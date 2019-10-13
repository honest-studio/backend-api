const rp = require('request-promise');
const commander = require('commander');
import * as elasticsearch from 'elasticsearch';
import { WikiImport } from '../Wiki-Importer/Wiki-Import';
import { WIKI_SYNC_RECENTCHANGES_FILTER_REGEX } from '../Wiki-Importer/functions/wiki-constants';
import { MysqlService } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import { calcIPFSHash } from '../../src/utils/article-utils/article-tools';
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
  .description('Sync an Everipedia page to its corresponding Wikipedia page. Also handle new pages')
  .usage('[OPTIONS]...')
  .option('-s, --start <timestamp>', 'Lower bound timestamp in format 2019-09-21T00:00:00Z')
  .option('-e, --end <timestamp>', 'Upper bound timestamp in format 2019-09-21T00:00:00Z')
  .parse(process.argv);

const LANG_CODE = 'en';
const BATCH_SIZE_MILLISECONDS = 7200 * 1000; // 2 hours

const RC_LIMIT = 499; // Max allowed is 500 for non-Wikipedia superusers
// const LASTMOD_CUTOFF_TIME = '2099-09-14 00:00:00';
// const RC_LIMIT = 500;
const PAGE_NOTE = '|EN_WIKI_IMPORT|';

export const logYlw = (inputString: string) => {
	return console.log(chalk.yellow.bold(inputString));
}

export const logOrg = (inputString: string) => {
	return console.log(chalk.rgb(255, 204, 153).bold(inputString));
}

