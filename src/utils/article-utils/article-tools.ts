import cheerio from 'cheerio';
import crypto from 'crypto';
import tag from 'html-tag';
import * as htmlparser2 from 'htmlparser2';
import MarkdownIt from 'markdown-it';
import striptags from 'striptags';
import decode from 'unescape';
import { BrowserInfo } from 'detect-browser';
import urlSlug from 'url-slug';
import * as axios from 'axios';
const conv = require('binstring');
import endianness from 'endianness';

import { ArticleJson, Citation, ListItem, Media, NestedContentItem, MediaType, Paragraph, Sentence, Table, TableCell, TableRow, Infobox, InfoboxValue } from '../../types/article';
import { AMPParseCollection, InlineImage, SeeAlso, SeeAlsoCollection } from '../../types/article-helpers';
import { CAPTURE_REGEXES, getYouTubeID, linkCategorizer, socialURLType } from './article-converter';
import { AMP_BAD_TAGS, AMP_REGEXES_POST, AMP_REGEXES_PRE, ReactAttrConvertMap, URL_REGEX_TEST } from './article-tools-constants';
const normalizeUrl = require('normalize-url');
var colors = require('colors');

export function compareURLs (firstURL: string, secondURL: string): boolean {
    if (firstURL == secondURL) return true;
    else if (firstURL == encodeURIComponent(secondURL)) return true;
    else if (encodeURIComponent(firstURL) == secondURL) return true;
    else if (encodeURIComponent(firstURL) == encodeURIComponent(secondURL)) return true;
    return false;
}

// Get the YouTube ID from a URL
export const getYouTubeIdIfPresent = (inputURL: string) => {
    try {
        // Also handle image URLs
        inputURL = inputURL.replace('https://i.ytimg.com/vi/', 'https://youtu.be/').replace('/hqdefault.jpg', '');

        // Get the ID
        let result = getYouTubeID(inputURL);

        // Return the YouTube ID string
        return result ? result : false;
    } catch (e) {
        return false;
    }
}

// Convert React attributes back into HTML ones
const reverseAttributes = (inputAttrs: { [attr: string]: any }): { [attr: string]: any } => {
    if (!inputAttrs) return {};
    if (!(Object.keys(inputAttrs).length === 0 && inputAttrs.constructor === Object)) return {};
    let reversedAttrs = {};
    const keys = Object.keys(inputAttrs);
    for (const key of keys) {
        if (inputAttrs[key] && inputAttrs[key] != ''){
            try {
                
                reversedAttrs[ReactAttrConvertMap[key]] = inputAttrs[key];
            }
            catch (e) {
                console.log(e);
                reversedAttrs[key] = inputAttrs[key]
            }
        } 
    }
    // if (reversedAttrs['style']){
    //     reversedAttrs['style'] = parseStyles(reversedAttrs['style']);
    // } 
    return reversedAttrs;
}

