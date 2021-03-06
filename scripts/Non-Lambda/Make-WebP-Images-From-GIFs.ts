
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
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

const BATCH_SIZE = 250;
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
  .description('Make WebP Images From GIFs and also fill in missing non-WebP thumbnails')
  .usage('[OPTIONS]...')
  .option('-s, --start <pageid>', 'Starting ID')
  .option('-e, --end <endid>', 'Ending ID')
  .parse(process.argv);

interface WebPTrioBuf {
    webpOriginalBuf: Buffer,
    webpMediumBuf: Buffer,
    webpThumbBuf: Buffer,
}

interface WebPTrioURL {
    webp_original?: string;
    webp_medium?: string;
    webp_thumb?: string;
}

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

const UpdateWithWebP = async (inputItem: Media | Citation, slug: string, lang_code: string, auxiliary_prefix: string, uploadTypeInput: string, mediaType: MediaType): Promise<Media | Citation> => {
    let returnItem = inputItem;
    if (inputItem.url == 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png'){
        returnItem = {
            ...inputItem,
            media_props: {
                ...inputItem.media_props,
                type: mediaType,
                webp_original: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-original.webp',
                webp_medium: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-medium.webp',
                webp_thumb: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-thumb.webp'
            }
        }
        console.log(chalk.green("Default image found, so using default WebP's."));
    }
    else if (inputItem.media_props 
            && inputItem.media_props.webp_original
            && inputItem.media_props.webp_original.indexOf('webp') >= 0
            && inputItem.media_props.webp_original.indexOf('no-image-slide') == -1){
        console.log(chalk.green("Existing WebP found, so skipping WebP part."));
    }
    else {
        console.log(chalk.yellow(`Need to make new WebP's for ${inputItem.url}.`));
        let theTrio = await MakeWebPTrio(inputItem.url, slug, lang_code, `${auxiliary_prefix}${uploadTypeInput}`);
        returnItem = {
            ...inputItem,
            media_props: {
                ...inputItem.media_props,
                type: mediaType,
                ...theTrio
            }
        };
        console.log(chalk.green.bold(`Made a WebP image for ${uploadTypeInput}: ${theTrio.webp_original}`))//: " )), util.inspect(theTrio, {showHidden: false, depth: null, chalk: true})));
    }

    if(!inputItem.thumb || inputItem.thumb == 'https://everipedia-fast-cache.s3.amazonaws.com/images/no-image-slide-big.png'){
        console.log(chalk.yellow(`Need to make a normal thumbnail for ${inputItem.url}.`));
        let theNewThumb = await MakeRegularThumbnail(inputItem.url, slug, lang_code, `${auxiliary_prefix}${uploadTypeInput}`);
        returnItem = {
            ...returnItem,
            thumb: theNewThumb
        }
        console.log(chalk.green.bold(`Made a normal thumbnail for ${uploadTypeInput}: ${theNewThumb}`))//: " )), util.inspect(theTrio, {showHidden: false, depth: null, chalk: true})));
    }
    else{
        console.log(chalk.green("Existing thumbnail found, so skipping thumbnail part."));
    }




    return returnItem;
}

