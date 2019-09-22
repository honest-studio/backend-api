const rp = require('request-promise');
const commander = require('commander');
import * as elasticsearch from 'elasticsearch';
import { WikiImport } from '../Wiki-Importer/Wiki-Import';
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

const LASTMOD_CUTOFF_TIME = '2019-09-18 02:35:19';
// const LASTMOD_CUTOFF_TIME = '2099-09-14 00:00:00';
const PAGE_NOTE = '|EN_WIKI_IMPORT|';

export const logYlw = (inputString: string) => {
	return console.log(chalk.yellow.bold(inputString));
}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");
    let start_time;
    fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Syncer", 'resultlinks.txt'), "");

    console.log("\n");
    logYlw("---------------------------------------------------------------------------------------");
    logYlw("---------------------------------------------------------------------------------------");
    logYlw("🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏁 START 🏁🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇🏇");
    console.log(chalk.yellow.bold(`Looking for changes since ${start_time}`));

    logYlw("==========🧐 CHECKING RECENT CHANGES🧐==========");
    // https://www.mediawiki.org/wiki/API:RecentChanges
    // https://en.wikipedia.org/w/api.php?action=query&list=recentchanges&rcprop=title%7Cids%7Csizes%7Cflags%7Cuser&rclimit=3

    // Check recent edits on Wikipedia
    process.stdout.write(chalk.bold.yellow(`Checking for recent edits ✍️ ...`));
    const wikiMedia = `https://${LANG_CODE}.wikipedia.org/w/api.php?` // Default WikiMedia format
    const format = 'format=json';
    const action = 'action=query';
    const list = 'list=recentchanges';
    const start = `rcstart=${start_time}`;
    const recent_edits_url = `${wikiMedia}${action}&${list}&${format}&${start}`;
    
    // https://en.wikipedia.org/w/api.php?action=query&list=recentchanges&format=json

    let title = await rp(recent_edits_url)
                    .then(body => JSON.parse(body).parse.displaytitle);

    process.stdout.write(chalk.bold.yellow(` DONE\n`));

    let fetchedArticles = [];
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