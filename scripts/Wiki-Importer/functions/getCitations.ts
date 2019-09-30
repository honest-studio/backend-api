import * as cheerio from 'cheerio';
import * as mimePackage from 'mime';
import { MediaUploadService } from '../../../src/media-upload';
import { parseInternalCitation } from './pagebodyfunctionalities/parseInternalCitation';
import { Citation, CitationCategoryType, Sentence } from '../../../src/types/article';
import { cheerio_css_cleaner, linkCategoryFromText } from '../../../src/utils/article-utils/article-tools';
import { linkCategorizer, socialURLType } from '../../../src/utils/article-utils/article-converter';
import { accumulateText } from './pagebodyfunctionalities/textParser';
import { POST_CITATION_CHOP_BELOW, IMAGE_MAX_PIXELS } from './wiki-constants';
import { CheerioPack } from '../functions/pagebodyfunctionalities/cleaners';
const util = require('util');
const chalk = require('chalk');
const _ = require('lodash');
const sleep = require('sleep');
const getYouTubeID = require('get-youtube-id');

export interface RawCitation {
	id: string,
	id_note: string,
	index_to_use: number,
	url?: string,
	isbn?: string,
	issn?: string,
	category: CitationCategoryType,
	text: string,
	note_element: CheerioElement
}

export interface CitationReturnPack {
	citations: Citation[],
	internalCitations: any,
	cheerio_pack: CheerioPack,
	amp_info: {
		load_youtube_js: boolean,
		load_audio_js: boolean,
		load_video_js: boolean,
		lightboxes: any[]
	}
}

// Default description for the Wikipedia citation
let defaultDescription: Sentence[] = [
	{
		index: 0,
		text: "The original version of this page is from Wikipedia, you can edit the page right here on Everipedia.",
		type: "sentence"
	}, 
	{
		index: 1,
		text: "Text is available under the Creative Commons Attribution-ShareAlike License.",
		type: "sentence"
	},
	{
		index: 2,
		text: "Additional terms may apply.",
		type: "sentence"
	},
	{
		index: 3,
		text: "See everipedia.org/everipedia-termsfor further details.",
		type: "sentence"
	},
	{
		index: 4,
		text: "Images/media credited individually (click the icon for details).",
		type: "sentence"
	}
]

