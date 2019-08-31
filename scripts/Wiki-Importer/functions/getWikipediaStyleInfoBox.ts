const cheerio = require('cheerio');
const getTable = require('./pagebodyfunctionalities/tablefunctionalities/getTable');
const wikipedia = 'https://en.wikipedia.org/wiki/';
const Table = {}; // Array of {paragraphs: , images: } objects 
import { Table } from '../../../src/types/article';

// Get the Wikipedia infobox
export const getWikipediaStyleInfoBox = (html): Table => { 
	const $ = cheerio.load(html, {decodeEntities: false});
	const $content = $('div.mw-parser-output');
	const $table = $content.find('.infobox');
	if ($table.length > 0) {
		return getTable($table, $);
	}
	return null;
};