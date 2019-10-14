const commander = require('commander');
import rp from 'request-promise';
import * as elasticsearch from 'elasticsearch';
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import { MediaUploadService } from '../../src/media-upload';
import { ArticleJson } from '../../src/types/article';
import { oldHTMLtoJSON, infoboxDtoPatcher, mergeMediaIntoCitations, sentenceSplitFixer, flushPrerenders } from '../../src/utils/article-utils';
const util = require('util');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);
const theAWSS3 = new AWSS3Service(theConfig);
const theElasticsearch = new elasticsearch.Client({
    host: `${theConfig.get('ELASTICSEARCH_PROTOCOL')}://${theConfig.get('ELASTICSEARCH_HOST')}:${theConfig.get('ELASTICSEARCH_PORT')}${theConfig.get('ELASTICSEARCH_URL_PREFIX')}`,
    httpAuth: `${theConfig.get('ELASTICSEARCH_USERNAME')}:${theConfig.get('ELASTICSEARCH_PASSWORD')}`,
    apiVersion: '7.1'
});
const theMediaUploadService = new MediaUploadService(theAWSS3);

commander
  .version('1.0.0', '-v, --version')
  .description('Loops through Everipedia pages to see if any of them were deleted from Wikipedia. If they were, it indexes them.')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

const BATCH_SIZE = 499; // Wikipedia limit is 500
const TITLE_CONCAT_SIZE = 49; // Wikipedia limits title param concats to 50 or less. Using 10 because some titles are huge
const PAGE_NOTE = '|EN_WIKI_IMPORT|';
const NEW_PAGE_NOTE = '|EN_WIKI_IMPORT_DELETED|';
const LANG_CODE = 'en';

export const logYlw = (inputString: string) => {
	return console.log(chalk.yellow.bold(inputString));
}

