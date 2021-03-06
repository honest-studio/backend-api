import * as cheerio from 'cheerio';
import * as htmlparser2 from 'htmlparser2';
import * as mimePackage from 'mime';
import * as path from 'path';
import { convert as ReactAttrConvert } from 'react-attr-converter';
import * as tokenizer from 'sbd';
import { ArticleJson, Citation, CitationCategoryType, DescList, Infobox, InfoboxValue, Media, Metadata, NestedContentItem, NestedTagItem, NestedTextItem, Section, Sentence, Table } from '../../types/article';
import { urlCleaner, getYouTubeIdIfPresent } from './article-tools';
import * as JSONCycleCustom from './json-cycle-custom';
const util = require('util');
const chalk = require('chalk');
var colors = require('colors');
const voidElements = require('html-void-elements');
const decode = require('unescape');
const writeJsonFile = require('write-json-file');
const htmlTags = require('html-tags');

export const BLOCK_ELEMENTS = [
    "address",
    "article",
    "aside",
    "blockquote",
    "canvas",
    "dd",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "hr",
    "li",
    "main",
    "nav",
    "noscript",
    "ol",
    "output",
    "p",
    "pre",
    "samp",
    "section",
    "table",
    "td",
    "tfoot",
    "th",
    "tr",
    "ul",
    "video"
];

