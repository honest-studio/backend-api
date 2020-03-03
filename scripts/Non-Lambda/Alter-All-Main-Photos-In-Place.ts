
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { MediaUploadService } from '../../src/media-upload/media-upload.service';
import { ConfigService } from '../../src/common';
import { fromBuffer } from 'file-type';
import * as axios from 'axios';

import * as crypto from 'crypto';
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



const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);
const theAWSS3 = new AWSS3Service(theConfig);
const theMediaUploadSvc = new MediaUploadService(theAWSS3);

const BATCH_SIZE = 10;
const LASTMOD_TIMESTAMP_CEIL = '2019-07-28 00:00:00';
const LANGUAGES = ['en', 'ko'];

// SELECT CONCAT('lang_', art.page_lang, '/', art.slug, '|', art.ipfs_hash_current, '|', TRIM(art.page_title))
// FROM enterlink_articletable art
// WHERE id BETWEEN 1000 AND 1000000
// AND art.is_removed = 0
// AND art.is_indexed = 1
// AND redirect_page_id IS NULL

commander
  .version('1.0.0', '-v, --version')
  .description('Make WebP Images')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);


export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

const RegenerateMainPhoto = async (inputItem: Media, slug: string, lang_code: string, auxiliary_prefix: string, uploadTypeInput: string, mediaType: MediaType): Promise<Media> => {
    let theUrl = inputItem.url;
    let theBuffer = await theMediaUploadSvc.getImageBufferFromURL(theUrl);
    let theFileName = theUrl.substring(theUrl.lastIndexOf('/') + 1 );
    let uploadResult = await theMediaUploadSvc.processMedia(theBuffer, lang_code, slug, 'IDENTIFIER', uploadTypeInput, 'CAPTION', theFileName);

    return null;
}

export const AlterAllMainPhotosInPlace = async (inputString: string, processMediaGallery: boolean = false) => {
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
    console.log("\n");
    console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    console.log(chalk.blue.bold("---------------------------------------------------------------------------------------"));
    console.log(chalk.blue.bold("=========================================START========================================="));
    console.log(chalk.blue.bold(`Starting to process: ${inputString}`));
    console.log(chalk.blue.bold(`Page Title: |${pageTitle}|`));
    console.log(chalk.blue.bold(`Page Slug: |${slug}|`));

    // Get the article object
    let hashCacheResult: Array<any> = await theMysql.TryQuery(
        `
            SELECT * FROM enterlink_hashcache WHERE ipfs_hash = ?
        `,
        [inputIPFS]
    );

    // Get the article JSON
    let wiki: ArticleJson;
    try {
        wiki = JSON.parse(hashCacheResult[0].html_blob);
    } catch (e) {
        wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(hashCacheResult[0].html_blob)));
        wiki.ipfs_hash = hashCacheResult[0].ipfs_hash;
    }

    // If it is an import, prefix with AuxiliaryImports and the page note
    const pageNoteFilter = wiki.metadata.filter(w => w.key == 'page_note');
    const page_note = pageNoteFilter.length ? pageNoteFilter[0].value : null;
    const auxiliary_prefix = page_note ? `AuxiliaryImports/${page_note.slice(1, -1)}/` : "";

    logYlw("==================MAIN PHOTO=================");
    // Deal with the main photo first
    // If the default photo is present, just put in the default WebP images and skip the upload
    if (wiki.main_photo && wiki.main_photo.length){
        let theMainPhoto: Media = wiki.main_photo[0];
        wiki.main_photo = [await RegenerateMainPhoto(theMainPhoto, slug, lang_code, auxiliary_prefix, 'ProfilePicture', 'main_photo') as Media]
    }

    return false;
    // console.log(util.inspect(wiki.main_photo, {showHidden: false, depth: null, chalk: true}));

    // if(processMediaGallery){
    //     logYlw("================MEDIA GALLERY================");
    //     // Deal with the other media now
    //     wiki.citations = await Promise.all(wiki.citations.map(async (ctn) => {
    //         // Only process media citations
    //         if (!ctn.media_props) return ctn;
    //         if (ctn.category == 'YOUTUBE' 
    //         || ctn.category == 'NORMAL_VIDEO' 
    //         || ctn.category == 'AUDIO' 
    //         || ctn.category == 'NONE'
    //         || ctn.category == 'BOOK'
    //         || ctn.category == 'PERIODICAL' 
    //         || ctn.category == 'FILE'
    //         ) return ctn;
    //         else {
    //             return await RegenerateMainPhoto(ctn, slug, lang_code, auxiliary_prefix, 'NewlinkFiles', 'normal') as Citation
    //         }
    //     }));
    //     // console.log(util.inspect(wiki.citations, {showHidden: false, depth: null, chalk: true}));
    // }


    logYlw("=================MAIN UPLOAD=================");

    try {
        const json_insertion = await theMysql.TryQuery(
            `
                UPDATE enterlink_hashcache
                SET html_blob = ?
                WHERE ipfs_hash = ? 
            `,
            [JSON.stringify(wiki), inputIPFS]
        );
    } catch (e) {
        if (e.message.includes("ER_DUP_ENTRY")){
            console.log(chalk.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
        }
        else throw e;
    }

    let main_photo = wiki && wiki.main_photo && wiki.main_photo.length && wiki.main_photo[0];
    const media_props = main_photo.media_props || null;
    const webp_large = media_props && media_props.webp_original || "NULL";
    const webp_medium = media_props && media_props.webp_medium || "NULL";
    const webp_small =  media_props && media_props.webp_thumb || "NULL";

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
                AND photo_url <> 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png'
                AND page_lang IN (?)
            `,
            [currentStart, currentEnd, LANGUAGES]
        );

        for await (const artResult of fetchedArticles) {
            try{
                await AlterAllMainPhotosInPlace(artResult.concatted, false);
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
            }
        }

        
    }
    return;
})();



