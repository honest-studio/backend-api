
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
const path = require('path');
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
const lineReader = require('line-reader');
const isSvg = require('is-svg');
import { FileFetchResult, MediaUploadResult, MimePack, PhotoExtraData } from '../../src/media-upload/media-upload-dto';
import { oldHTMLtoJSON, infoboxDtoPatcher, mergeMediaIntoCitations, flushPrerenders } from '../../src/utils/article-utils';
const slugify = require('slugify');
slugify.extend({'%': '_u_'});
const util = require('util');
const chalk = require('chalk');
const fs = require('fs');
const sharp = require('sharp');
const zlib = require('zlib');

const mainWidth = 1201;
const mainHeight = 1201;
const mediumWidth = 640;
const mediumHeight = 640;
const thumbWidth = 320;
const thumbHeight = 320;

const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);
const theAWSS3 = new AWSS3Service(theConfig);
const theBucket = theAWSS3.getBucket();


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
    let from_articletable_row: Array<any> = await theMysql.TryQuery(
        `
            SELECT * 
            FROM enterlink_articletable
            WHERE 
                page_lang = ?
                AND slug = ?
        `,
        [from_lang_code, from_slug]
    );

    // Make sure the FROM article exists
    if(!(from_articletable_row && from_articletable_row.length > 0)) return null;
    let from_article_obj = from_articletable_row[0];

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

    // Make sure the TO hashcache exists
    if(!(to_hashcache_row && to_hashcache_row.length > 0)) return null;
    let to_hash_obj = to_hashcache_row[0];

    // Get the FROM article JSON
    let from_wiki: ArticleJson;
    try {
        from_wiki = JSON.parse(from_hash_obj.html_blob);
    } catch (e) {
        from_wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(from_hash_obj.html_blob)));
        from_wiki.ipfs_hash = from_hash_obj.ipfs_hash;
    }

    // Get the TO article JSON
    let to_wiki: ArticleJson;
    try {
        to_wiki = JSON.parse(to_hash_obj.html_blob);
    } catch (e) {
        to_wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(to_hash_obj.html_blob)));
        to_wiki.ipfs_hash = to_hash_obj.ipfs_hash;
    }


    // logYlw("=================MAIN UPLOAD=================");

    // try {
    //     const json_insertion = await theMysql.TryQuery(
    //         `
    //             UPDATE enterlink_hashcache
    //             SET html_blob = ?
    //             WHERE ipfs_hash = ? 
    //         `,
    //         [JSON.stringify(wiki), inputIPFS]
    //     );
    // } catch (e) {
    //     if (e.message.includes("ER_DUP_ENTRY")){
    //         console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
    //     }
    //     else throw e;
    // }

    // let main_photo = wiki && wiki.main_photo && wiki.main_photo.length && wiki.main_photo[0];
    // const media_props = main_photo.media_props || null;
    // const webp_large = media_props && media_props.webp_original || "NULL";
    // const webp_medium = media_props && media_props.webp_medium || "NULL";
    // const webp_small =  media_props && media_props.webp_thumb || "NULL";

    // try {
    //     const article_update = await theMysql.TryQuery(
    //         `
    //             UPDATE enterlink_articletable 
    //             SET lastmod_timestamp = NOW(),
    //                 desktop_cache_timestamp = NULL,
    //                 mobile_cache_timestamp = NULL,
    //                 webp_large = ?,
    //                 webp_medium = ?,
    //                 webp_small = ?
    //             WHERE ipfs_hash_current = ? 
    //         `,
    //         [webp_large, webp_medium, webp_small, inputIPFS]
    //     );
    // } catch (e) {
    //     if (e.message.includes("ER_DUP_ENTRY")){
    //         console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
    //     }
    //     else throw e;
    // }

    // // Flush the prerenders
    // const prerenderToken = theConfig.get('PRERENDER_TOKEN');
    // flushPrerenders(lang_code, slug, prerenderToken);
    
    console.log(chalk.blue.bold("========================================COMPLETE======================================="));
    return null;
}

(async () => {
    logYlw("=================STARTING MAIN SCRIPT=================");

    console.log("\n");
    console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    console.log(chalk.blue.bold("=========================================START========================================="));

    let line_collection = [];
    lineReader.eachLine('/path/to/file', function(line) {
        line_collection.push(line);
    });

    for await (const inner_line of line_collection) {
        try{
            await MergeList(inner_line);
        }
        catch (err){
            console.error(`${inner_line} FAILED!!! [${err}]`);
            console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
        }
    }
    return;
})();



