
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
import { PageCategory } from '../../src/types/api';
import * as readline from 'readline';
import moment from 'moment';
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

const BATCH_SIZE = 10000;
const PAGE_TYPES = ['Person', 'Organization'];
const IGNORE_CATEGORIES_BELOW = 0; // Used to help speed up categorization for new categories [4066]
const LANGUAGE_CODE = 'en';
const TIMESTAMP_FLOOR = '2014-10-13 21:45:19'; 

// nano scripts/Non-Lambda/Page-Categorizer-Universal.ts

const CTN_REGEX = /\[\[CITE\|\-?.*?\|([^\]]{0,300})(\]\])/gim;

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

export const PageCategorizerUniversal = async (inputString: string, regexed_categories: PageCategory[]) => {
    let quickSplit = inputString.split("|");
    let wikiLangSlug = quickSplit[0];
	let wikiLangSlug_alt = quickSplit[1];
    let inputIPFS = quickSplit[2];
    let pageTitle = quickSplit[3].trim();
    let pageID = quickSplit[4];
    let redirectPageID = quickSplit[5];
    let creationTimestamp = quickSplit[6];
    let page_type = quickSplit[7];
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
    console.log(chalk.blue.bold(`Page Type: |${page_type}|`));

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


    // Search through the infoboxes
    let categories_to_add: PageCategory[] = [];


    // Filter the categories appropriately
    let filtered_categories_to_check = regexed_categories.filter(cat => cat.schema_for == page_type || cat.schema_for == 'Thing') 

    if (wiki.infoboxes.length > 0){
        for (let index = 0; index < wiki.infoboxes.length; index++) {
            let ibox = wiki.infoboxes[index];
            // Search the schema
            for (let c_idx = 0; c_idx < filtered_categories_to_check.length; c_idx++) {
                let categ = filtered_categories_to_check[c_idx];
                let schema_keyword_regex = new RegExp(categ.schema_keyword, 'gimu')
                let key_regex = new RegExp(categ.key_regex, 'gimu');
                let values_regex = new RegExp(categ.values_regex, 'gimu');

                // Normal regexes
                if (
                    (ibox.schema && ibox.schema.search(schema_keyword_regex) >= 0)
                    || (ibox.key && ibox.key.search(key_regex) >= 0)
                ){
                    // console.log(util.inspect(ibox, {showHidden: false, depth: null, chalk: true}));
                    // Search the values
                    // Combine into one big string first
                    let combo_value = ibox.values.map(val => {
                        return val && val.sentences && val.sentences.map(sent => sent.text).join(' ');
                    })
                    .join(' ')
                    .replace(CTN_REGEX, "") // Remove any citations, if present
    
                    if(combo_value && combo_value.search(values_regex) >= 0){
                        console.log(util.inspect(ibox, {showHidden: false, depth: null, chalk: true}));
                        categories_to_add.push(categ);
                    }
                }
            }

            // Handle birthdays
            if (
                page_type == 'Person'
                && (
                    (ibox.schema && ibox.schema.search(/birthDate/gimu) >= 0)
                    || (ibox.key && ibox.key.search(/Born|Birthday/gimu) >= 0)
                )
            ){
                // console.log(util.inspect(ibox, {showHidden: false, depth: null, chalk: true}));
                // Search the values
                // Combine into one big string first
                let combo_value = ibox.values.map(val => {
                    return val && val.sentences && val.sentences.map(sent => sent.text).join(' ');
                })
                .join(' ')
                .replace(CTN_REGEX, "") // Remove any citations, if present

                // Trim the result first
                let trimmed_value = combo_value.trim();

                // Ignore only years with no month or day
                // Also remove ages
                if(trimmed_value.length >= 5){
                    // Try to parse out the date and calculate the corresponding category slug
                    const parsed_date = moment(trimmed_value).format("MMMM D");
                    let calculated_category_slug = parsed_date.toLowerCase().replace(" ", "-") + '-birthdays';

                    // Ignore unparsable dates
                    if (calculated_category_slug != 'invalid-date-birthdays'){
                        console.log(chalk.green.bold("FOUND BIRTHDATE: ", parsed_date));
                        console.log(chalk.green.bold("CALCULATED SLUG: ", calculated_category_slug));
                        console.log(util.inspect(ibox, {showHidden: false, depth: null, chalk: true}));

                        // Find what the birthday's category ID is from the calculated_category_slug
                        let pagecategory_id_query, found_category_id = null;
                        try {
                            pagecategory_id_query = await theMysql.TryQuery(
                                `
                                    SELECT *
                                    FROM enterlink_pagecategory
                                    WHERE 
                                        slug=?
                                        AND lang=?
                                `,
                                [calculated_category_slug, LANGUAGE_CODE]
                            );
                            if(pagecategory_id_query && pagecategory_id_query.length) {
                                let found_categ = pagecategory_id_query[0];
                                categories_to_add.push(found_categ);
                                console.log(chalk.green("Page category ID should be: ", found_categ.id));
                            }
                            
                            
                        } catch (e) {
                            if (e.message.includes("ER_DUP_ENTRY")){
                                console.log(chalk.yellow('WARNING: Duplicate submission for enterlink_pagecategory_collection. Category collection already exists'));
                            }
                            else throw e;
                        }


                    }


                }
                
                

            }
        }
        
    } 
    else {
        console.log(chalk.yellow("No infoboxes. Skipping..."));
        return;
    }

    if(categories_to_add.length > 0){
        // Concat the values
        let values_concatted = categories_to_add.map(cat => {
            return `(NULL, ${cat.id}, ${pageID})`
        }).join(', ');

        // Update the pagecategory collection
        let pagecategory_collection_insertion;
        try {
            pagecategory_collection_insertion = await theMysql.TryQuery(
                `
                    INSERT IGNORE INTO enterlink_pagecategory_collection
                    VALUES ${values_concatted}
                `,
                [values_concatted]
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
            let existing_category_ids = wiki.categories && wiki.categories.length > 0 
                ? wiki.categories
                : [];
            let new_category_ids = categories_to_add.map(cat => cat.id);

            // Add the new categories to the old one
            existing_category_ids = existing_category_ids.concat(new_category_ids);

            // Remove duplicates, then sort
            wiki.categories = [...new Set(existing_category_ids)].sort();

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
}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");
    
    let totalBatches = Math.ceil(((parseInt(commander.end) - parseInt(commander.start)) / BATCH_SIZE));
    console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));

    const all_regexed_categories: PageCategory[] = await theMysql.TryQuery(
        `
            SELECT *
            FROM enterlink_pagecategory
            WHERE schema_for in (?)
                AND schema_keyword IS NOT NULL
                AND key_regex IS NOT NULL
                AND values_regex IS NOT NULL
                AND id >= ?
        `,
        [PAGE_TYPES, IGNORE_CATEGORIES_BELOW]
    );

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
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, ''), art.creation_timestamp, art.page_type ) as concatted
                FROM enterlink_articletable art
                INNER JOIN enterlink_hashcache hsc ON art.ipfs_hash_current=hsc.ipfs_hash
                WHERE art.id between ? and ?
                    AND art.is_removed = 0
                    AND art.redirect_page_id IS NULL
                    AND art.is_indexed = 1
                    AND art.page_type IN (?)
                    AND art.page_lang = ?
                    AND hsc.timestamp >= ?
                GROUP BY art.id
            `,
            [currentStart, currentEnd, PAGE_TYPES, LANGUAGE_CODE, TIMESTAMP_FLOOR]
        );

        for await (const artResult of fetchedArticles) {
            try{
                await PageCategorizerUniversal(artResult.concatted, all_regexed_categories);
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
            }
        }

        
    }
    return;
})();
