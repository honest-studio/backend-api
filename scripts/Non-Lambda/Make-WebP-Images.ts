
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
import { MysqlService } from '../../src/feature-modules/database';
import { ConfigService } from '../../src/common';
const util = require('util');
const chalk = require('chalk');
const fs = require('fs');

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


export const MakeWebPImages = async (wikiLangSlug: string) => {
    console.log(chalk.yellow(`Starting to scrape: |${wikiLangSlug}|`));
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
    let articleResultPacket: Array<any> = await theMysql.TryQuery(
        `
        SELECT 
            id,
            page_title
        FROM enterlink_articletable AS art 
        WHERE 
            page_lang = ? 
            AND slug = ?
            AND art.is_removed = 0
        `,
        [lang_code, slug]
    );
    console.log(articleResultPacket)
}

(async () => {
    for await (const inputWikiLangSlug of readInterface) {
        try{
            await MakeWebPImages(inputWikiLangSlug);
        }
        catch (err){
            console.error(`${inputWikiLangSlug} FAILED!!! [${err}]`);
        }
    }

})();
