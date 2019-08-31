import { textParser, accumulateText } from './textParser';

//input: <ul> element
//output: array of formatted li elements

export const getList = (element, $, internalCitations) => {
	let listItems = []; //return obj 
	let $element = $(element); //ul element 
	$element.children().each((i, el) => { //for each ListItem 
		let sentence = accumulateText(el, $, internalCitations);
		listItems.push({
			type: 'list_item',
			index: i,
			sentences: sentence,
			tag_type: 'li'
		});
	})
	return listItems;
}


