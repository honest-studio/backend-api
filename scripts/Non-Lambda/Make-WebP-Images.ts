
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

const MakeWebPTrio = (startingURL: string): WebPTrioURL => {
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
    let mainArticleJson: ArticleJson;
    try {
        mainArticleJson = JSON.parse(hashCacheResult[0].html_blob);
    } catch (e) {
        mainArticleJson = oldHTMLtoJSON(hashCacheResult[0].html_blob);
        mainArticleJson.ipfs_hash = hashCacheResult[0].ipfs_hash;
    }

    // Run the patches for now
    mainArticleJson = infoboxDtoPatcher(mergeMediaIntoCitations(mainArticleJson));

    console.log(util.inspect(mainArticleJson, {showHidden: false, depth: null, chalk: true}));
    
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
