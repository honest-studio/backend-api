const rp = require('request-promise');
const commander = require('commander');
import * as elasticsearch from 'elasticsearch';
import { WikiImport } from '../Wiki-Importer/Wiki-Import';
import { WIKI_SYNC_RECENTCHANGES_FILTER_REGEX } from '../Wiki-Importer/functions/wiki-constants';
import { MysqlService } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
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
  .parse(process.argv);

const LANG_CODE = 'en';

const BATCH_SIZE = 5;
const LASTMOD_CUTOFF_TIME = '2019-09-22 00:00:00';
const RC_LIMIT = 25; // Max allowed is 5000
// const BATCH_SIZE = 250;
// const LASTMOD_CUTOFF_TIME = '2099-09-14 00:00:00';
// const RC_LIMIT = 10;
const PAGE_NOTE = '|EN_WIKI_IMPORT|';

export const logYlw = (inputString: string) => {
	return console.log(chalk.yellow.bold(inputString));
}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");
    let start_time = commander.start;
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
    const type = `rctype=edit|new`;
    const recent_edits_url = `${wikiMedia}${action}&${list}&${format}&${start}&${type}&${limit}`;
    console.log(chalk.yellow(recent_edits_url));

    let parsed_body = await rp(recent_edits_url)
                    .then(body => JSON.parse(body));

    // Need to filter here, etc
    let title_array = [];
    let changes_list = parsed_body && parsed_body.query && parsed_body.query.recentchanges.map(change => {
        let result;

        // Remove useless titles
        if (change.title && change.title.search(WIKI_SYNC_RECENTCHANGES_FILTER_REGEX) >= 0) result = null;
        else result = change;

        // Add the title to the title array
        if (result) title_array.push(result.title)

        return result;
    }).filter(c => c);

    // console.log(changes_list)

    // console.log(util.inspect(parsed_body, {showHidden: false, depth: null, chalk: true}));


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
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, '') ) as concatted
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


// TO SEE PROGRESS
// SELECT count(*)
// FROM enterlink_articletable art
// INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
// WHERE art.is_removed = 0
// AND art.redirect_page_id IS NULL
// AND art.is_indexed = 0
// AND art.page_note = '|EN_WIKI_IMPORT|'
// AND art.lastmod_timestamp <= '2019-09-13 21:08:14'