// constants
const ROOT_DIR = path.join(__dirname, '../..');
export const CAPTURE_REGEXES = {
    link: /(?<=\[\[)LINK\|[^\]]*(?=\]\])/g,
    link_match: /\[\[LINK\|lang_(.*?)\|(.*?)\|(.*?)\]\]/g,
    cite: /(?<=\[\[)CITE\|[^\]]*(?=\]\])/g,
    inline_image: /(?<=\[\[)INLINE_IMAGE\|[^\]]*(?=\]\])/g,
    inline_image_match: /\[\[INLINE_IMAGE\|(.*?)\|(.*?)\|(.*?)\|h(.*?)\|w(.*?)(?:\|(.*?))?\]\]/gm
};
export const REPLACEMENTS = [
    { regex: /\u00A0/g, replacement: ' ' },
    { regex: /\u200B/g, replacement: '' },
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

export const NON_AMP_BAD_TAGS = [
    'font',
    'head',
    'noscript',
    'map',
    'math',
    'mi',
    'mo',
    'mtd',
    'mrow',
    'mspace',
    'mtext',
    'msub',
    'msup',
    'mstyle',
    'semantics',
    'usemap',
    'xml',
    'worddocument',
    'mathpr',
    'mathfont',
    'kno-share-button'
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
export const ANCILLARY_STYLES = [
    { normal: 'bgcolor', react: 'backgroundColor'}, // Background color
    { normal: 'align', react: 'textAlign'} // Text alignment
]
export const VALID_AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a', '.mpga'];
export const SPLIT_SENTENCE_EXCEPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.'];
export const VALID_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pps', '.ppsx', '.odt', '.ods', '.key', '.csv', '.txt', '.rtf'];

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

const SOCIAL_MEDIA_REGEXES = {
    'bandcamp': {
        regex: /bandcamp.com/gimu,
        exclusions: [/bandcamp.com\/track\/.*/gimu, /bandcamp.com\/album\/.*/gimu, /blog.bandcamp.com\/.*/gimu],
    },
    'facebook': {
        regex: /facebook.com/gimu,
        exclusions: [
            /facebook.com\/photo.*/gimu,
            /facebook.com\/.*?\/videos\/vb.*/gimu,
            /facebook.com\/.*?\/photos/gimu,
            /facebook.com\/.*?\/timeline\//gimu,
            /facebook.com\/.*?\/posts/gimu,
            /facebook.com\/events\/.*?/gimu,
            /blog.facebook.com\/.*/gimu,
            /developers.facebook.com\/.*/gimu,
        ],
    },
    'google': { regex: /plus.google.com/gimu, exclusions: [] },
    'instagram': {
        regex: /instagram.com/gimu,
        exclusions: [/instagram.com\/p\/.*/gimu, /blog.instagram.com\/.*/gimu],
    },
    'lastfm': { regex: /last.fm\/user/gimu, exclusions: [/last.fm\/music\/.*\/.*/gimu] },
    'linkedin': {
        regex: /linkedin.com/gimu,
        exclusions: [/linkedin.com\/pub\/.*/gimu, /press.linkedin.com\/.*/gimu, /blog.linkedin.com\/.*/gimu],
    },
    'medium': { regex: /medium.com\/@/gimu, exclusions: [/medium.com\/@.*\/.*/gimu] },
    'myspace': {
        regex: /myspace.com/gimu,
        exclusions: [/myspace.com\/.*\/.*/gimu, /blogs.myspace.com\/.*/gimu],
    },
    'pinterest': {
        regex: /pinterest.com/gimu,
        exclusions: [/pinterest.com\/pin\/.*/gimu, /blog.pinterest.com\/.*/gimu],
    },
    'quora': { regex: /quora.com\/profile/gimu, exclusions: [] },
    'reddit': { regex: /reddit.com\/user/gimu, exclusions: [] },
    'snapchat': { regex: /snapchat.com\/add/gimu, exclusions: [] },
    'songkick': { regex: /songkick.com\/artists/gimu, exclusions: [] },
    'soundcloud': {
        regex: /soundcloud.com/gimu,
        exclusions: [
            /soundcloud.com\/.*\/tracks\/.*/gimu,
            /soundcloud.com\/.*\/sets\/.*/gimu,
            /soundcloud.com\/.*\/reposts\/.*/gimu,
        ],
    },
    'tumblr': { regex: /tumblr.com/gimu, exclusions: [/tumblr.com\/post.*/gimu] },
    'twitch': { regex: /twitch.tv/gimu, exclusions: [] },
    'twitter': {
        regex: /twitter.com/gimu,
        regex_tweet: /^https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)$/gimu,
        exclusions: [
            /twitter.com\/.*?\/status.*?/gimu,
            /dev.twitter.com\/.*/gimu,
            /blog.twitter.com\/.*/gimu,
            /help.twitter.com\/.*/gimu,
            /support.twitter.com\/.*/gimu,
        ],
    },
    'vine': { regex: /vine.co/gimu, exclusions: [] },
    'vk': { regex: /vk.com/gimu, exclusions: [] },
    'yelp': { regex: /yelp.com\/biz/gimu, exclusions: [] },
    'youtube': {
        regex: /youtube.com/gimu,
        exclusions: [
            /youtube.com\/playlist.*[?]list=.*/gimu,
            /youtube.com\/v\/.*/gimu,
            /youtube.com\/channel\/.*?#p.*?/gimu,
            /youtube.com\/embed\/.*/gimu,
            /youtube.com\/watch?v=.*/gimu,
            /youtube.com\/watch.*[?]v=.*/gimu,
            /youtube.com\/watch.*[?]v=.*/gimu,
            /youtube.com\/watch?.*?/gimu,
            /youtube.com\/user\/.*?#p.*?/gimu,
            /youtube.com\/subscription_center.*/gimu,
        ],
    }
};

/**
 * @function parseStyles
 * Parses a string of inline styles into a javascript object with casing for react
 *
 * @param {string} styles
 * @returns {Object}
 */
export const parseStyles = (styles: string): {} => {
    if (!styles) return null;
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

export const cleanAttributes = (inputAttrs: { [attr: string]: any }): { [attr: string]: any } => {
    // Prevent error for empty inputs
	if (inputAttrs === undefined || inputAttrs === null) {
		return {}
	}
	const cleanedAttrs = {};
    const keys = Object.keys(inputAttrs);

    // Look for the non-react CSS name and convert it to the React format
    for (const key of keys) {
        if (inputAttrs[key] && inputAttrs[key] != '') {
        	cleanedAttrs[ReactAttrConvert(key)] = inputAttrs[key];
        }
    }

    // If a 'style' attribute is present, combine all of the styles into one style string 
    if (cleanedAttrs['style']){
        cleanedAttrs['style'] = parseStyles(cleanedAttrs['style']);
        
        // Look to add other styles, if present
        ANCILLARY_STYLES.forEach(sty => {
            if (cleanedAttrs[sty.normal] && !cleanedAttrs['style'][sty.react]){
                cleanedAttrs['style'][sty.react] = cleanedAttrs[sty.normal];
            }
        });
    }
    else {
        cleanedAttrs['style'] = {};

        // Look to add other styles, if present
        ANCILLARY_STYLES.forEach(sty => {
            if (cleanedAttrs[sty.normal] && !cleanedAttrs['style'][sty.react]){
                cleanedAttrs['style'][sty.react] = cleanedAttrs[sty.normal];
            }
        });

        // Remove empty styles
        if (Object.keys(cleanedAttrs['style']).length === 0 && cleanedAttrs['style'].constructor === Object) delete cleanedAttrs['style'];
    }
    return cleanedAttrs;
}


// Convert the old-style HTML into a JSON
export function oldHTMLtoJSON(oldHTML: string): ArticleJson {
    // Replace some problematic unicode characters and other stuff
    REPLACEMENTS.forEach(function(pair) {
        oldHTML = oldHTML.replace(pair.regex, pair.replacement);
    });

    // Quick trim
    oldHTML = oldHTML.trim();

    // Load the HTML into htmlparser2 beforehand since it is more forgiving
    // Then load the HTML into cheerio for parsing
    let dom = htmlparser2.parseDOM(oldHTML, { decodeEntities: true });
    let $ = cheerio.load(dom as any);

    // Need to extract citations before sanitizing so the citation ID can be marked
    const citations = extractCitations($);

    // Remove useless and empty tags and HTML
    // Convert text formatting to pseudo-markdown
    // Converts link HTML to clean parseable formats
    $ = sanitizeText($);

    // Converts citation HTML to clean parseable formats
    $ = sanitizeCitations($, citations);

    let quickHTML = $.html();
    // Replace some problematic unicode characters and other stuff
    REPLACEMENTS.forEach(function(pair) {
        quickHTML = quickHTML.replace(pair.regex, pair.replacement);
    });

    dom = htmlparser2.parseDOM(quickHTML, { decodeEntities: true });
    $ = cheerio.load(dom as any);

    const metadata = extractMetadata($);

    const page_title_text =
        $('h1.page-title')
            .text()
            .trim() || '';
    const page_title = [{
        index: 0,
        type: 'sentence',
        text: page_title_text
    }];
    const media_gallery = extractMediaGallery($);
    const main_photo = extractMainPhoto($);
    let infobox_html = extractInfoboxHtml($);
    const infoboxes = extractInfoboxes($);

    // AMP info
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

    const page_body = extractPageBody($);

    writeJsonFile(path.resolve(__dirname, 'foo.json'), page_body)

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
            let thePair = { key: pairKey, value: pairValue };
            metadata.push(thePair);
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
            citation_id: i + 1,
            description: parseSentences($descriptionTexts.eq(i).text().trim()),
            timestamp: $timestamps.eq(i).text().trim(),
            mime: $mimes.eq(i).text().trim(),
            attribution: $attributions.eq(i).text().trim(),
            thumb: $thumbs.eq(i).attr('src')
        };

        let href = $hrefs.eq(i).attr('href');
        if (!href){
            href = $href_wraps.eq(i).text().trim().replace(" ", "");
        }
        if (href) {
            citation.url = urlCleaner(href);
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
        type: 'main_photo',
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
        const captionText = decode(caption.text().trim(), 'all');
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

    let parsedBlobBox = parseTable($(blobbox), 'wikitable');
    return parsedBlobBox;
}

function extractInfoboxes($: CheerioStatic): Infobox[] {
    let infoboxes = [];

    // Loop through the plural non-Wikipedia elements first and fill the dictionary
    $('table.ibox-item-plural').each(function() {
        // Initialize a blank object dictionary
        let infoPackage: Infobox = {
            key: null,
            schema: null,
            addlSchematype: null,
            addlSchemaItemProp: null,
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
        infoPackage.addlSchemaItemProp = pyToJS(
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
                    index: i,
                    sentences: [{
                        type: 'sentence',
                        index: 0,
                        text: rowText
                    }]
                } as InfoboxValue);
            });

        // Add to the infobox list
        infoboxes.push(infoPackage);
    });

    // Loop through the nonplural elements and fill the dictionary
    $('table.ibox-item-nonplural').each(function() {
        // Initialize a blank object dictionary
        let infoPackage: Infobox = {
            key: null,
            schema: null,
            addlSchematype: null,
            addlSchemaItemProp: null,
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
        infoPackage.addlSchemaItemProp = pyToJS(
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
                    index: i,
                    sentences: [{
                        type: 'sentence',
                        index: 0,
                        text: tempValue
                    }]
                } as InfoboxValue);
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
        .map((htmlSection) => {
            if (htmlSection.length && htmlSection.charAt(0) != "<"){
                console.log("No section immediate child wrap found. Adding a <p>");
                return `<p>${htmlSection}</p>`;
            }
            else return htmlSection;
        })
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
            category: linkCategorizer(theImgNode.attr('src')) || null,
            media_props: {
                type: 'section_image'
            }
        };

        // Deal with images in tables
        if (!image.url) {
            const inline_image_token = $image.html().match(CAPTURE_REGEXES.inline_image);
            if (inline_image_token) {
                const parts = inline_image_token[0].split('|');
                image.url = urlCleaner(parts[1]);
                image.media_props = {
                    type: 'inline_image',
                    srcSet: parts[2],
                    height: Number(parts[4].substring(1)),
                    width: Number(parts[5].substring(1))
                };
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
        if (image.url) {
            image.url = urlCleaner(decodeURIComponent(image.url));

            try { image.url = urlCleaner(decodeURIComponent(image.url)); }
            catch(err) { image.url = decodeURIComponent(image.url); }
        }

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
            attrs: cleanAttributes(element.attribs),
            items: []
        };

        // Process the tag types accordingly
        if (paragraph.tag_type == 'p' || paragraph.tag_type == 'blockquote'){
            paragraph.items = parseSentences($element.text().trim());
        }

        // Headings
        else if (paragraph.tag_type.match(/h[1-6]/g)) paragraph.items = parseSentences($element.text().trim());
        // Lists
        else if (paragraph.tag_type.match(/(ul|ol)/g)) {
            // Loop through the li's
            const $list_items = $element.children('li');
            for (let j = 0; j < $list_items.length; j++) {
                const $list_item = $list_items.eq(j);
                 // All <li> sentences should be joined anyways, otherwise they will produce erroneous bullet points
                let comboSentence = { type: 'sentence', index: 0, text: parseSentences($list_item.text()).map((sent) => sent.text).join("") };
                paragraph.items.push({
                    type: 'list-item',
                    index: j,
                    sentences: [comboSentence],
                    tag_type: 'li'
                });
            }
        }

        // Description List
        else if (paragraph.tag_type == 'dl') {
            const DescList = parseDescriptionList($element);
            paragraph.items.push(DescList);
        }

        // Tables
        else if (paragraph.tag_type == 'table') {
            // ignore images
            const classes = paragraph.attrs.className;
            if (classes && classes.includes('blurb-inline-image-container')) continue;

            const table = parseTable($element, 'body-table');
            paragraph.items.push(table);
        }
        else{
            // console.log(colors.red(`ERROR IN PARSING: TAG ${element.tagName.toLowerCase()} NOT HANDLED! NEED A DEFAULT: `, $element.html() ))
            console.log(colors.red("ERROR IN PARSING: TAG NOT HANDLED. TO DEBUG, YOU WILL NEED TO set cache: boolean = false on getWikiBySlug"));
        }

        // Add the object to the array
        section.paragraphs.push(paragraph);
    }

    return section;
}

function sanitizeCitations ($, citations) {
    // Substitute all the citations into something that is safe for the parser
    $('a.tooltippableCarat').each(function() {
        let url;
        try { url = decodeURIComponent($(this).attr('data-username')); }
        catch(err) { url = $(this).attr('data-username'); }
        if (url.trim() == "Cite as verified editor")
            url = "Self-citation:DEPRECATED"
        else {
            url = urlCleaner(url);
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

    // Remove more bad tags
    $(NON_AMP_BAD_TAGS.join(", ")).remove()

    // Unwrap certain tags
    const unwrapTags = ['small'];
    unwrapTags.forEach((selector) => {
        $(selector).each(function(index, element) {
            $(this).replaceWith($(element).contents());
        });
    })

    // Substitute all the links into something that is safe for the parser
    $('a.tooltippable').each(function(i, el) {
        let old_slug;
        try { old_slug = decodeURIComponent($(el).attr('data-username')); }
        catch(err) { old_slug = $(el).attr('data-username'); }
        if (old_slug.charAt(0) == '/') old_slug = old_slug.substring(1);
        const display_text = $(this).text().trim();

        let lang_code, slug;
        if (old_slug.includes('lang_')) {
            lang_code = old_slug.split('/')[0].substring(5); // ignore the lang_ at the start
            slug = old_slug.split('/')[1];
        } else {
            lang_code = 'en';
            slug = old_slug;
        }
        
        // If the <a> is wrapping an <img>, do not replace with the Markdown
        let innerTags = $(el).find('img');
        if (innerTags && innerTags.length){
            // Do nothing
            return;
        }
        else {
            // Replace the tag with the string
            const plaintextString = `[[LINK|lang_${lang_code}|${slug}|${display_text}]]`;
            $(this).replaceWith(plaintextString);
        }


    });

    // Convert <strong> and <b> tags to **text** (Markdown)
    $('strong, b').each(function() {
        // Get the string
        let theString = '';
        theString = $(this).text().trim() || '';

        // Create the string
        let plaintextString = `**${theString}**`;

        // Replace the tag with the string
        $(this).replaceWith(plaintextString);
    });

    
    // Convert <em> and <i> tags to *text* (Markdown)
    $('em, i').each(function() {
        // Get the string
        let theString = '';
        theString = $(this).text().trim() || '';

        // Create the string
        let plaintextString = `*${theString}*`;

        // Replace the tag with the string
        $(this).replaceWith(plaintextString);
    });

    // Convert images inside wikitables and ul's to markup
    $('.wikitable img, .blurb-wrap ul img, .infobox img').each(function(i, el) {
        // Construct a dictionary
        const src = urlCleaner($(this).attr('src')).replace(/http:/g, "https:");
        const srcSet = $(this).attr('srcset') || '';
        const height = $(this).attr('height');
        const width = $(this).attr('width');
        const alt = $(this).attr('alt') || '';
        let the_class_string = $(this).attr('class') || '';
        if (!the_class_string || the_class_string == null || the_class_string == "") the_class_string = "";
        else the_class_string = `|${the_class_string}`;

        // Replace the tag with the string
        const plaintextString = `[[INLINE_IMAGE|${src}|${srcSet}|${alt}|h${height}|w${width}${the_class_string}]]`;

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

    // Add whitespace after links, bold, and italics unless there is a special character or a space after it already
    // THE * WORD* SPACING PROBLEM IS HERE
    const spaced_links = $.html().replace(/\[\[LINK\|[^\]]*\]\](?=[^.(),:'"“”‘’;\s\-])/g, (token) => `${token} `);
    // const spaced_bold = spaced_links.replace(/\*\*[^\*]+\*\*(?=[^.(),:'"“”‘’;\s\-])/g, (token) => `${token} `);
    // const spaced_italics = spaced_bold.replace(/\*[^\*]+\*(?=[^.(),:'"“”‘’;\s\-])/g, (token) => `${token} `);
    $ = cheerio.load(spaced_links);

    return $;
}

// Convert the plaintext strings for links and citations to the Markdown format
export function parseSentences(inputString: string, bypass_trim?: boolean): Sentence[] {
    if (!inputString) return [];
    if (inputString == " ") return [{ type: 'sentence', index: 0, text: ' ' }];

    // Create the sentence tokens
    const sentenceTokens = splitSentences(inputString);

    const returnTokens: Sentence[] = [];

    sentenceTokens.forEach(function(token, index) {
        // Initialize the return object
        let sentence = { type: 'sentence', index: index, text: token };

        // Quick regex clean
        sentence.text = sentence.text
                        .replace(/ {1,}/g, ' ') // excess spaces
                        .replace(/(\)|\]|\,)\[\[/g, '$1 [[') // lack of space before a LINK / CITE / INLINE_IMAGE in certain cases
                        .replace(/\]\](\(|\[)/g, ']] $1') // lack of space after a LINK / CITE / INLINE_IMAGE in certain cases
                        .replace(/(\*|\]\])\s(\)|\'|\"|\“|\”|\‘|\’|\-)/g, '$1$2') // remove space between a mark or inline and certain things
                        .replace(/(\(|\'|\"|\“|\”|\‘|\’|\-)\s(\*|\[\[)/g, '$1$2') // remove space between a mark or inline and certain things


        

        // Make sure that no sentences start with a space
        if (sentence.text.charAt(0) == " " && !bypass_trim) sentence.text = sentence.text.slice(1);

        // If there is only one sentence, trim it
        if (index == 0 && sentenceTokens.length == 1 && !bypass_trim) sentence.text = sentence.text.trim();

        if (sentenceTokens.length > 2 && index < sentenceTokens.length - 1){
            // FIX THIS TO MAKE SURE THAT SENTENCES DO NOT START WITH SPACES, and INSTEAD END WITH THEM
            // WILL NEED TO LOOK AHEAD AT THE NEXT SENTENCE
            let nextSentenceString = sentenceTokens[index + 1];
            if (nextSentenceString && 
                nextSentenceString.charAt(0) == " " &&
                sentence.text.charAt(sentence.text.length - 1) != " "
            ){
                sentence.text = sentence.text + " ";
            }
        }

        // console.log(`sentence.text: |${sentence.text}|`)

        // If it is the last sentence, trim it
        if (index == sentenceTokens.length - 1 && !bypass_trim) sentence.text = sentence.text.trim();

        // console.log(sentence)

        // Return the object
        returnTokens.push(sentence);
    });
    // Don't split inside a LINK, CITE, or INLINE IMAGE
    for (let i = 0; i < returnTokens.length; i++) {
        // const lastWord = returnTokens[i].split(' ').pop();
        if (returnTokens[i].text.match(/\[\[(LINK|CITE|INLINE_IMAGE)\|(.*?)\|(.*?)\|(.*?)[!?.\s]\s?$/gm) && i + 1 < returnTokens.length) {
            returnTokens[i].text = `${returnTokens[i].text}${returnTokens[i + 1].text}`;
            returnTokens.splice(i + 1, 1);
            i--; // re-check this sentence in case there's multiple bad splits
            
        }
    }

    return returnTokens;
}

// See if a given URL is a social media URL. If so, return the type
export function socialURLType(inputURL: string) {
    if (!inputURL || inputURL == "") return null;
    // Set the return type
    let returnSocialType = null;

    // Loop through the regexes
    let isExcluded = false;
    let theSocialKeys = Object.keys(SOCIAL_MEDIA_REGEXES);
    for (let i = 0; i < theSocialKeys.length; i++) {
        let regexPack = SOCIAL_MEDIA_REGEXES[theSocialKeys[i]];
        // See if the URL matches one of the regexes
        if (inputURL && inputURL.match && inputURL.match(new RegExp(regexPack.regex, 'gimu'))) {
            // Make sure it doesn't match one of the exclusions
            for (let exclusion of regexPack.exclusions) {
                if (inputURL.match(new RegExp(exclusion, 'gimu'))) {
                    isExcluded = true;
                    break;
                }
            }
            // If the URL matched an excluded regex, break the loop and return null
            if (isExcluded) {
                returnSocialType = null;
                break;
            }
            // Otherwise, set the type
            else {
                returnSocialType = theSocialKeys[i];
                break;
            }
        }
    }
    return returnSocialType;
}

// Regex copied from natural NPM package
// https://www.npmjs.com/package/natural#tokenizers
// function splitSentences(text: string): Array<string> {
//     let splits = text.split(/(?<=[.!?]\s)/gm);
//     splits = splits.map((split) => split.trim()).filter(Boolean);

//     // Don't split on certain tricky words like Mr., Mrs., etc.
//     // Don't split inside a LINK, CITE, or INLINE IMAGE
//     for (let i = 0; i < splits.length; i++) {
//         const lastWord = splits[i].split(' ').pop();
//         const split = SPLIT_SENTENCE_EXCEPTIONS.includes(lastWord);
//         if (
//             (SPLIT_SENTENCE_EXCEPTIONS.includes(lastWord) ||
//                 splits[i].match(/\[\[(LINK|CITE|INLINE_IMAGE)[^\]]*[!?.]$/gm)) &&
//             i + 1 < splits.length
//         ) {
//             splits[i] = `${splits[i]} ${splits[i + 1]}`;
//             splits.splice(i + 1, 1);
//             i--; // re-check this sentence in case there's multiple bad splits
//         }
//     }

//     return splits;
// }

function splitSentences(text: string): Array<string> {
    // Get the splits
    let splits = tokenizer.sentences(text, { "preserve_whitespace" : true });

    // No empty sentences
    splits = splits.filter(split => split.length).filter(Boolean);

    // Cleanup
    for (let i = 0; i < splits.length; i++) {
        splits[i] = splits[i].replace("[[[[", "[[");
    }

    // Don't split inside a LINK, CITE, or INLINE IMAGE
    for (let i = 0; i < splits.length; i++) {
        // const lastWord = splits[i].split(' ').pop();
        if (splits[i].match(/\[\[(LINK|CITE|INLINE_IMAGE)[^\]]*[!?.]$/gm) && i + 1 < splits.length) {
            splits[i] = `${splits[i]} ${splits[i + 1]}`;
            splits.splice(i + 1, 1);
            i--; // re-check this sentence in case there's multiple bad splits
        }
    }

    return splits;
}

export function linkCategorizer(inputString: string): CitationCategoryType {    
    // Find the MIME type and the extension
    let theMIME = mimePackage.getType(inputString);
    let theExtension = mimePackage.getExtension(theMIME);
    // console.log("--------")
    // console.log("theMIME: ", theMIME);
    // console.log("theExtension: ", theExtension);
    // Test for different categories
    if (getYouTubeIdIfPresent(inputString)) {
        return 'YOUTUBE';
    } else if (theMIME == '' || theMIME == null || theMIME.search(/^text/gimu) >= 0) {
        return 'NONE';
    } else if (theMIME == 'image/gif') {
        return 'GIF';
    } else if (inputString.indexOf('https://openlibrary.org/books/') == 0 || inputString.indexOf('https://openlibrary.org/search') == 0) {
        return 'BOOK';
    } else if (inputString.indexOf('https://portal.issn.org/resource/ISSN/') == 0) {
        return 'PERIODICAL';
    } else if (theMIME && theMIME.indexOf('image') >= 0) {
        return 'PICTURE';
    } else if (VALID_VIDEO_EXTENSIONS.includes(theExtension) || VALID_VIDEO_EXTENSIONS.includes("." + theExtension)) {
        return 'NORMAL_VIDEO';
    } else if (VALID_AUDIO_EXTENSIONS.includes(theExtension) || VALID_AUDIO_EXTENSIONS.includes("." + theExtension)) {
        return 'AUDIO';
    } else if (VALID_FILE_EXTENSIONS.includes(theExtension) || VALID_FILE_EXTENSIONS.includes('.' + theExtension)) {
        return 'FILE';
    } else return 'NONE';
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

export function nestedContentParser($contents: CheerioElement[], nestedContents: NestedContentItem[] = []) {
    $contents.forEach((element, index) => {
        switch (element.type){
            case 'text':
                let theSentences: Sentence[] = parseSentences(element.data, true);
                if (theSentences.length) {
                    nestedContents.push({
                        type: 'text',
                        content: theSentences
                    } as NestedTextItem);
                }
                break;
            case 'tag':
                let newElement: NestedTagItem | NestedTextItem = null;
                let tagClass = BLOCK_ELEMENTS.indexOf(element.name) !== -1 
                ? 'block'   
                : voidElements.indexOf(element.name) !== -1 
                    ? 'void'
                    : 'inline' ;
                let parsedChildrenContent: NestedContentItem[] = [];

                // Account for non-void tags
                if (element.children.length) {
                    parsedChildrenContent = nestedContentParser(element.children, [])
                }
                let cleanedAttributes = cleanAttributes(element.attribs);

                // Handle <img>'s inside of cells as INLINE_IMAGES
                if( false && element.name == 'img' ){
                    newElement = {
                        type: 'text',
                        content: [{ index: 0, type: 'sentence', text: parseInlineImageCheerioElement(element) }] 
                    } as NestedTextItem;
                } 
                // Otherwise, process normally
                else {
                    // Make sure the tag type is valid
                    let validTag = htmlTags.includes(element.name);
                    if (!validTag) newElement = null;
                    else {
                        newElement = {
                            type: 'tag',
                            tag_type: element.name,
                            tag_class: tagClass,
                            attrs: cleanedAttributes,
                            content: parsedChildrenContent
                        } as NestedTagItem;
                    }
                }

                if (newElement) nestedContents.push(newElement);
                break;
        }
    })

    // Combine adjacent text 
    let accumulated_text = "", merged_content: NestedContentItem[] = [];
    let content_idx = 0;
    while(content_idx < nestedContents.length){
        let item: NestedContentItem = nestedContents[content_idx];
        switch(item.type){
            case 'text': {
                accumulated_text += (item as NestedTextItem).content.map(sent => sent.text).join("");
                
                // If the next item is a tag, or the end, push the current accumulated text
                if (content_idx == nestedContents.length - 1 || nestedContents[content_idx + 1].type == 'tag'){
                    merged_content.push({
                        type: 'text',
                        content: [{
                            index: 0,
                            type: 'sentence',
                            text: accumulated_text
                        }]
                    });
                    accumulated_text = "";
                }

                break;
            }
            // Push a tag regardless
            case 'tag': {
                merged_content.push(item);
                break;
            }
        }
        content_idx++;
    }

    return merged_content;
}

export function collectNestedContentSentences(input_nested_item: NestedContentItem): Sentence[]{
    let collected_sentences: Sentence[] = [];
    switch(input_nested_item.type){
        case 'text':
            collected_sentences.push(...(input_nested_item as NestedTextItem).content);
            break;
        case 'tag':
            let nested_tag = input_nested_item as NestedTagItem;
            if (nested_tag.content && nested_tag.content.length){
                nested_tag.content.map(inner_nested_item => {
                    collected_sentences.push(...collectNestedContentSentences(inner_nested_item));
                })
            }
            break;
    }
    return collected_sentences;
}

function parseDescriptionList($dlist: Cheerio): DescList {
    const dlist: DescList = {
        type: 'dl',
        attrs: $dlist.length > 0 ? cleanAttributes($dlist[0].attribs) : {},
        items: []
    };

    // Parse the dt and dd tags
    let $dtags = $dlist.children('dt, dd');
    let dtagArr = [];
    $dtags.each((idx, dElem) => {
        let theContentsParsed = nestedContentParser(dElem.children, []);
        if (theContentsParsed.length){
            dtagArr.push({
                index: idx,
                attrs: cleanAttributes(dElem.attribs),
                tag_type: dElem.name,
                content: theContentsParsed,
            });
        }
    });

    if (dtagArr.length) dlist.items = dtagArr;

    // Prevent MongoDB from complaining about Circular references in JSON
    let decycledDescList = JSONCycleCustom.decycle(dlist, []) as any;
    return decycledDescList as DescList;
}

function parseTable($element: Cheerio, tableType: Table['type'] ): Table {
    let $table;
    switch (tableType){
        case 'body-table': {
            $table = $element;
            break;
        }
        case 'wikitable': {
            $table = $element.children('table');
            break
        }
    }

    const table: Partial<Table> = {
        type: tableType as any,
        attrs: $table.length > 0 ? cleanAttributes($table[0].attribs) : {},
    };

    // Set the table caption, if present
    const $caption = $table.children('caption');
    table.caption = { 
        attrs: $caption.length > 0 ? cleanAttributes($caption[0].attribs) : {}, 
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
            $TSECT(sectElem).children('tr').each((rowIdx, rowElem) => {
                let $TROW = cheerio.load(rowElem);
                let cellsArr = [];
                $TROW(rowElem).children('th, td').each((cellIdx, cellElem) => {
                    let theContentsParsed = nestedContentParser(cellElem.children, []);
                    cellsArr.push({
                        index: cellIdx,
                        attrs: cleanAttributes(cellElem.attribs),
                        tag_type: cellElem.name,
                        tag_class: 'block',
                        content: theContentsParsed,
                    });
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
                attrs: cleanAttributes(sectElem.attribs) 
            };
        })
    })
    // Prevent MongoDB from complaining about Circular references in JSON
    let decycledTable = JSONCycleCustom.decycle(table, []) as any;
    return decycledTable as Table;
}

//[[INLINE_IMAGE|${src}|${srcset}|${alt}|h${height}|w${width}|cls_${the_class}]] 
export const parseInlineImage = (img, $) => {
	let $img = $(img);
	let src = $img.attr('src');
	let srcset = $img.attr('srcset');
	let alt = $img.attr('alt');
	if (alt == undefined) {
		alt = '';
	}
	let height = $img.attr('height');
    let width = $img.attr('width'); 
    let the_class_string = $img.attr('class'); 
    if (!the_class_string || the_class_string == null || the_class_string == "") the_class_string = "";
    else the_class_string = `|${the_class_string}`;
	return `[[INLINE_IMAGE|${src}|${srcset}|${alt}|h${height}|w${width}${the_class_string}]]`;
}

export const parseInlineImageCheerioElement = (img: CheerioElement) => {
	let theAttribs = img.attribs;
	let src = theAttribs['src'];
	let srcset = theAttribs['srcset'];
	let alt = theAttribs['alt'];
	if (alt == undefined) {
		alt = '';
	}
	let height = theAttribs['height'];
    let width = theAttribs['width'];
    let the_class_string = theAttribs['class']; 
    if (!the_class_string || the_class_string == null || the_class_string == "") the_class_string = "";
    else the_class_string = `|${the_class_string}`;
	return `[[INLINE_IMAGE|${src}|${srcset}|${alt}|h${height}|w${width}${the_class_string}]]`;
}