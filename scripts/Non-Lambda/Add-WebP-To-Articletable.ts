
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import * as axios from 'axios';
const fetch = require("node-fetch");
import { WikiService } from '../../src/wiki/wiki.service';
import { oldHTMLtoJSON, infoboxDtoPatcher, mergeMediaIntoCitations, sentenceSplitFixer, flushPrerenders } from '../../src/utils/article-utils';
const util = require('util');
const chalk = require('chalk');
const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);

const fs = require('fs');

// SELECT CONCAT('lang_', art.page_lang, '/', art.slug, '|', art.ipfs_hash_current, '|', TRIM(art.page_title))
// FROM enterlink_articletable art
// WHERE id BETWEEN 1000 AND 1000000
// AND art.is_removed = 0
// AND art.is_indexed = 1
// AND redirect_page_id IS NULL

commander
  .version('1.0.0', '-v, --version')
  .description('Add WebP data to enterlink_articletable')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

const BATCH_SIZE = 250;
const LASTMOD_TIMESTAMP_CEIL = '2019-07-28 00:00:00';
// const PAGE_NOTE = '|SOCCERWAY_PLAYERS|';

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

export const AddWebPToArticletable = async (inputString: string) => {
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
            INNER JOIN enterlink_articletable art ON art.ipfs_hash_current = ? 
            WHERE ipfs_hash = ? 
            AND timestamp <= ? 
            AND art.is_indexed = 1 
        `,
        [inputIPFS, inputIPFS, LASTMOD_TIMESTAMP_CEIL]
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
        wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(hashCacheResult[0].html_blob)));
        wiki.ipfs_hash = hashCacheResult[0].ipfs_hash;
    }


    logYlw("=================MAIN UPLOAD=================");

    let main_photo = wiki && wiki.main_photo && wiki.main_photo.length && wiki.main_photo[0];
    const media_props = main_photo.media_props || null;
    
    const webp_large = (media_props 
            && media_props.webp_original
            && media_props.webp_original.indexOf('no-image-slide') == -1
        ) ? media_props.webp_original : "NULL";
    const webp_medium = (media_props 
            && media_props.webp_medium
            && media_props.webp_medium.indexOf('no-image-slide') == -1 
        ) ? media_props.webp_medium : "NULL";
    const webp_small =  (media_props 
            && media_props.webp_thumb
            && media_props.webp_thumb.indexOf('no-image-slide') == -1 
        ) ? media_props.webp_thumb : "NULL";

    try {
        const article_update = await theMysql.TryQuery(
            `
                UPDATE enterlink_articletable 
                SET lastmod_timestamp = NOW(),
                    desktop_cache_timestamp = NULL,
                    mobile_cache_timestamp = NULL,
                    webp_large = ?,
                    webp_medium = ?,
                    webp_small = ?
                WHERE ipfs_hash_current = ? 
            `,
            [webp_large, webp_medium, webp_small, inputIPFS]
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

    console.log(chalk.blue.bold("========================================COMPLETE======================================="));
    return null;
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
                SELECT CONCAT('lang_', art.page_lang, '/', art.slug, '|', art.ipfs_hash_current, '|', TRIM(art.page_title)) as concatted
                FROM enterlink_articletable art
                WHERE art.id between ? and ?
                AND art.is_removed = 0
                AND redirect_page_id IS NULL
                AND art.is_indexed = 1
            `,
            [currentStart, currentEnd]
        );

        for await (const artResult of fetchedArticles) {
            try{
                await AddWebPToArticletable(artResult.concatted);
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
            }
        }

        
    }
    return;
})();
