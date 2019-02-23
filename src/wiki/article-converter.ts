import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import * as htmlparser2 from 'htmlparser2';
import {
    ArticleOptions,
    PageLink,
    Inline,
    Template,
    TemplateWithProps,
    TextFormat,
    Sentence,
    Image,
    SectionData,
    Section,
    Interwiki,
    ArticleData,
    ArticleJson,
    Media,
    Citation,
    Metadata
} from './article-dto';
import * as mimePackage from 'mime';
const decode = require('unescape');
import getYouTubeID from 'get-youtube-id';

// constants
const ROOT_DIR = path.join(__dirname, '../..');
const CAPTURE_REGEXES = {
    linkcite: /__~(LINK|CITATION)__~~~USERNAME:(.*?)~-~HREF:(.*?)~-~STRING:(.*?)~~~__(LINK|CITATION)~__/gimu
};
const SOCIAL_MEDIA_REGEXES = [
    {
        type: 'bandcamp',
        regex: /bandcamp.com/gimu,
        exclusions: [/bandcamp.com\/track\/.*/gimu, /bandcamp.com\/album\/.*/gimu, /blog.bandcamp.com\/.*/gimu]
    },
    {
        type: 'facebook',
        regex: /facebook.com/gimu,
        exclusions: [
            /facebook.com\/photo.*/gimu,
            /facebook.com\/.*?\/videos\/vb.*/gimu,
            /facebook.com\/.*?\/photos/gimu,
            /facebook.com\/.*?\/timeline\//gimu,
            /facebook.com\/.*?\/posts/gimu,
            /facebook.com\/events\/.*?/gimu,
            /blog.facebook.com\/.*/gimu,
            /developers.facebook.com\/.*/gimu
        ]
    },
    { type: 'google', regex: /plus.google.com/gimu, exclusions: [] },
    {
        type: 'instagram',
        regex: /instagram.com/gimu,
        exclusions: [/instagram.com\/p\/.*/gimu, /blog.instagram.com\/.*/gimu]
    },
    { type: 'lastfm', regex: /last.fm\/user/gimu, exclusions: [/last.fm\/music\/.*\/.*/gimu] },
    {
        type: 'linkedin',
        regex: /linkedin.com/gimu,
        exclusions: [/linkedin.com\/pub\/.*/gimu, /press.linkedin.com\/.*/gimu, /blog.linkedin.com\/.*/gimu]
    },
    { type: 'medium', regex: /medium.com\/@/gimu, exclusions: [/medium.com\/@.*\/.*/gimu] },
    { type: 'myspace', regex: /myspace.com/gimu, exclusions: [/myspace.com\/.*\/.*/gimu, /blogs.myspace.com\/.*/gimu] },
    {
        type: 'pinterest',
        regex: /pinterest.com/gimu,
        exclusions: [/pinterest.com\/pin\/.*/gimu, /blog.pinterest.com\/.*/gimu]
    },
    { type: 'quora', regex: /quora.com\/profile/gimu, exclusions: [] },
    { type: 'reddit', regex: /reddit.com\/user/gimu, exclusions: [] },
    { type: 'snapchat', regex: /snapchat.com\/add/gimu, exclusions: [] },
    { type: 'songkick', regex: /songkick.com\/artists/gimu, exclusions: [] },
    {
        type: 'soundcloud',
        regex: /soundcloud.com/gimu,
        exclusions: [
            /soundcloud.com\/.*\/tracks\/.*/gimu,
            /soundcloud.com\/.*\/sets\/.*/gimu,
            /soundcloud.com\/.*\/reposts\/.*/gimu
        ]
    },
    { type: 'tumblr', regex: /tumblr.com/gimu, exclusions: [/tumblr.com\/post.*/gimu] },
    {
        type: 'twitter',
        regex: /twitter.com/gimu,
        exclusions: [
            /twitter.com\/.*?\/status.*?/gimu,
            /dev.twitter.com\/.*/gimu,
            /blog.twitter.com\/.*/gimu,
            /help.twitter.com\/.*/gimu,
            /support.twitter.com\/.*/gimu
        ]
    },
    { type: 'vine', regex: /vine.co/gimu, exclusions: [] },
    { type: 'vk', regex: /vk.com/gimu, exclusions: [] },
    { type: 'yelp', regex: /yelp.com\/biz/gimu, exclusions: [] },
    {
        type: 'youtube',
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
            /youtube.com\/subscription_center.*/gimu
        ]
    }
];
const REPLACEMENTS = [
    { regex: /\u{00A0}/gimu, replacement: ' ' },
    { regex: /\u{200B}/gimu, replacement: '' },
    { regex: /\n <\/a>\n/gimu, replacement: '</a>' },
    { regex: /<\/a> (,|.|:|'|\))/gimu, replacement: '</a>$1' },
    { regex: / {1,}/gimu, replacement: ' ' },
    { regex: /\n\s/gimu, replacement: ' ' },
    { regex: / , /gimu, replacement: ', ' },
    { regex: / \./gimu, replacement: '.' },
    {
        regex: /https:\/\/s3.amazonaws.com\/everipedia-storage/gimu,
        replacement: 'https://everipedia-storage.s3.amazonaws.com'
    }
];
const AMP_REGEXES_PRE = [
    /<html.*<\/head>/gimu,
    /<\/html/gimu,
    /\sstyle=".*?"/gimu,
    /\sstyle='.*?'/gimu,
    /\sscope=".*?"/gimu,
    /\ssummary=".*?"/gimu,
    /\sitem=".*?"/gimu,
    /\sitem='.*?'/gimu,
    /\salign='.*?'/gimu,
    /\svalign=".*?"/gimu,
    /\sv=".*?"/gimu,
    /\srules=".*?"/gimu,
    /\snowrap=".*?"/gimu,
    /\stype='.*?'/gimu,
    /\saria-describedby='.*?'/gimu,
    /\ssize=".*?"/gimu,
    /\sface=".*?"/gimu,
    /\scolor=".*?"/gimu,
    /\susemap=".*?"/gimu,
    /<html><head><\/head>/gimu,
    /<\/html>/gimu,
    /\sunselectable=".*?"/gimu,
    /\starget=".*?"/gimu,
    /\sonclick=".*?"/gimu,
    /\sonmouseout=".*?"/
];
const AMP_REGEXES_POST = [
    /border=".*?"/gimu,
    /pic_id=".*?"/gimu,
    /style=".*?"/gimu,
    /style='.*?'/gimu,
    /xml:lang=".*?"/,
    /\sstyle="color:\s#71b8e4;"/,
    /\sstyle="color:\s#71b8e4;\sfont-face:\sbold;\stext-decoration:\snone;"/
];
const AMP_BAD_TAGS = [
    'audio',
    'head',
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
    'code',
    'picture'
];
const AMP_BAD_CLASSES = [
    'mwe-math-fallback-image-inline',
    'sortkey',
    'mw-graph-img',
    'oly_at__img',
    'timeline-wrapper',
    'PopUpMediaTransform'
];
const VALID_VIDEO_EXTENSIONS = [
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
const VALID_AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a'];

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

// Convert the old-style HTML into a JSON
export function oldHTMLtoJSON(oldHTML: string, useAMP: boolean = false): ArticleJson {
    // Replace some problematic unicode characters and other stuff
    REPLACEMENTS.forEach(function(pair) {
        oldHTML = oldHTML.replace(pair.regex, pair.replacement);
    });

    // Quick trim
    oldHTML = oldHTML.trim();

    // Load the HTML into htmlparser2 beforehand since it is more forgiving
    let dom = htmlparser2.parseDOM(oldHTML, { decodeEntities: true });

    // Load the HTML into cheerio for parsing
    let $ = cheerio.load(dom);

    // Convert some stuff to markdown / psuedo-markdown
    $ = markdowner($);

    // Remove bad tags
    const badTagSelectors = ['.thumbcaption .magnify', '.blurb-wrap .thumbinner'];
    badTagSelectors.forEach((selector) => $(selector).remove());

    // ---------------------------------------------------------
    // PAGE TITLE
    // Extract the page title
    const page_title =
        $('h1.page-title')
            .text()
            .trim() || null;

    // ---------------------------------------------------------
    // PAGE METADATA
    // Extract the page metadata
    // Initialize the sub-dictionary
    const metadata: Metadata = { link_count: 1, page_lang: 'en' };

    // Loop through the elements and fill the dictionary
    $('tr.data-pair').each(function() {
        let pairKey = $(this).attr('data-key');
        let pairValue = pyToJS(
            $(this)
                .find('td')
                .eq(1)
                .text()
                .trim()
        );
        metadata[pairKey] = pairValue;
    });

    // ---------------------------------------------------------
    // AMP
    // Do a big AMP sanitization beforehand if applicable
    const amp_info = {
        load_youtube_js: false,
        load_audio_js: false,
        load_video_js: false,
        lightboxes: []
    };
    if (useAMP) {
        // Sanitize the blurb and collect the lightboxes
        let resultDict = ampSanitizer(oldHTML, metadata, 'QmdddTESTTEST_REPLACE_ME', 'en', false);
        amp_info.lightboxes.push(resultDict.lightBoxes);

        // Load the AMP-sanitized HTML into htmlparser2
        dom = htmlparser2.parseDOM(resultDict.text, { decodeEntities: true });

        // Load the AMP-sanitized HTML into cheerio for parsing
        $ = cheerio.load(dom);
    }

    // ---------------------------------------------------------
    // CITATIONS
    // Extract the citations

    // Loop through the elements and fill the dictionary
    const citations = [];
    $('li.link-row').each(function(index, element) {
        // Initialize a blank citation object dictionary
        let citation = {
            url: null,
            thumb: null,
            description: null,
            category: null,
            link_id: 0,
            social_type: null,
            attr: null,
            timestamp: null,
            mime: null,
            in_gallery: false,
            in_blurb: false,
            attribution_url: null,
            media_page_uuid: null,
            comments: []
        };

        // Fetch the citation number
        // citation.link_id = $(this).find(".link-url-citation-number").eq(0).text().trim();
        // Clean up the link_id once and for all
        citation.link_id = metadata['link_count'];

        // Increment the link count
        metadata['link_count'] = metadata['link_count'] + 1;

        // Fetch the description
        let tempDescription = decode(
            $(this)
                .find('.link-description')
                .eq(0)
                .html()
                .trim(),
            'all'
        );

        // Find any links to other pages that appear in the link description
        citation.description = linkCiteSentenceMarkdowner(tempDescription, [], true);

        // Fetch the timestamp
        citation.timestamp =
            $(this)
                .find('.link-timestamp')
                .eq(0)
                .text()
                .trim() || null;

        // Fetch the MIME type
        citation.mime =
            pyToJS(
                $(this)
                    .find('.link-mime')
                    .eq(0)
                    .text()
                    .trim()
            ) || null;

        // Fetch the attribution info
        citation.attr = pyToJS(
            $(this)
                .find('.link-attr')
                .eq(0)
                .text()
                .trim()
        );
        citation.attr = null;

        // Fetch the thumbnail
        citation.thumb = $(this)
            .find('.link-thumb')
            .eq(0)
            .attr('src');
        citation.thumb = null;

        // Fetch the URL & social media type
        const href = $(this)
            .find('.link-url')
            .eq(0)
            .attr('href');
        if (!href) {
            citation.url = null;
            citation.social_type = null;
        } else {
            citation.url = href.trim();
            citation.social_type = socialURLType(citation.url);
        }

        // Find the url category
        citation.category = linkCategorizer(citation.url);

        // Add it to the list
        citations.push(citation);
    });

    // ---------------------------------------------------------
    // MEDIA
    // Extract items from the media gallery, like videos and images
    // These media items will be added to the citations list if they are not already present
    // Initialize the sub-dictionary
    let media = [];

    // Loop through the elements and fill the dictionary
    $('li.media-row').each(function() {
        // Initialize a blank media object dictionary
        let mediaObject = {
            url: null,
            thumb: null,
            caption: null,
            class: null,
            mime: null,
            timestamp: null,
            attribution_url: null,
            media_page_uuid: null,
            comments: []
        };

        // Fetch the caption
        let tempCaption = decode(
            $(this)
                .find('.media-caption')
                .eq(0)
                .html()
                .trim(),
            'all'
        );

        // Find any links to other pages that appear in the caption]
        mediaObject.caption = linkCiteSentenceMarkdowner(tempCaption, [], true);

        // Fetch the classification (IMAGE, YOUTUBE, VIDEO, etc)
        mediaObject.class = $(this)
            .find('.media-class')
            .eq(0)
            .text()
            .trim();

        // Fetch the MIME type
        mediaObject.mime = pyToJS(
            $(this)
                .find('.media-mime')
                .eq(0)
                .text()
                .trim()
        );
        mediaObject.mime = null;

        // Fetch the timestamp
        mediaObject.timestamp = pyToJS(
            $(this)
                .find('.media-timestamp')
                .eq(0)
                .text()
                .trim()
        );

        // Fetch the attribution
        mediaObject.attribution_url =
            pyToJS(
                $(this)
                    .find('.media-ogsource')
                    .eq(0)
                    .text()
                    .trim()
            ) || null;

        // Random ID (for unique identification on the front end), if needed. Changes every time the front end is reloaded
        let mediaUnique = Math.random()
            .toString(36)
            .substring(2);
        mediaObject.media_page_uuid = mediaUnique;

        // Fetch the main and thumbnail URLs depending on the category of the media
        let mediaElement = $(this)
            .find('.media-obj')
            .eq(0);
        switch (mediaObject.class) {
            case 'PICTURE':
            case 'GIF': {
                mediaObject.url = mediaElement.attr('src');
                mediaObject.thumb = mediaElement.attr('data-thumb');
                break;
            }
            case 'YOUTUBE': {
                amp_info.load_youtube_js = true;
                mediaObject.url = mediaElement.attr('data-videourl');
                mediaObject.thumb = mediaElement.attr('src');
                break;
            }
            case 'NORMAL_VIDEO': {
                amp_info.load_video_js = true;
                mediaObject.url = mediaElement
                    .find('source')
                    .eq(0)
                    .attr('src');
                mediaObject.thumb = mediaElement
                    .find('source')
                    .eq(0)
                    .attr('data-thumb');
                break;
            }
            case 'AUDIO': {
                amp_info.load_audio_js = true;
                mediaObject.url = mediaElement
                    .find('source')
                    .eq(0)
                    .attr('src');
                mediaObject.thumb = mediaElement
                    .find('source')
                    .eq(0)
                    .attr('data-thumb');
                break;
            }
            default:
                break;
        }

        // If a media item matches an existing citation, update the latter
        let matchFound = false;
        for (let citeObj of citations) {
            if (citeObj.url == mediaObject.url && citeObj.url && mediaObject.url) {
                if (!citeObj.thumb) {
                    citeObj.thumb = mediaObject.thumb;
                }
                citeObj.category = mediaObject.class;
                citeObj.attribution_url = mediaObject.attribution_url;
                citeObj.media_page_uuid = mediaObject.media_page_uuid;
                citeObj.in_gallery = true;
                matchFound = true;
                break;
            }
        }

        // If no match was found, insert the media object as a citation object
        // remember to use currentLinkID
        if (!matchFound) {
            // Add the media object to the list of links
            media.push({
                url: mediaObject.url,
                thumb: mediaObject.thumb,
                description: mediaObject.caption,
                category: mediaObject.class,
                link_id: metadata['link_count'],
                timestamp: mediaObject.timestamp,
                mime: mediaObject.mime,
                in_gallery: true,
                in_blurb: false,
                attribution_url: mediaObject.attribution_url,
                media_page_uuid: mediaObject.media_page_uuid
            });

            // Increment the link count
            metadata['link_count'] = metadata['link_count'] + 1;
        }
    });

    // ---------------------------------------------------------
    // MAIN PHOTO
    // Start finding the main photo
    // Initialize the Media object
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

    // Find any links to other pages that appear in the caption
    const caption = $('figcaption.main-photo-caption');
    if (caption.length == 0) main_photo.caption = null;
    else {
        const captionText = decode(caption.html().trim(), 'all');
        main_photo.caption = linkCiteSentenceMarkdowner(captionText, [], true);
    }

    // Try to find the photo attribution
    main_photo.attribution_url =
        pyToJS(
            $('.main-photo-og-url')
                .text()
                .trim()
        ) || null;

    // ---------------------------------------------------------
    // BLOBBOX / WIKIPEDIA-INFOBOX
    // Extract the blobbox, which is another name for the Wikipedia-imported infobox
    // NOTE, might need prettifyCorrector() from Python here
    let infobox_html;
    const blobbox = $('div.blobbox-wrap');
    if (blobbox.length == 0) infobox_html = null;
    // no infobox found
    else
        infobox_html = decode(
            $('div.blobbox-wrap')
                .html()
                .trim(),
            'all'
        );

    // ---------------------------------------------------------
    // INFOBOXES
    // Extract the non-Wikipedia infoboxes
    let infoboxes = [];

    // Loop through the plural non-Wikipedia elements first and fill the dictionary
    $('table.ibox-item-plural').each(function() {
        // Initialize a blank object dictionary
        let infoPackage = {
            key: null,
            schema: null,
            addlSchematype: null,
            addlSchemaItemprop: null,
            rows: [],
            comments: []
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
            .find('td.ibox-plural-value')
            .each(function() {
                // Try to find the value
                let tempValue = decode(
                    $(this)
                        .html()
                        .trim(),
                    'all'
                );

                // Find any links to other pages that appear in the caption]
                tempValue = linkCiteSentenceMarkdowner(tempValue, [], true, true);

                // Add the value to the rows
                infoPackage.rows.push(tempValue);
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
            rows: [],
            comments: []
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
            .each(function() {
                // Try to find the value
                let tempValue;
                tempValue = decode(
                    $(this)
                        .html()
                        .trim(),
                    'all'
                );

                // Find any links to other pages that appear in the caption]
                tempValue = linkCiteSentenceMarkdowner(tempValue, [], true, true);

                // Add the value to the rows
                infoPackage.rows.push(tempValue);
            });

        // Add to the infobox list
        infoboxes.push(infoPackage);
    });

    // ---------------------------------------------------------
    // BLURB / MAIN ARTICLE BODY
    // Extract the blurb
    // NOTE, might need prettifyCorrector() from Python here
    const sections = blurbParser(
        decode(
            $('.blurb-wrap')
                .html()
                .trim(),
            'all'
        ),
        citations,
        metadata,
        media
    );

    // Return the dictionary
    return { infobox_html, page_title, sections, main_photo, citations, media, infoboxes, metadata, amp_info };
}

// AMP sanitize a chunk of HTML and return the cleaned HTML, as well as the hoverblurb and citation lightboxes
// Blue links and citation links need to be converted into buttons that trigger lightboxes, which mimic the hover-over
// feature on desktop. GIF <img>'s need to be converted to <amp-anim>, <img> to <amp-img>, and <video> to <amp-video>.
// Also, a regex loop cleans attributes and other bad tags and attributes.
export function ampSanitizer(
    inputString: string,
    pageMetaData: Object,
    currentIPFS: String,
    pageLang: String = 'en',
    bypassRegex: boolean = false
) {
    console.log('NEED TO PARSE NEW MARKDOWN FORMAT!!!');
    console.log('NEED TO PARSE NEW MARKDOWN FORMAT!!!');
    console.log('NEED TO PARSE NEW MARKDOWN FORMAT!!!');
    console.log('NEED TO PARSE NEW MARKDOWN FORMAT!!!');
    console.log('NEED TO PARSE NEW MARKDOWN FORMAT!!!');
    console.log('NEED TO PARSE NEW MARKDOWN FORMAT!!!');
    console.log('NEED TO PARSE NEW MARKDOWN FORMAT!!!');
    console.log('NEED TO PARSE NEW MARKDOWN FORMAT!!!');

    // Set some initial variables
    let localCopy = inputString;
    let ampLightBoxes = [];

    // Do some regex replacements first
    if (!bypassRegex) {
        AMP_REGEXES_PRE.forEach(function(element) {
            localCopy = localCopy.replace(element, '');
        });
    }

    // Load the HTML into htmlparser2 beforehand since it is more forgiving
    const dom = htmlparser2.parseDOM(localCopy, { decodeEntities: true });

    // Load the HTML into cheerio for parsing
    const $ = cheerio.load(dom);

    // Replace tags <font> with <span>
    const replacementTags = [['font', 'span']];
    replacementTags.forEach(function(pair) {
        $(pair[0]).replaceWith($(`<${pair[1]}>${$(this).innerHTML}</${pair[1]}>`));
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

    // Remove tags with bad classes from the HTML
    AMP_BAD_CLASSES.forEach(function(badClass) {
        $(`.${badClass}`).remove();
    });

    // Find the hoverblurb links
    $('a.tooltippable').each(function() {
        // Generate a random string for the tag ID
        let unique_id = Math.random()
            .toString(36)
            .substring(2);

        // Get the slug
        // MAY NEED TO DEAL WITH ENCODING ISSUES LATER
        let theSlug = $(this).attr('data-username');

        // Look for a possible IPFS link
        let theHref = $(this).attr('href');
        let hrefDestinationSlug = '';
        try {
            // Try to find the IPFS hash if it exists
            let IPFSHashCombo = theHref.split('wiki/Qm');
            hrefDestinationSlug = 'Qm' + IPFSHashCombo.slice(1, -1);
        } catch (e) {
            console.log(e);

            // Handle the page language in the URL, if present
            if (theSlug.includes('lang_')) {
                hrefDestinationSlug = theSlug;
            } else {
                hrefDestinationSlug = `lang_${pageLang}/${theSlug}/`;
            }
        }

        // Collect all the interior tags, if any
        // TODO, may not be necessary

        // Get the text of the link
        let anchorText = $(this)
            .text()
            .trim();

        // Create the button that will be substituted
        let openButtonTag = $('<button />');
        $(openButtonTag).addClass('tooltippable');
        $(openButtonTag).attr({
            role: 'button',
            tabindex: 0,
            'aria-label': theSlug,
            'aria-labelledby': `${theSlug}__${unique_id}`,
            on: `tap:hvrblb-${theSlug}__${unique_id}`
        });
        $(openButtonTag).text(anchorText);

        // Replace the <a> tag with a button
        $(this).replaceWith(openButtonTag);

        // Construct the amp-lightbox
        let lightBoxTag = $('<amp-lightbox />');
        $(lightBoxTag).addClass('amp-hc');
        $(lightBoxTag).attr({
            id: `hvrblb-${theSlug}__${unique_id}`,
            role: 'button',
            tabindex: 0,
            on: `tap:hvrblb-${theSlug}__${unique_id}.close`,
            layout: 'nodisplay'
        });

        // Construct the amp-iframe
        let iframeTag = $('<amp-iframe />');
        $(iframeTag).addClass('amp-hc');
        $(iframeTag).attr({
            sandbox: 'allow-same-origin allow-scripts allow-top-navigation',
            frameborder: 0,
            scrolling: 'no',
            layout: 'fill',
            src: `https://www.everipedia.org/AJAX-REQUEST/AJAX_Hoverblurb/${hrefDestinationSlug}/`
        });

        // Placeholder image (leave this here or it will cause stupid AMP problems)
        let placeholderTag = $('<amp-img />');
        $(placeholderTag).attr({
            placeholder: '',
            layout: 'fill',
            src: 'https://epcdn-vz.azureedge.net/static/images/white_dot.png'
        });

        // Put the placeholder inside the iframe
        $(iframeTag).append(placeholderTag);

        // Put the iframe inside of the lightbox
        $(lightBoxTag).append(iframeTag);

        // Add the lightboxes to the list, as text and not a jQuery object
        ampLightBoxes.push($.html(lightBoxTag));
    });

    // Find the citation links
    $('a.tooltippableCarat').each(function() {
        // Generate a random string for the tag ID
        let unique_id = Math.random().toString(36);

        // Encode the URL
        let linkURLEncoded = '';
        try {
            linkURLEncoded = encodeURIComponent($(this).attr('data-username'));
        } catch (e) {
            linkURLEncoded = $(this).attr('data-username');
        }

        // Get the text of the citation
        let anchorText = $(this)
            .text()
            .trim();

        // Create the button that will be substituted
        let openButtonTag = $('<button />');
        $(openButtonTag).addClass('tooltippableCarat');
        $(openButtonTag).attr({
            role: 'button',
            tabindex: 0,
            'aria-label': anchorText,
            'aria-labelledby': `hvrlnk-${unique_id}`,
            on: `tap:hvrlnk-${unique_id}`
        });
        $(openButtonTag).text(anchorText);

        // Replace the <a> tag with a button
        $(this).replaceWith(openButtonTag);

        // Construct the amp-lightbox
        let lightBoxTag = $('<amp-lightbox />');
        $(lightBoxTag).addClass('amp-hc');
        $(lightBoxTag).attr({
            id: `hvrlnk-${unique_id}`,
            role: 'button',
            tabindex: 0,
            on: `tap:hvrlnk-${unique_id}.close`,
            layout: 'nodisplay'
        });

        // Construct the amp-iframe
        let iframeTag = $('<amp-iframe />');
        $(iframeTag).addClass('amp-hc');
        $(iframeTag).attr({
            sandbox: 'allow-same-origin allow-scripts allow-top-navigation',
            height: '275',
            frameborder: 0,
            scrolling: 'no',
            layout: 'fill',
            src: `https://www.everipedia.org/AJAX-REQUEST/AJAX_Hoverlink/${currentIPFS}/?target_url=${linkURLEncoded}`
        });

        // Placeholder image (leave this here or it will cause stupid AMP problems)
        let placeholderTag = $('<amp-img />');
        $(placeholderTag).attr({
            placeholder: '',
            layout: 'fill',
            src: 'https://epcdn-vz.azureedge.net/static/images/white_dot.png'
        });

        // Put the placeholder inside the iframe
        $(iframeTag).append(placeholderTag);

        // Put the iframe inside of the lightbox
        $(lightBoxTag).append(iframeTag);

        // Add the lightboxes to the list, as text and not a jQuery object
        ampLightBoxes.push($.html(lightBoxTag));
    });

    // Convert <img> GIFs into <amp-anim>'s
    $("img[data-mimetype='image/gif']").each(function() {
        // Get the full and thumbnail URLs
        let fullImgSrc = '';
        let thumbImgSrc = '';
        if ($(this).attr('data-src')) {
            fullImgSrc = $(this).attr('data-src');
            thumbImgSrc = $(this).attr('src');
        } else {
            fullImgSrc = $(this).attr('src');
            thumbImgSrc =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
        }

        // Create the amp-anim
        let ampAnimTag = $('<amp-anim />');
        $(ampAnimTag).attr({
            width: 'auto',
            height: '275',
            layout: 'fixed-height',
            'data-mimetype': 'image/gif',
            src: fullImgSrc
        });

        // Create the placeholder / thumbnail image
        let placeholderTag = $('<amp-img />');
        $(placeholderTag).attr({
            layout: 'fill',
            width: '1',
            'data-height': '1',
            src: thumbImgSrc,
            placeholder: ''
        });

        // Put the placeholder inside the amp-anim
        $(ampAnimTag).append(placeholderTag);

        // Replace the <img> GIF with <amp-anim>
        $(this).replaceWith(ampAnimTag);
    });

    // Convert non-GIF <img>'s into <amp-img>'s
    $("img[data-mimetype!='image/gif']", 'img.caption-video').each(function() {
        // If the image isn't a video caption, double check that the mimetype is present and it isn't a GIF
        if (!$(this).hasClass('caption-video')) {
            let patt = new RegExp(/^image\/(?!gif).*$/);
            if (!patt.test($(this).attr('data-mimetype'))) {
                // Skip this element if the regex fails to match
                return true;
            }
        }

        // Get the full and thumbnail URLs
        let fullImgSrc = '';
        let thumbImgSrc = '';
        if ($(this).attr('data-src')) {
            fullImgSrc = $(this).attr('data-src');
            thumbImgSrc = $(this).attr('src');
        } else {
            fullImgSrc = $(this).attr('src');
            thumbImgSrc =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
        }

        // Create the amp-img
        let ampImgTag = $('<amp-img />');
        $(ampImgTag).attr({
            width: 'auto',
            height: '275',
            layout: 'fixed-height',
            'data-mimetype': $(this).attr('data-mimetype'),
            src: fullImgSrc
        });

        // Create the placeholder / thumbnail image
        let placeholderTag = $('<amp-img />');
        $(placeholderTag).attr({
            layout: 'fill',
            width: '1',
            'data-height': '1',
            src: thumbImgSrc,
            placeholder: ''
        });

        // Put the placeholder inside the amp-img
        $(ampImgTag).append(placeholderTag);

        // Replace the <img> with <amp-img>
        $(this).replaceWith(ampImgTag);

        return true; // to silence errors
    });

    // Convert <video> to <amp-video>
    $('video').each(function() {
        // Create the amp-img
        let ampVideoTag = $('<amp-video />');
        $(ampVideoTag).attr({
            width: 'auto',
            height: '250',
            layout: 'fixed-height',
            preload: 'metadata',
            'data-mimetype': $(this).attr('data-mimetype')
        });
        $(ampVideoTag).text(' ');

        // Create the source tag
        let sourceTag = $('<source />');
        $(sourceTag).attr({
            src: $(this).attr('src') + '#t=0.1',
            type: $(this).attr('data-mimetype')
        });

        // Put the source inside the amp-video
        $(ampVideoTag).append(sourceTag);

        // Replace the <video> with <amp-video>
        $(this).replaceWith(ampVideoTag);
    });

    // Check for remaining images in the HTML and make sure they have heights and widths
    $('img', 'amp-img').each(function() {
        let useFixTag = false;

        // Make sure the image has a valid height
        if ($(this).attr('height')) {
            // Percentage signs in heights cause problems
            if ($(this).attr('height') == '100%') {
                $(this).attr('height', 275);
                useFixTag = true;
            }
        } else {
            // Set the height manually
            $(this).attr('height', 275);
            useFixTag = true;
        }

        // Make sure the image has a valid width
        if ($(this).attr('width')) {
            // Percentage signs in widths cause problems
            if ($(this).attr('width') == '100%') {
                $(this).attr('width', 275);
                useFixTag = true;
            }
        } else {
            // Set the width manually
            $(this).attr('width', 275);
            useFixTag = true;
        }

        if (useFixTag) {
            // Create the placeholder / thumbnail image
            let ampFixTag = $('<div />');
            $(ampFixTag).addClass('amp-san-picfix');
            let theContents = $(this).replaceWith(ampFixTag);
            $(ampFixTag).append(theContents);
        }

        // Cleans up remaining images (mainly from wikipedia imports). Will fail for GIF
        if ($(this).tagName == 'img') {
            if (!$(this).attr('placeholder')) {
                // Create the amp-img
                let ampImgTag = $('<amp-img />');
                $(ampImgTag).attr({
                    width: $(this).attr('width'),
                    height: $(this).attr('height'),
                    layout: 'fixed',
                    src: $(this).attr('src')
                });
                $(ampImgTag).text(' ');
            }
        }
    });

    // Set the output to a string instead of a jQuery / cheerio object
    let outputHTML = decode($.html(), 'all');

    // Do some regex replacements again
    if (!bypassRegex) {
        AMP_REGEXES_POST.forEach(function(element) {
            outputHTML = outputHTML.replace(element, '');
        });
    }

    // Return the amp-sanitized text as well as the list of amp-lightboxes
    return { text: outputHTML, lightBoxes: ampLightBoxes };
}

// Turn the HTML blurb into a JSON dict
export function blurbParser(inputString: string, citations: Citation[], metadata: any, media: Media[]) {
    // Load the HTML into htmlparser2 beforehand since it is more forgiving
    // Note the dummy document
    const dom = htmlparser2.parseDOM(
        `<html><head></head><body><div class="blurb-wrap">${inputString}</div></body></html>`,
        { decodeEntities: true }
    );

    // Load the HTML into cheerio for parsing
    let $ = cheerio.load(dom);

    // Get the body
    let theBody = $('.blurb-wrap');

    // Check for wikipedia divs
    if ($('.mw-parser-output').length > 0) {
        theBody = $('.mw-parser-output')[0];
    } else if ($('.mw-content-ltr').length > 0) {
        theBody = $('.mw-content-ltr')[0];
    }

    // Create the sections array
    let sections = [];

    // Fix certain elements
    $(theBody)
        .children('div.thumb')
        .each(function(index, element) {
            // Find the inline photo, if present
            let innerInlinePhoto = $(this)
                .find('.blurb-inline-image-container')
                .eq(0);

            // Replace the div.thumb with the inline image
            $(this).replaceWith(innerInlinePhoto);
        });

    // Fix <center> elements
    $(theBody)
        .children('center')
        .each(function(index, element) {
            // Replace the center with all of its contents
            $(this).replaceWith($(element).contents());
        });

    // Fix <div> elements
    $(theBody)
        .children('div')
        .each(function(index, element) {
            // Convert the div to a <p>
            $(element).replaceWith('<p>' + $(element).html() + '</p>');
        });

    // Set up the first section
    sections.push({ paragraphs: [] });

    // Loop through all of the first-level children
    $(theBody)
        .children()
        .each(function(index, element) {
            // Initialize a blank dictionary for the first level
            let paragraph = {
                index: index,
                items: [],
                tag_type:
                    $(this)
                        .prop('tagName')
                        .toLowerCase() || null,
                attrs: this.attribs
            };

            // Process the tag types accordingly
            switch (paragraph.tag_type) {
                // Paragraphs and divs
                case 'blockquote':
                case 'p': {
                    // Get the sentences
                    paragraph.items = linkCiteSentenceMarkdowner($(this).text(), citations);
                    break;
                }
                // Headings
                case String(paragraph.tag_type.match(/h[1-6]/gimu)): {
                    // Get the sentences
                    sections.push({ paragraphs: [] });
                    paragraph.items = linkCiteSentenceMarkdowner($(this).text(), citations, true, true);
                    break;
                }
                // Lists
                case String(paragraph.tag_type.match(/(ul|ol)/gimu)): {
                    // Initialize the return array
                    let listItems = [];

                    // Loop through the li's
                    $(element)
                        .children('li')
                        .each(function(innerIndex, innerElem) {
                            // Get the sentences
                            listItems.push({
                                index: innerIndex,
                                sentences: linkCiteSentenceMarkdowner($(innerElem).text(), citations)
                            });
                        });

                    // Set the items
                    paragraph.items = listItems;
                    break;
                }
                // Inline images
                case 'table': {
                    // Initialize the return object
                    let paragraph_item: any;

                    // get the the HTML classes
                    const classes = paragraph.attrs.class;

                    // if there's no class, ignore the table
                    if (!classes) break;

                    // See what type of table it is
                    for (let testClass of classes.split(/\s+/)) {
                        // Test for the inline images
                        if (testClass.includes('blurb-inline-image-container')) {
                            // Get the image node
                            let theImgNode = $(element)
                                .find('img.caption-img, img.tooltippableImage')
                                .eq(0);

                            // Initialize the objects
                            const image: Media = {
                                type: 'inline-image',
                                url: $(theImgNode).attr('src'),
                                mime: $(theImgNode).attr('data-mimetype'),
                                thumb: null,
                                caption: null
                            };

                            paragraph_item = { type: 'inline-image', link_id: null };

                            // Get the caption
                            // Set the caption node
                            let captionNode = $(this)
                                .find('.blurbimage-caption')
                                .eq(0);

                            // Remove the .magnify div, if present (applies to some Wikipedia imports)
                            $(captionNode)
                                .find('.blurbimage-caption .magnify')
                                .eq(0)
                                .remove();

                            // Unwrap the thumbcaption, if present (applies to some Wikipedia imports)
                            $(captionNode)
                                .children('.thumbcaption')
                                .each(function(index, element) {
                                    $(captionNode).html($(this).html());
                                });

                            // Set the caption
                            image.caption = linkCiteSentenceMarkdowner(
                                $(captionNode)
                                    .text()
                                    .trim(),
                                [],
                                true,
                                false
                            );

                            // Decode the URL
                            let decodedURL = decodeURIComponent(image.url);

                            // Find the URL in the global citations list, if applicable
                            let theLinkID: number = -1;
                            for (let element of citations) {
                                if (element.url == decodedURL && element.url && decodedURL) {
                                    theLinkID = element.link_id;
                                    element.in_blurb = true;
                                    break;
                                }
                            }

                            // Orphaned images need to be added to the link list
                            if (theLinkID == -1) {
                                // Set the linkID
                                theLinkID = metadata.link_count;
                                paragraph_item.link_id = theLinkID;
                                image.link_id = theLinkID;

                                // Construct the filename
                                if (image.url.includes('wikipedia')) {
                                    let theAttributionURL = null;
                                    theAttributionURL = image.url.split('/').pop();
                                    theAttributionURL = `https://${
                                        metadata.page_lang
                                    }.wikipedia.org/wiki/File:${image.url.split('/').pop()}`;
                                    image.attribution_url = theAttributionURL;
                                }

                                // Add the media object to the list of media links
                                media.push(image);

                                // Increment the link count
                                metadata.link_count++;
                            }
                        } else if (testClass.includes('wikitable') || testClass.includes('ep-table')) {
                            // Set the objects
                            let tableObj = {
                                type: 'wikitable',
                                table: {
                                    caption: null,
                                    colgroup: null,
                                    thead: {
                                        attrs: [],
                                        rows: [],
                                        comments: []
                                    },
                                    tbody: {
                                        attrs: [],
                                        rows: [],
                                        comments: []
                                    },
                                    tfoot: {
                                        attrs: [],
                                        rows: [],
                                        comments: []
                                    }
                                }
                            };

                            // Set the table caption, if present
                            $(element)
                                .children('caption')
                                .each(function(index, element) {
                                    let tempValue = $(this)
                                        .html()
                                        .trim();
                                    tableObj.table.caption = linkCiteSentenceMarkdowner(tempValue, [], true, true);
                                });

                            // Deal with the colgroup
                            // TODO

                            // Loop through the head, body, and foot
                            $(element)
                                .children('thead, tbody, tfoot')
                                .each(function(innerIndex, innerElement) {
                                    // Find the tag name (thead, tbody, or tfoot)
                                    let theTagName =
                                        $(innerElement)
                                            .prop('tagName')
                                            .toLowerCase() || null;

                                    // Push the attributes into the parent object
                                    tableObj.table[theTagName].attrs = innerElement.attribs;

                                    // Loop through the tr's
                                    let rowList = [];
                                    $(innerElement)
                                        .children('tr')
                                        .each(function(rowIdx, rowElem) {
                                            // Initialize a row object
                                            let rowObj = {
                                                index: rowIdx,
                                                attrs: rowElem.attribs,
                                                comments: [],
                                                cells: null
                                            };

                                            // Loop through the cells
                                            let cellList = [];
                                            $(rowElem)
                                                .children('th, td')
                                                .each(function(cellIdx, cellElem) {
                                                    // Find the tag name (th or td)
                                                    let theCellTagName =
                                                        $(cellElem)
                                                            .prop('tagName')
                                                            .toLowerCase() || null;

                                                    // Initialize a cell object
                                                    let cellObj = {
                                                        index: cellIdx,
                                                        attrs: cellElem.attribs,
                                                        tag_type: theCellTagName,
                                                        comments: [],
                                                        contents: null
                                                    };

                                                    // Process / Markdown the cell contents
                                                    let tempValue = $(cellElem)
                                                        .text()
                                                        .trim();
                                                    cellObj.contents = linkCiteSentenceMarkdowner(
                                                        tempValue,
                                                        [],
                                                        true,
                                                        true
                                                    );

                                                    // Add the cell object to the list of cells
                                                    cellList.push(cellObj);
                                                });

                                            // Add the cells to the row object
                                            rowObj.cells = cellList;

                                            // Add the row object to the list of rows
                                            rowList.push(rowObj);
                                        });

                                    // Push the rows into the parent object
                                    tableObj.table[theTagName].rows = rowList;
                                });

                            // Set the return object to the table object
                            paragraph_item = tableObj;
                        }
                    }

                    // Return the object
                    paragraph.items.push(paragraph_item);
                    break;
                }
                default:
                    break;
            }
            // Add the object to the array
            sections[sections.length - 1].paragraphs.push(paragraph);
        });

    return sections;
}

// Take a jQuery / cheerio object and convert some of its HTML to Markdown
export function markdowner(cheerioInput: cheerio) {
    // Set the dollar sign
    let $ = cheerioInput;

    // Substitute all the links and citations into something that is safe for the parser
    $('a.tooltippable, a.tooltippableCarat').each(function() {
        // Construct a dictionary
        let toolObj = {
            type: '',
            username: encodeURIComponent($(this).attr('data-username')).replace(/\./gimu, '%2E'),
            href: encodeURIComponent($(this).attr('href')).replace(/\./gimu, '%2E') || '',
            string: ''
        };

        // Find the type
        if ($(this).hasClass('tooltippableCarat')) {
            toolObj.type = 'CITATION';
        } else {
            toolObj.type = 'LINK';
        }

        // Set the string
        toolObj.string =
            $(this)
                .text()
                .trim() || '';

        // Create the string
        let plaintextString = `__~${toolObj.type}__~~~USERNAME:${toolObj.username}~-~HREF:${toolObj.href}~-~STRING:${
            toolObj.string
        }~~~__${toolObj.type}~__`;

        // Replace the tag with the string
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

    // Convert images inside wikitables to markup
    $('.wikitable img').each(function() {
        // Construct a dictionary
        let imgObj = {
            type: 'INLINE_IMAGE',
            src: encodeURIComponent($(this).attr('src')).replace(/\./gimu, '%2E') || '',
            height: $(this).attr('height'),
            width: $(this).attr('width'),
            alt: encodeURIComponent($(this).attr('alt'))
        };

        // Create the string
        let plaintextString = `__~${imgObj.type}__~~~SRC:${imgObj.src}~-~HEIGHT:${imgObj.height}~-~WIDTH:${
            imgObj.width
        }~-~WIDTH:${imgObj.alt}~~~__${imgObj.type}~__`;

        // Replace the tag with the string
        $(this).replaceWith(plaintextString);
    });

    return $;
}

// Convert the plaintext strings for links and citations to the Markdown format
export function linkCiteSentenceMarkdowner(
    inputString: string,
    linksList: any[],
    addPeriod: boolean = false,
    removePeriod: boolean = false
): Sentence[] {
    if (!inputString) return [];

    // Make sure the sentence ends in a period
    if (addPeriod) {
        // NEED TO CHECK THIS FOR CHINESE AND OTHER LANGUAGES
        inputString = inputString.endsWith('.') ? inputString : inputString + '.';
    }

    // Create the sentence tokens
    let sentenceTokens = splitSentences(inputString);

    // Each sentence needs to be a dictionary
    // Need to text replace placeholders for citations and links
    return sentenceTokens.map(function(token, index) {
        // Initialize the return object
        let sentence = { type: 'sentence', index: index, text: token, comments: [], links: [] };

        // Deal with the links and citations
        // https://davidwalsh.name/string-replace-javascript
        let increment = 0;
        // There is an implicit loop here...
        sentence.text = token.replace(CAPTURE_REGEXES.linkcite, (match, $1, $2, $3, $4, index) => {
            // Fill the correct array and construct the replacement string
            let replacementString = '';
            switch ($1) {
                case 'LINK': {
                    // Add the link to the array
                    sentence.links.push({
                        index: increment,
                        slug: $2,
                        href: $3,
                        string: $4
                    });

                    // Construct the replacement string
                    replacementString = `[[${$1}|${increment}|${$4}]]`;

                    // Increment
                    increment = increment + 1;
                    break;
                }
                case 'CITATION': {
                    // Decode the URL
                    let decodedURL = decodeURIComponent($2);

                    // Find the URL in the global links list
                    let theLinkID = null;
                    for (let element of linksList) {
                        if (element.url == decodedURL) {
                            theLinkID = element.link_id;
                            break;
                        }
                    }

                    // Construct the replacement string
                    if (theLinkID) {
                        // Construct the replacement string
                        replacementString = `[[${$1}|${theLinkID}]]`;
                    } else {
                        // Remove the citation
                        replacementString = '';
                    }

                    break;
                }
                default:
                    break;
            }

            // Replace the link with the bracket
            return replacementString;
        });

        // Remove the period if applicable
        sentence.text = removePeriod ? sentence.text.slice(0, -1) : sentence.text;

        // Quick regex clean
        sentence.text = sentence.text.replace(/ {1,}/gimu, ' ');

        // Return the object
        return sentence;
    });
}

// See if a given URL is a social media URL. If so, return the type
export function socialURLType(inputURL: string) {
    // Set the return type
    let returnSocialType = null;

    // Loop through the regexes
    let isExcluded = false;
    for (let regexPack of SOCIAL_MEDIA_REGEXES) {
        // See if the URL matches one of the regexes
        if (inputURL.match(regexPack.regex)) {
            // Make sure it doesn't match one of the exclusions
            for (let exclusion of regexPack.exclusions) {
                if (inputURL.match(exclusion)) {
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
                returnSocialType = regexPack.type;
                break;
            }
        }
    }
    return returnSocialType;
}

function splitSentences(text: string): Array<string> {
    const matches = text.match(
        /([\"\'\‘\“\'\"\[\(\{\⟨][^\.\?\!]+[\.\?\!][\"\'\’\”\'\"\]\)\}\⟩]|[^\.\?\!]+[\.\?\!\s]*)/g
    );
    if (!matches) return [text];
    return matches.map((sentence) => sentence.trim());
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
    } else if (getYouTubeIdIfPresent(inputString)) {
        return 'YOUTUBE';
    } else if (VALID_VIDEO_EXTENSIONS.includes(theExtension)) {
        return 'NORMAL_VIDEO';
    } else if (VALID_AUDIO_EXTENSIONS.includes(theExtension)) {
        return 'AUDIO';
    } else {
        return 'NONE';
    }
}

function getYouTubeIdIfPresent(inputURL: string) {
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
