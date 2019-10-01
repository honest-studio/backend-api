const rp = require('request-promise');
const commander = require('commander');
import * as elasticsearch from 'elasticsearch';
import { getTitle } from './functions/getTitle';
import { getPageBodyPack } from './functions/getPageBody';
import { getWikipediaStyleInfoBox } from './functions/getWikipediaStyleInfoBox';
import { getMetaData } from './functions/getMetaData';
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import { getMainPhoto } from './functions/getMainPhoto';
import lodashSet from 'lodash/fp/set';
import { ArticleJson, Sentence, ListItem } from '../../src/types/article';
import { calcIPFSHash, flushPrerenders } from '../../src/utils/article-utils/article-tools';
import { preCleanHTML } from './functions/pagebodyfunctionalities/cleaners';
import { MediaUploadService, UrlPack } from '../../src/media-upload';
import { ELASTICSEARCH_INDEX_NAME, ELASTICSEARCH_DOCUMENT_TYPE } from '../../src/utils/elasticsearch-tools/elasticsearch-tools';
const util = require('util');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);
const theAWSS3 = new AWSS3Service(theConfig);
const theElasticsearch = new elasticsearch.Client({
    host: `${theConfig.get('ELASTICSEARCH_PROTOCOL')}://${theConfig.get('ELASTICSEARCH_HOST')}:${theConfig.get('ELASTICSEARCH_PORT')}${theConfig.get('ELASTICSEARCH_URL_PREFIX')}`,
    httpAuth: `${theConfig.get('ELASTICSEARCH_USERNAME')}:${theConfig.get('ELASTICSEARCH_PASSWORD')}`,
    apiVersion: '7.1'
});
const theBucket = theAWSS3.getBucket();
const theMediaUploadService = new MediaUploadService(theAWSS3);

commander
  .version('1.0.0', '-v, --version')
  .description('Import a page from Wikipedia')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

const BATCH_SIZE = 250;
const LASTMOD_CUTOFF_TIME = '2019-09-18 02:35:19';
// const BATCH_SIZE = 1;
// const LASTMOD_CUTOFF_TIME = '2099-09-14 00:00:00';
const PAGE_NOTE = '|EN_WIKI_IMPORT|';

export const logYlw = (inputString: string) => {
	return console.log(chalk.yellow.bold(inputString));
}