export const WikiSyncSince = async (api_start: number, api_end: number, process_type: 'new-pages' | 'edits') => { 

    // Check recent edits on Wikipedia
    console.log(chalk.bold.yellow(`Checking logevents ✍️ ...`));
    const wikiMedia = `https://${LANG_CODE}.wikipedia.org/w/api.php?` // Default WikiMedia format
    
    // Determine which API endpoint to use
    let wiki_api_url = '';
    switch (process_type){
        case 'new-pages': {
            // OLD / UNIVERSAL STYLE (may need to use letype=review)
            // const recent_edits_url = `${wikiMedia}action=query&list=logevents&lelimit=${RC_LIMIT}&format=json&lenamespace=0&ledir=newer&lestart=${api_start}&leend=${api_end}&leprop=ids|title|type|user|timestamp|comment|details|tags`;
    
            // NEW STYLE (POST 07/01/2018)
            wiki_api_url = `${wikiMedia}action=query&list=logevents&lelimit=${RC_LIMIT}&format=json&letype=create&lenamespace=0&ledir=newer&lestart=${api_start}&leend=${api_end}&leprop=ids|title|type|user|timestamp|comment|details|tags`;
            break;
        }

        case 'edits': {
            // NEED TO USE API:Revisions HERE, ALONG WITH LOGEVENTS TOO, TO LOOK FOR REDIRECTS
            // wiki_api_url = `${wikiMedia}action=query&list=logevents&lelimit=${RC_LIMIT}&format=json&letype=create&lenamespace=0&ledir=newer&lestart=${api_start}&leend=${api_end}&leprop=ids|title|type|user|timestamp|comment|details|tags`;
            break;
        }
    }
    console.log(chalk.yellow(wiki_api_url));
    
    // Fetch data from the API
    let parsed_body = await rp(wiki_api_url).then(body => JSON.parse(body));

    // Parse the response
    switch (process_type){
        case 'new-pages': {
            parsed_body = parsed_body && parsed_body.query && parsed_body.query.logevents;
            break;
        }

        case 'edits': {
            // NEED TO USE API:Revisions HERE, ALONG WITH LOGEVENTS TOO, TO LOOK FOR REDIRECTS
            // wiki_api_url = `${wikiMedia}action=query&list=logevents&lelimit=${RC_LIMIT}&format=json&letype=create&lenamespace=0&ledir=newer&lestart=${api_start}&leend=${api_end}&leprop=ids|title|type|user|timestamp|comment|details|tags`;
            break;
        }
    }
    
    
         
    // Clean up redirects and bad titles
    let new_page_array = [];
    parsed_body = parsed_body.map(event_obj => {
        // Remove useless titles (lenamespace should handle this, but this is a backup check)
        if (event_obj.title && event_obj.title.search(WIKI_SYNC_RECENTCHANGES_FILTER_REGEX) >= 0) return null;

        // Remove redirects
        if(event_obj.comment && event_obj.comment.search(/redir/gimu) >= 0) return null;

        // Another redirect check
        if(event_obj.tags && event_obj.tags.includes('mw-new-redirect')) return null;


        // Add the import info to the new_page_array
        new_page_array.push({ title: event_obj.title, id: event_obj.pageid });

    }).filter(obj => obj);

    
    console.log(chalk.rgb(255, 204, 153)(`New pages found: `));
    console.log(new_page_array);
    console.log(chalk.rgb(255, 204, 153)(`-------------`));
    

    // Need to make dummy entries in enterlink_articletable and enterlink_hashcache
    for (let index = 0; index < new_page_array.length; index++) {
        let new_page_info = new_page_array[index];
        logOrg("====================🆕 PROCESSING NEW PAGE 🆕====================");
        logOrg(`****${new_page_info.title}****`);

        // Make sure the page hasn't been deleted
        console.log(chalk.yellow(`Verifying that the page has not been deleted`));
        let is_deleted_url = `${wikiMedia}action=query&list=logevents&lelimit=${RC_LIMIT}&format=json&letype=delete&lestart=${api_start}&letitle=${encodeURIComponent(new_page_info.title)}`;
        let deleted_parsed_body = await rp(is_deleted_url).then(body => JSON.parse(body));
        deleted_parsed_body = deleted_parsed_body && deleted_parsed_body.query && deleted_parsed_body.query.logevents;
        if(deleted_parsed_body && deleted_parsed_body.length > 0 ) {
            console.log("Page was deleted. Skipping...");
            continue;
        }

        // Make sure the page hasn't been merged
        console.log(chalk.yellow(`Verifying that the page has not been merged`));
        let is_merged_url = `${wikiMedia}action=query&list=logevents&lelimit=${RC_LIMIT}&format=json&letype=merge&lestart=${api_start}&letitle=${encodeURIComponent(new_page_info.title)}`;
        let merged_parsed_body = await rp(is_merged_url).then(body => JSON.parse(body));
        merged_parsed_body = merged_parsed_body && merged_parsed_body.query && merged_parsed_body.query.logevents;
        if(merged_parsed_body && merged_parsed_body.length > 0 ) {
            console.log("Page was merged. Skipping...");
            console.log(merged_parsed_body);
            continue;
        }

        // Make sure the page hasn't been redirected
        console.log(chalk.yellow(`Verifying that the page has not been redirected`));
        let is_moved_url = `${wikiMedia}action=query&list=logevents&lelimit=${RC_LIMIT}&format=json&leaction=move%2Fmove_redir&lestart=${api_start}&letitle=${encodeURIComponent(new_page_info.title)}`;
        let moved_parsed_body = await rp(is_moved_url).then(body => JSON.parse(body));
        moved_parsed_body = moved_parsed_body && moved_parsed_body.query && moved_parsed_body.query.logevents;
        if(moved_parsed_body && moved_parsed_body.length > 0 ) {
            console.log("Page was moved or redirected. Skipping...");
            console.log(moved_parsed_body);
            continue;
        }

        // continue

        
        let new_slug = "";
        let url = `https://${LANG_CODE}.wikipedia.org/w/api.php?action=query&prop=info&titles=${encodeURIComponent(new_page_info.title)}&inprop=url&format=json`;
        let result = await rp(url)
                        .then(body => {
                            let result = JSON.parse(body);
                            return result && result.query && result.query.pages && result.query.pages[new_page_info.id];
                        })
                        .catch((err) => {
                            console.log(err);
                            return "TITLE_REQUEST_FAILED";
                        });
        if (result) {
            console.log("Making dummy MySQL entries for: ", new_page_info);
            new_slug = result.canonicalurl.replace(`https://${LANG_CODE}.wikipedia.org/wiki/`, '');
            console.log(`NEW SLUG: |${new_slug}|`);
            // console.log(result)

            const page_title = result.title;
            const slug = new_slug;
            const cleanedSlug = theMysql.cleanSlugForMysql(slug);
            let alternateSlug = cleanedSlug;

            // If the two slugs are the same, encode the alternateSlug
            if (cleanedSlug === slug) alternateSlug = encodeURIComponent(alternateSlug);

            // If the two slugs are still the same, decode the alternateSlug
            if (cleanedSlug === alternateSlug) alternateSlug = decodeURIComponent(alternateSlug);

            let text_preview = "";

            const photo_url = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png';
            const photo_thumb_url = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide.png';
            const webp_large = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-original.webp';
            const webp_medium = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-medium.webp';
            const webp_small =  'https://epcdn-vz.azureedge.net/static/images/no-image-slide-thumb.webp';
            const page_type = 'Thing';
            const is_adult_content = 0;
            const page_lang = 'en';
            const page_note = '|EN_WIKI_IMPORT|';

            // Dummy hash for now
            const ipfs_hash = calcIPFSHash(`${page_title}${slug}${page_lang}`);
            const ipfs_hash_parent = 'QmQCeAYSbKut79Uvw2wPHzBnsVpuLCjpbE5sm7nBXwJerR'; // Dummy value
            let article_insertion;
            try {
                article_insertion = await theMysql.TryQuery(
                    `
                    INSERT INTO enterlink_articletable 
                        (   ipfs_hash_current, 
                            ipfs_hash_parent, 
                            slug, 
                            slug_alt, 
                            page_title, 
                            blurb_snippet, 
                            photo_url, 
                            photo_thumb_url, 
                            page_type, 
                            creation_timestamp, 
                            lastmod_timestamp, 
                            is_adult_content, 
                            page_lang, 
                            is_new_page, 
                            pageviews, 
                            is_removed, 
                            is_indexed, 
                            bing_index_override, 
                            has_pending_edits, 
                            webp_large, 
                            webp_medium, 
                            webp_small, 
                            page_note
                        )
                    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, 0, 0, 0, 0, 1, 0, ?, ?, ?, ? )
                    `,
                    [
                        ipfs_hash,
                        ipfs_hash_parent,
                        cleanedSlug,
                        alternateSlug,
                        page_title,
                        text_preview,
                        photo_url,
                        photo_thumb_url,
                        page_type,
                        is_adult_content,
                        page_lang,
                        webp_large,
                        webp_medium,
                        webp_small,
                        page_note
                    ]
                )
            } catch (e) {
                if (e.message.includes("ER_DUP_ENTRY")){
                    console.log(chalk.yellow('WARNING: Duplicate submission for enterlink_articletable. IPFS hash already exists'));
                }
                else throw e;
            }

            let inserted_id = article_insertion && (article_insertion as any).insertId;

            let articlejson: ArticleJson = {
                page_title: [{ type: 'sentence', index: 0, text: page_title }], 
                main_photo: [],
                infobox_html: null,
                page_body: [],
                infoboxes: [],
                citations: [],
                media_gallery: [],
                metadata: [],
                amp_info: [],
                ipfs_hash: ipfs_hash // Set the dummy hash first
            } as any;

            let json_insertion;
            try {
                json_insertion = await theMysql.TryQuery(
                    `
                    INSERT INTO enterlink_hashcache (articletable_id, ipfs_hash, html_blob, timestamp) 
                    VALUES (?, ?, ?, NOW())
                    `,
                    [inserted_id, ipfs_hash, JSON.stringify(articlejson)]
                );
            } catch (e) {
                if (e.message.includes("ER_DUP_ENTRY")){
                    console.log(chalk.yellow('WARNING: Duplicate submission for enterlink_hashcache. IPFS hash already exists'));
                }
                else throw e;
            }

            // Run the import script for the new page
            if (article_insertion && json_insertion){
                let concat_string = `lang_${page_lang}/${slug}|lang_${page_lang}/${alternateSlug}|${ipfs_hash}|${page_title.trim()}|${inserted_id}|||`;
                try{
                    // console.log(artResult.concatted)
                    await WikiImport(concat_string);
                }
                catch (err){
                    console.error(`${concat_string} FAILED!!! [${err}]`);
                    console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
                }
            }
        }
    }


}


