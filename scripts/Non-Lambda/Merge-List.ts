
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
import { MergeResult } from '../../src/types/api';
const path = require('path');
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
const lineReader = require('line-reader');
const isSvg = require('is-svg');
import * as elasticsearch from 'elasticsearch';
import { FileFetchResult, MediaUploadResult, MimePack, PhotoExtraData } from '../../src/media-upload/media-upload-dto';
import { oldHTMLtoJSON, infoboxDtoPatcher, mergeMediaIntoCitations, flushPrerenders, mergeWikis } from '../../src/utils/article-utils';
import { ELASTICSEARCH_INDEX_NAME, ELASTICSEARCH_DOCUMENT_TYPE } from '../../src/utils/elasticsearch-tools/elasticsearch-tools';
const slugify = require('slugify');
slugify.extend({'%': '_u_'});
const util = require('util');
const chalk = require('chalk');
const fs = require('fs');
const readline = require('readline');
const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);
const theAWSS3 = new AWSS3Service(theConfig);

const theElasticsearch = new elasticsearch.Client({
    host: `${theConfig.get('ELASTICSEARCH_PROTOCOL')}://${theConfig.get('ELASTICSEARCH_HOST')}:${theConfig.get('ELASTICSEARCH_PORT')}${theConfig.get('ELASTICSEARCH_URL_PREFIX')}`,
    httpAuth: `${theConfig.get('ELASTICSEARCH_USERNAME')}:${theConfig.get('ELASTICSEARCH_PASSWORD')}`,
    apiVersion: theConfig.get('ELASTICSEARCH_API_VERSION')
});

const prerenderToken = theConfig.get('PRERENDER_TOKEN');
import { updateElasticsearch } from '../../src/utils/elasticsearch-tools';
var colors = require('colors');

const SCRIPT_ROOT_DIR = path.join(__dirname, '..', '..', '..', 'scripts');

commander
  .version('1.0.0', '-v, --version')
  .description('Given a list of two wikilangslugs, merge the first into the second')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