export const WikiImport = async (inputString: string) => { 
    let quickSplit = inputString.split("|");
    let wikiLangSlug = quickSplit[0];
	let wikiLangSlug_alt = quickSplit[1];
    let inputIPFS = quickSplit[2];
    let pageTitle = quickSplit[3].trim();
    let pageID = quickSplit[4];
    let redirectPageID = quickSplit[5];
    if (redirectPageID == "") redirectPageID = null;

    let lang_code, slug, slug_alt;
    if (wikiLangSlug.includes('lang_')) {
        lang_code = wikiLangSlug.split('/')[0].substring(5); // ignore the lang_ at the start
        slug = wikiLangSlug.split('/')[1];
        slug_alt = wikiLangSlug_alt.split('/')[1];
    } else {
        lang_code = 'en';
        slug = wikiLangSlug;
        slug_alt = wikiLangSlug_alt;
    }

    console.log(chalk.blue.bold(`Starting to import: ${inputString}`));
    console.log(chalk.blue.bold(`Page ID: |${pageID}|`));
    console.log(chalk.blue.bold(`Page Title: |${pageTitle}|`));
    console.log(chalk.blue.bold(`Page Slug: |${slug}| alt: |${slug_alt}|`));
    
    let url = `https://${lang_code}.wikipedia.org/wiki/${slug}`;

    // Fetch the page title, metadata, and page
    let page_title, metadata, page;
    try{
        page_title = await getTitle(lang_code, slug);

        // Move on if the title does not exist
        if (page_title === undefined || page_title == null) return null;

        metadata = await getMetaData(lang_code, slug);
        page = await rp(url);
    }
    catch(err){
        console.log(chalk.yellow(`Fetching with slug ${slug} failed. Trying slug_alt: |${slug_alt}|`));
        page_title = await getTitle(lang_code, slug_alt);

        // Move on if the title does not exist
        if (page_title === undefined || page_title == null) return null;

        metadata = await getMetaData(lang_code, slug_alt);
        page = await rp(`https://${lang_code}.wikipedia.org/wiki/${slug_alt}`);
    }



    // Pre-cleaning
    let precleaned_cheerio_pack = preCleanHTML(page);

    // return false;

    // Try extracting a main photo
    let photo_result = await getMainPhoto(precleaned_cheerio_pack, theMediaUploadService, lang_code, slug);
    let photoless_cheerio_pack = photo_result.cheerio_pack;

    // Note that page_body and citations are computed together to account for internal citations 
    const page_body_pack = await getPageBodyPack(photoless_cheerio_pack, url, theMediaUploadService); 

    // Process the wikipedia-style infobox
    const wiki_infobox_pack = getWikipediaStyleInfoBox(page_body_pack.cheerio_pack, page_body_pack.internal_citations);
    
    // Handle the parsed page_type, if present
    if (wiki_infobox_pack.page_type){
        metadata = metadata.map(meta => {
            if (meta.key == 'page_type') return { key: 'page_type', value: wiki_infobox_pack.page_type }
            else return meta;
        })
    }

    logYlw("==============⚙️  ARTICLEJSON ASSEMBLY ⚙️ =============");
    // Assemble the wiki
    process.stdout.write(chalk.yellow(`Creating the ArticleJson object...`));
    let articlejson: ArticleJson = {
        page_title: page_title, 
        main_photo: [photo_result.main_photo],
        infobox_html: wiki_infobox_pack.table,
        page_body: page_body_pack.sections,
        infoboxes: [],
        citations: page_body_pack.citations,
        media_gallery: [],
        metadata: metadata,
        amp_info: page_body_pack.amp_info,
        ipfs_hash: 'QmQCeAYSbKut79Uvw2wPHzBnsVpuLCjpbE5sm7nBXwJerR' // Set the dummy hash first
    } as ArticleJson;
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Calculate what the IPFS hash would be
    process.stdout.write(chalk.yellow(`Generating the IPFS hash...`));
    let newHash = calcIPFSHash(JSON.stringify(articlejson));
    articlejson.ipfs_hash = newHash;
    process.stdout.write(chalk.yellow(` DONE [${newHash}]\n`));

    console.log(chalk.bold.green(`DONE`));
    logYlw("==================📡 MAIN UPLOAD 📡==================");

    // Update the hash cache
    process.stdout.write(chalk.yellow(`Updating the hash cache...`));
    try {
        const json_insertion = await theMysql.TryQuery(
            `
                UPDATE enterlink_hashcache
                SET html_blob = ?,
                    timestamp = NOW() 
                WHERE ipfs_hash = ? 
            `,
            [JSON.stringify(articlejson), inputIPFS]
        );
    } catch (e) {
        if (e.message.includes("ER_DUP_ENTRY")){
            console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
        }
        else throw e;
    }
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Update the article cache
    process.stdout.write(chalk.yellow(`Updating the article cache...`));
    const cleanedSlug = theMysql.cleanSlugForMysql(slug);
    let text_preview = "";
    try {
        const first_para = articlejson.page_body[0].paragraphs[0];
        text_preview = (first_para.items[0] as Sentence).text;
        if (text_preview === undefined) text_preview = "";
        if (first_para.items.length > 1){
            if(first_para.tag_type && first_para.tag_type.search(/ul|ol/) >= 0){
                let list_sentences = (first_para.items[1]as ListItem).sentences;
                if (list_sentences.length <= 2){
                    list_sentences.forEach(item => {
                        if (item) text_preview += (item as Sentence).text;
                    })
                }
                else{
                    list_sentences.slice(0, 2).forEach(item => {
                        if (item) text_preview += (item as Sentence).text;
                    })
                }
            } else {
                text_preview += (first_para.items[1] as Sentence).text;
            }
        }
        else if (!text_preview || text_preview == ""){
            text_preview = "";
            // Loop through the first section until text is found
            let sliced_paras = articlejson.page_body[0].paragraphs.slice(1);
            sliced_paras.forEach(para => {
                // Only take the first two sentences
                if (text_preview == ""){
                    if (para.items.length <= 2){
                        para.items.forEach(item => {
                            text_preview += (item as Sentence).text;
                        })
                    }
                    else{
                        para.items.slice(0, 2).forEach(item => {
                            text_preview += (item as Sentence).text;
                        })
                    }
                }
            })
        }
    } catch (e) {
        text_preview = "";
    }

    const title_to_use = page_title.map(sent => sent.text).join();
    const photo_url = articlejson.main_photo[0].url;
    const photo_thumb_url = articlejson.main_photo[0].thumb;
    const media_props = articlejson.main_photo[0].media_props || null;
    const webp_large = media_props && media_props.webp_original || null;
    const webp_medium = media_props && media_props.webp_medium || null;
    const webp_small =  media_props && media_props.webp_thumb || null;
    const page_type = articlejson.metadata.find((m) => m.key == 'page_type').value;

    try {
        const article_update = await theMysql.TryQuery(
            `
                UPDATE enterlink_articletable 
                SET lastmod_timestamp = NOW(),
                    page_title=?,     
                    blurb_snippet=?,
                    photo_url=?, 
                    photo_thumb_url=?, 
                    page_type=?, 
                    desktop_cache_timestamp=NULL, 
                    mobile_cache_timestamp=NULL, 
                    webp_large=?, 
                    webp_medium=?, 
                    webp_small=?, 
                    is_indexed=0
                WHERE ipfs_hash_current = ? 
            `,
            [   
                title_to_use,
                text_preview, 
                photo_url,
                photo_thumb_url,
                page_type,
                webp_large,
                webp_medium,
                webp_small,
                inputIPFS
            ]
        );
    } catch (e) {
        if (e.message.includes("ER_DUP_ENTRY")){
            console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
        }
        else throw e;
    }
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Update Elasticsearch
    // Prepare the JSON request
    process.stdout.write(chalk.yellow(`Updating Elasticsearch...`));
    let jsonRequest = {
        "id": pageID,
        "page_title": title_to_use,
        "canonical_id": redirectPageID ? redirectPageID : pageID,    
        "lang": lang_code
    }

    const response = await theElasticsearch.index({
        index: `${ELASTICSEARCH_INDEX_NAME}`,
        type: ELASTICSEARCH_DOCUMENT_TYPE,
        id: pageID,
        body: jsonRequest
    })
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Flush the prerenders
    console.log(chalk.yellow.bold(`---Flushing prerenders---`));
    const prerenderToken = theConfig.get('PRERENDER_TOKEN');
    await flushPrerenders(lang_code, slug, prerenderToken);
    console.log(chalk.yellow.bold(`------Flush complete-----`));

    // fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Importer", 'test.json'), JSON.stringify(articlejson, null, 2));
    // console.log(util.inspect(resultjson, {showHidden: false, depth: null, chalk: true}));

    fs.appendFileSync(path.join(__dirname,"../../../scripts/Wiki-Importer", 'resultlinks.txt'), `http://127.0.0.1:7777/wiki/lang_${lang_code}/${slug}\n`);
    fs.appendFileSync(path.join(__dirname,"../../../scripts/Wiki-Importer", 'resultlinks.txt'), `https://${lang_code}.wikipedia.org/wiki/${slug_alt}\n`);

    logYlw("🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏁 END 🏁🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅");
    return null;

}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");
    let batchCounter = 0;
    let totalBatches = Math.ceil(((parseInt(commander.end) - parseInt(commander.start)) / BATCH_SIZE));
    console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));
    let currentStart, currentEnd;
    fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Importer", 'resultlinks.txt'), "");
    for (let i = 0; i < totalBatches; i++) {
        currentStart = parseInt(commander.start) + (batchCounter * BATCH_SIZE);
        currentEnd = parseInt(commander.start) + (batchCounter * BATCH_SIZE) + BATCH_SIZE - 1;

        console.log("\n");
        logYlw("---------------------------------------------------------------------------------------");
        logYlw("---------------------------------------------------------------------------------------");
        logYlw("🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏁 START 🏁🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇");
        console.log(chalk.yellow.bold(`Trying ${currentStart} to ${currentEnd}`));

        // The HAVING statement makes sure that human edited wikiscrapes are not affected.
        const fetchedArticles: any[] = await theMysql.TryQuery(
            `
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, '') ) as concatted
                FROM enterlink_articletable art
                INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
                WHERE art.id between ? and ?
                AND art.is_removed = 0
                AND art.redirect_page_id IS NULL
                AND art.is_indexed = 0
                AND art.page_note = ?
                AND art.lastmod_timestamp <= ?
                GROUP BY art.id
                HAVING COUNT(cache.timestamp) = 1
            `,
            [currentStart, currentEnd, PAGE_NOTE, LASTMOD_CUTOFF_TIME]
        );

        for await (const artResult of fetchedArticles) {
            try{
                // console.log(artResult.concatted)
                await WikiImport(artResult.concatted);
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
            }
        }

        batchCounter++;
    }
    return;
})();

// TOTAL ARTICLES FOR EN_WIKI_IMPORT: 5293982

// TO SEE PROGRESS
// SELECT count(*)
// FROM enterlink_articletable art
// INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
// WHERE art.is_removed = 0
// AND art.redirect_page_id IS NULL
// AND art.is_indexed = 0
// AND art.page_note = '|EN_WIKI_IMPORT|'
// AND art.lastmod_timestamp <= '2019-09-13 21:08:14'