export const logOrg = (inputString: string) => {
	return console.log(chalk.rgb(255, 204, 153).bold(inputString));
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
        logYlw("---------------------------------------------------------------------------------------");
        logYlw("---------------------------------------------------------------------------------------");
        logYlw("🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏁 START 🏁🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇");
        console.log(chalk.yellow.bold(`Trying ${currentStart} to ${currentEnd}`));

        // The HAVING statement makes sure that human edited wikiscrapes are not affected.
        const fetchedArticles: any[] = await theMysql.TryQuery(
            `
                SELECT 
                    art.page_title, 
                    art.id,
                    art.ipfs_hash_current
                FROM enterlink_articletable art
                INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
                WHERE 
                    art.id between ? and ?
                    AND art.is_removed = 0
                    AND art.redirect_page_id IS NULL
                    AND art.is_indexed = 0
                    AND art.page_note = ?
                GROUP BY art.id
                HAVING COUNT(cache.timestamp) = 1
            `,
            [currentStart, currentEnd, PAGE_NOTE]
        );

        // Get the titles
        let title_array = fetchedArticles && fetchedArticles.map(row => row.page_title);
        let found_titles_lowercase: string[] = []; 

        // Prepare the URL prefix
        const wikiMedia = `https://${LANG_CODE}.wikipedia.org/w/api.php?` //Default wikiMedia format

        // Prepare the title concat
        let totalConcatBatches = Math.ceil(fetchedArticles.length / TITLE_CONCAT_SIZE);
        for (let b = 0; b < totalConcatBatches; b++) {
            let title_slice_start = b * TITLE_CONCAT_SIZE;
            let title_slice_end = (b * TITLE_CONCAT_SIZE) + TITLE_CONCAT_SIZE;

            // Concatenate the titles
            let concatted_titles = title_array
                                        .slice(title_slice_start, title_slice_end)
                                        .join('|');

            // URL Encode the concatenated titles
            concatted_titles = encodeURIComponent(concatted_titles);

            // Fetch the info from the Wikipedia API
            const url = `${wikiMedia}action=query&format=json&prop=info&titles=${concatted_titles}`;
            // console.log(url);

            let title_response = await rp(url)
                                .then(body => {
                                    let result = JSON.parse(body);
                                    return result && result.query && result.query.pages;
                                })
                                .catch((err) => {
                                    console.log(err);
                                    return "TITLE_REQUEST_FAILED";
                                });


            // Loop through the response and look for missing titles
            Object.keys(title_response).map(key => {
                let page_object = title_response[key];

                if (page_object 
                    && page_object.title 
                    && page_object.pageid)
                {
                    found_titles_lowercase.push(page_object.title.toLowerCase());
                }

            })

        }

        // Find removed titles
        let removed_titles = title_array.filter(title => !found_titles_lowercase.includes(title.toLowerCase()));

        logOrg("*****PROSPECTIVE PAGES*****")
        console.log(removed_titles);
        console.log('RUNNING ADDITIONAL CHECKS');

        for (let n = 0; n < removed_titles.length; n++) {
            let title_to_check = removed_titles[n];
            console.log("CHECKING: ", title_to_check)

            // Fetch the info from the Wikipedia API
            const url = `${wikiMedia}action=query&format=json&list=logevents&letype=delete&letitle=${title_to_check}`;

            let logevent_response = await rp(url)
                                .then(body => {
                                    let result = JSON.parse(body);
                                    return result && result.query && result.query.logevents;
                                })
                                .catch((err) => {
                                    console.log(err);
                                    return "TITLE_REQUEST_FAILED";
                                });
            if(logevent_response.length > 0) delete removed_titles[title_to_check];

        }

        logOrg("*****CLEARED PAGES*****")
        console.log(removed_titles);
        let cleared_article_ids = fetchedArticles && fetchedArticles
                                .filter(row => removed_titles.includes(row.page_title))
                                .map(row => row.id);
        let cleared_article_ipfs_hash_currents = fetchedArticles && fetchedArticles
                                .filter(row => removed_titles.includes(row.page_title))
                                .map(row => row.ipfs_hash_current);
        
        // Update the articles themselves
        const article_update: any[] = await theMysql.TryQuery(
            `
                UPDATE enterlink_articletable
                SET 
                    page_note = ?,
                    is_indexed = 1,
                    bing_index_override = 0,
                    lastmod_timestamp = NOW()
                FROM enterlink_articletable art
                WHERE 
                    art.id IN (?)
            `,
            [NEW_PAGE_NOTE, cleared_article_ids]
        );  

        // Update the redirects
        const redirects_update: any[] = await theMysql.TryQuery(
            `
                UPDATE enterlink_articletable
                SET 
                    page_note = ?,
                    lastmod_timestamp = NOW()
                FROM enterlink_articletable art
                WHERE 
                    art.redirect_page_id IN (?)
            `,
            [NEW_PAGE_NOTE, cleared_article_ids]
        );
        
        // Get the article jsons
        let hash_cache_results: Array<any> = await theMysql.TryQuery(
            `
                SELECT * 
                FROM enterlink_hashcache 
                WHERE ipfs_hash IN (?)
            `,
            [cleared_article_ipfs_hash_currents]
        );

        if (hash_cache_results.length == 0) {
            console.log(chalk.red(`NO HASHES FOUND . Continuing...`));
            return;
        }

        for (let h = 0; h < hash_cache_results.length; h++) {
            // Get the article JSON
            let wiki: ArticleJson;
            try {
                wiki = JSON.parse(hash_cache_results[h].html_blob);
            } catch (e) {
                wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(hash_cache_results[h].html_blob)));
                wiki.ipfs_hash = hash_cache_results[h].ipfs_hash;
            }

            // Update some of the metadata values
            wiki.metadata = wiki.metadata.map(meta => {
                if(meta.key == 'page_note') return { key: '', value: LANG_CODE }
                else if(meta.key == 'is_indexed') return { key: 'is_indexed', value: 1 }
                else if(meta.key == 'bing_index_override') return { key: 'bing_index_override', value: 0 }
                else if(meta.key == 'lastmod_timestamp') return { key: 'lastmod_timestamp', value: new Date() }
                else return meta;
            })


            // Update the hashcache
            let json_insertion;
            try {
                json_insertion = await theMysql.TryQuery(
                    `
                        UPDATE enterlink_hashcache
                        SET html_blob = ?
                        WHERE ipfs_hash = ? 
                    `,
                    [JSON.stringify(wiki), hash_cache_results[h].ipfs_hash]
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

    return;
})();

// TOTAL ARTICLES FOR EN_WIKI_IMPORT: 5293982

// TO SEE PROGRESS
// SELECT count(*)
// FROM enterlink_articletable art
// INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
// WHERE art.is_removed = 0
// AND art.redirect_page_id IS NULL
// AND art.is_indexed = 0
// AND art.page_note = '|EN_WIKI_IMPORT|'
// AND art.lastmod_timestamp <= '2019-09-13 21:08:14'