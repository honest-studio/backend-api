import { Citation, AMPParseCollection } from '../../wiki/article-dto';
const cheerio = require('cheerio');
const decode = require('unescape');
import * as htmlparser2 from 'htmlparser2';

export const CheckForLinksOrCitationsAMP = (
	textProcessing: string,
    citations: Citation[],
    currentIPFS: string,
    ampLightBoxes: string[] = [],
	returnPlaintext?: boolean,
    tagType?: string
): AMPParseCollection => {
	if (!textProcessing) return {'text': '', 'lightboxes': []};

	let text = textProcessing;
	// if (text.indexOf('<div')) text = textProcessing.innerHtml;
	const check = text.indexOf('[[');
	if (check >= 0) {
		const end = text.indexOf(']]') + 2;
		const link: string = text.substring(check, end);
		const linkString: string = 'LINK';
		const citeString: string = 'CITE';
		const isLink = link.indexOf(linkString);
		const isCitation = link.indexOf(citeString);
		let newString: string;
		// Check whether link or citation
		if (isLink >= 0) {
			const linkBegin = isLink + linkString.length + 1;
			const linkEnd = link.lastIndexOf('|');
			const textBegin = linkEnd + 1;
			const linkText = link.substring(textBegin, link.length - 2);

			const linkUrlFull = link.substring(linkBegin, linkEnd);
			const linkBreakIndex = linkUrlFull.indexOf('|');
			const lang_code = linkUrlFull.substring(0, linkBreakIndex);
			const slug = linkUrlFull.substring(linkBreakIndex + 1, linkUrlFull.length);
            const linkCodeAndSlug = '/wiki/' + lang_code + '/' + slug;
            const linkCodeAndSlugNoWiki = lang_code + '/' + slug;
            const nextLetter = text.charAt(end);
            const endingString = !!nextLetter.match(/[.,:;!?']/) ? '' : ' ';
            const unique_id = Math.random().toString(36).substring(2);
            // Load the HTML into htmlparser2 beforehand since it is more forgiving
            let dom = htmlparser2.parseDOM('<a></a>', { decodeEntities: true });

            // Load the HTML into cheerio for parsing
            let $ = cheerio.load(dom);

            // Create the button that will be substituted
            let openButtonTag = $('<button />');
            $(openButtonTag).addClass('tooltippable');
            $(openButtonTag).attr('role', 'button');
            $(openButtonTag).attr('tabindex', 0);
            $(openButtonTag).attr('aria-label', linkCodeAndSlug);
            $(openButtonTag).attr('aria-labelledby', `${linkCodeAndSlug}__${unique_id}`);
            $(openButtonTag).attr('on', `tap:hvrblb-${linkCodeAndSlug}__${unique_id}`);
            $(openButtonTag).text(linkText);

            // Replace the <a> tag with a button
            $("a").replaceWith(openButtonTag);

            // Construct the amp-lightbox
            let lightBoxTag = $('<amp-lightbox />');
            $(lightBoxTag).addClass('amp-hc');
            $(lightBoxTag).attr('id', `hvrblb-${linkCodeAndSlug}__${unique_id}`);
            $(lightBoxTag).attr('role', 'button');
            $(lightBoxTag).attr('tabindex', 0);
            $(lightBoxTag).attr('on', `tap:hvrblb-${linkCodeAndSlug}__${unique_id}.close`);
            $(lightBoxTag).attr('layout', 'nodisplay');

            // Construct the amp-iframe
            let iframeTag = $('<amp-iframe />');
            $(iframeTag).addClass('amp-hc');
            $(iframeTag).attr('sandbox', 'allow-same-origin allow-scripts allow-top-navigation');
            $(iframeTag).attr('frameborder', 0);
            $(iframeTag).attr('scrolling', 'no');
            $(iframeTag).attr('layout', 'fill');
            $(iframeTag).attr('src', `https://www.everipedia.org/AJAX-REQUEST/AJAX_Hoverblurb/${linkCodeAndSlugNoWiki}/`);

            // Placeholder image (leave this here or it will cause stupid AMP problems)
            let placeholderTag = $('<amp-img />');
            $(placeholderTag).attr('placeholder', '');
            $(placeholderTag).attr('layout', 'fill');
            $(placeholderTag).attr('src', 'https://epcdn-vz.azureedge.net/static/images/white_dot.png');

            // Put the placeholder inside the iframe
            $(iframeTag).append(placeholderTag);

            // Put the iframe inside of the lightbox
            $(lightBoxTag).append(iframeTag);

            // Add the lightboxes to the list, as text and not a jQuery object
            ampLightBoxes.push($.html(lightBoxTag));

            // Set the new string
            newString = decode($.html() + endingString, 'all');


		} else if (isCitation >= 0 && citations) {
			const citationIndex: number = parseInt(link.charAt(isCitation + citeString.length + 1));
            const pulledCitation = citations[citationIndex];
            // Load the HTML into htmlparser2 beforehand since it is more forgiving
            let dom = htmlparser2.parseDOM('<a></a>', { decodeEntities: true });

            // Load the HTML into cheerio for parsing
            let $ = cheerio.load(dom);
            let unique_id = Math.random().toString(36);

            const nextLetter = text.charAt(end);
            const endingString = !!nextLetter.match(/[.,:;!?']/) ? '' : ' ';

            // Encode the URL
            let linkURLEncoded = '';
            try {
                linkURLEncoded = encodeURIComponent($(this).attr('data-username'));
            } catch (e) {
                linkURLEncoded = $(this).attr('data-username');
            }

            // Create the button that will be substituted
            let openButtonTag = $('<button />');
            $(openButtonTag).addClass('tooltippableCarat');
            $(openButtonTag).attr('role', 'button');
            $(openButtonTag).attr('tabindex', 0);
            $(openButtonTag).attr('aria-label', citationIndex);
            $(openButtonTag).attr('aria-labelledby', `hvrlnk-${unique_id}`);
            $(openButtonTag).attr('on', `tap:hvrlnk-${unique_id}`);
            $(openButtonTag).text(citationIndex);
    
            // Replace the <a> tag with a button
            $("a").replaceWith(openButtonTag);
    
            // Construct the amp-lightbox
            let lightBoxTag = $('<amp-lightbox />');
            $(lightBoxTag).addClass('amp-hc');
            $(lightBoxTag).attr('id', `hvrlnk-${unique_id}`);
            $(lightBoxTag).attr('role', 'button');
            $(lightBoxTag).attr('tabindex', 0);
            $(lightBoxTag).attr('on', `tap:hvrlnk-${unique_id}.close`);
            $(lightBoxTag).attr('layout', 'nodisplay');
    
            // Construct the amp-iframe
            let iframeTag = $('<amp-iframe />');
            $(iframeTag).addClass('amp-hc');
            $(iframeTag).attr('sandbox', 'allow-same-origin allow-scripts allow-top-navigation');
            $(iframeTag).attr('height', '275');
            $(iframeTag).attr('frameborder', 0);
            $(iframeTag).attr('scrolling', 'no');
            $(iframeTag).attr('layout', 'fill');
            $(iframeTag).attr(
                'src',
                `https://www.everipedia.org/AJAX-REQUEST/AJAX_Hoverlink/${currentIPFS}/?target_url=${linkURLEncoded}`
            );
    
            // Placeholder image (leave this here or it will cause stupid AMP problems)
            let placeholderTag = $('<amp-img />');
            $(placeholderTag).attr('placeholder', '');
            $(placeholderTag).attr('layout', 'fill');
            $(placeholderTag).attr('src', 'https://epcdn-vz.azureedge.net/static/images/white_dot.png');
    
            // Put the placeholder inside the iframe
            $(iframeTag).append(placeholderTag);

            // Put the iframe inside of the lightbox
            $(lightBoxTag).append(iframeTag);

            // Add the lightboxes to the list, as text and not a jQuery object
            ampLightBoxes.push($.html(lightBoxTag));

            // Set the new string
            newString = decode($.html() + endingString, 'all');
		}
		// Recursive
		return CheckForLinksOrCitationsAMP(newString, citations, currentIPFS, ampLightBoxes, returnPlaintext);
	}
	return {'text': text,  'lightboxes': ampLightBoxes};
};