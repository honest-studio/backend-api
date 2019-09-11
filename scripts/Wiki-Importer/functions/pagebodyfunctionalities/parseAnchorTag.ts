import { parseInlineImage } from '../../../../src/utils/article-utils/article-converter';

// Input: anchor tag 
// Output: string of LINK or INLINE-IMG
export const parseAnchorTag = (element, $: CheerioStatic) => {
	let $element = $(element);
	let theClass = $element.attr('class');
  if ($element.children().length == 0) { // Resolve anchor tags that only contains text 
	  return parseLink(element, $);
	}
  else if (theClass && theClass.search(/image|flagicon/gimu) >= 0) { // Inline-image 
  	return parseInlineImage($element.children('img'), $);
  }
  // else if ($element.children('img').length && theClass.search(/image|flagicon/gimu) >= 0) { // Inline-image 
  //   return parseInlineImage($element.children('img'), $);
  // }
  else if ($element.html().includes('<br>')) {  // Anchor tag has inner br tag edge case
    let a = ($.html($element)).replace('<br>', '\n');
    return parseAnchorTag(a, $);
  }
  else {
    return ''
  }
}

export const parseLink = (anchorTagElement, $) => { //LINK
  let $element = $(anchorTagElement);
  let wikiLink = '';
  const linkText = $element.text(); 
  // Get slug 
  const hrefAttr = $element.attr('href');
  let slug = ''; 
  if(hrefAttr){
    slug = hrefAttr.slice(6); // account for 'wiki/'
    wikiLink = '[[LINK|lang_en|' + slug + '|' + linkText + ']]';
    if (wikiLink == undefined || anchorTagElement == undefined) {
      return ''
    }
    return wikiLink
  }
  else return '';


}




