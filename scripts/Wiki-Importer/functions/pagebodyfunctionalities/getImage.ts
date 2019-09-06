import { accumulateText } from './textParser'; //need to patch getSentences for this code 
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
export const getImage = (element, $: CheerioStatic, internal_citations, delete_when_done?: boolean): Media | string => { 
	let url: string;

	// Detect the image using Cheerio
	let $el = $(element);
	let $thumbinner = $el.find('.thumbinner');
	let $img = $thumbinner.find('img'); 
	let src = $img.attr('src');
	let $thumbcaption = $el.find('.thumbcaption');
	if ($thumbinner.length > 0 && $thumbcaption.length > 0) { 
		url = cleanURL(src);
		if (url && url.search(/.jpg|.jpeg|.png|.svg/gimu) == -1) { // Prevent edge case
			url = 'https:' + src;
		}

		// Get media attributes
		let attributes = getMediaAttributes(url);

		let workingImage: Media = {
			type: 'section_image',
			url: url,
			thumb: null,
			caption: accumulateText($thumbcaption, $, internal_citations),
			mime: (attributes as any).mime,
			category: (attributes as any).citationcategorytype,
			timestamp: new Date(),
			media_props: {
				type: 'section_image'
			}
		};

		// Set the thumb
		workingImage.thumb = url;

		// Get the full size image
		url = url.replace("/thumb", "");
		let quickSplit = url.split("/");
		if (quickSplit[quickSplit.length - 1] 
			&& quickSplit[quickSplit.length - 1].search(/(\.svg|\.jpeg|\.jpg|\.png|px-)/gimu) >= 0
			&& quickSplit[quickSplit.length - 2].search(/(\.svg|\.jpeg|\.jpg|\.png|px-)/gimu) >= 0
		){
			url = quickSplit.slice(0, -1).join("/");
		}
		workingImage.url = url;

		let image_attributes = $($img).eq(0)[0].attribs;

		// Get the srcset, if present
		if (image_attributes.srcset){
			let srcsetString = image_attributes.srcset;

			// Fix upload.wikimedia.org 
			srcsetString = srcsetString.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org");
			
			// Add the srcset
			workingImage.media_props.srcSet = srcsetString;
		}

		// Add the height and width, if present
		if(image_attributes['data-file-width'] && image_attributes['data-file-height']){
			workingImage.media_props.height = parseInt(image_attributes['data-file-height']);
			workingImage.media_props.width = parseInt(image_attributes['data-file-width']);
		}
		else if(image_attributes.width && image_attributes.height){
			workingImage.media_props.height = parseInt(image_attributes.height);
			workingImage.media_props.width = parseInt(image_attributes.width);
		}

		// Delete the image if applicable
		if (delete_when_done) $(element).remove();

		return workingImage;
	}

	src = $el.attr('src');
	url = cleanURL(src);
	if (url && url.search(/.jpg|.jpeg|.png|.svg/gimu) == -1) { // Prevent edge case
		url = 'https:' + src;
	}

	// Delete the image if applicable
	if (delete_when_done) $(element).remove();

	return url;
}
