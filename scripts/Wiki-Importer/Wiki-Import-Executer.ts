const commander = require('commander');
import * as elasticsearch from 'elasticsearch';
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import { WikiImport } from './Wiki-Import';
import { MediaUploadService } from '../../src/media-upload';
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
  .description('Import a page from Wikipedia')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

const BATCH_SIZE = 250;
const LASTMOD_CUTOFF_TIME = '2019-09-18 02:35:19';
// const BATCH_SIZE = 1;
// const LASTMOD_CUTOFF_TIME = '2099-09-14 00:00:00';
const PAGE_NOTE = '|EN_WIKI_IMPORT|';

export const logYlw = (inputString: string) => {
	return console.log(chalk.yellow.bold(inputString));
}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");
    
    let totalBatches = Math.ceil(((parseInt(commander.end) - parseInt(commander.start)) / BATCH_SIZE));
    console.log(chalk.yellow.bold(`Total batches: ${totalBatches}`));
    let currentStart, currentEnd;
    fs.writeFileSync(path.join(__dirname,"../../../scripts/Wiki-Importer", 'resultlinks.txt'), "");
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
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, ''), art.creation_timestamp ) as concatted
                FROM enterlink_articletable art
                INNER JOIN enterlink_hashcache cache on art.id = cache.articletable_id
                WHERE art.id between ? and ?
                AND art.is_removed = 0
                AND art.redirect_page_id IS NULL
                AND art.is_indexed = 0
                AND art.page_note = ?
                AND art.lastmod_timestamp <= ?
                GROUP BY art.id
                HAVING COUNT(cache.timestamp) = 1
            `,
            [currentStart, currentEnd, PAGE_NOTE, LASTMOD_CUTOFF_TIME]
        );

        for await (const artResult of fetchedArticles) {
            try{
                // console.log(artResult.concatted)
                await WikiImport(artResult.concatted,
                    theConfig,
                    theMysql,
                    theAWSS3,
                    theElasticsearch,
                    theMediaUploadService
                );
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
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