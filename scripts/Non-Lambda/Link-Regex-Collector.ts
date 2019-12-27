
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
  .description('Deindex pages that are too short')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

const BATCH_SIZE = 250;
const PAGE_LANG = 'en';
const output_file_path = path.resolve(__dirname, '../../../scripts/Non-Lambda', 'output', '247sports_player_links.txt');
const PAGE_NOTE = '|24_7_SPORTS|';
const LINK_REGEX = /247sports.com\/Player\//gimu;

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

export const LinkRegexCollector = async (inputString: string) => {
    let quickSplit = inputString.split("|");
    let wikiLangSlug = quickSplit[0];
	let wikiLangSlug_alt = quickSplit[1];
    let inputIPFS = quickSplit[2];
    let pageTitle = quickSplit[3].trim();
    let pageID = quickSplit[4];
    let redirectPageID = quickSplit[5];
    let creationTimestamp = quickSplit[6];
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

    console.log(chalk.blue.bold(`Looking at: ${inputString}`));
    console.log(chalk.blue.bold(`Page ID: |${pageID}|`));
    console.log(chalk.blue.bold(`Page Title: |${pageTitle}|`));
    console.log(chalk.blue.bold(`Page Slug: |${slug}| alt: |${slug_alt}|`));

    // Get the article object
    let hashCacheResult: Array<any> = await theMysql.TryQuery(
        `
            SELECT * 
            FROM enterlink_hashcache 
            WHERE ipfs_hash = ?
        `,
        [inputIPFS]
    );

    if (hashCacheResult.length == 0) {
        console.log(chalk.red(`NO ${inputIPFS} HASH FOUND . Continuing...`));
        return;
    }

    // Get the article JSON
    let wiki: ArticleJson;
    try {
        wiki = JSON.parse(hashCacheResult[0].html_blob);
    } catch (e) {
        wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(hashCacheResult[0].html_blob)));
        wiki.ipfs_hash = hashCacheResult[0].ipfs_hash;
    }

    // Find the link, if present
    let the_link;
    for (let i = 0; i < wiki.citations.length; i++) {
        if (LINK_REGEX.test(wiki.citations[i].url)) {
            the_link = wiki.citations[i].url;
            break;
        }
    }

    if (the_link){
        // Append the link to a list
        fs.appendFile(output_file_path, `${the_link}\n`, function(err) {
            if(err) {
                return console.log(err);
            }
            // console.log("The team links were appended!");
        }); 
    }


}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");

    let totalBatches = Math.ceil(((parseInt(commander.end) - parseInt(commander.start)) / BATCH_SIZE));
    console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));
    let currentStart, currentEnd;
    for (let i = 0; i < totalBatches; i++) {
        currentStart = parseInt(commander.start) + (i * BATCH_SIZE);
        currentEnd = parseInt(commander.start) + (i * BATCH_SIZE) + BATCH_SIZE - 1;

        console.log("\n");
        console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
        console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
        console.log(chalk.blue.bold("=========================================START========================================="));
        console.log(chalk.yellow.bold(`Trying ${currentStart} to ${currentEnd}`));

        const fetchedArticles: any[] = await theMysql.TryQuery(
            `
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, ''), art.creation_timestamp ) as concatted
                FROM enterlink_articletable art
                WHERE art.id between ? and ?
                    AND art.is_removed = 0
                    AND art.redirect_page_id IS NULL
                    AND art.page_lang = ?
                    AND art.page_note = ?
            `,
            [currentStart, currentEnd, PAGE_LANG, PAGE_NOTE]
        );

        for await (const artResult of fetchedArticles) {
            try{
                await LinkRegexCollector(artResult.concatted);
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
            }
        }

        
    }
    return;
})();
