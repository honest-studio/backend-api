import * as cheerio from 'cheerio';
import { textParser, accumulateText } from './pagebodyfunctionalities/textParser';
import { getImage } from './pagebodyfunctionalities/getImage';
import { getHeadlineSentence } from './pagebodyfunctionalities/getHeadlineSentence';
import { getListItems } from './pagebodyfunctionalities/getListItems';
import { getDescList } from './pagebodyfunctionalities/getDescList';
import { getTable } from './pagebodyfunctionalities/tablefunctionalities/getTable';
import { cleanAttrs } from './pagebodyfunctionalities/getAttributes';
import { getCitations } from './getCitations';
import { Section, Citation, Paragraph, Media, Sentence, Table, DescList } from '../../../src/types/article';

// input: page html, url
// output sections[] 

// Logic: 
// Whenever <p>, <ul>, <dl>, <table>, <div> tags are reached
// Create and push a new paragraph into paragraphs []
// Whenever an <h1>, ..., <h6> tag is reached, create and push a new section

export interface PageBodyPack {
	sections: Section[],
	citations: Citation[],
	internal_citations: any
}

export const getPageBodyPack = (html, url): PageBodyPack => {
	// Compute citations first to be able to implement internal citations
	// When parsing the page body
	let citations = getCitations(html, url);
	let internalCitations = citations.internalCitations;

	const sections: Section[] = []; // Return object: array of {paragraphs: Paragraph[] , images: Media[]} objects

	// Current section
	let section: Section = { 
		paragraphs: [] as Paragraph[], 
		images: [] as Media[]
	}; 

	let paragraphs: Paragraph[] = [];
	let images: Media[] = [];
	let paragraphIndex = 0; // Keep track of current paragraph

	// Parse the dom
	const $ = cheerio.load(html, {decodeEntities: false});
	const $content = $('div.mw-parser-output');

	// Loop through the children
	$content.children('p, h1, h2, h3, h4, h5, h6, div, table, ul, dl, center').each((i, el) => { 
		let $el = $(el);
		let tag_name = $el[0].name;

		// Process normal paragraphs
		if (tag_name == 'p') { 
			let sentenceItems = accumulateText(el, $, internalCitations); // Returns sentence[]
			paragraphs.push({  
				index: paragraphIndex,
				items: sentenceItems,
				tag_type: 'p',
				attrs: cleanAttrs(el.attribs)
			})
			paragraphIndex++;
		}
		// Process headlines / headers
		// Create new section when h tag is reached
		else if($el.prop('tagName').indexOf("H") > -1 && $el.find('.mw-headline').length > 0){ 
			// Terminate loop once references are reached (they've already been computed)
			if ( $el.attr('id') == 'References' ) {
				return false;
			}

			// Push current section
			sections.push({ 
				paragraphs: paragraphs,
				images: images
			})
			paragraphs = []; // Reset paragraphs array 
			paragraphIndex = 0; // Reset paragraphIndex
			images = [] // Reset images array
			  
			// Instantiate new empty section with first paragraph being an h tag
			section = { 
				paragraphs: [] as Paragraph[], 
				images: [] as Media[]
			};

			// Create a new paragraph with h tag 
			paragraphs.push({ 
				index: paragraphIndex,
				items: [getHeadlineSentence(el, $)] as Sentence[],
				tag_type: $el[0].name, 
				attrs: cleanAttrs(el.attribs)
			});
			paragraphIndex++;
		}
		// Potentially a section image
		else if (tag_name == 'div') {
			let divClass = $el.attr('class');
			if (divClass !== undefined) {
				// If section image found
				if (divClass.includes("thumb")) {
					images.push(getImage(el, $) as Media);
				}
			}
		}
		else if (tag_name == 'table') {
			let tableclass = $el.attr('class');
			if (tableclass === "wikitable" || tableclass === "body-table") {
				let table = getTable(el, $, internalCitations);
				paragraphs.push({
					index: paragraphIndex,
					items: [table] as Table[],
					tag_type: 'table',
					attrs: cleanAttrs(el.attribs)
				})
				paragraphIndex++;
			}
		}
		//sometimes pagebody tables are nested in center tags
		else if (tag_name == 'center' && $el.children('table').length > 0) { 
			console.log('ATTRIBS')
			let childTable = $el.find('table');
			console.log(childTable[0].attribs);
			let tableclass = childTable.attr('class');
			if (tableclass === "wikitable" || tableclass === "body-table") {
				let table = getTable(childTable, $, internalCitations);
				paragraphs.push({
					index: paragraphIndex,
					items: [table] as Table[],
					tag_type: 'table',
					attrs: cleanAttrs(childTable[0].attribs)
				})
				paragraphIndex++;
			}
		}
		else if (tag_name == 'ul' || tag_name == 'ol') {
			let items = getListItems(el, $, internalCitations); // Returns array of li elements
			paragraphs.push({
				index: paragraphIndex,
				items: items,
				tag_type: tag_name,
				attrs: cleanAttrs(el.attribs)
			})
			paragraphIndex++;	
		}
		else if(tag_name == 'dl') { // DescList
			let item = getDescList(el, $, internalCitations); // returns array of dl | dt items
			paragraphs.push({
				index: paragraphIndex,
				items: [item] as DescList[],
				tag_type: 'dl',
				attrs: cleanAttrs(el.attribs)
			})
			paragraphIndex++;
		}
	})
	return {
		sections: sections,
		citations: citations.citations,
		internal_citations: internalCitations
	}
}
