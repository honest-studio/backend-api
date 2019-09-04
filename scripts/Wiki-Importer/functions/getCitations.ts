import * as cheerio from 'cheerio';
import * as mimePackage from 'mime';
import { MediaUploadService } from '../../../src/media-upload';
import { Citation, CitationCategoryType, Sentence } from '../../../src/types/article';
import { linkCategorizer, socialURLType } from '../../../src/utils/article-utils/article-converter';
import { accumulateText } from './pagebodyfunctionalities/textParser';
import { POST_CITATION_CHOP_BELOW } from './wiki-constants';
const util = require('util');
const chalk = require('chalk');
const _ = require('lodash');
const getYouTubeID = require('get-youtube-id');

export interface RawCitation {
	id: string,
	id_ref: string,
	id_note: string,
	index_to_use: number,
	url?: string,
	isbn?: string,
	issn?: string,
	category: CitationCategoryType,
	text: string,
	note_element: CheerioElement
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
export const getCitations = async (input_html: string, url, theMediaUploadService: MediaUploadService) => { 
	const $: CheerioStatic = cheerio.load(input_html, {decodeEntities: false});
	let citations: Citation[] = []; // Instantiate return object - stores all citation objects 
	
	// Store {key, value} pair objects for O(1) access to determine internal citations
	// Where key == citationId, and value == url   
	let internalCitations = {};  
	let available_citation_id = 1;


	// Default push 
	citations.push({
		url: url, // References the specific wikipedia page 
		thumb: null,
		category: "NONE",
		citation_id: available_citation_id,
		description: defaultDescription,
		social_type: null,
	 	attribution: 'rel=nofollow',
	 	timestamp: new Date(), 
	 	mime: null
	});
	available_citation_id = available_citation_id + 1;

	// Page content
	const $content = $('div.mw-parser-output');

	// Loop through all of the <sup> tags and find the citation references
	let cite_refs: CheerioElement[] = [];
	$content.find("sup").each((idx, sup) => {
		// Find the citation references
		if (sup.attribs['id'] && sup.attribs['id'].search(/cite_ref/gimu) >= 0){
			cite_refs.push(sup);
		};
	});

	// Find the citation notes
	let rawCitations: RawCitation[] = [];
	$content.find("li").each((idx, list_item) => {
		// Find the citation notes
		if (list_item.attribs['id'] && list_item.attribs['id'].search(/cite_note/gimu) >= 0){
			let note_index_splits = list_item.attribs['id'].split("-");
			let note_index = note_index_splits[note_index_splits.length - 1];

			let workingRawCitation = {
				id: note_index,
				id_ref: null,
				id_note: list_item.attribs['id'],
				index_to_use: available_citation_id,
				category: null,
				text: null,
				note_element: list_item,
			};
			available_citation_id = available_citation_id + 1;

			// Find the ref that corresponds to the note
			cite_refs.forEach((ref_elem, idx) => {
				// console.log($(ref_elem).find("a").attr("href"))
				let ref_index_splits = $(ref_elem).find("a").attr("href").split("-");
				let ref_index = ref_index_splits[ref_index_splits.length - 1];

				if (note_index == ref_index){
					workingRawCitation.id_ref = ref_elem.attribs['id'];
				}
			})

			// if (!workingRawCitation.id_ref) NEED TO DO SOMETHING!!!

			// Add the ref and note information to the list of raw citations
			rawCitations.push(workingRawCitation)
			
		};
	});

	// Start classifying the citations
	rawCitations = rawCitations.map((raw_citn, idx) => {
		// console.log($(raw_citn.note_element).html())

		// First look for any <a href='#ABC123' ></a> and pull in that ID as the text.
		let possible_anchor = $(raw_citn.note_element).find("a").eq(0)[0];
		if (possible_anchor && possible_anchor.attribs['href']){
			let theInnerURL = possible_anchor.attribs['href'];
			if(theInnerURL[0] == "#"){
				let linked_id = theInnerURL;

				if (linked_id){
					$(`${linked_id} a`).each((idx, inner_anchor) => {
						let inner_href = inner_anchor.attribs['href'];
						if(inner_href){
							// Look for an ISBN
							if(inner_href.search(/Special:BookSources/gimu) >= 0){
								raw_citn.category = 'BOOK';
								raw_citn.isbn = $(inner_anchor).text().trim();
							}
							// Look for an ISSN
							else if(inner_href.search(/issn/gimu) >= 0){
								raw_citn.category = 'PERIODICAL';
								raw_citn.issn = $(inner_anchor).text().trim();
							}
						}
						$(inner_anchor).remove();
					})
				}
				$(possible_anchor).replaceWith($(linked_id).contents()); 
				raw_citn.text = $(raw_citn.note_element)
										.text()
										.trim()
										.replace("  .,", "")
										.replace("  ..", "");
			}
			else{
				raw_citn.category = linkCategorizer(theInnerURL);
				raw_citn.text = $(raw_citn.note_element)
									.text()
									.trim();
				raw_citn.url = theInnerURL;
			}
		}
		// Otherwise, assume a book and put the URL as a search query
		else {
			raw_citn.category = 'BOOK';
			raw_citn.text = $(raw_citn.note_element)
								.text()
								.trim();
			raw_citn.url = `https://openlibrary.org/search?q=${encodeURIComponent(raw_citn.text.substr(0, 50))}`;
		}
		return raw_citn;
	})

	// Convert the raw citations into real ones
	// Also replace the <sup> tags with markdown
	await Promise.all(
		rawCitations.map(async (raw_citn, idx) => {
			let workingCitation: Citation = {
				url: raw_citn.url || null,
				thumb: null,
				category: raw_citn.category,
				citation_id: raw_citn.index_to_use,
				description: [{ type: 'sentence', index: 0, text: raw_citn.text }],
				social_type: null,
				attribution: 'rel=nofollow',
				timestamp: new Date(), 
				mime: null
			};
			switch(raw_citn.category){
				case 'BOOK': {
					if (raw_citn.isbn){
						let bookInfo = await theMediaUploadService.getBookInfoFromISBN(raw_citn.isbn);
						workingCitation.url = bookInfo.url;
						workingCitation.thumb = bookInfo.thumb;
					};
					break;
				}
				case 'PERIODICAL': {
					if (raw_citn.issn){
						let periodicalInfo = await theMediaUploadService.getPeriodicalInfoFromISSN(raw_citn.issn);
						workingCitation.url = periodicalInfo.url;
						workingCitation.thumb = periodicalInfo.thumb;
					};
					break;
				}
				case 'YOUTUBE': {
					break;
				}
				case 'AUDIO':
				case 'GIF':
				case 'PICTURE':
				case 'NORMAL_VIDEO':
				case 'FILE': {
					workingCitation.mime = mimePackage.getType(raw_citn.url);
					break;
				}
				case 'NONE': {
					break;
				}
			}

			// Replace the <sup> with the markdown citation notation
			// console.log($(`#${raw_citn.id_ref}`).html())
			$(`#${raw_citn.id_ref}`).replaceWith(`[[CITE|${workingCitation.citation_id}|${workingCitation.url}]]`);


			// Handle thumbnails that don't require an upload
			switch(workingCitation.category){
				case 'YOUTUBE': {
					workingCitation.thumb = `https://i.ytimg.com/vi/${getYouTubeID(workingCitation.url)}/hqdefault.jpg`
					break;
				}
			}

			// Add the citation to the list
			citations.push(workingCitation);
			
		})
	)

	// Loop through all of the <a> tags and find the external links
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
				attribution: 'rel=nofollow',
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
			available_citation_id = available_citation_id + 1;
		};
	});

	// Sort the citations properly
	citations = _.sortBy(citations, ctn => ctn.citation_id);

	// Chop off the area below certain elements
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
		});
	});


	console.log(util.inspect(citations, {showHidden: false, depth: null, chalk: true}));


	// // OPTIONAL: Add thumbnails
	// citations = citations.map(ctn => {
	// 	switch(ctn.category){
	// 		case 'NONE': {
	// 			break;
	// 		}
	// 	}
	// 	return ctn;
	// })

	return {
		citations: citations,
		internalCitations: internalCitations, // Map passed to textParser for instant internal citation lookup
		altered_body: $.html()
	}; 
}