// NOTE. BEFORE 07/01/2018, the logevents were in a different format!
// NEED TO DO IN REVERSE ORDER TO ONLY GET THE MOST RECENT EDIT, INSTEAD OF RE-SYNCING THE SAME PAGE MULTIPLE TIMES!!!
// FIRST, SHOULD GET ALL NEW PAGES FROM start_date to end_date, starting from start_date
// NEXT, GET ALL EDITS FROM start_date to end_date, starting from end_date AND WORKING BACKWARDS
(async () => {
    logYlw("=================STARTING SYNC SINCE SCRIPT=================");
    let batchCounter = 0;

    // Get the time frame
    let start_date = commander.start;
    let end_date = commander.end;
    let start_unix = start_date * 1000;
    let end_unix = end_date * 1000;

    // Batch by BATCH_SIZE_MILLISECONDS increments
    let totalBatches = Math.ceil((end_unix - start_unix) / BATCH_SIZE_MILLISECONDS);
    console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));

    // // Create the file where the new pages will be logged
    // fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Importer", 'resultlinks.txt'), "");

    // First, get all new pages
    let batch_start_unix, batch_end_unix, batch_start_iso8601, batch_end_iso8601;
    for (let i = 0; i < totalBatches; i++) {
        batch_start_unix = start_unix + (batchCounter * BATCH_SIZE_MILLISECONDS);
        batch_start_iso8601 = (new Date(batch_start_unix)).toISOString();
        batch_end_unix = start_unix + (batchCounter * BATCH_SIZE_MILLISECONDS) + BATCH_SIZE_MILLISECONDS - 1;
        batch_end_iso8601 = (new Date(batch_end_unix)).toISOString();

        console.log("\n");
        logYlw("---------------------------------------------------------------------------------------");
        logYlw("---------------------------------------------------------------------------------------");
        logYlw("🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏁 START 🏁🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇");
        logOrg("===============🆕 PROCESSING NEW PAGES 🆕===============");
        console.log(chalk.yellow.bold(`Trying ${batch_start_iso8601} to ${batch_end_iso8601}`));

        // Run the script
        await WikiSyncSince(batch_start_unix / 1000, end_unix / 1000, 'new-pages');

        batchCounter++;
    }
    return;
})();