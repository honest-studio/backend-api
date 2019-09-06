import { cleanAttrs } from '../getAttributes';
import { getTagClass } from '../getTagClass';
import { parseAnchorTag } from '../parseAnchorTag';
import { Table, TableCell, TableRow, TableSection, TableCaption, NestedContentItem } from '../../../../../src/types/article';
import { nestedContentParser } from '../../../../../src/utils/article-utils/article-converter';

export const getTable = (element, $: CheerioStatic, internal_citations, table_type: 'wikitable' | 'body-table'): Table => {
	let $table = $(element);

	// Fix /wiki links first
	$($table).find("a").each((idx, anchor) => {
		// console.log($(anchor).html())
		$(anchor).replaceWith(parseAnchorTag(anchor, $));
		// console.log(parseAnchorTag(anchor, $));
	})
	

 	// Instantiate return object
	let table: Table = {
		type: table_type,
		attrs: cleanAttrs($table[0].attribs), 
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
	$table.find('tr').each((i, el) => {
		cells = []; // Reset cells array for each new row
		let $row = $(el);
		let row: TableRow = {
			index: i,
			attrs: cleanAttrs(el.attribs),
			tag_type: 'tr',
			tag_class: 'block', 
			cells: []
		}

		 // Loop through each cell
		$row.find('td, th').each((i2, el2) => {
			let $cell = $(el2);

			let content = nestedContentParser(el2.children, []);

			// Combine adjacent text 
			let local_accumulator = "", merged_content: NestedContentItem[] = [];
			let content_idx = 0;
			while(content_idx < content.length){
				let item: NestedContentItem = content[content_idx]
				switch(item.type){
					case 'text': {
						break;
					}
					case 'tag': {
						break;
					}
				}
				content_idx++;
			}


			if (merged_content != [] && merged_content != undefined) {
				let cell: TableCell = {
					index: i2,
					attrs: cleanAttrs(el2.attribs),
					tag_type: $cell[0].name as any,
					tag_class: 'block', 
					content: merged_content
				}
				cells.push(cell); 
			}
		}) 
		row.cells = cells; 
		rows.push(row)
	});

	// Create the table body
    let tbody: TableSection = {
        attrs: cleanAttrs($table.find('tbody')[0].attribs),
        rows: rows
	};
	
    table.tbody = tbody;
    return table;
}