export const MergeList = async (inputString: string) => {
    let quickSplit = inputString.split("|");
    let from_wikiLangSlug = quickSplit[0];
    let to_wikiLangSlug = quickSplit[1];
    
    let from_lang_code, from_slug;
    if (from_wikiLangSlug.includes('lang_')) {
        from_lang_code = from_wikiLangSlug.split('/')[0].substring(5); // ignore the lang_ at the start
        from_slug = from_wikiLangSlug.split('/')[1];
    } else {
        from_lang_code = 'en';
        from_slug = from_wikiLangSlug;
    }

    let to_lang_code, to_slug;
    if (to_wikiLangSlug.includes('lang_')) {
        to_lang_code = to_wikiLangSlug.split('/')[0].substring(5); // ignore the lang_ at the start
        to_slug = to_wikiLangSlug.split('/')[1];
    } else {
        to_lang_code = 'en';
        to_slug = to_wikiLangSlug;
    }
    
    console.log("\n");
    console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    console.log(chalk.blue.bold("=========================================START========================================="));
    console.log(chalk.blue.bold(`Starting to process: ${inputString}`));
    console.log(chalk.blue.bold(`Merging: |${from_wikiLangSlug}| into |${to_wikiLangSlug}|`));

    // Get the FROM article object
    // Also make sure it hasn't already been merged
    let from_articletable_row: Array<any> = await theMysql.TryQuery(
        `
            SELECT * 
            FROM enterlink_articletable
            WHERE 
                page_lang = ?
                AND slug = ?
                AND redirect_page_id IS NULL
        `,
        [from_lang_code, from_slug]
    );

    // Make sure the FROM article exists
    if(!(from_articletable_row && from_articletable_row.length > 0)) return null;
    let from_article_obj = from_articletable_row[0];

    console.log(chalk.green('PART 1'));

    // Get the FROM hashcache
    let from_hashcache_row: Array<any> = await theMysql.TryQuery(
        `
            SELECT * 
            FROM enterlink_hashcache
            WHERE 
                ipfs_hash = ?
        `,
        [from_article_obj.ipfs_hash_current]
    );

    // Make sure the FROM hashcache exists
    if(!(from_hashcache_row && from_hashcache_row.length > 0)) return null;
    let from_hash_obj = from_hashcache_row[0];

    // Get the TO article object
    let to_articletable_row: Array<any> = await theMysql.TryQuery(
        `
            SELECT * 
            FROM enterlink_articletable
            WHERE 
                page_lang = ?
                AND slug = ?
        `,
        [to_lang_code, to_slug]
    );

    // Make sure the TO article exists
    if(!(to_articletable_row && to_articletable_row.length > 0)) return null;
    let to_article_obj = to_articletable_row[0];

    // Get the TO hashcache
    let to_hashcache_row: Array<any> = await theMysql.TryQuery(
        `
            SELECT * 
            FROM enterlink_hashcache
            WHERE 
                ipfs_hash = ?
        `,
        [to_article_obj.ipfs_hash_current]
    );

    console.log(chalk.green('PART 2'));

    // Make sure the TO hashcache exists
    if(!(to_hashcache_row && to_hashcache_row.length > 0)) return null;
    let to_hash_obj = to_hashcache_row[0];

    // Get the FROM ArticleJson
    let from_wiki: ArticleJson;
    try {
        from_wiki = JSON.parse(from_hash_obj.html_blob);
    } catch (e) {
        from_wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(from_hash_obj.html_blob)));
        from_wiki.ipfs_hash = from_hash_obj.ipfs_hash;
    }

    // Get the TO ArticleJson
    let to_wiki: ArticleJson;
    try {
        to_wiki = JSON.parse(to_hash_obj.html_blob);
    } catch (e) {
        to_wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(to_hash_obj.html_blob)));
        to_wiki.ipfs_hash = to_hash_obj.ipfs_hash;
    }

    let merge_result: MergeResult = await mergeWikis(from_wiki, to_wiki);

    console.log(chalk.green('PART 3'));

    logYlw("=================MAIN UPLOAD=================");

    // Update the FROM article to be just a redirect
    await theMysql.TryQuery(
        `
        UPDATE enterlink_articletable 
            SET is_removed = 0, 
                is_indexed = 0, 
                bing_index_override = 0,
                lastmod_timestamp = NOW(),
                ipfs_hash_parent = 'REDIRECT',
                redirect_page_id = ?,
                desktop_cache_timestamp = NULL,
                mobile_cache_timestamp = NULL
            WHERE id = ?
        `,
        [to_article_obj.id, from_article_obj.id]
    );

    // Update Elasticsearch for the FROM to point it to the canonical article

    let jsonRequest = {
        "id": from_article_obj.id,
        "page_title": from_article_obj.page_title,
        "canonical_id": to_article_obj.id,    
        "lang": to_article_obj.page_lang
    }

    console.log(chalk.green('PART 4'));

    await theElasticsearch.index({
        index: `${ELASTICSEARCH_INDEX_NAME}`,
        type: ELASTICSEARCH_DOCUMENT_TYPE,
        id: from_article_obj.id,
        body: jsonRequest
    }).then(() => {
        console.log(colors.green(`Elasticsearch for lang_${from_article_obj.page_lang}/${from_article_obj.slug} updated`));
    }).catch(e => {
        console.log(colors.red(`Elasticsearch for lang_${from_article_obj.page_lang}/${from_article_obj.slug} failed:`), colors.red(e));
    })

    // Flush prerender for the FROM article
    flushPrerenders(from_article_obj.page_lang, from_article_obj.slug, prerenderToken);

    // Update the hashcache for the article
    try {
        const json_insertion = await theMysql.TryQuery(
            `
                UPDATE enterlink_hashcache
                SET html_blob = ?,
                    timestamp = NOW() 
                WHERE ipfs_hash = ? 
            `,
            [JSON.stringify(merge_result.merged_json), to_article_obj.ipfs_hash_current]
        );
    } catch (e) {
        if (e.message.includes("ER_DUP_ENTRY")){
            console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
        }
        else throw e;
    }

    console.log(chalk.green('PART 5'));

    // Flush prerender for the TO article
    flushPrerenders(to_article_obj.page_lang, to_article_obj.slug, prerenderToken);
        
    console.log(chalk.blue.bold("========================================COMPLETE======================================="));
    return null;
}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");

    console.log("\n");
    console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    console.log(chalk.blue.bold("=========================================START========================================="));

    let the_source_path = path.join(SCRIPT_ROOT_DIR, 'Non-Lambda', 'input', 'merge-slug-list.txt');
    let the_lines = fs.readFileSync(the_source_path).toString().split("\n");

    for (let i = 0; i < the_lines.length; i++) {
        let line = the_lines[i];
        try{
            await MergeList(line);
        }
        catch (err){
            console.error(`${line} FAILED!!! [${err}]`);
            console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
        }
    }

    console.log(the_lines)
    
    return;
})();



