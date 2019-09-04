import * as cheerio from 'cheerio';
import { getImage } from './pagebodyfunctionalities/getImage';
import { Media } from '../../../src/types/article';
import { linkCategorizer } from '../../../src/utils/article-utils/article-converter';
import { CheerioPack } from './pagebodyfunctionalities/cleaners';
import * as mimePackage from 'mime';

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
		url: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png',
		thumb:'https://epcdn-vz.azureedge.net/static/images/no-image-slide.png',
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


	// Try method 1 first (infobox)
	$($infobox).find("a.image").each((idx, img_anchor) => {
		let inner_href = img_anchor.attribs && img_anchor.attribs['href'];
		if(inner_href.search(/File/gimu) >= 0){
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
			theWorkingURL = theWorkingURL
							.split("/")
							.slice(0, -1)
							.join("/")
							.replace("/thumb", "");
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
			$(img_anchor).remove();
		};
	})
	
	workingMainPhoto.category = linkCategorizer(workingMainPhoto.url);
	workingMainPhoto.mime = mimePackage.getType(workingMainPhoto.url);

	// console.log(workingMainPhoto)

	// blobBoxSoup.findAll("a", {"class": "image", "href": re.compile(r"File", re.UNICODE)})


	// # Try method 1
	// firstImageAnchor = blobBoxSoup.findAll("a", {"class": "image", "href": re.compile(r"File", re.UNICODE)})
	// if (len(blobBoxSoup) == 0):
	// 	print("No class=image found, trying alternate selector")
	// 	firstImageAnchor = blobBoxSoup.findAll("a", {"href": re.compile(r"File", re.UNICODE)})
	// 	if (len(firstImageAnchor) == 0):
	// 		print("No class=image found, trying alternate selector without File: prefix")
	// 		firstImageAnchor = blobBoxSoup.findAll("a", class_="image")

	// # Prevents extracting red dot pictures as profile pics
	// try:
	// 	if "geonugget" in firstImageAnchor[0].parent['class']:
	// 		print("Geodot found in first image. Will not add a profile pic for now.")
	// 		raise
	// except:
	// 	pass

	// # If the firstimage is in a maptable, collect it, but dont extract it
	// try:
	// 	if "maptable" in firstImageAnchor[0].parent.parent.parent.parent.parent['class']:
	// 		skipExtract = True
	// 		print("Maptable found. Harvesting image, but not extracting it.")
	// 		raise
	// except:
	// 	pass


	// No main photo was found. 
	// Return place holder:
	return {
		main_photo: workingMainPhoto,
		cheerio_pack: {
			cheerio_static: $
		}
	}
};
