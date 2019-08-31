import { cleanAttrs } from '../getAttributes';
import { getTagClass } from '../getTagClass';
import { getParsedCellContent } from './cellParser'; 
import { Table, TableCell, TableRow, TableSection, TableCaption, NestedContentItem } from '../../../../../src/types/article';

export const getTable = (element, $): Table => {
	let $table = $(element);

 	// Instantiate return object
	let table: Table = {
		type: $table.attr('class'),
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
			let content = getParsedCellContent(el2, $);
			if (content != [] && content != undefined) {
				let cell: TableCell = {
					index: i2,
					attrs: cleanAttrs(el2.attribs),
					tag_type: $cell[0].name,
					tag_class: 'block', 
					content: content
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