export const CheckForLinksOrCitationsAMP = (
    textProcessing: string,
    citations: Citation[],
    currentIPFS: string,
    ampLightBoxes: string[] = [],
    snippetMode: boolean
): AMPParseCollection => {
    if (!textProcessing) return { text: '', lightboxes: [] };

    let text = textProcessing;
    let md = new MarkdownIt({ html: true });
    text = md.renderInline(text);

    // catch edge case where spaces are in **bold ** text
    text = text.replace(/\*\*[^\*]+\*\*/gu, (match) => match.slice(2, -2));

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

            if (!snippetMode) {
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
                let $ = cheerio.load(dom as any);

                // Create the button that will be substituted
                let openButtonTag = $('<button />');
                $(openButtonTag).addClass('tooltippable');
                $(openButtonTag).attr('role', 'button');
                $(openButtonTag).attr('tabindex', "0");
                $(openButtonTag).attr('aria-label', linkCodeAndSlug);
                $(openButtonTag).attr('aria-labelledby', `${linkCodeAndSlug}__${unique_id}`);
                $(openButtonTag).attr('on', `tap:hvrblb-${linkCodeAndSlug}__${unique_id}`);
                $(openButtonTag).text(linkText);

                // Replace the <a> tag with a button
                $('a').replaceWith(openButtonTag);

                // Construct the amp-lightbox
                let lightBoxTag = $('<amp-lightbox />');
                $(lightBoxTag).addClass('amp-hc');
                $(lightBoxTag).attr('id', `hvrblb-${linkCodeAndSlug}__${unique_id}`);
                $(lightBoxTag).attr('role', 'button');
                $(lightBoxTag).attr('tabindex', '0');
                $(lightBoxTag).attr('on', `tap:hvrblb-${linkCodeAndSlug}__${unique_id}.close`);
                $(lightBoxTag).attr('layout', 'nodisplay');

                // Construct the amp-iframe
                let iframeTag = $('<amp-iframe />');
                $(iframeTag).addClass('amp-hc');
                $(iframeTag).attr('sandbox', 'allow-same-origin allow-scripts allow-top-navigation');
                $(iframeTag).attr('frameborder', '0');
                $(iframeTag).attr('scrolling', 'no');
                $(iframeTag).attr('layout', 'fill');
                $(iframeTag).attr(
                    'src',
                    `https://api.everipedia.org/v2/preview/amp-hoverblurb/${linkCodeAndSlugNoWiki}/`
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
            } else {
                // Replace the link with plaintext
                newText = text.replace(link, linkText);
            }
        } else if (isCitation >= 0 && citations) {
            if (!snippetMode){
                const citationIndex: number | string =
                    parseInt(link.charAt(isCitation + citeString.length + 1)) ||
                    link.charAt(isCitation + citeString.length + 1);
                const pulledCitationURL = citations[citationIndex] ? citations[citationIndex].url : '';

                // Load the HTML into htmlparser2 beforehand since it is more forgiving
                let dom = htmlparser2.parseDOM('<a></a>', { decodeEntities: true });

                // Load the HTML into cheerio for parsing
                let $ = cheerio.load(dom as any);
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
                $(openButtonTag).attr('tabindex', "0");
                $(openButtonTag).attr('aria-label', citationIndex.toString());
                $(openButtonTag).attr('aria-labelledby', `hvrlnk-${unique_id}`);
                $(openButtonTag).attr('on', `tap:hvrlnk-${unique_id}`);
                $(openButtonTag).text(`[${citationIndex}]`);

                // Replace the <a> tag with a button
                $('a').replaceWith(openButtonTag);

                // Construct the amp-lightbox
                let lightBoxTag = $('<amp-lightbox />');
                $(lightBoxTag).addClass('amp-hc');
                $(lightBoxTag).attr('id', `hvrlnk-${unique_id}`);
                $(lightBoxTag).attr('role', 'button');
                $(lightBoxTag).attr('tabindex', "0");
                $(lightBoxTag).attr('on', `tap:hvrlnk-${unique_id}.close`);
                $(lightBoxTag).attr('layout', 'nodisplay');

                // Construct the amp-iframe
                let iframeTag = $('<amp-iframe />');
                $(iframeTag).addClass('amp-hc');
                $(iframeTag).attr('sandbox', 'allow-same-origin allow-scripts allow-top-navigation');
                $(iframeTag).attr('height', '275');
                $(iframeTag).attr('frameborder', "0");
                $(iframeTag).attr('scrolling', 'no');
                $(iframeTag).attr('layout', 'fill');
                $(iframeTag).attr(
                    'src',
                    `https://api.everipedia.org/v2/preview/amp-hoverlink/${currentIPFS}/?target_url=${linkURLEncoded}`
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
            } else {
                // Remove the citation text
                newText = text.replace(link, "");
            }
        } else if (isInlineImage > 0) {
            if (!snippetMode) {
                // Load the HTML into htmlparser2 beforehand since it is more forgiving
                let dom = htmlparser2.parseDOM('<img />', { decodeEntities: true });

                // Load the HTML into cheerio for parsing
                let $ = cheerio.load(dom as any);
                const unique_id = crypto.randomBytes(5).toString('hex');

                let result = CAPTURE_REGEXES.inline_image_match.exec(text);
                if (result && result[1] !== undefined && result[1] != '') {
                    let workingImage: InlineImage = {
                        src: result ? urlCleaner(result[1]) : '',
                        srcSet: result ? result[2] : '',
                        alt: result ? result[3] : '',
                        height: result ? result[4] : '1',
                        width: result ? result[5] : '1'
                    };

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
                    $(placeholderTag).attr('src', 'https://epcdn-vz.azureedge.net/static/images/white_dot.png');
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
            } else {
                // Remove the inline image text
                newText = text.replace(link, "");
            }
        }

        // Recursive
        return CheckForLinksOrCitationsAMP(newText, citations, currentIPFS, ampLightBoxes, false);
    }

    return { text: text, lightboxes: ampLightBoxes };
};

export const ConstructAMPImage = (
    media: Media,
    sanitizedCaption: string,
    sanitizedCaptionPlaintext: string
): string => {
    switch (media.type) {
        case 'section_image':
            let imageHTML = `${
                media.category == 'PICTURE'
                    ? `<amp-img width=150 height=150 layout="responsive" src="${media.url}" data-image="${media.url}" 
                        data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                        <amp-img placeholder width=150 height=150 src="${media.thumb}" layout="fill"></amp-img>
                    </amp-img>`
                    : media.category == 'GIF'
                    ? `<amp-anim width=150 height=150 layout="responsive" src="${media.url}" data-image="${
                          media.url
                      }" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                        <amp-img placeholder width=150 height=150 src="${media.thumb}" layout="fill"></amp-img>
                    </amp-anim>`
                    : media.category == 'YOUTUBE'
                    ? `<amp-youtube
                        data-videoid="${getYouTubeID(media.url)}"
                        layout="responsive"
                        width=150
                        height=150>
                    </amp-youtube>`
                    : media.category == 'NORMAL_VIDEO'
                    ? `<amp-video
                        width=150
                        height=150
                        layout="responsive"
                        preload="metadata"
                        poster='https://epcdn-vz.azureedge.net/static/images/placeholder-video.png'>
                            <source src="${media.url}#t=0.1" type="${media.mime}">
                            Please click to play the video.
                    </amp-video>`
                    : media.category == 'AUDIO'
                    ? `<amp-img width=150 height=150 layout="responsive" src="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" data-image="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                        <amp-img placeholder width=150 height=150 src="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" layout="fill"></amp-img>
                    </amp-img>`
                    : ``
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
            `;
            break;
        case 'inline_image':
            break;
        default:
            break;
    }
    return ``;
};

