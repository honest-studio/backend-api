import { Citation, AMPParseCollection, Media, SeeAlso, ArticleJson, Sentence, SeeAlsoCollection, InlineImage } from '../../wiki/article-dto';
const cheerio = require('cheerio');
const crypto = require("crypto");
const decode = require('unescape');
const normalizeUrl = require('normalize-url');
import * as MarkdownIt from 'markdown-it';
import * as htmlparser2 from 'htmlparser2';
import { getYouTubeID, CAPTURE_REGEXES } from 'src/wiki/article-converter';

export const CheckForLinksOrCitationsAMP = (
	textProcessing: string,
    citations: Citation[],
    currentIPFS: string,
    ampLightBoxes: string[] = [],
    tagType?: string
    
): AMPParseCollection => {
	if (!textProcessing) return {'text': '', 'lightboxes': []};

    let text = textProcessing;
    let md = new MarkdownIt({ html: true, });
    text = md.renderInline(text);

	// if (text.indexOf('<div')) text = textProcessing.innerHtml;
	const check = text.indexOf('[[');
	if (check >= 0) {
		const end = text.indexOf(']]') + 2;
		const link: string = text.substring(check, end);
		const linkString: string = 'LINK';
        const citeString: string = 'CITE';
        const inlineImageString: string = 'INLINE_IMAGE';
		const isLink = link.indexOf(linkString);
        const isCitation = link.indexOf(citeString);
        const isInlineImage = link.indexOf(inlineImageString);
		let newString: string, newText: string;
		// Check whether link or citation
		if (isLink > 0) {
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
            const unique_id = crypto.randomBytes(5).toString('hex');

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

            // Substitute in the new string
            newText = text.replace(link, newString);

		} else if (isCitation >= 0 && citations) {
			const citationIndex: number | string = parseInt(link.charAt(isCitation + citeString.length + 1)) || link.charAt(isCitation + citeString.length + 1);
            const pulledCitationURL = citations[citationIndex] ? citations[citationIndex].url : '';

            // Load the HTML into htmlparser2 beforehand since it is more forgiving
            let dom = htmlparser2.parseDOM('<a></a>', { decodeEntities: true });

            // Load the HTML into cheerio for parsing
            let $ = cheerio.load(dom);
            const unique_id = crypto.randomBytes(5).toString('hex');

            const nextLetter = text.charAt(end);
            const endingString = !!nextLetter.match(/[.,:;!?']/) ? '' : ' ';

            // Encode the URL
            let linkURLEncoded = '';
            try {
                linkURLEncoded = encodeURIComponent(pulledCitationURL);
            } catch (e) {
                linkURLEncoded = pulledCitationURL;
            }

            // Create the button that will be substituted
            let openButtonTag = $('<button />');
            $(openButtonTag).addClass('tooltippableCarat');
            $(openButtonTag).attr('role', 'button');
            $(openButtonTag).attr('tabindex', 0);
            $(openButtonTag).attr('aria-label', citationIndex);
            $(openButtonTag).attr('aria-labelledby', `hvrlnk-${unique_id}`);
            $(openButtonTag).attr('on', `tap:hvrlnk-${unique_id}`);
            $(openButtonTag).text(`[${citationIndex}]`);
    
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

            // Substitute in the new string
            newText = text.replace(link, newString);
        } else if (isInlineImage > 0){
            // Load the HTML into htmlparser2 beforehand since it is more forgiving
            let dom = htmlparser2.parseDOM('<img />', { decodeEntities: true });

            // Load the HTML into cheerio for parsing
            let $ = cheerio.load(dom);
            const unique_id = crypto.randomBytes(5).toString('hex');

            let result = CAPTURE_REGEXES.inline_image_match.exec(text);

            let workingImage: InlineImage = {
                src: result ? normalizeUrl(result[1]) : '',
                alt: result ? result[2] : '',
                height: result ? result[3] : '1',
                width: result ? result[4] : '1'
            }

            // Create the amp-img
            let ampImgTag = $('<amp-img />');
            $(ampImgTag).attr('width', workingImage.width);
            $(ampImgTag).attr('height', workingImage.height);
            $(ampImgTag).attr('layout', 'fixed');
            $(ampImgTag).attr('alt', workingImage.alt);
            $(ampImgTag).attr('src', workingImage.src);

            // Create the placeholder / thumbnail image
            let placeholderTag = $('<amp-img />');
            $(placeholderTag).attr('layout', 'fill');
            $(placeholderTag).attr('width', '1');
            $(placeholderTag).attr('height', '1');
            $(ampImgTag).attr('layout', 'fixed');
            $(placeholderTag).attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=');
            $(placeholderTag).attr('placeholder', '');

            // Put the placeholder inside the amp-img
            $(ampImgTag).append(placeholderTag);

            // Replace the image with the amp-img
            $('img').replaceWith(ampImgTag);

            // Set the new string
            newString = decode($.html(), 'all');

            // Substitute in the new string
            newText = text.replace(result ? result[0] : '', newString);
        }
    
		// Recursive
		return CheckForLinksOrCitationsAMP(newText, citations, currentIPFS, ampLightBoxes);
    }

	return {'text': text, 'lightboxes': ampLightBoxes};
};

export const ConstructAMPImage = (media: Media, sanitizedCaption: string, sanitizedCaptionPlaintext: string): string  => {
    switch(media.type){
        case 'section_image':
            let imageHTML = 
                `${ media.category == "PICTURE" ?
                    `<amp-img width=150 height=150 layout="responsive" src="${media.url}" data-image="${media.url}" 
                        data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                        <amp-img placeholder width=150 height=150 src="${media.thumb}" layout="fill"></amp-img>
                    </amp-img>` : 
                media.category == "GIF" ?
                    `<amp-anim width=150 height=150 layout="responsive" src="${media.url}" data-image="${media.url}" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                        <amp-img placeholder width=150 height=150 src="${media.thumb}" layout="fill"></amp-img>
                    </amp-anim>` : 
                media.category == "YOUTUBE" ?
                    `<amp-youtube
                        data-videoid="${getYouTubeID(media.url)}"
                        layout="responsive"
                        width=150
                        height=150>
                    </amp-youtube>` :  
                media.category == "NORMAL_VIDEO" ?
                    `<amp-video
                        width=150
                        height=150
                        layout="responsive"
                        preload="metadata"
                        poster='https://epcdn-vz.azureedge.net/static/images/placeholder-video.png'>
                            <source src="${media.url}#t=0.1" type="${media.mime}">
                            Please click to play the video.
                    </amp-video>` : 
                media.category == "AUDIO" ?
                    `<amp-img width=150 height=150 layout="responsive" src="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" data-image="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                        <amp-img placeholder width=150 height=150 src="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" layout="fill"></amp-img>
                    </amp-img>` : ``
                }
            `; 
            
            return `
                <table class=" blurb-inline-image-container">
                    <tbody>
                        <tr>
                            <td>
                                ${imageHTML}
                            </td>
                        </tr>
                     </tbody>
                     <caption class="blurbimage-caption">${sanitizedCaption}</caption>
                </table>
            `
            break
        case 'inline_image':
            break
        default:
            break
    }
    return ``;
}

export const getSeeAlsos = (passedJSON: ArticleJson): SeeAlso[] => {
    let allSentences: Sentence[] = [];
    passedJSON.page_body.forEach((section, index) => {
        section.paragraphs.forEach((paragraph, index) => {
            allSentences.push(...(paragraph.items as Sentence[]))
        })
    });
    allSentences.push(...(passedJSON.main_photo.caption as Sentence[]));
    passedJSON.infoboxes.forEach((infobox, index) => {
        allSentences.push(...(infobox.values as Sentence[]))
    });
    passedJSON.media_gallery.forEach((media, index) => {
        allSentences.push(...(media.caption as Sentence[]))
    });
    passedJSON.citations.forEach((citation, index) => {
        allSentences.push(...(citation.description as Sentence[]))
    });
    let tempSeeAlsos: SeeAlso[] = [];

    allSentences.forEach((sentence, index) => {
        let text = sentence.text;
        let result;
        while((result = CAPTURE_REGEXES.link_match.exec(text)) !== null) {
            tempSeeAlsos.push({
                lang: result[1],
                slug: result[2],
                title: "",
                thumbnail_url: "",
                snippet: ""
            });
        }
    });

    let seeAlsoTally: SeeAlsoCollection = {};
    let sortedSeeAlsos = [];
    tempSeeAlsos.forEach((value, index) => {
        let key = `${value.lang}__${value.slug}`;
        if (seeAlsoTally[key]){
            seeAlsoTally[key].count = seeAlsoTally[key].count + 1;
        }else{
            seeAlsoTally[key] = {
                count: 1,
                data: value
            };
        }
    });
    sortedSeeAlsos = Object.keys(seeAlsoTally).sort(function(a,b){
        return seeAlsoTally[a].count -seeAlsoTally[b].count
    });
    sortedSeeAlsos = sortedSeeAlsos.slice(0, 3);
    let newSeeAlsos = [];
    sortedSeeAlsos.forEach((key, index) => {
        newSeeAlsos.push(seeAlsoTally[key].data);
    });
	return newSeeAlsos;
};
