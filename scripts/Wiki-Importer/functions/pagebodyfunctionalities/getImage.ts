import { getSentences } from './getSentences'; //need to patch getSentences for this code 
import { getMediaAttributes } from './mediafunctions.js';
import { getTimeStamp } from './getTimeStamp';
import { Media } from '../../../../src/types/article';

// Clean the URL
export const cleanURL = (string): string => {
	let url = 'https:' + string; // Need to add https: 
	url = url.replace('thumb/', ''); // Need to remove '/thumb'
	let i = (url.length - 1); 

	// Need to remove text after last '/' character 
	while(url.charAt(i) !== '/') {
		if (i == 0) {
			return string; // Safety if cleaning fucntion dosent work 
		}
		i--;
	}
	url = url.substring(0, i);
	return url; 
}

// Get a Media object from an image
export const getImage = (element, $): Media | string => { 
	let url: string;

	// Detect the image using Cheerio
	let $el = $(element);
	let $thumbinner = $el.find('.thumbinner');
	let $img = $thumbinner.find('img'); 
	let src = $img.attr('src');
	let $thumbcaption = $el.find('.thumbcaption');
	if ($thumbinner.length > 0 && $thumbcaption.length > 0) { 
		url = cleanURL(src);
		if (!url.includes('.jpg') && !url.includes('.png')) { // Prevent edge case
			url = 'https:' + src;
		}

		// Get media attributes
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
