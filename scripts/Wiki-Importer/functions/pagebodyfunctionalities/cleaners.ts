import * as cheerio from 'cheerio';

export const preCleanHTML = (input_html: string): string => {
	const $ = cheerio.load(input_html, {decodeEntities: false});
    // const $content = $('div.mw-parser-output');
    

    return $.html();
}