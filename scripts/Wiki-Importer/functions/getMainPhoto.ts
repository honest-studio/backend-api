import * as cheerio from 'cheerio';
import { getImage } from './pagebodyfunctionalities/getImage';
import { Media } from '../../../src/types/article';
import { linkCategorizer } from '../../../src/utils/article-utils/article-converter';
import { CheerioPack } from './pagebodyfunctionalities/cleaners';
import * as mimePackage from 'mime';
const chalk = require('chalk');

export interface GetMainPhotoReturnPack {
	main_photo: Media,
	cheerio_pack: CheerioPack
}

export const getMainPhoto = (input_pack: CheerioPack): GetMainPhotoReturnPack => {
	// Parse the dom
	const $ = input_pack.cheerio_static;
	const $content = $('div.mw-parser-output');

	// Look at the infobox first
	const $infobox = $content.find('.infobox');
	// console.log($infobox.html());

	let workingMainPhoto: Media = {
		url: null,
		thumb: null, 
		caption: null, 
		type: 'main_photo', 
		attribution_url: null, 
		media_props: {
			type: 'main_photo', 
			height: null, 
			width: null, 
			srcSet: null
		},
		timestamp: new Date()
	};


	// Try method 1 first
	// Extract an image from the infobox
	let main_photo_found = false;
	$($infobox).find("a.image").each((idx, img_anchor) => {
		if (main_photo_found) return;
		let inner_href = img_anchor.attribs && img_anchor.attribs['href'];

		let parent_class = $(img_anchor).parent().attr('class');
		if(parent_class && parent_class.search(/geonugget/gimu) >= 0) {
			// REMEMBER THAT "GEONUGGET" IS A CONSTRUCTED NAME!!!
			console.log("Geodot found in first image. Will not add it.");
		}

		else if(inner_href.search(/File/gimu) >= 0){
			// Set the attribution url
			workingMainPhoto.attribution_url = inner_href.replace(/(^\/wiki)/gimu, "https://en.wikipedia.org/wiki");

			let inner_img = $(img_anchor).find("img");
			let inner_img_elem = inner_img.eq(0)[0];
			let theAttribs = inner_img_elem.attribs;
			let theWorkingURL = theAttribs.src ? theAttribs.src : workingMainPhoto.url;
			
			// Fix upload.wikimedia.org
			theWorkingURL = theWorkingURL.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org");

			// Set the thumb
			workingMainPhoto.thumb = theWorkingURL;

			// Get the full size image
			theWorkingURL = theWorkingURL.replace("/thumb", "");
			let quickSplit = theWorkingURL.split("/");
			if (quickSplit[quickSplit.length - 1] && quickSplit[quickSplit.length - 1].search(/(\.svg|\.jpeg|\.jpg|\.png|px-)/gimu) >= 0){
				theWorkingURL = quickSplit.slice(0, -1).join("/");
			}
			workingMainPhoto.url = theWorkingURL;


			// Get the srcset, if present
			if (theAttribs.srcset){
				let srcsetString = theAttribs.srcset;

				// Fix upload.wikimedia.org 
				srcsetString = srcsetString.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org");
				
				// Add the srcset
				workingMainPhoto.media_props.srcSet = srcsetString;
			}

			// Add the height and width, if present
			if(theAttribs['data-file-width'] && theAttribs['data-file-height']){
				workingMainPhoto.media_props.height = parseInt(theAttribs['data-file-height']);
				workingMainPhoto.media_props.width = parseInt(theAttribs['data-file-width']);
			}
			else if(theAttribs.width && theAttribs.height){
				workingMainPhoto.media_props.height = parseInt(theAttribs.height);
				workingMainPhoto.media_props.width = parseInt(theAttribs.width);
			}

			// Check the size to max sure it isn't a crappy flagicon or something
			let theHeight = workingMainPhoto.media_props.height;
			let theWidth = workingMainPhoto.media_props.width;
			if (theHeight * theWidth >= 5000){
				console.log(`Found a prospective ${theWidth}x${theHeight}: |${workingMainPhoto.url}|`);
				// 	print("Now trying to find a bigger one from the srcset")
				// 	try:
				// 		theSrcSet = testImage['srcset']
				// 		quickSplit = theSrcSet.split(" ")
				// 		lastPhoto = ""
				// 		for item in quickSplit:
				// 			if "wikimedia" in item:
				// 				lastPhoto = item
				// 				if lastPhoto[0] == "/":
				// 					lastPhoto = "https:" + lastPhoto
				// 		if lastPhoto != "":
				// 			thePhotoUrl = lastPhoto
				// 			print("Found a bigger image: |%s|" % thePhotoUrl)
				// 	except:
				// 		pass

				// 	if (skipExtract):
				// 		extractTag = None
				// 	else:
				// If there is more than one image in the nearest tr, do not extract
				let $extractTD = $(img_anchor).closest("td");
				let $extractTR = $($extractTD).closest("tr");

				// Look for multiple images within the td
				let rowImages = $($extractTR).children('img');
				if (rowImages.length > 1){
					console.log("Found multiple images in the parent <tr> of the blobbox profile image. Will not extract() it, but will still use it as the profile photo.");
				}
				else {
					$($extractTD).remove();
				}
				
				main_photo_found = true;
				console.log(chalk.green("Found a main image from the infobox"));
			}
			else{
				console.log(`Image is too small (${theWidth}x${theHeight}). Skipping...`);
				// Do nothing
			}





		};
	})

	// Try method 2 next
	// Extract a section image
	if (!workingMainPhoto.url){
		$content.find('div.thumb').each((idx, sect_img) => {
			if (main_photo_found) return;
			let parsed_section_img = getImage(sect_img, $, [], true);

			// Make sure a full Media was returned and not just a string
			if ((parsed_section_img as Media).url) {
				workingMainPhoto = parsed_section_img as Media;
				workingMainPhoto.media_props.type = 'main_photo';
				workingMainPhoto.type = 'main_photo';
				main_photo_found = true;
				console.log(chalk.green("Found a main image from the body"));
			}
		});
	}
	
	// Categorize and get the MIME types
	workingMainPhoto.category = linkCategorizer(workingMainPhoto.url);
	workingMainPhoto.mime = mimePackage.getType(workingMainPhoto.url);


	// If no main photo was found. 
	if (!workingMainPhoto.url) workingMainPhoto.url = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png';
	if (!workingMainPhoto.thumb) workingMainPhoto.thumb = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide.png';

	// Return main photo:
	return {
		main_photo: workingMainPhoto,
		cheerio_pack: {
			cheerio_static: $
		}
	}
};