export const calculateSeeAlsos = (passedJSON: ArticleJson): SeeAlso[] => {
    let allSentences: Sentence[] = [];
    passedJSON.page_body.forEach((section, index) => {
        section.paragraphs.forEach((paragraph, index) => {
            allSentences.push(...(paragraph.items as Sentence[]));
        });
    });
    let theCaptionSentences: Sentence[] = passedJSON.main_photo[0].caption ? passedJSON.main_photo[0].caption : [];
    allSentences.push(...theCaptionSentences);
    // passedJSON.infoboxes.forEach((infobox, index) => {
    //     infobox.values.forEach(val => {
    //         val.sentences.forEach(sent => {
    //             allSentences.push(sent);
    //         })
    //     })
    // });
    passedJSON.media_gallery.forEach((media, index) => {
        allSentences.push(...(media.caption as Sentence[]));
    });
    passedJSON.citations.forEach((citation, index) => {
        allSentences.push(...(citation.description as Sentence[]));
    });
    let tempSeeAlsos: SeeAlso[] = [];

    allSentences.forEach((sentence, index) => {
        let text = sentence.text;
        let result;
        while ((result = CAPTURE_REGEXES.link_match.exec(text)) !== null) {
            tempSeeAlsos.push({
                lang: result[1],
                slug: result[2],
                title: '',
                photo_url: '',
                thumbnail_url: '',
                snippet: ''
            });
        }
    });

    let seeAlsoTally: SeeAlsoCollection = {};
    let sortedSeeAlsos = [];
    tempSeeAlsos.forEach((value, index) => {
        let key = `${value.lang}__${value.slug}`;
        if (seeAlsoTally[key]) {
            seeAlsoTally[key].count = seeAlsoTally[key].count + 1;
        } else {
            seeAlsoTally[key] = {
                count: 1,
                data: value
            };
        }
    });
    sortedSeeAlsos = Object.keys(seeAlsoTally).sort(function(a, b) {
        return seeAlsoTally[a].count - seeAlsoTally[b].count;
    });
    sortedSeeAlsos = sortedSeeAlsos.slice(0, 3);
    let newSeeAlsos = [];
    sortedSeeAlsos.forEach((key, index) => {
        newSeeAlsos.push(seeAlsoTally[key].data);
    });
    return newSeeAlsos;
};

