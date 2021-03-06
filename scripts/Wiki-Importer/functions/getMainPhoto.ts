import * as cheerio from 'cheerio';
import { textParser, accumulateText } from './pagebodyfunctionalities/textParser';
import { getImage } from './pagebodyfunctionalities/getImage';
import { MediaUploadService, UrlPack } from '../../../src/media-upload';
import { Media } from '../../../src/types/article';
import { linkCategorizer } from '../../../src/utils/article-utils/article-converter';
import { CheerioPack } from './pagebodyfunctionalities/cleaners';
import * as mimePackage from 'mime';
import { IMAGE_MAX_PIXELS } from './wiki-constants';
const chalk = require('chalk');
const path = require('path');

export interface GetMainPhotoReturnPack {
	main_photo: Media,
	cheerio_pack: CheerioPack
}

export const getMainPhoto = async (input_pack: CheerioPack, theMediaUploadService: MediaUploadService, lang: string, slug: string,  ): Promise<GetMainPhotoReturnPack> => {
	console.log(chalk.yellow.bold("===================📷 MAIN PHOTO 📷==================="));

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
	console.log(chalk.yellow("Trying method 1: [infobox images]"));
	$($infobox).find("a.image").each((idx, img_anchor) => {
		if (main_photo_found) return;

		let anchor_attribs = img_anchor.attribs;
		let inner_href = anchor_attribs && anchor_attribs['href'];

		let parent_class = $(img_anchor).parent().attr('class');
		if(parent_class && parent_class.search(/geonugget/gimu) >= 0) {
			// REMEMBER THAT "GEONUGGET" IS A CONSTRUCTED NAME!!!
			console.log("Geodot found in first image. Will not add it.");
		}

		else if(
			inner_href.search(/File/gimu) >= 0 
			|| (anchor_attribs.class && anchor_attribs.class.search(/kartographer/gimu) >= 0)
		){
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
			if (quickSplit[quickSplit.length - 1] 
				&& quickSplit[quickSplit.length - 1].search(/(\.svg|\.jpeg|\.jpg|\.png|\.gif|\.tif|px-)/gimu) >= 0
				&& quickSplit[quickSplit.length - 2].search(/(\.svg|\.jpeg|\.jpg|\.png|\.gif|\.tif|px-)/gimu) >= 0
			){
				theWorkingURL = quickSplit.slice(0, -1).join("/");
			}
			workingMainPhoto.url = theWorkingURL;


			// Get the srcset, if present
			if (theAttribs && theAttribs.srcset){
				let srcsetString = theAttribs.srcset;

				// Fix upload.wikimedia.org 
				srcsetString = srcsetString.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org");
				
				// Add the srcset
				workingMainPhoto.media_props.srcSet = srcsetString;
			}

			// Check the size to max sure it isn't a crappy flagicon or something
			// Also make sure it isn't gigantic ( >= 5000 x 5000)
			let theHeight = parseInt(theAttribs.height);
			let theWidth = parseInt(theAttribs.width);
			let pixelCount = theHeight * theWidth;
			if (pixelCount >= 5000 && pixelCount <= IMAGE_MAX_PIXELS){

				// Add the height and width, if present
				if(theAttribs && theAttribs['data-file-width'] && theAttribs['data-file-height']){
					workingMainPhoto.media_props.height = parseInt(theAttribs['data-file-height']);
					workingMainPhoto.media_props.width = parseInt(theAttribs['data-file-width']);
				}
				else if(theAttribs && theAttribs.width && theAttribs.height){
					workingMainPhoto.media_props.height = theHeight;
					workingMainPhoto.media_props.width = theWidth;
				}


				// Inner pixel count check
				pixelCount = workingMainPhoto.media_props.height * workingMainPhoto.media_props.width;
				if (pixelCount >= 5000 && pixelCount <= IMAGE_MAX_PIXELS){

					// If there is more than one image in the nearest tr, do not extract
					let $extractTD = $(img_anchor).parents("td, th");
					let $extractTR = $($extractTD).parents("tr");

					// Look for multiple images within the td
					let rowImages = $($extractTR).find('img');
					if (rowImages.length > 1){
						console.log("Found multiple images in the parent <tr> of the blobbox profile image. Will not extract() it, but will still use it as the profile photo.");
					}
					else {
						// Remove the img's parent <a> first
						$(img_anchor).remove();

						// Try to get a caption
						workingMainPhoto.caption = accumulateText($extractTD, $, []);

						// Remove the surrounding <td>
						$($extractTD).remove();

						// If the <tr> is now empty, remove it too
						let inner_contents = $($extractTR).html();
						if (!inner_contents || inner_contents == ''){
							$($extractTR).remove();
						} 
					}
					
					main_photo_found = true;
					let imgString = `|${workingMainPhoto.url}| [${workingMainPhoto.media_props.width}x${workingMainPhoto.media_props.height}]`;
					console.log(chalk.green.bold(`Found a main image from the infobox: ${imgString}`));
				}
			}
			else{
				// console.log(`Image is too small (${theWidth}x${theHeight}). Skipping...`);
				// Do nothing
			}
		};
	})

	// Try method 2 next
	// Extract a section image
	if (!main_photo_found){
		console.log(chalk.yellow("Trying method 2: [section images]"));
		$content.find('div.thumb').each((idx, sect_img) => {
			if (main_photo_found) return;
			let parsed_section_img = getImage(sect_img, $, [], true);
			let theAttribs = sect_img.attribs;


			// Check the size to max sure it isn't a crappy flagicon or something
			// Also make sure it isn't gigantic ( >= 5000 x 5000)
			let theHeight = parseInt(theAttribs.height);
			let theWidth = parseInt(theAttribs.width);
			let pixelCount = theHeight * theWidth;
			if (pixelCount >= 5000 && pixelCount <= IMAGE_MAX_PIXELS){
				// Add the height and width, if present
				if(theAttribs['data-file-width'] && theAttribs['data-file-height']){
					workingMainPhoto.media_props.height = parseInt(theAttribs['data-file-height']);
					workingMainPhoto.media_props.width = parseInt(theAttribs['data-file-width']);
				}
				else if(theAttribs.width && theAttribs.height){
					workingMainPhoto.media_props.height = theHeight;
					workingMainPhoto.media_props.width = theWidth;
				}

				// Inner pixel count check
				pixelCount = workingMainPhoto.media_props.height * workingMainPhoto.media_props.width;
				if (pixelCount >= 5000 && pixelCount <= IMAGE_MAX_PIXELS){
					// Make sure a full Media was returned and not just a string
					if (parsed_section_img && (parsed_section_img as Media).url) {
						workingMainPhoto = parsed_section_img as Media;
						workingMainPhoto.media_props.type = 'main_photo';
						workingMainPhoto.type = 'main_photo';
						main_photo_found = true;
						let imgString = `|${workingMainPhoto.url}| [${workingMainPhoto.media_props.width}x${workingMainPhoto.media_props.height}]`;
						console.log(chalk.green.bold(`Found a main image from the body: ${imgString}`));
					}
				}
			}
		});
	}

	// // Try method 3 next
	// // Find any image that is of a decent size, but don't extract it
	// if (!main_photo_found){
	// 	console.log(chalk.yellow("Trying method 3: [remaining non-infobox large images]"));
	// 	$content.find("a.image").each((idx, img_anchor) => {
	// 		if (main_photo_found) return;
	// 		let inner_href = img_anchor.attribs && img_anchor.attribs['href'];

	// 		let parent_class = $(img_anchor).parent().attr('class');
	// 		if(parent_class && parent_class.search(/geonugget/gimu) >= 0) {
	// 			// REMEMBER THAT "GEONUGGET" IS A CONSTRUCTED NAME!!!
	// 			console.log("Geodot found in remaining image. Will not add it.");
	// 		}

	// 		if(inner_href.search(/File/gimu) >= 0){
	// 			// Set the attribution url
	// 			workingMainPhoto.attribution_url = inner_href.replace(/(^\/wiki)/gimu, "https://en.wikipedia.org/wiki");

	// 			let inner_img = $(img_anchor).find("img");
	// 			let inner_img_elem = inner_img.eq(0)[0];
	// 			let theAttribs = inner_img_elem.attribs;
	// 			let theWorkingURL = theAttribs.src ? theAttribs.src : workingMainPhoto.url;
				
	// 			// Fix upload.wikimedia.org
	// 			theWorkingURL = theWorkingURL.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org");

	// 			// Set the thumb
	// 			workingMainPhoto.thumb = theWorkingURL;

	// 			// Get the full size image
	// 			theWorkingURL = theWorkingURL.replace("/thumb", "");
	// 			let quickSplit = theWorkingURL.split("/");
	// 			if (quickSplit[quickSplit.length - 1] 
	// 				&& quickSplit[quickSplit.length - 1].search(/(\.svg|\.jpeg|\.jpg|\.png|\.gif|\.tif|px-)/gimu) >= 0
	// 				&& quickSplit[quickSplit.length - 2].search(/(\.svg|\.jpeg|\.jpg|\.png|\.gif|\.tif|px-)/gimu) >= 0
	// 			){
	// 				theWorkingURL = quickSplit.slice(0, -1).join("/");
	// 			}
	// 			workingMainPhoto.url = theWorkingURL;


	// 			// Get the srcset, if present
	// 			if (theAttribs.srcset){
	// 				let srcsetString = theAttribs.srcset;

	// 				// Fix upload.wikimedia.org 
	// 				srcsetString = srcsetString.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org");
					
	// 				// Add the srcset
	// 				workingMainPhoto.media_props.srcSet = srcsetString;
	// 			}

	// 			// Check the size to max sure it isn't a crappy flagicon or something
	// 			let theHeight = parseInt(theAttribs.height);
	// 			let theWidth = parseInt(theAttribs.width);
	// let pixelCount = theHeight * theWidth;
	// if (pixelCount >= 5000 && pixelCount <= IMAGE_MAX_PIXELS){

	// 				// Add the height and width, if present
	// 				if(theAttribs['data-file-width'] && theAttribs['data-file-height']){
	// 					workingMainPhoto.media_props.height = parseInt(theAttribs['data-file-height']);
	// 					workingMainPhoto.media_props.width = parseInt(theAttribs['data-file-width']);
	// 				}
	// 				else if(theAttribs.width && theAttribs.height){
	// 					workingMainPhoto.media_props.height = parseInt(theAttribs.height);
	// 					workingMainPhoto.media_props.width = parseInt(theAttribs.width);
	// 				}

	// 				main_photo_found = true;
	// 				let imgString = `|${workingMainPhoto.url}| [${workingMainPhoto.media_props.width}x${workingMainPhoto.media_props.height}]`;
	// 				console.log(chalk.green.bold(`Found a main image from the remaining images: ${imgString}`));
	// 			}
	// 			else{
	// 				// console.log(`Image is too small (${theWidth}x${theHeight}). Skipping...`);
	// 			}
	// 		};
	// 	})
	// }

	if(main_photo_found){
		// Categorize and get the MIME types
		workingMainPhoto.category = linkCategorizer(workingMainPhoto.url);
		workingMainPhoto.mime = mimePackage.getType(workingMainPhoto.url);

		// Default thumbnail
		if (!workingMainPhoto.thumb) workingMainPhoto.thumb = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide.png';

		// Upload the main image
		let resultBuffer;
		resultBuffer = await theMediaUploadService.getImageBufferFromURL(workingMainPhoto.url);
		let filename = path.basename(workingMainPhoto.url);
		let up_res = await theMediaUploadService.processMedia(
			resultBuffer,
			lang,
			slug,
			filename,
			'ProfilePicture',
			'',
			'mainphoto'
		);

		if(up_res){
			// Update the main photo info with the storage bucket URLs
			workingMainPhoto = {
				...workingMainPhoto,
				url: up_res.mainPhotoURL,
				thumb: up_res.thumbnailPhotoURL,
				mime: up_res.mime,
				media_props: {
					...workingMainPhoto.media_props,
					webp_original: up_res.webp_original,
					webp_medium: up_res.webp_medium,
					webp_thumb: up_res.webp_thumb,
				}

			};

			// Return main photo
			console.log(chalk.bold.green(`DONE`));
			return {
				main_photo: workingMainPhoto,
				cheerio_pack: {
					cheerio_static: $
				}
			}
		}
		else {
			workingMainPhoto.url = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png';
	
			// Return the default main photo
			console.log(chalk.bold.green(`DONE`));
			return {
				main_photo: workingMainPhoto,
				cheerio_pack: {
					cheerio_static: $
				}
			}
		}

	}
	else {
		workingMainPhoto.url = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png';

		// Return the default main photo
		console.log(chalk.bold.green(`DONE`));
		return {
			main_photo: workingMainPhoto,
			cheerio_pack: {
				cheerio_static: $
			}
		}
	}

};
