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
import { ArticleJson, Sentence } from '../../src/types/article';
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
const theElasticSearch = new elasticsearch.Client({
    host: `${theConfig.get('ELASTICSEARCH_PROTOCOL')}://${theConfig.get('ELASTICSEARCH_HOST')}:${theConfig.get('ELASTICSEARCH_PORT')}${theConfig.get('ELASTICSEARCH_URL_PREFIX')}`,
    httpAuth: `${theConfig.get('ELASTICSEARCH_USERNAME')}:${theConfig.get('ELASTICSEARCH_PASSWORD')}`,
    apiVersion: '7.1'
});
const theBucket = theAWSS3.getBucket();
const theMediaUploadService = new MediaUploadService(theAWSS3);

commander
  .version('1.0.0', '-v, --version')
  .description('Add WebP data to enterlink_articletable')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

const BATCH_SIZE = 1;
const LASTMOD_TIMESTAMP_CEIL = '2019-07-28 00:00:00';
const PAGE_NOTE = '|EN_WIKI_IMPORT|';

export const logYlw = (inputString: string) => {
	return console.log(chalk.yellow.bold(inputString));
}

export const WikiImport = async (inputString: string) => { 
    let quickSplit = inputString.split("|");
	let wikiLangSlug = quickSplit[0];
    let inputIPFS = quickSplit[1];
    let pageTitle = quickSplit[2].trim();
    let pageID = quickSplit[3];
    let redirectPageID = quickSplit[4];
    if (redirectPageID == "") redirectPageID = null;

    let lang_code, slug;
    if (wikiLangSlug.includes('lang_')) {
        lang_code = wikiLangSlug.split('/')[0].substring(5); // ignore the lang_ at the start
        slug = wikiLangSlug.split('/')[1];
    } else {
        lang_code = 'en';
        slug = wikiLangSlug;
    }

    console.log(chalk.blue.bold(`Starting to process: ${inputString}`));
    console.log(chalk.blue.bold(`Page Title: |${pageTitle}|`))
    console.log(chalk.blue.bold(`Page Slug: |${slug}|`))
	
	const url = `https://${lang_code}.wikipedia.org/wiki/${slug}`;
	let page_title = await getTitle(lang_code, slug);
	let metadata = await getMetaData(lang_code, slug);
    
    let page = await rp(url);
    
    // Precleaning
    let precleaned_cheerio_pack = preCleanHTML(page);

    // Try extracting a main photo
    let photo_result = getMainPhoto(precleaned_cheerio_pack);
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

    // Assemble the wiki
    let articlejson: ArticleJson = {
        page_title: page_title, 
        main_photo: [photo_result.main_photo],
        infobox_html: wiki_infobox_pack.table,
        page_body: page_body_pack.sections,
        infoboxes: [],
        citations: page_body_pack.citations,
        media_gallery: [],
        metadata: metadata,
        amp_info: { 
            load_youtube_js: false,
            load_audio_js: false,
            load_video_js: false,
            lightboxes: []
        },
        ipfs_hash: 'QmQCeAYSbKut79Uvw2wPHzBnsVpuLCjpbE5sm7nBXwJerR' // Set the dummy hash first
    } as ArticleJson

    // Calculate what the IPFS hash would be
    let newHash = calcIPFSHash(JSON.stringify(articlejson));
    articlejson.ipfs_hash = newHash;

    logYlw("=================MAIN UPLOAD=================");

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

    const cleanedSlug = theMysql.cleanSlugForMysql(slug);
    let text_preview;
    try {
        const first_para = articlejson.page_body[0].paragraphs[0];
        text_preview = (first_para.items[0] as Sentence).text;
        if (first_para.items.length > 1)
            text_preview += (first_para.items[1] as Sentence).text;
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

    // Update ElasticSearch
    // Prepare the JSON request
    let jsonRequest = {
        "id": pageID,
        "page_title": title_to_use,
        "canonical_id": redirectPageID ? redirectPageID : pageID,    
        "lang": lang_code
    }

    const response = await theElasticSearch.index({
        index: `${ELASTICSEARCH_INDEX_NAME}`,
        type: ELASTICSEARCH_DOCUMENT_TYPE,
        id: pageID,
        body: jsonRequest
    })

    // Flush the prerenders
    const prerenderToken = theConfig.get('PRERENDER_TOKEN');
    flushPrerenders(lang_code, slug, prerenderToken);

    fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Importer", 'test.json'), JSON.stringify(articlejson, null, 2));
    // console.log(util.inspect(resultjson, {showHidden: false, depth: null, chalk: true}));
    
    console.log(chalk.blue.bold("========================================COMPLETE======================================="));
    return null;
    


}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");
    let batchCounter = 0;
    let totalBatches = Math.ceil(((parseInt(commander.end) - parseInt(commander.start)) / BATCH_SIZE));
    console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));
    let currentStart, currentEnd;
    for (let i = 0; i < totalBatches; i++) {
        currentStart = parseInt(commander.start) + (batchCounter * BATCH_SIZE);
        currentEnd = parseInt(commander.start) + (batchCounter * BATCH_SIZE) + BATCH_SIZE - 1;

        console.log("\n");
        console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
        console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
        console.log(chalk.blue.bold("=========================================START========================================="));
        console.log(chalk.yellow.bold(`Trying ${currentStart} to ${currentEnd}`));

        const fetchedArticles: any[] = await theMysql.TryQuery(
            `
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, "") ) as concatted
                FROM enterlink_articletable art
                WHERE art.id between ? and ?
                AND art.is_removed = 0
                AND art.redirect_page_id IS NULL
				AND art.is_indexed = 0
				AND art.page_note = ?
            `,
            [currentStart, currentEnd, PAGE_NOTE]
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

        batchCounter = batchCounter + 1;
    }
    return;
})();
