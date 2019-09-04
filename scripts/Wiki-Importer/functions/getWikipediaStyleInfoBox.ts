const cheerio = require('cheerio');
import { getTable } from './pagebodyfunctionalities/tablefunctionalities/getTable';
import { CheerioPack } from './pagebodyfunctionalities/cleaners';
const wikipedia = 'https://en.wikipedia.org/wiki/';
import { Table, PageType } from '../../../src/types/article';
import { INFOBOX_PAGE_TYPE_CLUES } from '../functions/wiki-constants';
const chalk = require('chalk');

export interface WikipediaInfoboxResultPack {
	table: Table,
	page_type: PageType
}

// Get the Wikipedia infobox
export const getWikipediaStyleInfoBox = (input_pack: CheerioPack, internal_citations): WikipediaInfoboxResultPack => { 
	const $ = input_pack.cheerio_static;
	const $content = $('div.mw-parser-output');
	const $table = $content.find('.infobox');
	let pageTypeToUse: PageType = "Thing";

	let ibox_class = $table.eq(0)[0].attribs['class'];
	INFOBOX_PAGE_TYPE_CLUES.forEach(clue => {
        if (ibox_class.indexOf(clue.class) >= 0) {
			pageTypeToUse = clue.page_type;
			console.log(chalk.green(`Page type found from infobox!: ${pageTypeToUse}`));
		}
    });

	if ($table.length > 0) {
		return {
			table: getTable($table, $, internal_citations, "wikitable"),
			page_type: pageTypeToUse
		}
	}
	else{
		return {
			table: null,
			page_type: pageTypeToUse
		}
	}
};