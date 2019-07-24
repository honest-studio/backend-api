
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
const fileType = require('file-type');
import * as axios from 'axios';

import * as crypto from 'crypto';
const isSvg = require('is-svg');
import { FileFetchResult, MediaUploadResult, MimePack, PhotoExtraData } from '../../src/media-upload/media-upload-dto';
import { oldHTMLtoJSON, infoboxDtoPatcher, mergeMediaIntoCitations } from '../../src/utils/article-utils';
const slugify = require('slugify');
slugify.extend({'%': '_u_'});
const util = require('util');
const chalk = require('chalk');
const fs = require('fs');
const sharp = require('sharp');
const zlib = require('zlib');

const mainWidth = 1201;
const mainHeight = 1201;
const mediumWidth = 450;
const mediumHeight = 450;
const thumbWidth = 200;
const thumbHeight = 200;

const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);
const theAWSS3 = new AWSS3Service(theConfig);
const theBucket = theAWSS3.getBucket();

// SELECT CONCAT('lang_', art.page_lang, '/', art.slug, '|', art.ipfs_hash_current, '|', art.page_title)
// FROM enterlink_articletable art
// WHERE id < 100
// AND art.is_removed = 0
// AND art.is_indexed = 1
// AND redirect_page_id IS NULL

commander
  .version('1.0.0', '-v, --version')
  .description('Make WebP images')
  .usage('[OPTIONS]...')
  .option('-i, --input <path>', 'Input file')
  .parse(process.argv);

// Open the file with the URLs
const readInterface = readline.createInterface({
    input: fs.createReadStream(path.resolve(__dirname, commander.input)), 
    // output: process.stdout,
    // console: false
});

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
            && inputItem.media_props.webp_original.indexOf('webp') >= 0){
        console.log(chalk.green("Existing WebP found, so skipping."));
    }
    else {
        console.log(chalk.yellow(`Need to make new WebP's for |${inputItem.url}|.`));
        let theTrio = await MakeWebPTrio(inputItem.url, slug, lang_code, `${auxiliary_prefix}${uploadTypeInput}`);
        returnItem = {
            ...inputItem,
            media_props: {
                ...inputItem.media_props,
                type: mediaType,
                ...theTrio
            }
        };
        console.log(chalk.green("Made the WebP images"))//: " )), util.inspect(theTrio, {showHidden: false, depth: null, chalk: true})));
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
    let fetchResult: Partial<FileFetchResult> = await axios.default({
        url: startingURL,
        method: 'GET',
        responseType: 'arraybuffer',
    }).then(response => {
        let fileBuffer = response.data;
        let mimePack: MimePack = fileType(fileBuffer);
        if (mimePack == null){
            if (isSvg(fileBuffer)){
                mimePack = {
                    ext: 'svg',
                    mime: 'image/svg+xml'
                }
            }
        }
        let returnPack: Partial<FileFetchResult> = {
            file_buffer: fileBuffer,
            mime_pack: mimePack
        };
        return returnPack;
    })

    // Set the starting buffer
    let bufferToUse = fetchResult.file_buffer;

    // Get the original image in WEBP form
    bufferPack.webpOriginalBuf = await sharp(bufferToUse)
        .resize(mainWidth, mainHeight, {
            fit: 'inside',
            // background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 100, lossless: true, force: true })
        .toBuffer()
        .then((buffer) => buffer)
        .catch((err) => console.log(err));

    // Resize the WEBP for the medium image
    bufferPack.webpMediumBuf = await sharp(bufferToUse)
        .resize(mediumWidth, mediumHeight, {
            fit: 'inside',
            // background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 85, nearLossless: true, force: true })
        .toBuffer()
        .then((buffer) => buffer)
        .catch((err) => console.log(err));

    // Resize the WEBP for the thumb image
    bufferPack.webpThumbBuf = await sharp(bufferToUse)
        .resize(thumbWidth, thumbHeight, {
            fit: 'inside',
            // background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 85, lossless: false, force: true })
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
    let encodedSuffixFirstPart = encodeURIComponent(slugify(slug + "__" + crypto.randomBytes(3).toString('hex')));
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

export const MakeWebPImages = async (inputString: string) => {
    let wikiLangSlug = inputString.split("|")[0];
    let inputIPFS = inputString.split("|")[1];
    let pageTitle = inputString.split("|")[2];

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
    console.log(chalk.blue.bold(`Starting to process: |${inputString}|`));
    console.log(chalk.blue.bold(`Page Title: |${pageTitle}|`))
    console.log(chalk.blue.bold(`Page Slug: |${slug}|`))

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
        wiki = oldHTMLtoJSON(hashCacheResult[0].html_blob);
        wiki.ipfs_hash = hashCacheResult[0].ipfs_hash;
    }

    // Run the patches for now
    wiki = infoboxDtoPatcher(mergeMediaIntoCitations(wiki));

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

    logYlw("================MEDIA GALLERY================");
    // Deal with the other media now
    wiki.citations = await Promise.all(wiki.citations.map(async (ctn) => {
        // Only process media citations
        if (!ctn.media_props) return ctn;
        if (ctn.category == 'YOUTUBE' || ctn.category == 'NORMAL_VIDEO' || ctn.category == 'AUDIO' || ctn.category == 'NONE') return ctn;
        else {
            return await UpdateWithWebP(ctn, slug, lang_code, auxiliary_prefix, 'NewlinkFiles', 'normal') as Citation
        }
    }));
    // console.log(util.inspect(wiki.citations, {showHidden: false, depth: null, chalk: true}));

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
    
    console.log(chalk.blue.bold("========================================COMPLETE======================================="));
    return null;
}

(async () => {
    for await (const inputLine of readInterface) {
        try{
            await MakeWebPImages(inputLine);
        }
        catch (err){
            console.error(`${inputLine} FAILED!!! [${err}]`);
        }
    }

})();
