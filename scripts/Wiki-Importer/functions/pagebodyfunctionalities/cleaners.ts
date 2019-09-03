import * as cheerio from 'cheerio';
import { PRECLEAN_BAD_ELEMENTS, PRECLEAN_UNWRAP_ELEMENTS, ElementCleaningPack } from '../wiki-constants';
const chalk = require('chalk');

export const preCleanHTML = (input_html: string): string => {
    const $ = cheerio.load(input_html, {decodeEntities: false});
    
    // Remove certain elements
    PRECLEAN_BAD_ELEMENTS.forEach(pack => {
        let parent_selector = pack.parent ? 
                            `${pack.parent.id ? '#' + pack.parent.id : ""}${pack.parent.class ? '.' + pack.parent.class : ""} `
                            : "" ;
        let selector = `${parent_selector}${pack.tag}${pack.id ? '#' + pack.id : ""}${pack.class ? '.' + pack.class : ""}`;
        $(selector).each((idx, $elem) => {
            $($elem).remove();
            console.log(chalk.red(`${selector} removed...`));
        });
    })
    
    // Unwrap certain elements
    PRECLEAN_UNWRAP_ELEMENTS.forEach(pack => {
        let parent_selector = pack.parent ? 
                            `${pack.parent.id ? '#' + pack.parent.id : ""}${pack.parent.class ? '.' + pack.parent.class : ""} `
                            : "" ;
        let selector = `${parent_selector}${pack.tag}${pack.id ? '#' + pack.id : ""}${pack.class ? '.' + pack.class : ""}`;
        $(selector).each((idx, $elem) => {
            $($elem).replaceWith($($elem).contents());
            console.log(chalk.red(`${selector} unwrapped...`));
        });
    })
    return $.html();
}