// Parse out the citations from Wikipedia
export const getCitations = async (input_pack: CheerioPack, url, theMediaUploadService: MediaUploadService): Promise<CitationReturnPack> => { 
	console.log(chalk.yellow.bold("============📚 CITATIONS AND GALLERIES 📚============="));
	const $: CheerioStatic = input_pack.cheerio_static;
	let citations: Citation[] = []; // Instantiate return object - stores all citation objects 
	
	// Store {key, value} pair objects for O(1) access to determine internal citations
	// Where key == citationId, and value == url   
	let internalCitations = {};  
	let available_citation_id = 1;

	// Page content
	const $content = $('div.mw-parser-output');

	// AMP info
	let amp_info = {
		load_youtube_js: false,
		load_audio_js: false,
		load_video_js: false,
		lightboxes: []
	}

	// Find the citation notes
	let rawCitations: RawCitation[] = [];
	process.stdout.write(chalk.yellow(`Finding the citation notes...`));
	$content.find("li").each((idx, list_item) => {
		// Find the citation notes
		if (list_item.attribs['id'] && list_item.attribs['id'].search(/cite_note/gimu) >= 0){
			let note_index_splits = list_item.attribs['id'].split("-");
			let note_index = note_index_splits[note_index_splits.length - 1];

			let workingRawCitation = {
				id: note_index,
				id_note: list_item.attribs['id'],
				index_to_use: available_citation_id,
				category: null,
				text: null,
				note_element: list_item,
			};
			available_citation_id++;

			// Add the ref and note information to the list of raw citations
			rawCitations.push(workingRawCitation)
			
		};
	});
	process.stdout.write(chalk.yellow(` DONE\n`));

	// Start classifying the citations
	process.stdout.write(chalk.yellow(`Classifying the citations...`));
	rawCitations = rawCitations.map((raw_citn, idx) => {
		// console.log($(raw_citn.note_element).html())

		// First look for any <a href='#ABC123' ></a> and pull in that ID as the text.
		$(raw_citn.note_element).find("a").each((idx, ctn_inner_anchor) => {
			let theInnerURL = ctn_inner_anchor.attribs && ctn_inner_anchor.attribs['href'];
			let inner_class = ctn_inner_anchor.attribs && ctn_inner_anchor.attribs['class'];

			// See if the citation refers to another section (e.g. in the case of multiple citations of the same book, 
			// but different pages)
			if(theInnerURL[0] == "#"){
				let linked_id = theInnerURL;
				let linked_id_escaped = cheerio_css_cleaner(linked_id);

				if (linked_id){
					$(`${linked_id_escaped} a`).each((idx, other_section_anchor) => {
						let other_section_href = other_section_anchor.attribs['href'];
						// console.log($.html(linked_id_escaped))
						if(other_section_href){
							// Look for an ISBN
							if(other_section_href.search(/Special:BookSources/gimu) >= 0){
								raw_citn.category = 'BOOK';
								raw_citn.isbn = $(other_section_anchor).text().trim();
							}
							// Look for an ISSN
							else if(other_section_href.search(/issn/gimu) >= 0){
								raw_citn.category = 'PERIODICAL';
								raw_citn.issn = $(other_section_anchor).text().trim();
							}
						}
					})
				}
				$(ctn_inner_anchor).replaceWith($(linked_id_escaped).contents()); 
				raw_citn.text = $(raw_citn.note_element)
										.text()
										.trim()
										.replace("  .,", "")
										.replace("  ..", "");

				// If the raw citation does not have a category, see if it is a book or periodical
				if(!raw_citn.category){
					raw_citn.category = linkCategoryFromText(raw_citn.text);
				}

				return raw_citn;
			}
			else if(theInnerURL.search(/^\/wiki\//gimu) >= 0){
				// Do nothing
				// console.log(theInnerURL)
			}
			else{
				// Look for an ISBN
				if(theInnerURL.search(/Special:BookSources/gimu) >= 0){
					raw_citn.category = 'BOOK';
					raw_citn.isbn = $(ctn_inner_anchor).text().trim();
				}
				// Look for an ISSN
				else if(theInnerURL.search(/issn/gimu) >= 0){
					raw_citn.category = 'PERIODICAL';
					raw_citn.issn = $(ctn_inner_anchor).text().trim();
				}
				else if(inner_class && inner_class.search(/external/gimu) >= 0){
					// Look for a parent <cite> tag for clues
					let cite_elem = $(ctn_inner_anchor).closest('cite');
					let cite_attribs = cite_elem.length && $(cite_elem).eq(0)[0].attribs;
					let cite_class = cite_attribs && cite_attribs.class;
					if (cite_class && cite_class.search(/news|web/gimu) >= 0){
						raw_citn.category = 'NONE';
						raw_citn.url = theInnerURL;
					}
				}
				raw_citn.text = $(raw_citn.note_element)
									.text()
									.trim();
				
				if(!raw_citn.category || raw_citn.category == 'NONE') raw_citn.category = linkCategoryFromText(raw_citn.text);
				raw_citn.url = theInnerURL;

				return raw_citn;
			}
		});

		// Otherwise, if there is no url, assume a book and put the text as a search query
		if(!raw_citn.url){
			raw_citn.category = 'BOOK';
			raw_citn.text = $(raw_citn.note_element)
								.text()
								.trim();
			raw_citn.url = `https://openlibrary.org/search?q=${
				encodeURIComponent(raw_citn.text.substr(0, 50))
					.replace(/\(/g, "%28")
					.replace(/\)/g, "%29")
			}`;
		}
		return raw_citn;
	})
	process.stdout.write(chalk.yellow(` DONE\n`));

	// Convert the raw citations into real ones
	// Also replace the <sup> tags with markdown
	console.log(chalk.yellow.bold(`---Converting raw citations---`));
	let await_done = false, await_counter = 0;

	await Promise.all(
		rawCitations.map(async (raw_citn, idx) => {
			let workingCitation: Citation = {
				url: raw_citn.url || null,
				thumb: null,
				category: raw_citn.category,
				citation_id: raw_citn.index_to_use,
				description: [{ type: 'sentence', index: 0, text: raw_citn.text }],
				social_type: null,
				attribution: null,
				timestamp: new Date(), 
				mime: null
			};
			switch(raw_citn.category){
				case 'PERIODICAL':
				case 'BOOK': {
					if (raw_citn.isbn){
						process.stdout.write(chalk.yellow(`\tFetching book info\n`));
						let bookInfo = await theMediaUploadService.getBookInfoFromISBN(raw_citn.isbn, 3500);
						workingCitation.url = bookInfo.url;
						workingCitation.thumb = bookInfo.thumb;
					}
					else if (raw_citn.issn){
						process.stdout.write(chalk.yellow(`\tFetching periodical info\n`));
						let periodicalInfo = await theMediaUploadService.getPeriodicalInfoFromISSN(raw_citn.issn, 3500);
						workingCitation.url = periodicalInfo.url;
						workingCitation.thumb = periodicalInfo.thumb;
					};

					await_done = true;
					break;
				}
				case 'YOUTUBE': {
					await_done = true;
					break;
				}
				case 'AUDIO':
				case 'GIF':
				case 'PICTURE':
				case 'NORMAL_VIDEO':
				case 'FILE': {
					await_done = true;
					process.stdout.write(chalk.yellow(`\Getting MIME type\n`));
					workingCitation.mime = mimePackage.getType(raw_citn.url);
					break;
				}
				case 'NONE': {
					process.stdout.write(chalk.yellow(`\Getting social type\n`));
					workingCitation.social_type = socialURLType(raw_citn.url),
					await_done = true;
					break;
				}
			}

			while(!await_done && await_counter <= 20){
				console.log("Sleeping");
				await_counter = await_counter + 1;
				sleep.msleep(100);
			}

			if(await_done){
				// Replace the <sup> with the markdown citation notation
				let id_note_escaped = cheerio_css_cleaner(raw_citn.id_note);
				$(`[href='#${id_note_escaped}']`).each((idx, elem) => {
					$(elem).parent("sup").replaceWith(`[[CITE|${workingCitation.citation_id}|${workingCitation.url}]]`);
				})

				// Handle thumbnails that don't require an upload
				switch(workingCitation.category){
					case 'YOUTUBE': {
						workingCitation.thumb = `https://i.ytimg.com/vi/${getYouTubeID(workingCitation.url)}/hqdefault.jpg`
						break;
					}
					case 'NONE': {
						try{
							// Only try every 3th citation, to save bandwidth
							if (workingCitation.citation_id % 3 == 0){
								process.stdout.write(chalk.yellow(`\Getting Favicon\n`));
								let fetched_favicon = await theMediaUploadService.getFavicon({ url: raw_citn.url }, 2000);
								if (fetched_favicon != "") {
									workingCitation.thumb = fetched_favicon;
								}
							}
						}
						catch (err){
							// console.log(err);
						}
						
						break;
					}
				}

				// Add the citation to the list
				citations.push(workingCitation);
			}
			
		})
	)
	console.log(chalk.yellow.bold(`-------------DONE-------------`));

	// Loop through all of the <a> tags and find the external links
	process.stdout.write(chalk.yellow(`Finding external link citations...`));
	$content.find("ul li a").each((idx, anchor) => {
		// Find the external links
		if (anchor.attribs['class'] && anchor.attribs['class'].search(/external/gimu) >= 0){
			let theWorkingURL = anchor.attribs['href'];
			let workingCitation: Citation = {
				url: theWorkingURL,
				thumb: null,
				category: linkCategorizer(theWorkingURL),
				citation_id: available_citation_id,
				description: accumulateText(anchor, $, citations),
				social_type: socialURLType(theWorkingURL),
				attribution: null,
				timestamp: new Date(), 
				mime: null
			};
			switch(workingCitation.category){
				case 'AUDIO':
				case 'GIF':
				case 'PICTURE':
				case 'NORMAL_VIDEO':
				case 'FILE': {
					workingCitation.mime = mimePackage.getType(workingCitation.url);
					break;
				}
			}
			citations.push(workingCitation);
			available_citation_id++;
		};
	});
	process.stdout.write(chalk.yellow(` DONE\n`));

	// Handle external links as citations
	// Leave the plaintext next to the []
	$('a.external').each((idx, anchor) => {
		let theWorkingURL = anchor.attribs && anchor.attribs['href'] && anchor.attribs['href'].replace(/^\/\//, "http://");
		// theWorkingURL = theWorkingURL.replace("¶", "&para"); // Weird pilcrow issue with ASCII encoding

		$(anchor).attr('href', theWorkingURL);
		let workingCitation: Citation = {
			url: theWorkingURL,
			thumb: null,
			category: linkCategorizer(theWorkingURL),
			citation_id: available_citation_id,
			description: accumulateText(anchor, $, []),
			social_type: socialURLType(theWorkingURL),
			attribution: null,
			timestamp: new Date(), 
			mime: null
		};
		switch(workingCitation.category){
			case 'AUDIO':
			case 'GIF':
			case 'PICTURE':
			case 'NORMAL_VIDEO':
			case 'FILE': {
				workingCitation.mime = mimePackage.getType(workingCitation.url);
				break;
			}
		}
		// Replace the <a> with the citation Markdown
		let the_plaintext = $(anchor).text();
		
		$(anchor).replaceWith(the_plaintext + " " + parseInternalCitation(anchor, $, [], workingCitation.citation_id));

		// Add the citation to the list
		citations.push(workingCitation);
		available_citation_id++;
	});

	// Look for galleries
	console.log(chalk.yellow.bold(`---Looking for a photo gallery---`));
	$('ul.gallery > .gallerybox').each((idx, gal_box) => {
		let img_anchor = $(gal_box).find('a.image').eq(0)[0];
		let inner_href = img_anchor && img_anchor.attribs && img_anchor.attribs['href'];
		if(inner_href){
			let workingCitation: Citation = {
				url: null,
				thumb: null,
				category: null,
				citation_id: available_citation_id,
				description: null,
				social_type: null,
				attribution: null,
				timestamp: new Date(), 
				mime: null,
				media_props: {
					type: 'normal'
				}
			};
			available_citation_id++;
	
			if(inner_href.search(/File/gimu) >= 0){
				// Set the attribution url
				workingCitation.attribution = inner_href.replace(/(^\/wiki)/gimu, "https://en.wikipedia.org/wiki");
	
				let inner_img = $(img_anchor).find("img");
				let inner_img_elem = inner_img.eq(0)[0];
				let theAttribs = inner_img_elem.attribs;
				let theWorkingURL = theAttribs.src ? theAttribs.src : workingCitation.url;
				
				// Fix upload.wikimedia.org
				theWorkingURL = theWorkingURL.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org");
	
				// Set the thumb
				workingCitation.thumb = theWorkingURL;
	
				// Get the full size image
				theWorkingURL = theWorkingURL.replace("/thumb", "");
				let quickSplit = theWorkingURL.split("/");
				if (quickSplit[quickSplit.length - 1] 
					&& quickSplit[quickSplit.length - 1].search(/(\.svg|\.jpeg|\.jpg|\.png|\.gif|px-)/gimu) >= 0
					&& quickSplit[quickSplit.length - 2].search(/(\.svg|\.jpeg|\.jpg|\.png|\.gif|px-)/gimu) >= 0
				){
					theWorkingURL = quickSplit.slice(0, -1).join("/");
				}
				workingCitation.url = theWorkingURL;
	
	
				// Get the srcset, if present
				if (theAttribs && theAttribs.srcset){
					let srcsetString = theAttribs.srcset;
	
					// Fix upload.wikimedia.org 
					srcsetString = srcsetString.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org");
					
					// Add the srcset
					workingCitation.media_props.srcSet = srcsetString;
				}
	
				// Check the size to max sure it isn't a crappy flagicon or something
				// Also make sure it isn't gigantic ( >= 5000 x 5000)
				let theHeight = parseInt(theAttribs.height);
				let theWidth = parseInt(theAttribs.width);
				let pixelCount = theHeight * theWidth;
				if (pixelCount >= 5000 && pixelCount <= IMAGE_MAX_PIXELS){
	
					// Add the height and width, if present
					if(theAttribs && theAttribs['data-file-width'] && theAttribs['data-file-height']){
						workingCitation.media_props.height = parseInt(theAttribs['data-file-height']);
						workingCitation.media_props.width = parseInt(theAttribs['data-file-width']);
					}
					else if(theAttribs && theAttribs.width && theAttribs.height){
						workingCitation.media_props.height = parseInt(theAttribs.height);
						workingCitation.media_props.width = parseInt(theAttribs.width);
					}
	
					// Inner pixel count check
					pixelCount = workingCitation.media_props.height * workingCitation.media_props.width;
					if (pixelCount >= 5000 && pixelCount <= IMAGE_MAX_PIXELS){
						// If there is more than one image in the nearest tr, do not extract
						let $extractGallery = $(gal_box).parents("ul.gallery");
	
						// Remove the img's parent <a> first
						$(img_anchor).remove();
	
						// Try to get a caption
						workingCitation.description = accumulateText(gal_box, $, []);
	
						// Remove the surrounding <td>
						$($extractGallery).remove();
						
						let imgString = `|${workingCitation.url}| [${workingCitation.media_props.width}x${workingCitation.media_props.height}]`;
						console.log(chalk.green.bold(`Found a gallery image from the body: ${imgString}`));
					}
				}
				else{
					// console.log(`Image is too small (${theWidth}x${theHeight}). Skipping...`);
					// Do nothing
				}
	
				workingCitation.category = linkCategorizer(theWorkingURL);
				workingCitation.social_type = socialURLType(theWorkingURL);
				workingCitation.mime = mimePackage.getType(theWorkingURL);
	
			};
			citations.push(workingCitation);
		}
		
	})
	console.log(chalk.yellow.bold(`--------------DONE--------------`));
	

	// Sort the citations properly and also look for AMP-related stuff
	process.stdout.write(chalk.yellow(`Sorting the citations and getting AMP info...`));
	citations = _.sortBy(citations, ctn => {
		switch (ctn.category) {
			// AMP needs to know if these are present so it can import external JS files to handle them
			// They are not included by default as an AMP validation error will occur if the import is not needed
			case 'YOUTUBE': {
				amp_info.load_youtube_js = true;
				break;
			}
			case 'NORMAL_VIDEO': {
				amp_info.load_video_js = true;
				break;
			}
			case 'AUDIO': {
				amp_info.load_audio_js = true;
				break;
			}
			default:
			break;
		}
		return ctn.citation_id
	});
	process.stdout.write(chalk.yellow(` DONE\n`));

	// // Clean all of the citations
	// process.stdout.write(chalk.yellow(`Cleaning the citations...`));
	// citations = citations.map(ctn => {
	// 	console.log(ctn.url)
	// 	return {
	// 		...ctn,
	// 		url: ctn.url.replace("¶", "&para")
	// 	};
	// });
	// process.stdout.write(chalk.yellow(` DONE\n`));

	// console.log(util.inspect(citations, {showHidden: false, depth: null, chalk: true}));

	// Chop off the area below certain elements
	process.stdout.write(chalk.yellow(`Removing stuff below the citations...`));
	POST_CITATION_CHOP_BELOW.forEach(pack => {
		let parent_selector = pack.parent ? 
							`${pack.parent.tag ? pack.parent.tag : ""}${pack.parent.id ? '#' + pack.parent.id : ""}${pack.parent.class ? '.' + pack.parent.class : ""} `
							: "" ;
		let selector = `${parent_selector}${pack.tag}${pack.id ? '#' + pack.id : ""}${pack.class ? '.' + pack.class : ""}`;
		$(selector).each((idx, $elem) => {
			if (!pack.parent) {
				$($elem).remove();
				// console.log(chalk.red(`${selector} removed...`));	
			}
			else{
				$($elem).parent(parent_selector).nextAll().remove();
				// console.log(chalk.red(`${parent_selector}removed...`));	
			}

			// Remove the parent itself
			$($elem).parent().remove();
		});
	});
	process.stdout.write(chalk.yellow(` DONE\n`));

	// Default push 
	citations.push({
		url: url, // References the specific wikipedia page 
		thumb: null,
		category: "NONE",
		citation_id: available_citation_id,
		description: defaultDescription,
		social_type: null,
		attribution: null,
		timestamp: new Date(), 
		mime: null
	});
	available_citation_id++;

	console.log(chalk.bold.green(`DONE`));
	return {
		citations: citations,
		internalCitations: internalCitations, // Map passed to textParser for instant internal citation lookup
		cheerio_pack:  {
			cheerio_static: $
		},
		amp_info: amp_info
	}; 
}

