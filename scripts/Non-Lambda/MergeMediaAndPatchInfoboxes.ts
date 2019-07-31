
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph, Citation, MediaType } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
import { MysqlService, AWSS3Service } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
import * as axios from 'axios';
import { oldHTMLtoJSON, infoboxDtoPatcher, mergeMediaIntoCitations } from '../../src/utils/article-utils';
const util = require('util');
const chalk = require('chalk');
const theConfig = new ConfigService(`.env`);
const theMysql = new MysqlService(theConfig);

const fs = require('fs');

commander
  .version('1.0.0', '-v, --version')
  .description('Merge Media and Patch Infoboxes')
  .usage('[OPTIONS]...')
  .option('-i, --input <path>', 'Input file')
  .parse(process.argv);

export const logYlw = (inputString: string) => {
    return console.log(chalk.yellow.bold(inputString));
}

// Open the file with the URLs
const readInterface = readline.createInterface({
    input: fs.createReadStream(path.resolve(__dirname, commander.input)), 
    // output: process.stdout,
    // console: false
});

export const MergeMediaAndPatchInfoboxes = async (inputString: string) => {
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

    if (wiki.infoboxes.length == 0 && wiki.media_gallery.length == 0){
        console.log(chalk.yellow("No infoboxes or media. Skipping..."));
        return;
    }
    console.log(chalk.yellow("Running the patch"));

    // Run the patches for now
    wiki = infoboxDtoPatcher(mergeMediaIntoCitations(wiki));

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
            await MergeMediaAndPatchInfoboxes(inputLine);
        }
        catch (err){
            console.error(`${inputLine} FAILED!!! [${err}]`);
        }
    }

})();
