
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
const short_list_path = path.resolve(__dirname, '../../../scripts/Non-Lambda', 'output', 'short_files.txt');
const indexMinimimum = 275; // # of characters required for indexing

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

export const MinimumLengthDeindexer = async (inputString: string) => {
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

     // No index if article is 'thin content'.
    let noIndexArticle = true;

    let noIndexCounter = 0, pageBodyCounter = 0, infoboxCounter = 0;

    // Calculate whether thin content.
    wiki.page_body &&
        wiki.page_body.map((section) => {
            noIndexArticle &&
                section &&
                section.paragraphs &&
                (section.paragraphs as Paragraph[]).map((paragraph) => {
                    noIndexArticle &&
                        paragraph &&
                        paragraph.items &&
                        (paragraph.items as Sentence[]).map((item) => {
                            if (item && item.text && item.text.length) pageBodyCounter += item.text.length;
                        });
                });
    });
    noIndexCounter += pageBodyCounter;
    console.log('CALCULATED PAGE BODY LENGTH IS: ', pageBodyCounter);

    // If it still isn't marked to be index, tally up the infoboxes
    wiki.infoboxes && (wiki as ArticleJson).infoboxes.map((ibox) => {
        ibox &&
        ibox.values &&
        ibox.values.map((value) => {
            value &&
            value.sentences &&
            value.sentences.map((sent) => {
                if (sent && sent.text && sent.text.length) infoboxCounter += sent.text.length;
            });
        });
    });
    noIndexCounter += infoboxCounter;

    // A picture is worth a 1000 words (50 in this case)
    let main_photo_test =  wiki.main_photo
    && wiki.main_photo.length
    && (wiki as ArticleJson).main_photo[0];

    if (
        main_photo_test 
        && main_photo_test.url
        && main_photo_test.url != ""
        && main_photo_test.url != "https://everipedia-fast-cache.s3.amazonaws.com/images/no-image-slide-big.png" 
        && main_photo_test.url != "https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png"
    ){
        noIndexCounter += 50;
        console.log("MAIN PHOTO FOUND, COUNT ADDED: ", 50);
    }

    console.log('CALCULATED INFOBOX LENGTH IS: ', infoboxCounter);
    console.log('CALCULATED TOTAL LENGTH IS: ', noIndexCounter);
    if (noIndexCounter >= indexMinimimum) {
        noIndexArticle = false;
        console.log(chalk.green.bold("ARTICLE IS LONG ENOUGH. KEEPING IT..."));
        console.log("---------------------------------");
        return;
    } 
    else {
        console.log(chalk.red.bold("ARTICLE IS TOO SHORT. DEINDEXING IT..."));
        console.log("---------------------------------");
    }
    
    // Update some of the metadata values
    wiki.metadata = wiki.metadata.map(meta => {
        if(meta.key == 'is_indexed') return { key: 'is_indexed', value: false }
        else if(meta.key == 'bing_index_override') return { key: 'bing_index_override', value: true }
        else return meta;
    })

    // Update the articles themselves
    const article_update: any[] = await theMysql.TryQuery(
        `
            UPDATE enterlink_articletable
            SET 
                is_indexed = 0,
                bing_index_override = 1
            WHERE id = ? 
        `,
        [parseInt(pageID)]
    );  

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
    };

    // Append the short file to a list
    fs.appendFile(short_list_path, `https://everipedia.org/wiki/lang_en/${slug}\n`, function(err) {
        if(err) {
            return console.log(err);
        }
        // console.log("The team links were appended!");
    }); 

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
                    AND art.is_indexed = 1
                    AND art.page_lang = ?
            `,
            [currentStart, currentEnd, PAGE_LANG]
        );

        for await (const artResult of fetchedArticles) {
            try{
                await MinimumLengthDeindexer(artResult.concatted);
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
            }
        }

        
    }
    return;
})();
