
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
  .description('Merge Media and Patch Infoboxes')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

const BATCH_SIZE = 250;
const LASTMOD_TIMESTAMP_CEIL = '2019-07-28 00:00:00' 

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

export const MergeMediaAndPatchInfoboxes = async (inputString: string) => {
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

    // Get the article object
    let hashCacheResult: Array<any> = await theMysql.TryQuery(
        `
            SELECT * 
            FROM enterlink_hashcache 
            WHERE ipfs_hash = ?
            AND timestamp <= ?
        `,
        [inputIPFS, LASTMOD_TIMESTAMP_CEIL]
    );

    if (hashCacheResult.length == 0) {
        console.log(chalk.red(`NO ${inputIPFS} FOUND BELOW ${LASTMOD_TIMESTAMP_CEIL}. Continuing...`));
        return;
    }

    // Get the article JSON
    let wiki: ArticleJson;
    try {
        wiki = JSON.parse(hashCacheResult[0].html_blob);
    } catch (e) {
        wiki = oldHTMLtoJSON(hashCacheResult[0].html_blob);
        wiki.ipfs_hash = hashCacheResult[0].ipfs_hash;
    }

    if (wiki.infoboxes.length == 0 && wiki.media_gallery.length == 0){
        console.log(chalk.yellow("No infoboxes or media. Skipping..."));
        return;
    }
    console.log(chalk.yellow("Running the patch"));

    // Run the patches for now
    wiki = infoboxDtoPatcher(mergeMediaIntoCitations(wiki));

    logYlw("=================MAIN UPLOAD=================");

    try {
        const json_insertion = await theMysql.TryQuery(
            `
                UPDATE enterlink_hashcache
                SET html_blob = ?
                WHERE ipfs_hash = ? 
            `,
            [JSON.stringify(wiki), inputIPFS]
        );
    } catch (e) {
        if (e.message.includes("ER_DUP_ENTRY")){
            console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
        }
        else throw e;
    }
    
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
            `,
            [currentStart, currentEnd]
        );

        for await (const artResult of fetchedArticles) {
            try{
                await MergeMediaAndPatchInfoboxes(artResult.concatted);
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
