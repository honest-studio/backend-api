import * as cheerio from 'cheerio';
import { textParser, accumulateText } from './pagebodyfunctionalities/textParser';
import { getTimeStamp } from './pagebodyfunctionalities/getTimeStamp';
import { Citation, Sentence } from '../../../src/types/article';
import { linkCategorizer, socialURLType } from '../../../src/utils/article-utils/article-converter';

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
export const getCitations = (html, url) => { 
	const $ = cheerio.load(html, {decodeEntities: false});
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

	const $content = $('div.mw-parser-output'); // Page content
	const $refList = $content.find('.reflist').last().find('ol'); // Get the list of references
	
	 // Loop through the references
	$refList.children('li').each( (i, el) => {
		// Get a specific citation
		let $reference = $(el).find('.reference-text'); 
		let $citation = $reference.find('.citation');
		
		// If the citation is immediately present, process it
		// TODO: Deal with media uploads, thumbs, etc
		if ($citation.length > 0) {
			let description = accumulateText($citation, $, internalCitations);
			let urlToUse = $citation.find('a').attr('href');

			// Current citation
			let cur: Citation = {
				url: urlToUse,
				thumb: null,
				category: linkCategorizer(urlToUse),
				citation_id: i + 1, // i + 1 because default push is 0
				description: description,
				social_type: socialURLType(urlToUse),
				attribution: 'rel=nofollow',
				timestamp: getTimeStamp() as any,
				mime: null
			}
			let key = i+1;
			internalCitations[key] = cur.url;
			citations.push(cur);
			
		} 
		else { 
			// Else traverse biography (primary, secondary, tertiary sources to find citation)
			// and compare citations to identifiers to identify the citation in the biography
			let found = false; 
			$content.find('div .refbegin').each((i3, el3) => { // For each biography (i.e., primary, secondary, tertiary)  
				let a = $reference.find('a').attr('href');

				// Loop through the citations
				$(el3).find('cite').each( (i4, el4) => {
					if (a == '#' + $(el4).attr('id')) { // Citation found in biography
						let description = accumulateText(el4, $, internalCitations);

						// Type of citation = $(el4).attr('class'); (e.g, journal, book etc..)
						let url = '';
						$(el4).find('a').each((i5, el5) => {
							let $el5 = $(el5);
							if ($el5.attr('class') == "external text") {
								url = $el5.attr('href');
							}
						})
						if ( url == undefined ) {
							url == '';
						}
						let cur: Citation = {
							url: url,
							thumb: null,
							category: linkCategorizer(url),
							citation_id: i + 1, 
							description: description,
							social_type: null,
							attribution: 'rel=nofollow',
							timestamp: getTimeStamp() as any,
							mime: null
						}
						citations.push(cur);
						internalCitations[i+1] = cur.url;
						found = !found;
						return
					}
					if (found) { // Quick break to stop iterating if citation has been found in biography
						return
					}
				}) 
			}) 
		}
	}) 
	return {
		citations: citations,
		internalCitations: internalCitations //map passed to textParser for instant internal citation lookup
	}; 
}

