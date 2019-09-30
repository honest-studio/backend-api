import { cleanAttributes } from '../../../../../src/utils/article-utils/article-converter';
import { getTagClass } from '../getTagClass';
import { accumulateText } from '../textParser';
import { parseAnchorTag } from '../parseAnchorTag';
import { Table, TableCell, TableRow, TableSection, TableCaption, NestedContentItem, NestedTextItem, NestedTagItem } from '../../../../../src/types/article';
import { nestedContentParser } from '../../../../../src/utils/article-utils/article-converter';
const util = require('util');
const chalk = require('chalk');

export const getTable = (element, $: CheerioStatic, internal_citations, table_type: 'wikitable' | 'body-table'): Table => {
	let $table = $(element);

	// Fix /wiki links first
	$($table).find("a").each((idx, anchor) => {
		let theClass = anchor.attribs && anchor.attribs.class;
		if (theClass && theClass.search(/flagicon|image/gimu) >= 0){
			// Do nothing
		}
		else{
			$(anchor).replaceWith(parseAnchorTag(anchor, $));
		}
		// console.log($.html(anchor))
		
		// console.log(parseAnchorTag(anchor, $));
	})
	

 	// Instantiate return object
	let table: Table = {
		type: table_type,
		attrs: cleanAttributes($table[0].attribs), 
		caption: { attrs: {}, sentences: [] }, 
		thead: { rows: [], attrs: {} },
		tbody: { rows: [], attrs: {} },
		tfoot: { rows: [], attrs: {} }
	};

	// Initiate various things
	let rows: TableRow[] = [];
	let cells: TableCell[] = [];
	let content: NestedContentItem[] = []; // Cell content

	// Traverse table
	// Loop through each row
	$table.children('tbody').children('tr').each((i, el) => {
		cells = []; // Reset cells array for each new row
		let $row = $(el);
		let row: TableRow = {
			index: i,
			attrs: cleanAttributes(el.attribs),
			tag_type: 'tr',
			tag_class: 'block', 
			cells: []
		}

		 // Loop through each cell
		$row.children('td, th').each((i2, el2) => {
			let $cell = $(el2);
			let content = nestedContentParser(el2.children, []);
			if (content != [] && content != undefined) {
				let cell: TableCell = {
					index: i2,
					attrs: cleanAttributes(el2.attribs),
					tag_type: $cell[0].name as any,
					tag_class: 'block', 
					content: content
				}
				cells.push(cell); 
			}
		}) 
		row.cells = cells; 
		// console.log(chalk.yellow("------------------------"))
		// console.log($.html($row))
		// console.log(util.inspect(row, {showHidden: false, depth: null, chalk: true}));
		rows.push(row)
	});

	// Create the table body
	let the_found_table = $table.find('tbody')[0];
	if(the_found_table){
		let tbody: TableSection = {
			attrs: cleanAttributes($table.find('tbody')[0].attribs),
			rows: rows
		};
		table.tbody = tbody;
	}
	
	// Look for a table caption
	let $caption = $table.find('caption');
	if ($caption.length){
		table.caption = {
			attrs: cleanAttributes($caption.eq(0)[0].attribs),
			sentences: accumulateText($caption, $, [])
		}
	}
	
    return table;
}