export const blobBoxPreSanitize = (passedBlobBox: string): string => {
    let sanitizedBlobBox = passedBlobBox;
    // Do some regex replacements first
    AMP_REGEXES_PRE.forEach(function(element) {
        sanitizedBlobBox = sanitizedBlobBox.replace(element, '');
    });
    // Load the HTML into htmlparser2 beforehand since it is more forgiving
    const dom = htmlparser2.parseDOM(sanitizedBlobBox, { decodeEntities: true });

    // Load the HTML into cheerio for parsing
    const $ = cheerio.load(dom as any);

    // Replace tags <font> with <span>
    const replacementTags = [['font', 'span']];
    replacementTags.forEach(function(pair) {
        $(pair[0]).replaceWith($(`<${pair[1]}>${$(this).html()}</${pair[1]}>`));
    });

    // Remove bad tags from the HTML
    AMP_BAD_TAGS.forEach(function(badTag) {
        $(badTag).remove();
    });

    // Remove empty <p> tags to make the text look cleaner
    $('p').each(function() {
        var $this = $(this);
        if ($this.html().replace(/\s|&nbsp;/gimu, '').length == 0) {
            $this.remove();
        }
    });
    // Set the new string
    sanitizedBlobBox = decode($.html(), 'all');

    // Do some regex replacements again
    AMP_REGEXES_POST.forEach(function(element) {
        sanitizedBlobBox = sanitizedBlobBox.replace(element, '');
    });
    return sanitizedBlobBox;
};



export const resolveNestedContentToHTMLString = (inputContent: NestedContentItem[], returnContent: string = '') => {
    inputContent.forEach((contentItem) => {
            // USE THE tag() FUNCTION HERE!!!;
        switch (contentItem.type){
            case 'text':
                const sanitizedText: string = contentItem.content.map((sent) => sent.text).join("");
                // let newNodes = this.renderMarkdown(sanitizedText);
                // returnContent.push(newNodes);
                returnContent += sanitizedText;
                break;
            case 'tag':
                if (contentItem.content.length) {
                    returnContent += tag(contentItem.tag_type, reverseAttributes(contentItem.attrs), resolveNestedContentToHTMLString(contentItem.content, ''))
                }
                else {
                    returnContent += tag(contentItem.tag_type, reverseAttributes(contentItem.attrs))
                }
                break;
        }
    })
    return returnContent;
}

