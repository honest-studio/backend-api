import { cleanAttributes } from '../../../../src/utils/article-utils/article-converter';
import { getTagClass } from './getTagClass';
import { nestedContentParser } from '../../../../src/utils/article-utils/article-converter';
import { Samp } from '../../../../src/types/article';

// Input: <samp> element
// Output: array of formatted elements 

export const getSamp = (element: CheerioElement, $: CheerioStatic, internal_citations): Samp => {
	let $samp = $(element); 
	let inner_items = nestedContentParser(element.children, []);

	// Return the Samp
	return { 
		type: 'samp',
		attrs: cleanAttributes($samp.eq(0)[0].attribs),
		items: inner_items
	} as Samp;
}