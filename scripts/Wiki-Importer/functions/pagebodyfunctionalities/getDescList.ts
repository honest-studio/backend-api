import { cleanAttributes } from '../../../../src/utils/article-utils/article-converter';
import { getTagClass } from './getTagClass';
import { nestedContentParser } from '../../../../src/utils/article-utils/article-converter';
import { DescList, DescListItem } from '../../../../src/types/article';

// Input: <dl> element
// Output: array of formatted dt && dd elements 

export const getDescList = (element, $, internal_citations): DescList => {
	let $desclist = $(element); 
	let inner_items: DescListItem[] = []; // Instantiate return array

	// Loop through the children
	$desclist.children('dt, dd').each((i, el) => {
		let $item = $(el); 
		let DescListItem: DescListItem = {
			index: i,
			tag_type: $item[0].name,
			tag_class: getTagClass($item[0].name),
			attrs: cleanAttributes(el.attrs),
			content: []
		}
		
		// Compute DescListItem.content
		let content = nestedContentParser(el.children, []);

		DescListItem.content = content;
		inner_items.push(DescListItem);
	})

	// Return the DescList
	return { 
		type: 'dl',
		attrs: cleanAttributes($desclist.eq(0)[0].attribs),
		items: inner_items
	} as DescList;
}
