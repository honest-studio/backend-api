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
import { MediaUploadService, UrlPack } from '../../../src/media-upload';
import { CheerioPack } from '../functions/pagebodyfunctionalities/cleaners';
// input: page html, url
// output sections[] 

// Logic: 
// Whenever <p>, <ul>, <dl>, <table>, <div> tags are reached
// Create and push a new paragraph into paragraphs []
// Whenever an <h1>, ..., <h6> tag is reached, create and push a new section

export interface PageBodyPack {
	sections: Section[],
	citations: Citation[],
	internal_citations: any,
	cheerio_pack: CheerioPack
}

export const getPageBodyPack = async (input_pack: CheerioPack, url, theMediaUploadService: MediaUploadService): Promise<PageBodyPack> => {
	// Compute citations first to be able to implement internal citations
	// When parsing the page body
	let ctn_return_pack = await getCitations(input_pack, url, theMediaUploadService);
	let internalCitations = ctn_return_pack.internalCitations;

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
	const $ = ctn_return_pack.cheerio_pack.cheerio_static;
	const $content = $('div.mw-parser-output');

	// Loop through the children
	$content.children('h1, h2, h3, h4, h5, h6, p, div, table, ul, ol, dl, center').each((i, el) => { 
		let $el = $(el);
		let tag_name = $el[0].name;

		// Process headlines / headers
		// Create new section when h tag is reached
		if($el.prop('tagName').indexOf("H") > -1 && $el.find('.mw-headline').length > 0){ 
			// Terminate loop once references are reached (they've already been computed)
			if ( $el.attr('id') == 'References' ) {
				return false;
			}

			// Assemble current section
			section = { 
				paragraphs: paragraphs,
				images: images
			}
			// console.log(section)
			sections.push(section); // Push current section
			paragraphs = []; // Reset paragraphs array 
			paragraphIndex = 0; // Reset paragraphIndex
			images = [] // Reset images array
			  
			// Instantiate new empty section with first paragraph being an h tag
			section = { 
				paragraphs: [] as Paragraph[], 
				images: [] as Media[]
			};

			// Create a new paragraph with h tag 
			let headline = getHeadlineSentence(el, $);
			// console.log(headline.text)
			paragraphs.push({ 
				index: paragraphIndex,
				items: [headline] as Sentence[],
				tag_type: $el[0].name, 
				attrs: cleanAttrs(el.attribs)
			});
			paragraphIndex++;
		}
		// Process normal paragraphs
		else if (tag_name == 'p') { 
			let sentenceItems = accumulateText(el, $, internalCitations); // Returns sentence[]
			paragraphs.push({  
				index: paragraphIndex,
				items: sentenceItems,
				tag_type: 'p',
				attrs: cleanAttrs(el.attribs)
			})
			paragraphIndex++;
		}
		// Potentially a section image
		else if (tag_name == 'div') {
			let divClass = $el.attr('class');
			if (divClass !== undefined) {
				// If section image found
				if (divClass.includes("thumb")) {
					images.push(getImage(el, $, internalCitations) as Media);
				}
			}
		}
		else if (tag_name == 'table') {
			let tableclass = $el.attr('class');
			if (tableclass === undefined || tableclass.search(/wikitable/gimu) >= 0 || tableclass.search(/body-table/gimu) >= 0) {
				let parsed_table = getTable(el, $, internalCitations, "body-table");
				paragraphs.push({
					index: paragraphIndex,
					items: [parsed_table] as Table[],
					tag_type: 'table',
					attrs: cleanAttrs(el.attribs)
				})
				paragraphIndex++;
			}
			
		}
		// Sometimes pagebody tables are nested in center tags
		else if (tag_name == 'center' && $el.children('table').length > 0) { 
			let childTable = $el.find('table');
			let tableclass = childTable.attr('class');
			if (tableclass.search(/wikitable/gimu) >= 0 || tableclass.search(/body-table/gimu) >= 0) {
				let parsed_table = getTable(childTable, $, internalCitations, "body-table");
				paragraphs.push({
					index: paragraphIndex,
					items: [parsed_table] as Table[],
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
		citations: ctn_return_pack.citations,
		internal_citations: internalCitations,
		cheerio_pack: {
			cheerio_static: $
		}
	}
}
