const cheerio = require('cheerio');
import { getTable } from './pagebodyfunctionalities/tablefunctionalities/getTable';
import { CheerioPack } from './pagebodyfunctionalities/cleaners';
const wikipedia = 'https://en.wikipedia.org/wiki/';
const Table = {}; // Array of {paragraphs: , images: } objects 
import { Table } from '../../../src/types/article';

// Get the Wikipedia infobox
export const getWikipediaStyleInfoBox = (input_pack: CheerioPack, internal_citations): Table => { 
	const $ = input_pack.cheerio_static;
	const $content = $('div.mw-parser-output');
	const $table = $content.find('.infobox');
	if ($table.length > 0) {
		return getTable($table, $, internal_citations, "wikitable");
	}
	return null;
};