export const renderAMPParagraph = (
    paragraph: Paragraph,
    passedCitations: Citation[],
    passedIPFS: string,
    snippetMode: boolean
): AMPParseCollection => {
    let returnCollection: AMPParseCollection = { text: '', lightboxes: [] };
    const { tag_type, items } = paragraph;
    if (items && items.length > 0) {
    } else return returnCollection;
    if (!snippetMode && (tag_type === 'h2' || tag_type === 'h3' || tag_type === 'h4' || tag_type === 'h5' || tag_type === 'h6')) {
        const text: string = (items[0] as Sentence).text;
        returnCollection.text = `<${tag_type} id=${urlSlug(text).slice(0, 15)}>${text}</${tag_type}>`;
    } else if (tag_type === 'p') {
        let sanitizedText = (items as Sentence[])
            .map((sentenceItem: Sentence, sentenceIndex) => {
                let result = CheckForLinksOrCitationsAMP(sentenceItem.text, passedCitations, passedIPFS, [], true);
                returnCollection.lightboxes.push(...result.lightboxes);
                return result.text;
            })
            .join(' ');
        returnCollection.text = tag(tag_type, reverseAttributes(paragraph.attrs), sanitizedText);
    } else if (!snippetMode && (tag_type === 'ul')) {
        let sanitizedText = (items as ListItem[])
            .map((liItem: ListItem, listIndex) => {
                return liItem.sentences
                    .map((sentenceItem: Sentence, sentenceIndex) => {
                        let result = CheckForLinksOrCitationsAMP(sentenceItem.text, passedCitations, passedIPFS, [], true);
                        returnCollection.lightboxes.push(...result.lightboxes);
                        return tag(liItem.tag_type, {}, result.text);
                    })
                    .join('');
            })
            .join('');
        returnCollection.text = tag(tag_type, reverseAttributes(paragraph.attrs), sanitizedText);
    } else if (!snippetMode && (tag_type === 'table')) {
        let sanitizedText = (items as Table[]).map((tableItem: Table, tableIndex) => {
            // Create the thead if present
            let sanitizedHeadRows = tableItem.thead
                ? tableItem.thead.rows
                      .map((row: TableRow, rowIndex) => {
                          let sanitizedCells = row.cells
                              ? row.cells
                                    .map((cell: TableCell, cellIndex) => {
                                        let sanitizedCellContents = resolveNestedContentToHTMLString(cell.content)
                                        let result = CheckForLinksOrCitationsAMP(sanitizedCellContents, passedCitations, passedIPFS, [], false);
                                        returnCollection.lightboxes.push(...result.lightboxes);
                                        return tag(cell.tag_type, reverseAttributes(cell.attrs), result.text);
                                    })
                                    .join('')
                              : '';
                          return tag('tr', reverseAttributes(row.attrs), sanitizedCells);
                      })
                      .join('')
                : '';
            let sanitizedHead = tableItem.thead ? tag('thead', reverseAttributes(tableItem.thead.attrs), sanitizedHeadRows) : '';

            // Create the tbody
            let sanitizedBodyRows = tableItem.tbody
                ? tableItem.tbody.rows
                      .map((row: TableRow, rowIndex) => {
                          let sanitizedCells = row.cells
                              ? row.cells
                                    .map((cell: TableCell, cellIndex) => {
                                        let sanitizedCellContents = resolveNestedContentToHTMLString(cell.content)
                                        let result = CheckForLinksOrCitationsAMP(sanitizedCellContents, passedCitations, passedIPFS, [], false);
                                        returnCollection.lightboxes.push(...result.lightboxes);
                                        return tag(cell.tag_type, reverseAttributes(cell.attrs), result.text);
                                    })
                                    .join('')
                              : '';
                          return tag('tr', reverseAttributes(row.attrs), sanitizedCells);
                      })
                      .join('')
                : '';
            let sanitizedBody = tableItem.tbody ? tag('tbody', reverseAttributes(tableItem.tbody.attrs), sanitizedBodyRows) : '';

            // Create the tfoot if present
            let sanitizedFootRows = tableItem.tfoot
                ? tableItem.tfoot.rows
                      .map((row: TableRow, rowIndex) => {
                          let sanitizedCells = row.cells
                              ? row.cells
                                    .map((cell: TableCell, cellIndex) => {
                                        let sanitizedCellContents = resolveNestedContentToHTMLString(cell.content)
                                        let result = CheckForLinksOrCitationsAMP(sanitizedCellContents, passedCitations, passedIPFS, [], false);
                                        returnCollection.lightboxes.push(...result.lightboxes);
                                        return tag(cell.tag_type, reverseAttributes(cell.attrs), result.text);
                                    })
                                    .join('')
                              : '';
                          return tag('tr', reverseAttributes(row.attrs), sanitizedCells);
                      })
                      .join('')
                : '';
            let sanitizedFoot = tableItem.tfoot ? tag('tfoot', reverseAttributes(tableItem.tfoot.attrs), sanitizedFootRows) : '';

            // Create the caption if present
            let sanitizedCaptionText = tableItem.caption
                ? tableItem.caption.sentences
                    .map((sentenceItem: Sentence, sentenceIndex) => {
                        let result = CheckForLinksOrCitationsAMP(sentenceItem.text, passedCitations, passedIPFS, [], false);
                        returnCollection.lightboxes.push(...result.lightboxes);
                        return result.text;
                    })
                    .join('')
                : '';
            let sanitizedCaption = tag('caption', reverseAttributes(tableItem.caption.attrs), sanitizedCaptionText);
            return [sanitizedHead, sanitizedBody, sanitizedFoot, sanitizedCaption].join('');
        });
        returnCollection.text = tag('table', reverseAttributes(paragraph.attrs), sanitizedText.join(''));
    }

    // const sentences: Sentence[] = this.renderSentences(items, tag_type, index);
    // return <Paragraph key={index}>{sentences}</Paragraph>;
    return returnCollection;
};

