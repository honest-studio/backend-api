import { Sentence } from '../../../../src/types/article';

export const getCategory = (element, $): Sentence => {	
	let $el = $(element);
	let text = $el.find('.mw-headline').text();
	return {
		type: 'sentence',
		index: 0,
		text: text
	}
}

