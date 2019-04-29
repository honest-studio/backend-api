import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import * as htmlparser2 from 'htmlparser2';
import {convert as ReactAttrConvert} from 'react-attr-converter';
import * as  util from 'util';
import * as JSONCycleCustom from './json-cycle-custom';
import {
    WikiLink,
    Sentence,
    Section,
    ArticleJson,
    Media,
    Citation,
    Metadata,
    Infobox,
    Table,
    Paragraph,
    TableCellTextItem,
    TableCellTagItem,
    TableCellContentItem,
    TableCell
} from './article-dto';
import { AMPParseCollection } from './article-types';
import * as mimePackage from 'mime';
const blockElements = require('block-elements');
const voidElements = require('html-void-elements');

const decode = require('unescape');
const normalizeUrl = require('normalize-url');

// constants
const ROOT_DIR = path.join(__dirname, '../..');
export const CAPTURE_REGEXES = {
    link: /(?<=\[\[)LINK\|[^\]]*(?=\]\])/g,
    link_match: /\[\[LINK\|lang_(.*?)\|(.*?)\|(.*?)\]\]/g,
    cite: /(?<=\[\[)CITE\|[^\]]*(?=\]\])/g,
    inline_image: /(?<=\[\[)INLINE_IMAGE\|[^\]]*(?=\]\])/g,
    inline_image_match: /\[\[INLINE_IMAGE\|(.*?)\|(.*?)\|(.*?)\|h(.*?)\|w(.*?)\]\]/g
};
export const REPLACEMENTS = [
    { regex: /\u{00A0}/g, replacement: ' ' },
    { regex: /\u{200B}/g, replacement: '' },
    { regex: /\n <\/a>\n/g, replacement: '</a>' },
    { regex: /<\/a> (,|.|:|;|'|\))/g, replacement: '</a>$1' },
    { regex: / {1,}/g, replacement: ' ' },
    { regex: /\n\s/g, replacement: ' ' },
    { regex: / , /g, replacement: ', ' },
    { regex: / ; /g, replacement: '; ' },
    { regex: / \./g, replacement: '.' },
    {
        regex: /https:\/\/s3.amazonaws.com\/everipedia-storage/g,
        replacement: 'https://everipedia-storage.s3.amazonaws.com'
    }
];
export const VALID_VIDEO_EXTENSIONS = [
    '.mp4',
    '.m4v',
    '.flv',
    '.f4v',
    '.ogv',
    '.ogx',
    '.wmv',
    '.webm',
    '.3gp',
    '.3g2',
    '.mpg',
    '.mpeg',
    '.mov',
    '.avi'
];
export const VALID_AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a'];
export const SPLIT_SENTENCE_EXCEPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.'];

// Convert False/True into false/true and None into null
function pyToJS(inputItem: any) {
    switch (inputItem) {
        case 'True':
            return true;
        case 'False':
            return false;
        case '':
        case 'None':
            return null;
        default:
            return inputItem;
    }
}

/**
 * @function parseStyles
 * Parses a string of inline styles into a javascript object with casing for react
 *
 * @param {string} styles
 * @returns {Object}
 */
const parseStyles = (styles: string): {} => {
    return styles
    .split(';')
    .filter(style => style.split(':')[0] && style.split(':')[1])
    .map(style => [
        style.split(':')[0].trim().replace(/-./g, c => c.substr(1).toUpperCase()),
        style.split(':').slice(1).join(':').trim()
    ])
    .reduce((styleObj, style) => ({
        ...styleObj,
        [style[0]]: style[1],
    }), {});
}

const cleanAttributes = (inputAttrs: { [attr: string]: any }): { [attr: string]: any } => {
    let cleanedAttrs = {};
    const keys = Object.keys(inputAttrs);
    for (const key of keys) {
        cleanedAttrs[ReactAttrConvert(key)] = inputAttrs[key];
    }
    if (cleanedAttrs['style']){
        cleanedAttrs['style'] = parseStyles(cleanedAttrs['style']);
    } 
    return cleanedAttrs;
}

// Convert the old-style HTML into a JSON
export function oldHTMLtoJSON(oldHTML: string): ArticleJson {
    console.time("replacements");
    // Replace some problematic unicode characters and other stuff
    REPLACEMENTS.forEach(function(pair) {
        oldHTML = oldHTML.replace(pair.regex, pair.replacement);
    });
    console.timeEnd("replacements");

    // Quick trim
    oldHTML = oldHTML.trim();

    // Load the HTML into htmlparser2 beforehand since it is more forgiving
    // Then load the HTML into cheerio for parsing
    console.time("load dom");
    let dom = htmlparser2.parseDOM(oldHTML, { decodeEntities: true });
    let $ = cheerio.load(dom);
    console.timeEnd("load dom");

    // Need to extract citations before sanitizing so the citation ID can be marked
    console.time("citations");
    const citations = extractCitations($);
    console.timeEnd("citations");

    // Remove useless and empty tags and HTML
    // Convert text formatting to pseudo-markdown
    // Converts link HTML to clean parseable formats
    console.time("sanitize");
    $ = sanitizeText($);
    console.timeEnd("sanitize");

    // Converts citation HTML to clean parseable formats
    console.time("sanitize citations");
    $ = sanitizeCitations($, citations);
    console.timeEnd("sanitize citations");

    let quickHTML = $.html();
    // Replace some problematic unicode characters and other stuff
    REPLACEMENTS.forEach(function(pair) {
        quickHTML = quickHTML.replace(pair.regex, pair.replacement);
    });

    // console.log(quickHTML);

    dom = htmlparser2.parseDOM(quickHTML, { decodeEntities: true });
    $ = cheerio.load(dom);

    console.time("metadata");
    const metadata = extractMetadata($);
    console.timeEnd("metadata");

    const page_title_text =
        $('h1.page-title')
            .text()
            .trim() || '';
    const page_title = [{
        index: 0,
        type: 'sentence',
        text: page_title_text
    }];
    console.time("media gallery");
    const media_gallery = extractMediaGallery($);
    console.timeEnd("media gallery");
    console.time("main photo");
    const main_photo = extractMainPhoto($);
    console.timeEnd("main photo");
    console.time("infobox html");
    let infobox_html = extractInfoboxHtml($);
    console.timeEnd("infobox html");
    console.time("infoboxes");
    const infoboxes = extractInfoboxes($);
    console.timeEnd("infoboxes");


    // amp info
    console.time("amp info");
    const amp_info = {
        load_youtube_js: false,
        load_audio_js: false,
        load_video_js: false,
        lightboxes: []
    };
    media_gallery.forEach((value, index) => {
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
    console.timeEnd("amp info");

    console.time("page body");
    const page_body = extractPageBody($);
    console.timeEnd("page body");

    return { infobox_html, page_title, page_body, main_photo, citations, media_gallery, infoboxes, metadata, amp_info };
}


// Turn the HTML blurb into a JSON dict
export function extractPageBody($: CheerioStatic): Section[] {
    // Get the body
    // First 2 are wikipedia divs
    // Default is everipedia body
    let $body;
    if ($('.mw-parser-output').length > 0) $body = $('.mw-parser-output').eq(0);
    // Sometimes copy-pasting creates a duplicate of the mw-content-ltr class (see lang_en/star_wars)
    // for now prepending the div selector prevents these duplicates from being selected
    // additional guards may be necessary in the future
    else if ($('div.mw-content-ltr').length > 0) $body = $('.mw-content-ltr').eq(0);
    else $body = $('.blurb-wrap').eq(0);

    // Split body into sections
    let sections: Section[] = splitIntoSections($body).map(parseSection);
    return sections;
}

function extractMetadata($: CheerioStatic): Metadata[] {
    const metadata = [];
    const ignore_fields = ['pageviews'];

    // Loop through the elements and fill the dictionary
    $('tr.data-pair').each(function() {
        let pairKey = $(this).attr('data-key');
        if (!ignore_fields.includes(pairKey)) {
            let pairValue = pyToJS(
                $(this)
                    .find('td')
                    .eq(1)
                    .text()
                    .trim()
            );
            metadata.push({ key: pairKey, value: pairValue });
        }
    });

    return metadata;
}

function extractCitations($: CheerioStatic): Citation[] {
    const citations = [];
    const $rows = $("li.link-row");
    const $descriptionTexts = $rows.find("td.link-description");
    const $timestamps = $rows.find("td.link-timestamp");
    const $mimes = $rows.find("td.link-mime");
    const $attributions = $rows.find("td.link-attr");
    const $thumbs = $rows.find("td.link-thumb");
    const $hrefs = $rows.find("a.link-url");
    const $href_wraps = $rows.find("td.link-url-wrap");

    for (let i=0; i < $rows.length; i++) {
        const citation: any = {
            citation_id: i,
            description: parseSentences($descriptionTexts.eq(i).text().trim()),
            timestamp: $timestamps.eq(i).text().trim(),
            mime: $mimes.eq(i).text().trim(),
            attribution: $attributions.eq(i).text().trim(),
            thumb: $thumbs.eq(i).attr('src')
        };

        let href = $hrefs.eq(i).attr('href');
        if (!href)
            href = $href_wraps.eq(i).text().trim();
        if (href) {
            citation.url = normalizeUrl(href);
            citation.social_type = socialURLType(citation.url);
        }

        // Find the url category
        citation.category = linkCategorizer(citation.url);
        
        citations.push(citation);
    }

    return citations;
}

function extractMediaGallery($: CheerioStatic) {
    const gallery = [];

    $('li.media-row').each(function() {
        let media: any = {};

        // Fetch the caption
        let captionText = decode(
            $(this)
                .find('.media-caption')
                .eq(0)
                .html()
                .trim(),
            'all'
        );

        // Find any links to other pages that appear in the caption]
        media.caption = parseSentences(captionText);

        // Fetch the classification (IMAGE, YOUTUBE, VIDEO, etc)
        media.category = media.type = $(this)
            .find('.media-class')
            .eq(0)
            .text()
            .trim();

        // Fetch the MIME type
        media.mime = pyToJS(
            $(this)
                .find('.media-mime')
                .eq(0)
                .text()
                .trim()
        );

        // Fetch the timestamp
        media.timestamp = pyToJS(
            $(this)
                .find('.media-timestamp')
                .eq(0)
                .text()
                .trim()
        );

        // Fetch the attribution
        media.attribution_url =
            pyToJS(
                $(this)
                    .find('.media-ogsource')
                    .eq(0)
                    .text()
                    .trim()
            ) || null;

        // Fetch the main and thumbnail URLs depending on the category of the media
        let mediaElement = $(this)
            .find('.media-obj')
            .eq(0);
        switch (media.category) {
            case 'PICTURE':
            case 'GIF': {
                media.url = mediaElement.attr('src');
                media.thumb = mediaElement.attr('data-thumb');
                break;
            }
            case 'YOUTUBE': {
                // TODO: need to deal with this
                //amp_info.load_youtube_js = true;
                media.url = mediaElement.attr('data-videourl');
                media.thumb = mediaElement.attr('src');
                break;
            }
            case 'NORMAL_VIDEO': {
                // TODO: this needs to be dealt with
                //amp_info.load_video_js = true;
                media.url = mediaElement
                    .find('source')
                    .eq(0)
                    .attr('src');
                media.thumb = mediaElement
                    .find('source')
                    .eq(0)
                    .attr('data-thumb');
                break;
            }
            case 'AUDIO': {
                // TODO: This needs to be dealt with
                //amp_info.load_audio_js = true;
                media.url = mediaElement
                    .find('source')
                    .eq(0)
                    .attr('src');
                media.thumb = mediaElement
                    .find('source')
                    .eq(0)
                    .attr('data-thumb');
                break;
            }
            default:
                break;
        }
        gallery.push(media);
    });

    return gallery;
}

function extractMainPhoto($: CheerioStatic): Media[] {
    const main_photo: Media = {
        type: 'main_image',
        url: null,
        thumb: null,
        caption: null,
        attribution_url: null
    };

    let photoElement = $('.main-photo-wrap img.main-photo');

    // Get the URLs for the photo and its thumbnail. If absent, give placeholders
    main_photo.url = photoElement.attr('src') || 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png';
    main_photo.thumb =
        photoElement.attr('data-thumbnail') || 'https://epcdn-vz.azureedge.net/static/images/no-image-slide.png';
    main_photo.category = linkCategorizer(main_photo.url);

    // Find any links to other pages that appear in the caption
    const caption = $('figcaption.main-photo-caption');
    if (caption.length == 0) main_photo.caption = null;
    else {
        const captionText = decode(caption.html().trim(), 'all');
        main_photo.caption = parseSentences(captionText);
    }

    // Try to find the photo attribution
    main_photo.attribution_url =
        pyToJS(
            $('.main-photo-og-url')
                .text()
                .trim()
        ) || null;

    return [main_photo];
}

function extractInfoboxHtml($: CheerioStatic): Table {
    const blobbox = $('div.blobbox-wrap');

    // no infobox found
    if (blobbox.length == 0) return null;

    const html = decode(
        $('div.blobbox-wrap')
            .html()
            .trim(),
        'all'
    );
    
    let parsedBlobBox = parseTable($(blobbox), 'wikitable');
    // parsedBlobBox.tbody.rows.forEach((row) => {
    //     console.log(row);
    // });
    return parsedBlobBox;
}

function extractInfoboxes($: CheerioStatic): Infobox[] {
    let infoboxes = [];

    // Loop through the plural non-Wikipedia elements first and fill the dictionary
    $('table.ibox-item-plural').each(function() {
        // Initialize a blank object dictionary
        let infoPackage = {
            key: null,
            schema: null,
            addlSchematype: null,
            addlSchemaItemprop: null,
            values: []
        };

        // Get the key (plaintext schemaType)
        infoPackage.key = $(this)
            .find('.ibox-plural-key-inner')
            .eq(0)
            .text()
            .trim();

        // Get the schema.org key
        infoPackage.schema = pyToJS(
            $(this)
                .find('.ibox-schema')
                .eq(0)
                .text()
                .trim()
        );

        // Get the sub-schema type
        infoPackage.addlSchematype = pyToJS(
            $(this)
                .find('.ibox-additionalschematype')
                .eq(0)
                .text()
                .trim()
        );

        // Get the sub-schema key
        infoPackage.addlSchemaItemprop = pyToJS(
            $(this)
                .find('.ibox-addl_schema_itemprop')
                .eq(0)
                .text()
                .trim()
        );

        // Loop through the value rows
        $(this)
            .find('td.ibox-plural-value, .ibox-nonplural-value')
            .each(function(i) {
                // Try to find the value
                // Only the text is being grabbed now.
                // If there is any useful HTML in here more complex logic is required
                const rowText = decode(
                    $(this)
                        .text()
                        .trim(),
                    'all'
                );

                // Add the value to the rows
                infoPackage.values.push({
                    type: 'sentence',
                    index: i,
                    text: rowText
                });
            });

        // Add to the infobox list
        infoboxes.push(infoPackage);
    });

    // Loop through the nonplural elements and fill the dictionary
    $('table.ibox-item-nonplural').each(function() {
        // Initialize a blank object dictionary
        let infoPackage = {
            key: null,
            schema: null,
            addlSchematype: null,
            addlSchemaItemprop: null,
            values: []
        };

        // Get the key (plaintext schemaType)
        infoPackage.key = $(this)
            .find('.ibox-nonplural-key')
            .eq(0)
            .text()
            .trim();

        // Get the schema.org key
        infoPackage.schema = pyToJS(
            $(this)
                .find('.ibox-schema')
                .eq(0)
                .text()
                .trim()
        );

        // Get the sub-schema type
        infoPackage.addlSchematype = pyToJS(
            $(this)
                .find('.ibox-additionalschematype')
                .eq(0)
                .text()
                .trim()
        );

        // Get the sub-schema key
        infoPackage.addlSchemaItemprop = pyToJS(
            $(this)
                .find('.ibox-addl_schema_itemprop')
                .eq(0)
                .text()
                .trim()
        );

        // Loop through the value rows (should only be one)
        $(this)
            .find('.ibox-nonplural-value')
            .each(function(i) {
                // Try to find the value
                let tempValue;
                tempValue = decode(
                    $(this)
                        .html()
                        .trim(),
                    'all'
                );

                // Add the value to the rows
                infoPackage.values.push({
                    type: 'sentence',
                    index: i,
                    text: tempValue
                });
            });

        // Add to the infobox list
        infoboxes.push(infoPackage);
    });

    return infoboxes;
}

function splitIntoSections($body: Cheerio): Cheerio[] {
    const bodyHtml = $body.html();
    if (!bodyHtml) return [];
    return bodyHtml
        .split(/(?=<h[1-6])/g)
        .map((htmlSection) => htmlSection.trim())
        .map((htmlSection) => `<div class="section">${htmlSection}</div>`)
        .map((htmlSection) => cheerio.load(htmlSection))
        .map(($) => $('.section'));
}

function parseSection($section: Cheerio): Section {
    const section = { paragraphs: [], images: [] };

    // Get all images
    const $section_images = $section.find('.blurb-inline-image-container');

    $section_images.each((i, section_image_node) => {
        const $image = $section_images.eq(i);

        // Get the image node
        let theImgNode = $image.find('img.caption-img, img.tooltippableImage').eq(0);

        // Initialize the objects
        const image: Media = {
            type: 'section_image',
            url: theImgNode.attr('src'),
            mime: theImgNode.attr('data-mimetype'),
            thumb: null,
            caption: null,
            category: linkCategorizer(theImgNode.attr('src')) || null
        };

        // Deal with images in tables
        if (!image.url) {
            const inline_image_token = $image.html().match(CAPTURE_REGEXES.inline_image);
            if (inline_image_token) {
                const parts = inline_image_token[0].split('|');
                image.url = normalizeUrl(parts[1]);
                image.srcset = parts[2];
                image.alt = parts[3];
                image.height = Number(parts[4].substring(1));
                image.width = Number(parts[5].substring(1));
                image.type = 'inline_image';
                image.category = linkCategorizer(image.url);
            }
        }

        // Set the caption
        image.caption = parseSentences(
            $image
                .find('.blurbimage-caption')
                .text()
                .trim()
        );

        // Decode the URL
        if (image.url) image.url = normalizeUrl(decodeURIComponent(image.url));

        // Attribution URLs
        if (image.url && image.url.includes('wikipedia')) {
            //image.attribution_url = `https://${metadata.page_lang}.wikipedia.org/wiki/File:${image.url.split('/').pop()}`;
            image.attribution_url = `https://en.wikipedia.org/wiki/File:${image.url.split('/').pop()}`;
        }

        section.images.push(image);

        return true;
    });

    // Get paragraphs in section
    const $children = $section.children();
    for (let i = 0; i < $children.length; i++) {
        const $element = $children.eq(i);
        const element = $children[i];

        const paragraph: any = {
            index: i,
            tag_type: element.tagName.toLowerCase() || null,
            attrs: element.attribs,
            items: []
        };

        // Process the tag types accordingly
        if (paragraph.tag_type == 'p' || paragraph.tag_type == 'blockquote')
            paragraph.items = parseSentences($element.text());
        // Headings
        else if (paragraph.tag_type.match(/h[1-6]/g)) paragraph.items = parseSentences($element.text());
        // Lists
        else if (paragraph.tag_type.match(/(ul|ol)/g)) {
            // Loop through the li's
            const $list_items = $element.children('li');
            for (let j = 0; j < $list_items.length; j++) {
                const $list_item = $list_items.eq(j);
                paragraph.items.push({
                    type: 'list_item',
                    index: j,
                    sentences: parseSentences($list_item.text()),
                    tag_type: 'li'
                });
            }
        }

        // Tables
        else if (paragraph.tag_type == 'table') {
            // ignore images
            const classes = paragraph.attrs.class;
            if (classes && classes.includes('blurb-inline-image-container')) continue;

            const table = parseTable($element, 'body-table');
            paragraph.items.push(table);
        }

        // Add the object to the array
        section.paragraphs.push(paragraph);
    }

    return section;
}

function sanitizeCitations ($, citations) {
    // Substitute all the citations into something that is safe for the parser
    $('a.tooltippableCarat').each(function() {
        let url = decodeURIComponent($(this).attr('data-username'));
        if (url.trim() == "Cite as verified editor")
            url = "Self-citation:DEPRECATED"
        else {
            url = normalizeUrl(url);
        }
        const link_id = citations.findIndex((cite) => cite.url == url);
        const plaintextString = `[[CITE|${link_id}|${url}]]`;
        $(this).replaceWith(plaintextString);
    });
    
    return $;
}
// Sanitize a cheerio object and convert some of its HTML to Markdown
function sanitizeText($: CheerioStatic) {
    // Remove style sections
    $('style').remove();

    // Remove bad tags
    const badTagSelectors = ['.thumbcaption .magnify', '.blurbimage-caption .magnify', '.blurb-wrap .thumbinner'];
    badTagSelectors.forEach((selector) => $(selector).remove());

    // Unwrap certain tags
    const unwrapTags = ['small'];
    unwrapTags.forEach((selector) => {
        $(selector).each(function(index, element) {
            $(this).replaceWith($(element).contents());
        });
    })

    // Substitute all the links into something that is safe for the parser
    $('a.tooltippable').each(function(i, el) {
        let old_slug = decodeURIComponent($(el).attr('data-username'));
        if (old_slug.charAt(0) == '/') old_slug = old_slug.substring(1);
        const display_text = $(this)
            .text()
            .trim();

        let lang_code, slug;
        if (old_slug.includes('lang_')) {
            lang_code = old_slug.split('/')[0].substring(5); // ignore the lang_ at the start
            slug = old_slug.split('/')[1];
        } else {
            lang_code = 'en';
            slug = old_slug;
        }
        
        // Replace the tag with the string
        const plaintextString = `[[LINK|lang_${lang_code}|${slug}|${display_text}]]`;
        $(this).replaceWith(plaintextString);
    });

    // Convert <strong> and <b> tags to **text** (Markdown)
    $('strong, b').each(function() {
        // Get the string
        let theString = '';
        theString =
            $(this)
                .text()
                .trim() || '';

        // Create the string
        let plaintextString = `**${theString}**`;

        // Replace the tag with the string
        $(this).replaceWith(plaintextString);
    });

    // Convert <em> and <i> tags to *text* (Markdown)
    $('em, i').each(function() {
        // Get the string
        let theString = '';
        theString =
            $(this)
                .text()
                .trim() || '';

        // Create the string
        let plaintextString = `*${theString}*`;

        // Replace the tag with the string
        $(this).replaceWith(plaintextString);
    });

    //// Add whitespace after links, bold, and italics when there's no space and it's followed by a letter
    //// THE * WORD* SPACING PROBLEM IS HERE
    //// const spaced_links = $.html().replace(/\[\[LINK\|[^\]]*\]\](?=[a-zA-Z])/g, (token) => `${token} `);
    //// const spaced_bold = spaced_links.replace(/\*\*[^\*]+\*\*(?=[a-zA-Z])/g, (token) => `${token} `);
    //// const spaced_italics = spaced_bold.replace(/\*[^\*]+\*(?=[a-zA-Z])/g, (token) => `${token} `);
    //// $ = cheerio.load(spaced_italics);

    // Convert images inside wikitables and ul's to markup
    $('.wikitable img, .blurb-wrap ul img, .infobox img').each(function(i, el) {
        // Construct a dictionary
        const src = normalizeUrl($(this).attr('src'));
        const srcset = $(this).attr('srcset') || '';
        const height = $(this).attr('height');
        const width = $(this).attr('width');
        const alt = $(this).attr('alt') || '';


        // Replace the tag with the string
        const plaintextString = `[[INLINE_IMAGE|${src}|${srcset}|${alt}|h${height}|w${width}]]`;
        $(this).replaceWith(plaintextString);
    });

    // Replace thumbcaption divs with their text
    $('.thumbcaption').each(function(index, element) {
        $(this).replaceWith($(this).html());
    });

    // Get the body
    let theBody = $('.blurb-wrap');

    // Check for wikipedia divs
    if ($('.mw-parser-output').length > 0) {
        theBody = $($('.mw-parser-output')[0]);
    } else if ($('.mw-content-ltr').length > 0) {
        theBody = $($('.mw-content-ltr')[0]);
    }

    // Fix certain elements
    theBody
        .children('div.thumb')
        .each(function(index, element) {
            // Find the inline photo, if present
            let innerInlinePhoto = $(element)
                .find('.blurb-inline-image-container')
                .eq(0);

            // Replace the div.thumb with the inline image
            $(element).replaceWith(innerInlinePhoto);
        });

    // Fix <center> elements
    theBody
        .children('center')
        .each(function(index, element) {
            // Replace the center with all of its contents
            $(this).replaceWith($(element).contents());
        });
    
    // Fix <div> elements
    theBody
        .children('div')
        .each(function(index, element) {
            // Convert the div to a <p>
            $(element).replaceWith('<p>' + $(element).html() + '</p>');
        });

    // console.log($('table').html())

    return $;
}

// Convert the plaintext strings for links and citations to the Markdown format
export function parseSentences(inputString: string): Sentence[] {
    if (!inputString) return [];

    // Create the sentence tokens
    const sentenceTokens = splitSentences(inputString);

    return sentenceTokens.map(function(token, index) {
        // Initialize the return object
        let sentence = { type: 'sentence', index: index, text: token };

        // Quick regex clean
        sentence.text = sentence.text.replace(/ {1,}/g, ' ');

        // Make sure that all sentences start with a space, unless the index is 0
        if (index > 0){
            if (sentence.text.charAt(0) != " "){
                sentence.text = " " + sentence.text;
            }
        }

        // Return the object
        return sentence;
    });
}

// See if a given URL is a social media URL. If so, return the type
export function socialURLType(inputURL: string) {
    const SOCIAL_MEDIA_REGEXES = [
        {
            type: 'bandcamp',
            regex: /bandcamp.com/,
            exclusions: [/bandcamp.com\/track\/.*/, /bandcamp.com\/album\/.*/, /blog.bandcamp.com\/.*/]
        },
        {
            type: 'facebook',
            regex: /facebook.com/,
            exclusions: [
                /facebook.com\/photo.*/,
                /facebook.com\/.*?\/videos\/vb.*/,
                /facebook.com\/.*?\/photos/,
                /facebook.com\/.*?\/timeline\//,
                /facebook.com\/.*?\/posts/,
                /facebook.com\/events\/.*?/,
                /blog.facebook.com\/.*/,
                /developers.facebook.com\/.*/
            ]
        },
        { type: 'google', regex: /plus.google.com/, exclusions: [] },
        {
            type: 'instagram',
            regex: /instagram.com/,
            exclusions: [/instagram.com\/p\/.*/, /blog.instagram.com\/.*/]
        },
        { type: 'lastfm', regex: /last.fm\/user/, exclusions: [/last.fm\/music\/.*\/.*/] },
        {
            type: 'linkedin',
            regex: /linkedin.com/,
            exclusions: [/linkedin.com\/pub\/.*/, /press.linkedin.com\/.*/, /blog.linkedin.com\/.*/]
        },
        { type: 'medium', regex: /medium.com\/@/, exclusions: [/medium.com\/@.*\/.*/] },
        {
            type: 'myspace',
            regex: /myspace.com/,
            exclusions: [/myspace.com\/.*\/.*/, /blogs.myspace.com\/.*/]
        },
        {
            type: 'pinterest',
            regex: /pinterest.com/,
            exclusions: [/pinterest.com\/pin\/.*/, /blog.pinterest.com\/.*/]
        },
        { type: 'quora', regex: /quora.com\/profile/, exclusions: [] },
        { type: 'reddit', regex: /reddit.com\/user/, exclusions: [] },
        { type: 'snapchat', regex: /snapchat.com\/add/, exclusions: [] },
        { type: 'songkick', regex: /songkick.com\/artists/, exclusions: [] },
        {
            type: 'soundcloud',
            regex: /soundcloud.com/,
            exclusions: [
                /soundcloud.com\/.*\/tracks\/.*/,
                /soundcloud.com\/.*\/sets\/.*/,
                /soundcloud.com\/.*\/reposts\/.*/
            ]
        },
        { type: 'tumblr', regex: /tumblr.com/, exclusions: [/tumblr.com\/post.*/] },
        {
            type: 'twitter',
            regex: /twitter.com/,
            exclusions: [
                /twitter.com\/.*?\/status.*?/,
                /dev.twitter.com\/.*/,
                /blog.twitter.com\/.*/,
                /help.twitter.com\/.*/,
                /support.twitter.com\/.*/
            ]
        },
        { type: 'vine', regex: /vine.co/, exclusions: [] },
        { type: 'vk', regex: /vk.com/, exclusions: [] },
        { type: 'yelp', regex: /yelp.com\/biz/, exclusions: [] },
        {
            type: 'youtube',
            regex: /youtube.com/,
            exclusions: [
                /youtube.com\/playlist.*[?]list=.*/,
                /youtube.com\/v\/.*/,
                /youtube.com\/channel\/.*?#p.*?/,
                /youtube.com\/embed\/.*/,
                /youtube.com\/watch?v=.*/,
                /youtube.com\/watch.*[?]v=.*/,
                /youtube.com\/watch.*[?]v=.*/,
                /youtube.com\/watch?.*?/,
                /youtube.com\/user\/.*?#p.*?/,
                /youtube.com\/subscription_center.*/
            ]
        }
    ];

    // Check for a match and make sure it doesn't match an exclusion
    const match = SOCIAL_MEDIA_REGEXES.find(
        (r) => r.regex.test(inputURL) && !r.exclusions.some((exclusion) => exclusion.test(inputURL))
    );
    if (!match) return null;
    return match.type;
}

// Regex copied from natural NPM package
// https://www.npmjs.com/package/natural#tokenizers
function splitSentences(text: string): Array<string> {
    let splits = text.split(/(?<=[.!?]\s)/g);
    splits = splits.map((split) => split.trim()).filter(Boolean);

    // Don't split on certain tricky words like Mr., Mrs., etc.
    // Don't split inside a LINK, CITE, or INLINE IMAGE
    for (let i = 0; i < splits.length; i++) {
        const lastWord = splits[i].split(' ').pop();
        const split = SPLIT_SENTENCE_EXCEPTIONS.includes(lastWord);
        if (
            (SPLIT_SENTENCE_EXCEPTIONS.includes(lastWord) ||
                splits[i].match(/\[\[(LINK|CITE|INLINE_IMAGE)[^\]]*[!?.]$/gm)) &&
            i + 1 < splits.length
        ) {
            splits[i] = `${splits[i]} ${splits[i + 1]}`;
            splits.splice(i + 1, 1);
            i--; // re-check this sentence in case there's multiple bad splits
        }
    }

    return splits;
}

export function linkCategorizer(inputString: string) {
    // Find the MIME type and the extension
    let theMIME = mimePackage.getType(inputString);
    let theExtension = mimePackage.getExtension(theMIME);

    // Test for different categories
    if (theMIME == '' || theMIME == null) {
        return 'NONE';
    } else if (theMIME == 'image/gif') {
        return 'GIF';
    } else if (theMIME.includes('image')) {
        return 'PICTURE';
    } else if (getYouTubeID(inputString)) {
        return 'YOUTUBE';
    } else if (VALID_VIDEO_EXTENSIONS.includes(theExtension)) {
        return 'NORMAL_VIDEO';
    } else if (VALID_AUDIO_EXTENSIONS.includes(theExtension)) {
        return 'AUDIO';
    } else {
        return 'NONE';
    }
}

// Copied with light modifications from NPM package get-youtube-id
// https://www.npmjs.com/package/get-youtube-id
export function getYouTubeID(url: string) {
    if (!/youtu\.?be/.test(url)) return false;

    // Look first for known patterns
    var patterns = [
        /youtu\.be\/([^#\&\?]{11})/, // youtu.be/<id>
        /\?v=([^#\&\?]{11})/, // ?v=<id>
        /\&v=([^#\&\?]{11})/, // &v=<id>
        /embed\/([^#\&\?]{11})/, // embed/<id>
        /\/v\/([^#\&\?]{11})/ // /v/<id>
    ];

    // If any pattern matches, return the ID
    for (let i = 0; i < patterns.length; ++i) {
        if (patterns[i].test(url)) {
            return patterns[i].exec(url)[1];
        }
    }
    return false;
}

var circularObj = {} as any;
circularObj.circularRef = circularObj;
circularObj.list = [ circularObj, circularObj ];

function tableCellContentsParser($contents: CheerioElement[], cellContents: TableCellContentItem[] = []) {
    $contents.forEach((element, index) => {
        switch (element.type){
            case 'text':
                let theSentences: Sentence[] = parseSentences(element.data);
                if (theSentences.length) {
                    cellContents.push({
                        type: 'text',
                        content: theSentences
                    } as TableCellTextItem);
                }
                break;
            case 'tag':
                if (element.children.length) {
                    let tagClass = blockElements.indexOf(element.name) !== -1 
                    ? 'block'   
                    : voidElements.indexOf(element.name) !== -1 
                        ? 'void'
                        : 'inline' ;
    
                    // console.log(element)
                    let newElement = {
                        type: 'tag',
                        tag_type: element.name,
                        tag_class: tagClass,
                        attrs: cleanAttributes(element.attribs),
                        content: tableCellContentsParser(element.children)
                    } as TableCellTagItem;
                    // console.log(newElement);
                    cellContents.push(newElement);
                }
                break;
        }
    })
    return cellContents;
}

function parseTable($element: Cheerio, tableType: string): Table {
    const $table = $element.children('table');

    const table: Partial<Table> = {
        type: tableType as any,
        attrs: $table.length > 0 ? cleanAttributes($table[0].attribs) : {},
    };

    // Set the table caption, if present
    const $caption = $table.children('caption');
    table.caption = { 
        attrs: $caption.length > 0 ? $caption[0].attribs : {}, 
        sentences: $caption.length > 0 ? parseSentences($caption.html()) : []
        // sentences: $caption.length > 0 ? parseSentences($caption.html().trim()) : []
    }

    // Deal with the colgroup
    // TODO

    // Parse the thead, tbody, and tfoot
    const table_sections = ['thead', 'tbody', 'tfoot'];
    table_sections.forEach((sectionName) => {
        table[sectionName] = { 
            rows: [],
            attrs: {}
        };
        let $tsection = $table.children(sectionName);
        $tsection.each((idx, sectElem) => {
            let $TSECT = cheerio.load(sectElem);
            let rowsArr = [];
            // $TSECT(`${sectionName} > tr`).each((rowIdx, rowElem) => {
            $TSECT(sectElem).children('tr').each((rowIdx, rowElem) => {
                let $TROW = cheerio.load(rowElem);
                let cellsArr = [];
                $TROW(rowElem).children('th, td').each((cellIdx, cellElem) => {
                    let theContentsParsed = tableCellContentsParser(cellElem.children, []);
                    if (theContentsParsed.length){
                        cellsArr.push({
                            index: cellIdx,
                            attrs: cleanAttributes(cellElem.attribs),
                            tag_type: cellElem.name,
                            tag_class: 'block',
                            content: theContentsParsed,
                        });
                    }
                })
                rowsArr.push({
                    index: rowIdx,
                    tag_type: 'tr',
                    tag_class: 'block',
                    attrs: cleanAttributes(rowElem.attribs),
                    cells: cellsArr
                })
            })
            table[sectionName] = { 
                rows: rowsArr,
                attrs: sectElem.attribs
            };
        })
    })

    // Prevent MongoDB from complaining about Circular references in JSON
    let decycledTable = JSONCycleCustom.decycle(table, []) as any;
    // console.log("--------------------------")
    // console.log(util.inspect(decycledTable, false, null, true));
    // console.log("--------------------------")
    return decycledTable as Table;
}
