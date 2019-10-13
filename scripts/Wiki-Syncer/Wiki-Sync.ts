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
  .description('Sync an Everipedia page to its corresponding Wikipedia page')
  .usage('[OPTIONS]...')
  .option('-s, --start <timestamp>', 'Lower bound timestamp in format 2019-09-21T00:00:00Z')
  .option('-e, --end <timestamp>', 'Upper bound timestamp in format 2019-09-21T00:00:00Z')
  .parse(process.argv);

const LANG_CODE = 'en';

const BATCH_SIZE = 5;
const LASTMOD_CUTOFF_TIME = '2017-01-01 00:00:00';
const RC_LIMIT = 500; // Max allowed is 500 for non-Wikipedia superusers
// const EDIT_TYPES = 'edit|new';
const EDIT_TYPES = 'new'
// const BATCH_SIZE = 250;
// const LASTMOD_CUTOFF_TIME = '2099-09-14 00:00:00';
// const RC_LIMIT = 500;
const PAGE_NOTE = '|EN_WIKI_IMPORT|';

export const logYlw = (inputString: string) => {
	return console.log(chalk.yellow.bold(inputString));
}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");
    let start_time = commander.start;
    let end_time = commander.end;
    fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Syncer", 'resultlinks.txt'), "");

    console.log("\n");
    logYlw("---------------------------------------------------------------------------------------");
    logYlw("---------------------------------------------------------------------------------------");
    logYlw("🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏁 START 🏁🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇");
    console.log(chalk.yellow.bold(`Looking for changes since ${start_time}`));

    logYlw("==========🧐 CHECKING RECENT CHANGES🧐==========");
    // https://www.mediawiki.org/wiki/API:RecentChanges
    // https://en.wikipedia.org/w/api.php?action=query&list=recentchanges&format=json&rcstart=2019-09-21T00:00:00Z

    // Check recent edits on Wikipedia
    console.log(chalk.bold.yellow(`Checking for recent edits ✍️ ...`));
    const wikiMedia = `https://${LANG_CODE}.wikipedia.org/w/api.php?` // Default WikiMedia format
    const format = 'format=json';
    const action = 'action=query';
    const list = 'list=recentchanges';
    const start = `rcstart=${start_time}`;
    const limit = `rclimit=${RC_LIMIT}`;
    const type = `rctype=${EDIT_TYPES}`;
    const recent_edits_url = `${wikiMedia}${action}&${list}&${format}&${start}&${type}&${limit}`;
    console.log(chalk.yellow(recent_edits_url));

    let parsed_body = await rp(recent_edits_url)
                    .then(body => JSON.parse(body));

    // Need to filter here, etc
    let title_array = [], new_page_array = [];
    let changes_list = parsed_body && parsed_body.query && parsed_body.query.recentchanges.map(change => {
        let result;

        // Remove useless titles
        if (change.title && change.title.search(WIKI_SYNC_RECENTCHANGES_FILTER_REGEX) >= 0) result = null;
        else result = change;

        // Add the title to the title array
        // Also look for new pages
        if (result) title_array.push(result.title)
        if (result && result.type && result.type == 'new') new_page_array.push({ title: result.title, id: result.pageid });

        return result;
    }).filter(c => c);

    console.log(chalk.bold.yellow(`Recent edits found: `));
    console.log(title_array);

    // console.log(util.inspect(parsed_body, {showHidden: false, depth: null, chalk: true}));

    logYlw("===============🆕 PROCESSING NEW PAGES 🆕===============");
    console.log(chalk.bold.yellow(`New pages found: `));
    console.log(new_page_array);
    console.log(chalk.bold.yellow(`-------------`));

    // Need to make dummy entries in enterlink_articletable and enterlink_hashcache
    for (let index = 0; index < new_page_array.length; index++) {
        console.log(chalk.bold.yellow(`****`));
        console.log("Making dummy MySQL entries for: ", new_page_array[index]);
        let new_slug = "";
        let url = `https://${LANG_CODE}.wikipedia.org/w/api.php?action=query&prop=info&titles=${encodeURIComponent(new_page_array[index].title)}&inprop=url&format=json`;
        let result = await rp(url)
                        .then(body => {
                            let result = JSON.parse(body);
                            return result && result.query && result.query.pages && result.query.pages[new_page_array[index].id];
                        })
                        .catch((err) => {
                            console.log(err);
                            return "TITLE_REQUEST_FAILED";
                        });
        if (result) {
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
    return false;

    logYlw("=================STARTING BATCH SCRIPT=================");
    let batchCounter = 0;
    let totalBatches = Math.ceil(changes_list.length / BATCH_SIZE);
    console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));
    fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Syncer", 'resultlinks.txt'), "");
    let title_array_sliced = [];
    for (let i = 0; i < totalBatches; i++) {

        console.log("\n");
        logYlw("---------------------------------------------------------------------------------------");
        logYlw("---------------------------------------------------------------------------------------");
        logYlw("🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🗄️ BATCH 🗄️🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨🔨");
        console.log(chalk.yellow.bold(`Trying batch #${i}`));

        title_array_sliced = title_array.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

        // The HAVING statement makes sure that human edited wikiscrapes are not affected.
        const fetchedArticles: any[] = await theMysql.TryQuery(
            `
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, ''), art.creation_timestamp ) as concatted
                FROM enterlink_articletable art
                INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
                WHERE art.page_title IN (?)
                AND art.is_removed = 0
                AND art.redirect_page_id IS NULL
                AND art.is_indexed = 0
                AND art.page_note = ?
                AND art.lastmod_timestamp <= ?
                AND art.page_lang = ?
                GROUP BY art.id
                HAVING COUNT(cache.timestamp) = 1
            `,
            [title_array_sliced, PAGE_NOTE, LASTMOD_CUTOFF_TIME, LANG_CODE]
        );

        for await (const artResult of fetchedArticles) {
            try{
                // console.log(artResult.concatted)
                await WikiImport(artResult.concatted);
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
            }
        }

    }
})();
