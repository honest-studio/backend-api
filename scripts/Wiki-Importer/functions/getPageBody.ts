import * as cheerio from 'cheerio';
import { textParser, accumulateText } from './pagebodyfunctionalities/textParser';
import { getImage } from './pagebodyfunctionalities/getImage';
import { getCategory } from './pagebodyfunctionalities/getCategory';
import { getList } from './pagebodyfunctionalities/getList';
import { getDescList } from './pagebodyfunctionalities/getDescList';
import { getTable } from './pagebodyfunctionalities/tablefunctionalities/getTable';
import { cleanAttrs } from './pagebodyfunctionalities/getAttributes';
import { getCitations } from './getCitations';
import { Citation } from '../../../src/types/article';

//input: page html, url
//output sections[] 

//Logic: 
//Whenever <p>, <ul>, <dl>, <table>, <div> tags are reached
//Create and push a new paragraph into paragraphs []
//Whenever an <h1>, ..., <h6> tag is reached, create and push a new section

export const getPageBody = (html, url) => {
	//compute citations first to be able to implement internal citations
	//when parsing the page body
	let citations = getCitations(html, url);
	let internalCitations = citations.internalCitations;

	const sections = []; //return object: array of {paragraphs: Paragraph[] , images: Media[]} objects
	let section = {};  //current section
	let paragraphs = [];
	let images = [];
	let paragraphIndex = 0; //keep track of current paragraph

	const $ = cheerio.load(html, {decodeEntities: false});
	const $content = $('div.mw-parser-output');

	$content.children('p, h1, h2, h3, h4, h5, h6, div, table, ul, dl, center').each((i, el) => { 
		let $el = $(el);
		let tag = $el[0].name;
		if (tag == 'p') { 
			let sentenceItems = accumulateText(el, $, internalCitations); //returns sentence[]
			paragraphs.push({  
				index: paragraphIndex,
				items: sentenceItems,
				tag_type: 'p',
				attrs: cleanAttrs(el.attribs)
			})
			paragraphIndex++;
		}
		else if($el.prop('tagName').indexOf("H") > -1 && $el.find('.mw-headline').length > 0){ //create new section when h tag is reached
			if ( $el.attr('id') == 'References' ) {
				return false //terminate loop once references are reached (they've already been computed)
			}
			sections.push({ //push current section
				paragraphs: paragraphs,
				images: images
			})
			paragraphs = []; //reset paragraphs array 
			paragraphIndex = 0; //reset paragraphIndex
			images = [] //reset images array 
			section = {} //instantiate new empty section with first paragraph being an h tag
			// create a new paragraph with h tag 
			paragraphs.push({ 
				index: paragraphIndex,
				items: getCategory(el, $),
				tag_type: $el[0].name, 
				attrs: cleanAttrs(el.attribs)
			});
			paragraphIndex++;
		}
		else if (tag == 'div') { //potentially a section image
			let divClass = $el.attr('class');
			if (divClass !== undefined) {
				if (divClass.includes("thumb")) { //section image found
					images.push(getImage(el, $));
				}
			}
		}
		else if (tag == 'table') {
			let tableclass = $el.attr('class');
			if (tableclass === "wikitable" || tableclass === "body-table") {
				let table = getTable(el, $);
				paragraphs.push({
					index: paragraphIndex,
					items: table,
					tag_type: 'table',
					attrs: cleanAttrs(el.attribs)
				})
				paragraphIndex++;
			}
		}
		//sometimes pagebody tables are nested in center tags
		else if (tag == 'center' && $el.children('table').length > 0) { 
			console.log('ATTRIBS')
			let childTable = $el.find('table');
			console.log(childTable[0].attribs);
			let tableclass = childTable.attr('class');
			if (tableclass === "wikitable" || tableclass === "body-table") {
				let table = getTable(childTable, $);
				paragraphs.push({
					index: paragraphIndex,
					items: table,
					tag_type: 'table',
					attrs: cleanAttrs(childTable[0].attribs)
				})
				paragraphIndex++;
			}
		}
		else if ($el[0].name == 'ul') {
			let items = getList(el, $, internalCitations); //returns array of li elements
			paragraphs.push({
				index: paragraphIndex,
				items: items,
				tag_type: 'ul',
				attrs: cleanAttrs(el.attribs)
			})
			paragraphIndex++;	
		}
		else if($el[0].name == 'dl') { //DescList
			let items = getDescList(el, $); //returns array of dl | dt items
			paragraphs.push({
				index: paragraphIndex,
				items: items,
				tag_type: 'dl',
				attrs: cleanAttrs(el.attribs)
			})
			paragraphIndex++;
		}
	})
	return {
		sections: sections,
		citations: citations.citations
	}
}
