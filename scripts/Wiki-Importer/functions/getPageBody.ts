import * as cheerio from 'cheerio';
import { textParser, accumulateText } from './pagebodyfunctionalities/textParser';
import { getImage } from './pagebodyfunctionalities/getImage';
import { getHeadlineSentence } from './pagebodyfunctionalities/getHeadlineSentence';
import { getListItems } from './pagebodyfunctionalities/getListItems';
import { getDescList } from './pagebodyfunctionalities/getDescList';
import { getTable } from './pagebodyfunctionalities/tablefunctionalities/getTable';
import { cleanAttributes } from '../../../src/utils/article-utils/article-converter';
import { getCitations } from './getCitations';
import { Section, Citation, Paragraph, Media, Sentence, Table, DescList } from '../../../src/types/article';
import { MediaUploadService, UrlPack } from '../../../src/media-upload';
import { CheerioPack } from '../functions/pagebodyfunctionalities/cleaners';
const chalk = require('chalk');

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

	console.log(chalk.yellow.bold("====================📰 SECTIONS 📰===================="));
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
	console.log(chalk.yellow("Looping through the children"));
	let single_section_body = true; // Flag to handle the edge case of a single-section wiki
	$content.children('h1, h2, h3, h4, h5, h6, p, div, table, ul, ol, dl, blockquote, center').each((i, el) => { 
		let $el = $(el);
		let tag_name = $el[0].name;

		// Process headlines / headers
		// Create new section when h tag is reached
		process.stdout.write(chalk.yellow(`Adding ${tag_name}...`));
		if($el.prop('tagName').indexOf("H") > -1 && $el.find('.mw-headline').length > 0){ 
			// Terminate loop once references are reached (they've already been computed)
			if ( $el.attr('id') == 'References' ) {
				return false;
			}

			// Remove the single section body flag
			single_section_body = false;

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
				attrs: cleanAttributes(el.attribs)
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
				attrs: cleanAttributes(el.attribs)
			})
			paragraphIndex++;
		}
		// Process blockquotes
		else if (tag_name == 'blockquote') { 
			let sentenceItems = accumulateText(el, $, internalCitations); // Returns sentence[]
			paragraphs.push({  
				index: paragraphIndex,
				items: sentenceItems,
				tag_type: 'blockquote',
				attrs: cleanAttributes(el.attribs)
			})
			paragraphIndex++;
		}
		// Sometimes stuff is nested in center or div tags
		else if (tag_name.search(/center|div/gimu) >=0){
			if($el.children('table').length > 0) { 
				let childTable = $el.find('table');
				let tableclass = childTable.attr('class');
				if (tableclass && (tableclass.search(/wikitable/gimu) >= 0 || tableclass.search(/body-table/gimu) >= 0)) {
					let parsed_table = getTable(childTable, $, internalCitations, "body-table");
					paragraphs.push({
						index: paragraphIndex,
						items: [parsed_table] as Table[],
						tag_type: 'table',
						attrs: cleanAttributes(childTable[0].attribs)
					})
					paragraphIndex++;
				}
			}
			else {
				let divClass = $el.attr('class');
				if (divClass !== undefined) {
					// If section image found
					if (divClass.includes("thumb")) {
						images.push(getImage(el, $, internalCitations) as Media);
					}
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
					attrs: cleanAttributes(el.attribs)
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
				attrs: cleanAttributes(el.attribs)
			})
			paragraphIndex++;	
		}
		else if(tag_name == 'dl') { // DescList
			let item = getDescList(el, $, internalCitations); // returns array of dl | dt items
			paragraphs.push({
				index: paragraphIndex,
				items: [item] as DescList[],
				tag_type: 'dl',
				attrs: cleanAttributes(el.attribs)
			})
			paragraphIndex++;
		}
		process.stdout.write(chalk.yellow(` DONE\n`));
	})

	// Push any leftover paragraphs and/or images into a headerless section
	// Usually this occurs with a one-paragraph wiki
	if (single_section_body && (paragraphs.length > 0 || images.length > 0)){
		process.stdout.write(chalk.yellow(`Pushing leftover paragraphs and images...`));
		// Assemble current section
		section = { 
			paragraphs: paragraphs,
			images: images
		}
		sections.push(section); // Push current section
		process.stdout.write(chalk.yellow(` DONE\n`));
	}

	console.log(chalk.bold.green(`DONE`));
	return {
		sections: sections,
		citations: ctn_return_pack.citations,
		internal_citations: internalCitations,
		cheerio_pack: {
			cheerio_static: $
		}
	}
}
