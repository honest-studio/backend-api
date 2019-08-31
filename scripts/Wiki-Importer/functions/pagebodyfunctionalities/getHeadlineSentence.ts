import { Sentence } from '../../../../src/types/article';

// Get the headline sentence
export const getHeadlineSentence = (element, $): Sentence => {	
	let $el = $(element);
	let text = $el.find('.mw-headline').text();
	return {
		type: 'sentence',
		index: 0,
		text: text
	} as Sentence
}

