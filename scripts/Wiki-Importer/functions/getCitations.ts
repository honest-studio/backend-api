import * as cheerio from 'cheerio';
import { textParser, accumulateText } from './pagebodyfunctionalities/textParser';
import { getTimeStamp } from './pagebodyfunctionalities/getTimeStamp';
import { Citation, Sentence, CitationCategoryType } from '../../../src/types/article';
import { linkCategorizer, socialURLType } from '../../../src/utils/article-utils/article-converter';

export interface RawCitation {
	id: string,
	id_ref: string,
	id_note: string,
	category: CitationCategoryType,
	text: string,
	note_element: CheerioElement,
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
export const getCitations = (input_html: string, url) => { 
	const $: CheerioStatic = cheerio.load(input_html, {decodeEntities: false});
	let citations: Citation[] = []; // Instantiate return object - stores all citation objects 
	
	// Store {key, value} pair objects for O(1) access to determine internal citations
	// Where key == citationId, and value == url   
	let internalCitations = {};  

	// Default push 
	citations.push({
		url: url, // References the specific wikipedia page 
		thumb: null,
		category: "NONE",
		citation_id: 0,
		description: defaultDescription,
		social_type: null,
	 	attribution: 'rel=nofollow',
	 	timestamp: getTimeStamp() as any, 
	 	mime: null
	})

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

	// Loop through all of the <a> tags and find the external links
	let external_links: CheerioElement[] = [];
	$content.find("a").each((idx, anchor) => {
		// Find the external links
		if (anchor.attribs['class'] && anchor.attribs['class'].search(/external/gimu) >= 0){
			external_links.push(anchor);
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
				category: null,
				text: null,
				note_element: list_item,
			};

			// Find the ref that corresponds to the note
			cite_refs.forEach((ref_elem, idx) => {
				let ref_index_splits = ref_elem.attribs['id'].split("-");
				let ref_index = ref_index_splits[ref_index_splits.length - 1];

				if (note_index == ref_index){
					workingRawCitation.id_ref = ref_elem.attribs['id'];
				}
			})

			if (!workingRawCitation.id_ref) NEED TO DO SOMETHING!!!

			// Add the ref and note information to the list of raw citations
			rawCitations.push(workingRawCitation)
			
		};
	});

	console.log(rawCitations)

	// // Start matching refs to notes
	// let rawCitations: RawCitation[] = [];
	// cite_refs.forEach((idx, elem) => {
	// 	let note_index = $(elem).a
	// })


	// console.log(cite_refs);
	// console.log(cite_notes);
	// console.log(external_links);

	// let cite_refs = $($content).find('a', href=re.compile('#cite_ref'))
	// let cite_notes = $content.find_all('a', href=re.compile('#cite_note'))



	// const $refList = $content.find('.reflist').last().find('ol'); // Get the list of references

	//  // Loop through the references
	// $refList.children('li').each( (i, el) => {
		

	// 	// Get a specific citation
	// 	let $reference = $(el).find('.reference-text'); 
	// 	let $citation = $reference.find('.citation');
		
	// 	// If the citation is immediately present, process it
	// 	// TODO: Deal with media uploads, thumbs, etc
	// 	if ($citation.length > 0) {
	// 		let description = accumulateText($citation, $, internalCitations);
	// 		let urlToUse = $citation.find('a').attr('href');

	// 		// Current citation
	// 		let cur: Citation = {
	// 			url: urlToUse,
	// 			thumb: null,
	// 			category: linkCategorizer(urlToUse),
	// 			citation_id: i + 1, // i + 1 because default push is 0
	// 			description: description,
	// 			social_type: socialURLType(urlToUse),
	// 			attribution: 'rel=nofollow',
	// 			timestamp: getTimeStamp() as any,
	// 			mime: null
	// 		}
	// 		let key = i+1;
	// 		internalCitations[key] = cur.url;
	// 		citations.push(cur);
			
	// 	} 
	// 	else { 
	// 		// Else traverse biography (primary, secondary, tertiary sources to find citation)
	// 		// and compare citations to identifiers to identify the citation in the biography
	// 		let found = false; 
	// 		$content.find('div .refbegin').each((i3, el3) => { // For each biography (i.e., primary, secondary, tertiary)  
	// 			let a = $reference.find('a').attr('href');

	// 			// Loop through the citations
	// 			$(el3).find('cite').each( (i4, el4) => {
	// 				if (a == '#' + $(el4).attr('id')) { // Citation found in biography
	// 					let description = accumulateText(el4, $, internalCitations);

	// 					// Type of citation = $(el4).attr('class'); (e.g, journal, book etc..)
	// 					let url = '';
	// 					$(el4).find('a').each((i5, el5) => {
	// 						let $el5 = $(el5);
	// 						if ($el5.attr('class') == "external text") {
	// 							url = $el5.attr('href');
	// 						}
	// 					})
	// 					if ( url == undefined ) {
	// 						url == '';
	// 					}
	// 					let cur: Citation = {
	// 						url: url,
	// 						thumb: null,
	// 						category: linkCategorizer(url),
	// 						citation_id: i + 1, 
	// 						description: description,
	// 						social_type: null,
	// 						attribution: 'rel=nofollow',
	// 						timestamp: getTimeStamp() as any,
	// 						mime: null
	// 					}
	// 					citations.push(cur);
	// 					internalCitations[i+1] = cur.url;
	// 					found = !found;
	// 					return
	// 				}
	// 				if (found) { // Quick break to stop iterating if citation has been found in biography
	// 					return
	// 				}
	// 			}) 
	// 		}) 
	// 	}
	// }) 
	return {
		citations: citations,
		internalCitations: internalCitations //map passed to textParser for instant internal citation lookup
	}; 
}

