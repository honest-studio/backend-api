const rp = require('request-promise');
const commander = require('commander');
import { getTitle } from './functions/getTitle';
import { getPageBodyPack } from './functions/getPageBody';
import { getWikipediaStyleInfoBox } from './functions/getWikipediaStyleInfoBox';
import { getMetaData } from './functions/getMetaData';
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import { getMainPhoto } from './functions/getMainPhoto';
import { ArticleJson } from '../../src/types/article';
import { calcIPFSHash, flushPrerenders } from '../../src/utils/article-utils/article-tools';
import { preCleanHTML } from './functions/pagebodyfunctionalities/cleaners';
import { MediaUploadService, UrlPack } from '../../src/media-upload';
const util = require('util');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);
const theAWSS3 = new AWSS3Service(theConfig);
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
	let wikiLangSlug = inputString.split("|")[0];
    let inputIPFS = inputString.split("|")[1];
    let pageTitle = inputString.split("|")[2].trim();

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
    let precleaned_html = preCleanHTML(page);

    // Note that page_body and citations are computed together to account for internal citations 
    const page_body_pack = await getPageBodyPack(precleaned_html, url, theMediaUploadService); 
    let articlejson: ArticleJson = {
        page_title: page_title, 
        main_photo: [getMainPhoto(precleaned_html)],
        infobox_html: getWikipediaStyleInfoBox(precleaned_html, page_body_pack.internal_citations) as any,
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

    try {
        const article_update = await theMysql.TryQuery(
            `
                UPDATE enterlink_articletable 
                SET lastmod_timestamp = NOW(),
                    desktop_cache_timestamp = NULL,
                    mobile_cache_timestamp = NULL
                WHERE ipfs_hash_current = ? 
            `,
            [inputIPFS]
        );
    } catch (e) {
        if (e.message.includes("ER_DUP_ENTRY")){
            console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
        }
        else throw e;
    }

    // Flush the prerenders
    const prerenderToken = theConfig.get('PRERENDER_TOKEN');
    flushPrerenders(lang_code, slug, prerenderToken);

    // const data: Response = await fetch(`${'https://api.everipedia.org/v2/'}wiki/bot-submit?token=HmMhOCDZTspmAfNugg8AZPBnxN2DZ4ZCaivyvCKMdK2MomxJx56M9SdsmAK&bypass_ipfs=1`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(wiki)
    // });
    // let theResult = await data.json();
    // if ((theResult as any).status == 'Success'){
    //     return theResult;
    // }
    // else{
    //     console.log(util.inspect(theResult, {showHidden: false, depth: null, chalk: true}));
    //     throw new Error((theResult as any).status) as any;
    // }


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
                SELECT CONCAT('lang_', art.page_lang, '/', art.slug, '|', art.ipfs_hash_current, '|', TRIM(art.page_title)) as concatted
                FROM enterlink_articletable art
                WHERE art.id between ? and ?
                AND art.is_removed = 0
                AND redirect_page_id IS NULL
				AND art.is_indexed = 0
				AND art.page_note = ?
            `,
            [currentStart, currentEnd, PAGE_NOTE]
        );

        for await (const artResult of fetchedArticles) {
            try{
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
