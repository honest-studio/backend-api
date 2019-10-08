
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

const BATCH_SIZE = 1000;
const PAGE_TYPES = ['Person', 'Thing'];
const SCHEMAS_TO_LOOK_FOR = /jobTitle/gimu;
const KEYS_TO_LOOK_FOR = /Occupation/gimu;
const VALUES_TO_LOOK_FOR = /Model/gimu;
const PAGE_NOTES = ['|FAMOUS_BIRTHDAYS_2|'];
const CATEGORY_ID = 4; // YouTube Stars

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

export const PageCategorizer = async (inputString: string) => {
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

    console.log(chalk.blue.bold(`Starting to import: ${inputString}`));
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
        wiki = oldHTMLtoJSON(hashCacheResult[0].html_blob);
        wiki.ipfs_hash = hashCacheResult[0].ipfs_hash;
    }

    // Search through the infoboxes
    let has_the_category = false;
    if (wiki.infoboxes.length > 0){
        for (let index = 0; !has_the_category && (index < wiki.infoboxes.length); index++) {
            let ibox = wiki.infoboxes[index];
            // Search the schema
            if (
                (ibox.schema && ibox.schema.search(SCHEMAS_TO_LOOK_FOR) >= 0)
                || (ibox.key && ibox.key.search(KEYS_TO_LOOK_FOR) >= 0)
            ){
                // console.log(util.inspect(ibox, {showHidden: false, depth: null, chalk: true}));
                // Search the values
                // Combine into one big string first
                let combo_value = ibox.values.map(val => {
                    return val && val.sentences && val.sentences.map(sent => sent.text).join(' ');
                }).join(' ')

                if(combo_value && combo_value.search(VALUES_TO_LOOK_FOR) >= 0){
                    console.log(util.inspect(ibox, {showHidden: false, depth: null, chalk: true}));
                    has_the_category = true;
                    break;
                }
            }

        }
        
    } 
    else {
        console.log(chalk.yellow("No infoboxes. Skipping..."));
        return;
    }

    if(has_the_category){
        // Update the pagecategory collection
        let pagecategory_collection_insertion;
        try {
            pagecategory_collection_insertion = await theMysql.TryQuery(
                `
                    INSERT INTO enterlink_pagecategory_collection (category_id, articletable_id) 
                    VALUES (?, ?)
                `,
                [CATEGORY_ID, pageID]
            );
            console.log(chalk.green("Added to pagecategory_collection."));
        } catch (e) {
            if (e.message.includes("ER_DUP_ENTRY")){
                console.log(chalk.yellow('WARNING: Duplicate submission for enterlink_pagecategory_collection. Category collection already exists'));
            }
            else throw e;
        }

        // Update the hashcache
        if (pagecategory_collection_insertion){
            // Prepare the new wiki
            wiki.categories && wiki.categories.length > 0 
                ? wiki.categories = wiki.categories
                    .filter(cat => cat != CATEGORY_ID) // Make sure there are no dupe categories
                    .concat(CATEGORY_ID)
                : wiki.categories = [CATEGORY_ID];

            // Update the hashcache
            let json_insertion;
            try {
                json_insertion = await theMysql.TryQuery(
                    `
                        UPDATE enterlink_hashcache
                        SET html_blob = ?
                        WHERE ipfs_hash = ? 
                    `,
                    [JSON.stringify(wiki), inputIPFS]
                );
                console.log(chalk.green("Added to enterlink_hashcache."));
            } catch (e) {
                if (e.message.includes("ER_DUP_ENTRY")){
                    console.log(chalk.yellow('WARNING: Duplicate submission for enterlink_hashcache. IPFS hash already exists'));
                }
                else throw e;
            }
        }
    }

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
    // return null;
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
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, ''), art.creation_timestamp ) as concatted
                FROM enterlink_articletable art
                LEFT JOIN enterlink_pagecategory_collection collect ON collect.category_id=? AND collect.articletable_id=art.id
                WHERE art.id between ? and ?
                    AND art.is_removed = 0
                    AND art.redirect_page_id IS NULL
                    AND art.is_indexed = 1
                    AND art.page_type IN (?)
                    AND art.page_note IN (?)
                    AND collect.id IS NULL
                GROUP BY art.id
            `,
            [CATEGORY_ID, currentStart, currentEnd, PAGE_TYPES, PAGE_NOTES]
        );

        for await (const artResult of fetchedArticles) {
            try{
                await PageCategorizer(artResult.concatted);
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
