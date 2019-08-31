import { request } from 'request';
import * as cheerio from 'cheerio';
import { getSentences } from './getSentences'; //need to patch getSentences for this code 
import { getMediaAttributes } from './mediafunctions.js';
import { getTimeStamp } from './getTimeStamp';
import { Media } from '../../../../src/types/article';

const wikipedia = 'https://en.wikipedia.org/wiki/';    
// important global variable
let url = '';

export const cleanURL = (string) => {
	//need to add https: 
	//need to remove text after last '/' character 
	//need to remove '/thumb'
	let url = 'https:' + string; //create image url 
	url = url.replace('thumb/', '');
	let i = (url.length - 1); 
	while(url.charAt(i) !== '/') {
		if (i == 0) {
			return string; // safety if cleaning fucntion dosent work 
		}
		i--;
	}
	url = url.substring(0, i);
	return url; 
}

export const getImage = (element, $): Media | string => { 
	let $el = $(element);
	let $thumbinner = $el.find('.thumbinner');
	let $img = $thumbinner.find('img'); 
	let src = $img.attr('src');
	let $thumbcaption = $el.find('.thumbcaption');
	if ($thumbinner.length > 0 && $thumbcaption.length > 0) { 
		url = cleanURL(src);
		if (!url.includes('.jpg') && !url.includes('.png')) { //prevent edge case
			url = 'https:' + src;
		}
		let attributes = getMediaAttributes(url);
		return {
			type: 'section_image',
			url: url,
			thumb: null,
			caption: getSentences($thumbcaption, $),
			mime: (attributes as any).mime,
			category: (attributes as any).citationcategorytype,
			timestamp: getTimeStamp() as any,
		}
	}
		src = $el.attr('src');
		url = cleanURL(src);
		if (!url.includes('.jpg') && !url.includes('.png')) { //prevent edge case
			url = 'https:' + src;
		}
		return url;
}
