import { textParser, accumulateText } from './textParser';
import { ListItem } from '../../../../src/types/article';

// Input: <ul> or <ol> element
// Output: array of formatted li elements

export const getListItems = (element, $, internalCitations): ListItem[] => {
	let listItems = []; // Return obj 
	let $element = $(element); // ul or ol element 

	// Loop
	$element.children().each((i, el) => {
		let sentences = accumulateText(el, $, internalCitations);
		listItems.push({
			type: 'list_item',
			index: i,
			sentences: sentences,
			tag_type: 'li'
		});
	})
	return listItems;
}


