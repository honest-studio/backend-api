const rp = require('request-promise');
const commander = require('commander');
import * as elasticsearch from 'elasticsearch';
import { WikiImport } from '../Wiki-Importer/Wiki-Import';
import { MysqlService } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import { ArticleJson, Sentence } from '../../src/types/article';
import { ELASTICSEARCH_INDEX_NAME, ELASTICSEARCH_DOCUMENT_TYPE } from '../../src/utils/elasticsearch-tools/elasticsearch-tools';
const util = require('util');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);

commander
  .version('1.0.0', '-v, --version')
  .description('Sync an Everipedia page to its corresponding Wikipedia page')
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

export const WikiSync = async (inputString: string) => { 
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

    console.log(chalk.blue.bold(`Starting to sync: ${inputString}`));
    console.log(chalk.blue.bold(`Page ID: |${pageID}|`));
    console.log(chalk.blue.bold(`Page Title: |${pageTitle}|`));
    console.log(chalk.blue.bold(`Page Slug: |${slug}| alt: |${slug_alt}|`));
    
    let url = `https://${lang_code}.wikipedia.org/wiki/${slug}`;

    // Fetch the page title, metadata, and page
    let page_title, metadata, page;
    try{
        page_title = await getTitle(lang_code, slug);
        metadata = await getMetaData(lang_code, slug);
        page = await rp(url);
    }
    catch(err){
        console.log(chalk.yellow(`Fetching with slug ${slug} failed. Trying slug_alt: |${slug_alt}|`));
        page_title = await getTitle(lang_code, slug_alt);
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

    logYlw("====🧐 CHECKING RECENT EDITS ON WIKIPEDIA 🧐====");
    // Check recent edits on Wikipedia
	process.stdout.write(chalk.bold.yellow(`Getting the title ✍️ ...`));
	const format = 'format=json';
	const wikiMedia = `https://${lang_code}.wikipedia.org/w/api.php?` //Default wikiMedia format
	const action = 'action=parse';
	const prop = 'prop=displaytitle';
	let pageToUse = 'page=' + slug;

	const url = `${wikiMedia}${action}&${prop}&${format}&${pageToUse}`;
	let title = await rp(url)
					.then(body => JSON.parse(body).parse.displaytitle);

	process.stdout.write(chalk.bold.yellow(` DONE\n`));
    logYlw("==================📡 IMPORT 📡==================");

    // Call the import
    process.stdout.write(chalk.yellow(`Importing...`));
    await WikiImport(inputString)
    process.stdout.write(chalk.yellow(` DONE\n`));

    logYlw("🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏁 END 🏁🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅🏅");
    return null;

}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");
    let batchCounter = 0;
    let totalBatches = Math.ceil(((parseInt(commander.end) - parseInt(commander.start)) / BATCH_SIZE));
    console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));
    let currentStart, currentEnd;
    fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Sync", 'resultlinks.txt'), "");
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
                await WikiSync(artResult.concatted);
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


// TO SEE PROGRESS
// SELECT count(*)
// FROM enterlink_articletable art
// INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
// WHERE art.is_removed = 0
// AND art.redirect_page_id IS NULL
// AND art.is_indexed = 0
// AND art.page_note = '|EN_WIKI_IMPORT|'
// AND art.lastmod_timestamp <= '2019-09-13 21:08:14'