export const renderAMPImage = (image: Media, passedCitations: Citation[], passedIPFS: string): AMPParseCollection => {
    let returnCollection: AMPParseCollection = { text: '', lightboxes: [] };
    let sanitizedCaption = image.caption
        .map((sentenceItem: Sentence, sentenceIndex) => {
            let result = CheckForLinksOrCitationsAMP(sentenceItem.text, passedCitations, passedIPFS, [], true);
            returnCollection.lightboxes.push(...result.lightboxes);
            return result.text;
        })
        .join('');
    let sanitizedCaptionPlaintext = (striptags as any)(sanitizedCaption);
    returnCollection.text = ConstructAMPImage(image, sanitizedCaption, sanitizedCaptionPlaintext);
    return returnCollection;
};


export function sanitizeTextPreview(inputText: string): string {
    if (!inputText) return '';
    let sanitizedText = inputText.replace(/\s+/g, ' ').trim();
    sanitizedText = CheckForLinksOrCitationsAMP(sanitizedText, [], "", [], true).text;
    sanitizedText = sanitizedText.replace(/\s+/g, ' ').trim();

    // remove citation references from preview
    sanitizedText = sanitizedText.replace(/\[(\d+|u)\]/g, '');

    const $ = cheerio.load(sanitizedText);
    sanitizedText = $.root().text();
    sanitizedText = sanitizedText.replace(/\s+/g, ' ').trim();
    return sanitizedText;
}

export function convertMediaToCitation(inputMedia: Media, idToUse: number, mediaTypeOverride?: MediaType): Citation {
    let newCitation: Citation = {
        url: inputMedia.url,
        thumb: inputMedia.thumb,
        description: inputMedia.caption,
        category: inputMedia.category ? inputMedia.category : linkCategorizer(inputMedia.url),
        citation_id: idToUse,
        social_type: socialURLType(inputMedia.url),
        attribution: inputMedia.attribution_url || null,
        timestamp: inputMedia.timestamp || new Date(),
        mime: inputMedia.mime || null,
        media_props: {
            type: mediaTypeOverride ? mediaTypeOverride : inputMedia.type,
            webp_original: inputMedia.media_props && inputMedia.media_props.webp_original 
                ? inputMedia.media_props.webp_original 
                : 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-original.webp',
            webp_medium: inputMedia.media_props && inputMedia.media_props.webp_medium 
                ? inputMedia.media_props.webp_medium 
                : 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-medium.webp',
            webp_thumb: inputMedia.media_props && inputMedia.media_props.webp_thumb 
                ? inputMedia.media_props.webp_thumb 
                : 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-thumb.webp'
        },
        in_blurb: false,
    }

    if (inputMedia.diff) newCitation.diff = inputMedia.diff;
    if (inputMedia.height) newCitation.media_props.height = inputMedia.height;
    if (inputMedia.width) newCitation.media_props.width = inputMedia.width;
    if (inputMedia.srcSet) newCitation.media_props.srcSet = inputMedia.srcSet;

    return newCitation;
}

export function getFirstAvailableCitationIndex(citations: Citation[]): number {
    let highestID = 1;
    citations.forEach((ctn) => {
        if (ctn.citation_id >= highestID) highestID = ctn.citation_id + 1;
    })
    return highestID;
}

export function getFirstAvailableInfoboxValueIndex(ibox_values: InfoboxValue[]): number {
    let highestID = 1;
    ibox_values.forEach((val) => {
        if (val.index >= highestID) highestID = val.index + 1;
    })
    return highestID;
}

export function mergeMediaIntoCitations(inputWiki: ArticleJson): ArticleJson {
    // Eventually the media_gallery will be merged into citations. Dupe them for now
    // Interestingly, if an article does not have a main photo, you could set it as one of the gallery images...
    let modifiedWiki = inputWiki;
    if (modifiedWiki && modifiedWiki.media_gallery && modifiedWiki.media_gallery.length) {
        let startingCitationIndex = getFirstAvailableCitationIndex(modifiedWiki.citations);
        modifiedWiki.media_gallery.forEach((media, index) => {
            let replacedExisting = false;
            modifiedWiki.citations.forEach((existingCtn, ctnArrIdx) => {
                if (compareURLs(existingCtn.url, media.url)){
                    modifiedWiki.citations[ctnArrIdx] = convertMediaToCitation(media, existingCtn.citation_id);
                    replacedExisting = true;
                }
            })
            if (!replacedExisting){
                modifiedWiki.citations.push(convertMediaToCitation(media, startingCitationIndex + index));
            }
        });
        modifiedWiki.media_gallery = [];
    }
    return modifiedWiki;
}

