import { cleanAttrs } from './getAttributes';
import { getTagClass } from './getTagClass';
import { getParsedCellContent } from './tablefunctionalities/cellParser';
import { DescList, DescListItem } from '../../../../src/types/article';

// Input: <dl> element
// Output: array of formatted dt && dd elements 

export const getDescList = (element, $): DescList => {
	let $desclist = $(element); 
	let inner_items: DescListItem[] = []; // Instantiate return array

	// Loop through the children
	$desclist.children('dt, dd').each((i, el) => {
		let $item = $(el); 
		let DescListItem: DescListItem = {
			index: i,
			tag_type: $item[0].name,
			tag_class: getTagClass($item[0].name),
			attrs: cleanAttrs(el.attrs),
			content: []
		}
		// Compute DescListItem.content
		let content = getParsedCellContent(el, $);
		DescListItem.content = content;
		inner_items.push(DescListItem);
	})

	// Return the DescList
	return {
		type: 'dl',
		attrs: {},
		items: inner_items
	} as DescList;
}
