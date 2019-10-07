
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import * as axios from 'axios';
const fetch = require("node-fetch");
import { WikiService } from '../../src/wiki/wiki.service';
import { oldHTMLtoJSON, infoboxDtoPatcher, mergeMediaIntoCitations } from '../../src/utils/article-utils';
const util = require('util');
const chalk = require('chalk');
const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);

const fs = require('fs');

commander
  .version('1.0.0', '-v, --version')
  .description('Find Categories For Pages')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

const BATCH_SIZE = 250;

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

export const PageCategorizer = async (inputString: string) => {
    // let quickSplit = inputString.split("|");
    // let wikiLangSlug = quickSplit[0];
	// let wikiLangSlug_alt = quickSplit[1];
    // let inputIPFS = quickSplit[2];
    // let pageTitle = quickSplit[3].trim();
    // let pageID = quickSplit[4];
    // let redirectPageID = quickSplit[5];
    // let creationTimestamp = quickSplit[6];
    // if (redirectPageID == "") redirectPageID = null;

    // let lang_code, slug, slug_alt;
    // if (wikiLangSlug.includes('lang_')) {
    //     lang_code = wikiLangSlug.split('/')[0].substring(5); // ignore the lang_ at the start
    //     slug = wikiLangSlug.split('/')[1];
    //     slug_alt = wikiLangSlug_alt.split('/')[1];
    // } else {
    //     lang_code = 'en';
    //     slug = wikiLangSlug;
    //     slug_alt = wikiLangSlug_alt;
    // }

    // console.log(chalk.blue.bold(`Starting to import: ${inputString}`));
    // console.log(chalk.blue.bold(`Page ID: |${pageID}|`));
    // console.log(chalk.blue.bold(`Page Title: |${pageTitle}|`));
    // console.log(chalk.blue.bold(`Page Slug: |${slug}| alt: |${slug_alt}|`));

    // // Get the article object
    // let hashCacheResult: Array<any> = await theMysql.TryQuery(
    //     `
    //         SELECT * 
    //         FROM enterlink_hashcache 
    //         WHERE ipfs_hash = ?
    //         AND timestamp <= ?
    //     `,
    //     [inputIPFS, LASTMOD_TIMESTAMP_CEIL]
    // );

    // if (hashCacheResult.length == 0) {
    //     console.log(chalk.red(`NO ${inputIPFS} FOUND BELOW ${LASTMOD_TIMESTAMP_CEIL}. Continuing...`));
    //     return;
    // }

    // // Get the article JSON
    // let wiki: ArticleJson;
    // try {
    //     wiki = JSON.parse(hashCacheResult[0].html_blob);
    // } catch (e) {
    //     wiki = oldHTMLtoJSON(hashCacheResult[0].html_blob);
    //     wiki.ipfs_hash = hashCacheResult[0].ipfs_hash;
    // }

    // if (wiki.infoboxes.length == 0 && wiki.media_gallery.length == 0){
    //     console.log(chalk.yellow("No infoboxes or media. Skipping..."));
    //     return;
    // }
    // console.log(chalk.yellow("Running the patch"));

    // logYlw("=================MAIN UPLOAD=================");

    // try {
    //     const json_insertion = await theMysql.TryQuery(
    //         `
    //             UPDATE enterlink_hashcache
    //             SET html_blob = ?
    //             WHERE ipfs_hash = ? 
    //         `,
    //         [JSON.stringify(wiki), inputIPFS]
    //     );
    // } catch (e) {
    //     if (e.message.includes("ER_DUP_ENTRY")){
    //         console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
    //     }
    //     else throw e;
    // }
    
    // console.log(chalk.blue.bold("========================================COMPLETE======================================="));
    return null;
}

(async () => {
    // logYlw("=================STARTING MAIN SCRIPT=================");
    // let batchCounter = 0;
    // let totalBatches = Math.ceil(((parseInt(commander.end) - parseInt(commander.start)) / BATCH_SIZE));
    // console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));
    // let currentStart, currentEnd;
    // for (let i = 0; i < totalBatches; i++) {
    //     currentStart = parseInt(commander.start) + (batchCounter * BATCH_SIZE);
    //     currentEnd = parseInt(commander.start) + (batchCounter * BATCH_SIZE) + BATCH_SIZE - 1;

    //     console.log("\n");
    //     console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    //     console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    //     console.log(chalk.blue.bold("=========================================START========================================="));
    //     console.log(chalk.yellow.bold(`Trying ${currentStart} to ${currentEnd}`));

    //     const fetchedArticles: any[] = await theMysql.TryQuery(
    //         `
    //             SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, ''), art.creation_timestamp ) as concatted
    //             FROM enterlink_articletable art
    //             INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
    //             WHERE art.id between ? and ?
    //             AND art.is_removed = 0
    //             AND art.redirect_page_id IS NULL
    //             AND art.is_indexed = 0
    //             AND art.page_note = ?
    //             AND art.lastmod_timestamp <= ?
    //             GROUP BY art.id
    //             HAVING COUNT(cache.timestamp) = 1
    //         `,
    //         [currentStart, currentEnd, PAGE_NOTE, LASTMOD_CUTOFF_TIME]
    //     );

    //     for await (const artResult of fetchedArticles) {
    //         try{
    //             await MergeMediaAndPatchInfoboxes(artResult.concatted);
    //         }
    //         catch (err){
    //             console.error(`${artResult.concatted} FAILED!!! [${err}]`);
    //             console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
    //         }
    //     }

    //     batchCounter++;
    // }
    // return;
})();