export function infoboxDtoPatcher(inputWiki: ArticleJson): ArticleJson {
    // Convert values: Sentences[] to values: InfoboxValue[]
    let modifiedWiki = inputWiki;
    if (modifiedWiki && modifiedWiki.infoboxes && modifiedWiki.infoboxes.length) {
        modifiedWiki.infoboxes = modifiedWiki.infoboxes.map(ibox => {
            return {...ibox, values: ibox.values.map((val, valIdx) => {
                // Check for Sentence instead of InfoboxValue
                if(val.hasOwnProperty('type')){
                    // Convert to InfoboxValue
                    return {
                        index: valIdx,
                        sentences: [{
                            type: 'sentence',
                            index: 0,
                            text: (val as any).text
                        }]
                    }
                }
                else return val;
            })}
        })
        // Check for the old style values
    }
    return modifiedWiki;
}

export function urlCleaner (inputURL: string): string {
    let cleanedURL = inputURL.trim().replace(" ", "");
    try {
        cleanedURL = normalizeUrl(cleanedURL);
        if (URL_REGEX_TEST.test(cleanedURL)) return cleanedURL;
        else return "";
    }
    catch (e){
        console.log(e);
        return "";
    }

}

export function sentenceSplitFixer(inputWiki: ArticleJson): ArticleJson {
    // Convert values: Sentences[] to values: InfoboxValue[]
    let modifiedWiki = inputWiki;
    if (modifiedWiki && modifiedWiki.page_body && modifiedWiki.page_body.length) {
        // Handle the body
        modifiedWiki.page_body = modifiedWiki.page_body.map(section => {
            let cleanedParagraphs: Paragraph[] = section.paragraphs;
            cleanedParagraphs = cleanedParagraphs.map(para => {
                switch (para.tag_type){
                    case 'p': {
                        if(para.items && para.items.length && para.items[0].hasOwnProperty('text')){
                            let newPara = para;
                            // Don't split inside a LINK, CITE, or INLINE IMAGE
                            for (let i = 0; i < newPara.items.length; i++) {
                                // const lastWord = returnTokens[i].split(' ').pop();
                                if ((newPara.items[i] as Sentence).text.match(/\[\[(LINK|CITE|INLINE_IMAGE)\|(.*?)\|(.*?)\|(.*?)[!?.\s]\s?$/gm) && i + 1 < newPara.items.length) {
                                    (newPara.items[i] as Sentence).text = `${(newPara.items[i] as Sentence).text}${(newPara.items[i + 1] as Sentence).text}`;
                                    newPara.items.splice(i + 1, 1);
                                    i--; // re-check this sentence in case there's multiple bad splits
                                }
                            }
                            return newPara;
                        }
                        else return para;
                    }
                    default:
                        return para;
                }
            })

            return {
                paragraphs: cleanedParagraphs,
                images: section.images
            }
        })
        // Check for the old style values
    }
    return modifiedWiki;
}

export function addAMPInfo (inputArticle: ArticleJson): ArticleJson {
    // AMP info
    const amp_info = {
        load_youtube_js: false,
        load_audio_js: false,
        load_video_js: false,
        lightboxes: []
    };
    inputArticle.citations.filter(ctn => ctn.media_props).forEach((value, index) => {
        switch (value.category) {
            case 'YOUTUBE': {
                amp_info.load_youtube_js = true;
                break;
            }
            case 'NORMAL_VIDEO': {
                amp_info.load_video_js = true;
                break;
            }
            case 'AUDIO': {
                amp_info.load_audio_js = true;
                break;
            }
            default:
                break;
        }
    });

    return {
        ...inputArticle,
        amp_info: amp_info
    }
}

export async function flushPrerenders (inputLang: string, inputSlug: string, prerenderToken: string ): Promise<void> {
    // Flush the prerender cache for this page
    try {
        console.log(colors.yellow(`Flushing prerender for lang_${inputLang}/${inputSlug}`));
        let payload = {
            "prerenderToken": prerenderToken,
            "url": `https://everipedia.org/wiki/lang_${inputLang}/${inputSlug}/amp`
        }

        // Send the recache request for AMP
        await axios.default.post('https://api.prerender.io/recache', payload)
        .then(response => {
            console.log(colors.green(`lang_${inputLang}/${inputSlug}/amp prerender successfully flushed`));
            return response;
        })

        // Construct the payload for desktop
        let payload2 = {
            "prerenderToken": prerenderToken,
            "url": `https://everipedia.org/wiki/lang_${inputLang}/${inputSlug}`
        }

        // Send the recache request for desktop
        await axios.default.post('https://api.prerender.io/recache', payload2)
        .then(response => {
            console.log(colors.green(`lang_${inputLang}/${inputSlug} prerender successfully flushed`));
            return response;
        })
        .catch(err => {
            throw err;
        })

    } catch (e) {
        console.log(colors.red(`Failed to flush prerender for lang_${inputLang}/${inputSlug} :`), colors.red(e));
    }
    return null;
}

export interface PhotoToUsePack {
	is_webp_compatible: boolean;
	full: string,
	medium: string,
	thumb: string
}

export const sizes = {
	desktop: 992,
	tablet: 768,
	phone: 576
};

// Edge and the latest Firefox do support WebP, but only as of ~ late 2018
const WEBP_UNSUPPORTED_BROWSERS: Partial<BrowserInfo['name']>[] = ['edge', 'safari', 'ie', 'bb10', 'ios', 'ios-webview', 'firefox'];

export const IsWebPCompatibleBrowser = (browser: BrowserInfo['name']): boolean => {
	return !WEBP_UNSUPPORTED_BROWSERS.includes(browser);
}

export const PhotoToUse = (inputPhoto: Media, browser: BrowserInfo['name']): PhotoToUsePack => {
	// Initialize the return pack
	let photoReturnPack: PhotoToUsePack = {
		is_webp_compatible: true,
		full: null,
		medium: null,
		thumb: null
	};

	// Get the normal photos
	let theFull = inputPhoto && inputPhoto.url;
	let theThumb = inputPhoto && inputPhoto.thumb;
	theFull = theFull ? theFull 
					  : theThumb ? theThumb : null;

	// Handle browsers that do not support WebP
	if (WEBP_UNSUPPORTED_BROWSERS.includes(browser)){
		photoReturnPack = {
			is_webp_compatible: false,
			full: theFull,
			medium: theFull,
			thumb: theThumb
		};
	}
	else {
		if (
			inputPhoto &&
			inputPhoto.media_props &&
			inputPhoto.media_props.webp_medium &&
			inputPhoto.media_props.webp_medium.indexOf('no-image-') == -1
		) {
			photoReturnPack = {
				is_webp_compatible: true,
				full: inputPhoto.media_props.webp_original,
				medium: inputPhoto.media_props.webp_medium,
				thumb: inputPhoto.media_props.webp_thumb
			};
	
        } 
        else {
			photoReturnPack = {
				is_webp_compatible: true,
				full: theFull,
				medium: theFull,
				thumb: theThumb
			};
		}
	}
	return photoReturnPack;
}

export const sha256ToChecksum256EndianSwapper = (input_sha256: string) => {
    // https://eosio.stackexchange.com/questions/4116/how-to-use-checksum256-secondary-index-to-get-table-rows/4344
    let hashToUse = input_sha256; //'7af12386a82b6337d6b1e4c6a1119e29bb03e6209aa03c70ed3efbb9b74a290c';
    let slice1 = hashToUse.slice(0, 32);
    let slice2 = hashToUse.slice(32);
    let bytes1 = conv(slice1, { in:'hex', out: 'bytes' });
    let bytes2 = conv(slice2, { in:'hex', out: 'bytes' });
    // console.log("----------sha256ToChecksum256EndianSwapper--------------");
    // console.log("---PART 1---");
    // console.log(slice1);
    // console.log(bytes1);
    // console.log("---PART 2---");
    // console.log(slice2);
    // console.log(bytes2);
    // console.log("--------------------------------------------------------");
    endianness(bytes1, 16);
    endianness(bytes2, 16);
    let comboString = conv(bytes1, { in:'bytes', out: 'hex' }) + conv(bytes2, { in:'bytes', out: 'hex' });
    // console.log(comboString);
    return comboString;
}