const MakeWebPTrio = async (startingURL: string, slug: string, lang: string, uploadType: string): Promise<WebPTrioURL> => {
    // Initialize the buffer pack
    let bufferPack: WebPTrioBuf = { 
        webpOriginalBuf: new Buffer(''),
        webpMediumBuf: new Buffer(''),
        webpThumbBuf: new Buffer('')
    };

    // Initialize the return pack
    let returnPack: WebPTrioURL = { 
        webp_original: null,
        webp_medium: null,
        webp_thumb: null
    };

    // Fetch the image
    let response = await axios.default({
        url: startingURL,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 5000
    });

    let fileBuffer = response.data;
    let mimePack: MimePack = await fromBuffer(fileBuffer);
    if (mimePack == null){
        if (isSvg(fileBuffer)){
            mimePack = {
                ext: 'svg',
                mime: 'image/svg+xml'
            } as any;
        }
    }
    let returnPackMimed: Partial<FileFetchResult> = {
        file_buffer: fileBuffer,
        mime_pack: mimePack
    };
    

    // Set the starting buffer
    let bufferToUse = returnPackMimed.file_buffer;

    // Get the original image in WEBP form
    bufferPack.webpOriginalBuf = await sharp(bufferToUse)
        .resize(mainWidth, mainHeight, {
            fit: 'inside',
            // background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 60, reductionEffort: 6, force: true, alphaQuality: 60 })
        .toBuffer()
        .then((buffer) => buffer)
        .catch((err) => console.log(err));

    // Resize the WEBP for the medium image
    bufferPack.webpMediumBuf = await sharp(bufferToUse)
        .resize(mediumWidth, mediumHeight, {
            fit: 'inside',
            // background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 60, reductionEffort: 6, force: true, alphaQuality: 60 })
        .toBuffer()
        .then((buffer) => buffer)
        .catch((err) => console.log(err));

    // Resize the WEBP for the thumb image
    bufferPack.webpThumbBuf = await sharp(bufferToUse)
        .resize(thumbWidth, thumbHeight, {
            fit: 'inside',
            // background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 60, reductionEffort: 6, force: true, alphaQuality: 60 })
        .toBuffer()
        .then((buffer) => buffer)
        .catch((err) => console.log(err));


    // Gzip the webp images
    bufferPack.webpOriginalBuf = zlib.gzipSync(bufferPack.webpOriginalBuf, {
        level: zlib.constants.Z_BEST_COMPRESSION
    });
    bufferPack.webpMediumBuf = zlib.gzipSync(bufferPack.webpMediumBuf, {
        level: zlib.constants.Z_BEST_COMPRESSION
    });
    bufferPack.webpThumbBuf = zlib.gzipSync(bufferPack.webpThumbBuf, {
        level: zlib.constants.Z_BEST_COMPRESSION
    });

    // Set the AWS S3 bucket keys
    let encodedSuffixFirstPart = encodeURIComponent(slugify(slug + "__" + crypto.randomBytes(3).toString('hex'), { remove: /[*+~.()'"#%?!:@]/g }));
    let encodedSuffixWebpOriginal = `${encodedSuffixFirstPart}_original.webp`;
    let encodedSuffixWebpMedium = `${encodedSuffixFirstPart}_medium.webp`;
    let encodedSuffixWebpThumb = `${encodedSuffixFirstPart}_thumb.webp`;
    let theFullKeyWebpOriginal = `${uploadType}/${lang}/${encodedSuffixWebpOriginal}`;
    let theFullKeyWebpMedium = `${uploadType}/${lang}/${encodedSuffixWebpMedium}`;
    let theFullKeyWebpThumb = `${uploadType}/${lang}/${encodedSuffixWebpThumb}`;

    let theReusableParts = {
        Bucket: theBucket,
        ACL: 'public-read',
        ContentType: "image/webp",
        CacheControl: 'max-age=31536000',
        ContentEncoding: 'gzip'
    };

    // Specify S3 upload options for the webp'd original
    let uploadParamsMainWebpOriginal = {
        Key: theFullKeyWebpOriginal,
        Body: bufferPack.webpOriginalBuf,
        ...theReusableParts
    };

    // Specify S3 upload options for the medium webp
    let uploadParamsMainWebpMedium = {
        Key: theFullKeyWebpMedium,
        Body: bufferPack.webpMediumBuf,
        ...theReusableParts
    };

    // Specify S3 upload options for the thumb webp
    let uploadParamsMainWebpThumb = {
        Key: theFullKeyWebpThumb,
        Body: bufferPack.webpThumbBuf,
        ...theReusableParts
    };

    // Upload the WebP original to S3
    returnPack = await new Promise<WebPTrioURL>((resolve, reject) => {
        theAWSS3.upload(uploadParamsMainWebpOriginal, (s3ErrInner, dataInner) => {
            if (s3ErrInner){
                console.log(chalk.yellow('ERROR: s3ErrInner for thumb'));
                console.log(s3ErrInner);
                reject(s3ErrInner);
            }
            else {
                returnPack.webp_original = dataInner.Location;
                resolve(returnPack);
            }
        });
    });

    // Upload the WebP medium to S3
    returnPack = await new Promise<WebPTrioURL>((resolve, reject) => {
        theAWSS3.upload(uploadParamsMainWebpMedium, (s3ErrInner, dataInner) => {
            if (s3ErrInner){
                console.log(chalk.yellow('ERROR: s3ErrInner for thumb'));
                console.log(s3ErrInner);
                reject(s3ErrInner);
            }
            else {
                returnPack.webp_medium = dataInner.Location;
                resolve(returnPack);
            }
        });
    });

    // Upload the WebP thumb to S3
    returnPack = await new Promise<WebPTrioURL>((resolve, reject) => {
        theAWSS3.upload(uploadParamsMainWebpThumb, (s3ErrInner, dataInner) => {
            if (s3ErrInner){
                console.log(chalk.yellow('ERROR: s3ErrInner for thumb'));
                console.log(s3ErrInner);
                reject(s3ErrInner);
            }
            else {
                returnPack.webp_thumb = dataInner.Location;
                resolve(returnPack);
            }
        });
    });

    return returnPack;
}


const MakeRegularThumbnail = async (startingURL: string, slug: string, lang: string, uploadType: string): Promise<string> => {
    // Initialize the buffer pack
    let thumbBuffer = new Buffer('');

    // Initialize the return pack
    let returnUrl: string = "";

    // Fetch the image
    let response = await axios.default({
        url: startingURL,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 5000
    })

    let fileBuffer = response.data;
    let mimePack: MimePack = await fromBuffer(fileBuffer);
    if (mimePack == null){
        if (isSvg(fileBuffer)){
            mimePack = {
                ext: 'svg',
                mime: 'image/svg+xml'
            } as any;
        }
    }
    let returnPackMimed: Partial<FileFetchResult> = {
        file_buffer: fileBuffer,
        mime_pack: mimePack
    };

    // Set the starting buffer
    let bufferToUse = returnPackMimed.file_buffer;

    // Get the original image in jpeg form
    thumbBuffer = await sharp(bufferToUse)
        .resize(thumbWidth, thumbHeight, {
            fit: 'inside',
        })
        .jpeg({ quality: 60, force: true, alphaQuality: 60 })
        .toBuffer()
        .then((buffer) => buffer)
        .catch((err) => console.log(err));


    // Gzip the jpeg image
    thumbBuffer = zlib.gzipSync(thumbBuffer, {
        level: zlib.constants.Z_BEST_COMPRESSION
    });

    // Set the AWS S3 bucket keys
    let encodedSuffixFirstPart = encodeURIComponent(slugify(slug + "__" + crypto.randomBytes(3).toString('hex'), { remove: /[*+~.()'"#%?!:@]/g }));
    let encodedSuffixThumb = `${encodedSuffixFirstPart}_thumb.jpeg`;
    let theFullKeyThumb = `${uploadType}/${lang}/${encodedSuffixThumb}`;

    let theReusableParts = {
        Bucket: theBucket,
        ACL: 'public-read',
        ContentType: "image/jpeg",
        CacheControl: 'max-age=31536000',
        ContentEncoding: 'gzip'
    };

    // Specify S3 upload options for the webp'd original
    let uploadParamsMainThumb = {
        Key: theFullKeyThumb,
        Body: thumbBuffer,
        ...theReusableParts
    };

    // Upload the WebP original to S3
    returnUrl = await new Promise<string>((resolve, reject) => {
        theAWSS3.upload(uploadParamsMainThumb, (s3ErrInner, dataInner) => {
            if (s3ErrInner){
                console.log(chalk.yellow('ERROR: s3ErrInner for thumb'));
                console.log(s3ErrInner);
                reject(s3ErrInner);
            }
            else {
                returnUrl = dataInner.Location;
                resolve(returnUrl);
            }
        });
    });


    return returnUrl;
}

export const MakeWebPImagesFromGIFs = async (inputString: string, processMediaGallery: boolean = true) => {
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
        wiki.main_photo = [await UpdateWithWebP(theMainPhoto, slug, lang_code, auxiliary_prefix, 'ProfilePicture', 'main_photo') as Media]
    }
    // console.log(util.inspect(wiki.main_photo, {showHidden: false, depth: null, chalk: true}));

    if(processMediaGallery){
        logYlw("================MEDIA GALLERY================");
        // Deal with the other media now
        wiki.citations = await Promise.all(wiki.citations.map(async (ctn) => {
            // Only process media citations
            if (!ctn.media_props) return ctn;
            if (ctn.category == 'YOUTUBE' 
            || ctn.category == 'NORMAL_VIDEO' 
            || ctn.category == 'AUDIO' 
            || ctn.category == 'NONE'
            || ctn.category == 'BOOK'
            || ctn.category == 'PERIODICAL' 
            || ctn.category == 'FILE'
            ) return ctn;
            else {
                return await UpdateWithWebP(ctn, slug, lang_code, auxiliary_prefix, 'NewlinkFiles', 'normal') as Citation
            }
        }));
        // console.log(util.inspect(wiki.citations, {showHidden: false, depth: null, chalk: true}));
    }


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
                SELECT CONCAT_WS('|', CONCAT('lang_', art.page_lang, '/', art.slug), CONCAT('lang_', art.page_lang, '/', art.slug_alt), art.ipfs_hash_current, TRIM(art.page_title), art.id, IFNULL(art.redirect_page_id, ''), art.creation_timestamp ) as concatted
                FROM enterlink_articletable art
                WHERE id between ? and ?
                AND is_removed = 0
                AND is_indexed = 1
                AND redirect_page_id IS NULL
                AND (webp_large IS NULL OR webp_large = '')
                AND photo_url LIKE '%.gif'
                AND page_lang IN (?)
            `,
            [currentStart, currentEnd, LANGUAGES]
        );

        for await (const artResult of fetchedArticles) {
            try{
                await MakeWebPImagesFromGIFs(artResult.concatted, false);
            }
            catch (err){
                console.error(`${artResult.concatted} FAILED!!! [${err}]`);
                console.log(util.inspect(err, {showHidden: false, depth: null, chalk: true}));
            }
        }

        
    }
    return;
})();



