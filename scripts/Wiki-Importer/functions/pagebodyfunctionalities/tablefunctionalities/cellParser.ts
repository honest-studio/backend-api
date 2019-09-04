import { cleanAttrs } from '../getAttributes';
import { textParser, accumulateText } from '../textParser'; 
import { getTagClass } from '../getTagClass';
import { getImage } from '../getImage';
import { parseAnchorTag } from '../parseAnchorTag';
import { parseInternalCitation } from '../parseInternalCitation';
import { NestedContentItem, NestedTextItem, NestedTagItem, TableCell } from '../../../../../src/types/article';

export const getParsedCellContent = (cell, $, nestedContentItems, accumulator, internalCitations): NestedContentItem[] => {
	let localNestedContentItems = nestedContentItems;
	let localAccumulator = accumulator; 

	// console.log("CELL PARSER IS MESSED UP. NEED TO TEST LIVE. JUST MIMIC THE LOGIC OF nestedContentParser in article-converter.ts")

	// Skip undefined elements
	if (cell == undefined) {
		return ;
	}

	// Initialize the element
	const $element = $(cell);

	// Do not display html that wikipedia doesn't display
	if ($element.attr('style') == 'display: none;') { 
      	return;
  	}

	// Else element is nested   
	$element.contents().each( (i, el) => {
		if ( el.type == 'text' ) {
			let text = $(el).text();
			if (text !== undefined && text !== '') {
				accumulator += text;
				return;
			}
			return;
		} 
		else if ($(el)[0].name == 'br') {
			if( localAccumulator != undefined && localAccumulator != '' ) {
				// Sentence is completed 
				localNestedContentItems.push({
					type: 'text', 
					content: [{type: 'sentence', index: 0, text: localAccumulator}] 
				});
      		}
      		// Push br tag 
      		localNestedContentItems.push({
				attrs: cleanAttrs(el.attrs),
				content: [], 
				tag_class: "void",
				tag_type: 'br',
				type: "tag" 
			});

	        localAccumulator = ''; //reset localAccumulator
	        return 
		}
		else if ($(el)[0].name == 'a') {
			localAccumulator += parseAnchorTag(el, $);
  		}
  		else if ($(el)[0].name == 'sup') { 
  			localAccumulator += parseInternalCitation($(el).find('a'), $, internalCitations);
  		}
  		else if ($(el)[0].name == 'ul') { //edge case for infobox_html
  			let listElements = $(el).children('li');
  			let listContent = [];
  			for ( i = 0; i < listElements.length; i++ ) {
  				listContent.push({
  					type: 'tag', 
  					tag_type: 'li',
  					tag_class: getTagClass($(listElements[i])[0].name), 
  					attrs: cleanAttrs(listElements[i].attribs),
  					content: { 
  						type: 'text',
  						content: textParser(listElements[i], $, internalCitations)
  					} 
  				}) 
  			} 
  			localNestedContentItems.push({ //push UL element 
  				type: 'tag', 
  				tag_type: 'ul', 
  				tag_class: getTagClass($(el)[0].name), 
  				attrs: cleanAttrs(el.attribs), 
  				content: listContent 
  			}) 
  			return;
  		}
  		else { 
			// Nested tag is reached 
			localNestedContentItems.push(...getParsedCellContent(el , $, [], "", internalCitations));
  		}
	})

	localAccumulator = localAccumulator.trim(); 
	let tempLength = localNestedContentItems.length;

	// Since the code pushes localNestedContentItems only when br tags are reached
	// The following conditional code will push the remaining code after the br tag is reached 
	// Within a cell (as it was not pushed yet since a br tag was never reached)
	if (tempLength == 0) {	
	localNestedContentItems.push({ 
   	  	type: 'text', 
     	content: [{type: 'sentence', index: 0, text: localAccumulator}] });
	} else {
		if (localNestedContentItems[tempLength - 1].type == 'text') {
			if ((localNestedContentItems[tempLength - 1] as NestedTextItem).content[0].text != localAccumulator) {
				localNestedContentItems.push({ 
			   	  	type: 'text', 
			     	content: [{type: 'sentence', index: 0, text: localAccumulator}] });
			}
		}
		else {
			if (localAccumulator != '') {
				localNestedContentItems.push({ 
			   	  	type: 'text', 
			     	content: [{type: 'sentence', index: 0, text: localAccumulator}] });
			}
		}	
	}
	return localNestedContentItems;
}
