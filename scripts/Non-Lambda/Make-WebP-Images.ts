
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
import { MysqlService } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import { oldHTMLtoJSON, infoboxDtoPatcher, mergeMediaIntoCitations } from '../../src/utils/article-utils';

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

const MakeWebPTrio = async (startingURL: string): Promise<WebPTrioURL> => {
    return null;
}

export const MakeWebPImages = async (inputString: string) => {
    console.log(chalk.yellow(`Starting to scrape: |${inputString}|`));
    let wikiLangSlug = inputString.split("|")[0];
    let inputIPFS = inputString.split("|")[1];

    let lang_code, slug;
    if (wikiLangSlug.includes('lang_')) {
        lang_code = wikiLangSlug.split('/')[0].substring(5); // ignore the lang_ at the start
        slug = wikiLangSlug.split('/')[1];
    } else {
        lang_code = 'en';
        slug = wikiLangSlug;
    }
    const theConfig = new ConfigService(`.env`);
    const theMysql = new MysqlService(theConfig);

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

    logYlw("==================================MAIN PHOTO=================================");
    // Deal with the main photo first
    // If the default photo is present, just put in the default WebP images and skip the upload
    if (wiki.main_photo && wiki.main_photo.length){
        let theMainPhoto: Media = wiki.main_photo[0];
        if (theMainPhoto.url == 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png'){
            theMainPhoto = {
                ...theMainPhoto,
                media_props: {
                    ...theMainPhoto.media_props,
                    webp_original: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-original.webp',
                    webp_medium: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-medium.webp',
                    webp_thumb: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-thumb.webp'
                }
            }
            console.log(chalk.green("Default image found, so using default WebP's."));
            wiki.main_photo = [theMainPhoto];
        }
        else if (theMainPhoto.media_props 
                && theMainPhoto.media_props.webp_original
                && theMainPhoto.media_props.webp_original.indexOf('webp') >= 0){
            console.log(chalk.green("Existing WebP found, so skipping."));
        }
        else {
            console.log(chalk.yellow("Need to make new WebP's."));
            let theTrio = await MakeWebPTrio(theMainPhoto.url);
            theMainPhoto = {
                ...theMainPhoto,
                media_props: {
                    ...theMainPhoto.media_props,
                    ...theTrio
                }
            }
            console.log(chalk.green("Made the WebP images: ", theTrio));
        }
    }

    
    logYlw("================================MEDIA GALLERY================================");

    console.log(util.inspect(wiki, {showHidden: false, depth: null, chalk: true}));



    
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
