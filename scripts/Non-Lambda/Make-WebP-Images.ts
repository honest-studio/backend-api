
const commander = require('commander');
import { ArticleJson, InfoboxValue, Sentence, Media, Table, Paragraph } from '../../src/types/article';
import * as readline from 'readline';
const path = require('path');
const getYouTubeID = require('get-youtube-id');
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
