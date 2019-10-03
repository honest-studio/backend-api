const cheerio = require('cheerio');
import { getTable } from './pagebodyfunctionalities/tablefunctionalities/getTable';
import { CheerioPack } from './pagebodyfunctionalities/cleaners';
const wikipedia = 'https://en.wikipedia.org/wiki/';
import { Table, PageType } from '../../../src/types/article';
import { INFOBOX_OUTER_PAGE_TYPE_CLUES, INFOBOX_INNER_PAGE_TYPE_CLUES, INFOBOX_PAGE_TYPE_KEYWORDS } from '../functions/wiki-constants';
const chalk = require('chalk');

export interface WikipediaInfoboxResultPack {
	table: Table,
	page_type: PageType,
	sub_page_type: string
}

// Get the Wikipedia infobox
export const getWikipediaStyleInfoBox = (input_pack: CheerioPack, internal_citations): WikipediaInfoboxResultPack => { 
	console.log(chalk.yellow.bold("=====================🖼️  INFOBOX 🖼️====================="));
	const $ = input_pack.cheerio_static;
	const $content = $('div.mw-parser-output');
	const $table = $content.find('.infobox');
	let pageTypeToUse: PageType = "Thing";
	let subPageTypeToUse: string = "";

	if ($table.length == 0) {
		console.log(chalk.yellow(`No infobox present. Skipping...`));
		console.log(chalk.bold.green(`DONE`));
		return {
			table: null,
			page_type: null,
			sub_page_type: null
		}
	}

	let theAttribs = $table.eq(0)[0] && $table.eq(0)[0].attribs;
	let ibox_class = theAttribs && theAttribs['class'];
	console.log(chalk.yellow(`Trying to find the page type`));
	INFOBOX_OUTER_PAGE_TYPE_CLUES.forEach(clue => {
        if ($($table).parent().find(clue.selector).length > 0) {
			pageTypeToUse = clue.page_type;
			subPageTypeToUse = clue.sub_page_type;
			console.log(chalk.green(`Page Type found from infobox!: ${pageTypeToUse}`));
			if (subPageTypeToUse) console.log(chalk.green(`Sub Page Type found from infobox!: ${subPageTypeToUse}`));
		}
	});

	INFOBOX_INNER_PAGE_TYPE_CLUES.forEach(clue => {
        if ($($table).find(clue.selector).length > 0) {
			pageTypeToUse = clue.page_type;
			subPageTypeToUse = clue.sub_page_type;
			console.log(chalk.green(`Page type found from infobox!: ${pageTypeToUse}`));
			if (subPageTypeToUse) console.log(chalk.green(`Sub Page Type found from infobox!: ${subPageTypeToUse}`));
		}
	});

	// TODO: Loop through INFOBOX_PAGE_TYPE_KEYWORDS for page_type clues

	// Get the actual table
	process.stdout.write(chalk.yellow(`Parsing the table... `));
	let theTable = getTable($table, $, internal_citations, "wikitable");
	process.stdout.write(chalk.yellow(` DONE\n`));

	console.log(chalk.bold.green(`DONE`));
	return {
		table: theTable,
		page_type: pageTypeToUse,
		sub_page_type: subPageTypeToUse
	}
};