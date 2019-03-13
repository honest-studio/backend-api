import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import * as htmlparser2 from 'htmlparser2';
import { WikiLink, Sentence, Section, ArticleJson, Media, Citation, Metadata, Infobox, Table } from './article-dto';
import * as mimePackage from 'mime';
const decode = require('unescape');

// constants
const ROOT_DIR = path.join(__dirname, '../..');
const CAPTURE_REGEXES = {
    link: /(?<=\[\[)LINK\|[^\]]*(?=\]\])/gimu,
    cite: /(?<=\[\[)CITE\|[^\]]*(?=\]\])/gimu,
    inline_image: /(?<=\[\[)INLINE_IMAGE\|[^\]]*(?=\]\])/gimu
};
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

    // Remove useless and empty tags and HTML
    // Convert text formatting to pseudo-markdown
    // Converts link and citation HTML to clean parseable formats
    $ = sanitizeText($);

    const metadata = extractMetadata($);

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

    const page_title =
        $('h1.page-title')
            .text()
            .trim() || null;
    const citations = extractCitations($);
    const media_gallery = extractMediaGallery($);
    const main_photo = extractMainPhoto($);
    let infobox_html = extractInfoboxHtml($);
    const infoboxes = extractInfoboxes($);

    // mark all the citations with the appropriate number in the text
    $ = markCitations($, citations);

    const page_body = extractPageBody($);

    // Deal with citation + media matches
    // If a media item matches an existing citation, update the latter
    //for (let citeObj of citations) {
    //    if (citeObj.url == medium.url && citeObj.url && medium.url) {
    //    }
    //}

    // Return the dictionary
    return { infobox_html, page_title, page_body, main_photo, citations, media_gallery, infoboxes, metadata, amp_info };
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
        $(openButtonTag).attr('role', 'button');
        $(openButtonTag).attr('tabindex', 0);
        $(openButtonTag).attr('aria-label', theSlug);
        $(openButtonTag).attr('aria-labelledby', `${theSlug}__${unique_id}`);
        $(openButtonTag).attr('on', `tap:hvrblb-${theSlug}__${unique_id}`);
        $(openButtonTag).text(anchorText);

        // Replace the <a> tag with a button
        $(this).replaceWith(openButtonTag);

        // Construct the amp-lightbox
        let lightBoxTag = $('<amp-lightbox />');
        $(lightBoxTag).addClass('amp-hc');
        $(lightBoxTag).attr('id', `hvrblb-${theSlug}__${unique_id}`);
        $(lightBoxTag).attr('role', 'button');
        $(lightBoxTag).attr('tabindex', 0);
        $(lightBoxTag).attr('on', `tap:hvrblb-${theSlug}__${unique_id}.close`);
        $(lightBoxTag).attr('layout', 'nodisplay');

        // Construct the amp-iframe
        let iframeTag = $('<amp-iframe />');
        $(iframeTag).addClass('amp-hc');
        $(iframeTag).attr('sandbox', 'allow-same-origin allow-scripts allow-top-navigation');
        $(iframeTag).attr('frameborder', 0);
        $(iframeTag).attr('scrolling', 'no');
        $(iframeTag).attr('layout', 'fill');
        $(iframeTag).attr('src', `https://www.everipedia.org/AJAX-REQUEST/AJAX_Hoverblurb/${hrefDestinationSlug}/`);

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
        $(openButtonTag).attr('role', 'button');
        $(openButtonTag).attr('tabindex', 0);
        $(openButtonTag).attr('aria-label', anchorText);
        $(openButtonTag).attr('aria-labelledby', `hvrlnk-${unique_id}`);
        $(openButtonTag).attr('on', `tap:hvrlnk-${unique_id}`);
        $(openButtonTag).text(anchorText);

        // Replace the <a> tag with a button
        $(this).replaceWith(openButtonTag);

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
        $(ampAnimTag).attr('width', 'auto');
        $(ampAnimTag).attr('height', '275');
        $(ampAnimTag).attr('layout', 'fixed-height');
        $(ampAnimTag).attr('data-mimetype', 'image/gif');
        $(ampAnimTag).attr('src', fullImgSrc);

        // Create the placeholder / thumbnail image
        let placeholderTag = $('<amp-img />');
        $(placeholderTag).attr('layout', 'fill');
        $(placeholderTag).attr('width', '1');
        $(placeholderTag).attr('data-height', '1');
        $(placeholderTag).attr('src', thumbImgSrc);
        $(placeholderTag).attr('placeholder', '');

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
        $(ampImgTag).attr('width', 'auto');
        $(ampImgTag).attr('height', '275');
        $(ampImgTag).attr('layout', 'fixed-height');
        $(ampImgTag).attr('data-mimetype', $(this).attr('data-mimetype'));
        $(ampImgTag).attr('src', fullImgSrc);

        // Create the placeholder / thumbnail image
        let placeholderTag = $('<amp-img />');
        $(placeholderTag).attr('layout', 'fill');
        $(placeholderTag).attr('width', '1');
        $(placeholderTag).attr('data-height', '1');
        $(placeholderTag).attr('src', thumbImgSrc);
        $(placeholderTag).attr('placeholder', '');

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
        $(ampVideoTag).attr('width', 'auto');
        $(ampVideoTag).attr('height', '250');
        $(ampVideoTag).attr('layout', 'fixed-height');
        $(ampVideoTag).attr('preload', 'metadata');
        $(ampVideoTag).attr('data-mimetype', $(this).attr('data-mimetype'));
        $(ampVideoTag).text(' ');

        // Create the source tag
        let sourceTag = $('<source />');
        $(sourceTag).attr('src', $(this).attr('src') + '#t=0.1');
        $(sourceTag).attr('type', $(this).attr('data-mimetype'));

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
        if (this.tagName == 'img') {
            if (!$(this).attr('placeholder')) {
                // Create the amp-img
                let ampImgTag = $('<amp-img />');
                $(ampImgTag).attr('width', $(this).attr('width'));
                $(ampImgTag).attr('height', $(this).attr('height'));
                $(ampImgTag).attr('layout', 'fixed');
                $(ampImgTag).attr('src', $(this).attr('src'));
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
export function extractPageBody($: CheerioStatic): Section[] {
    // Get the body
    // First 2 are wikipedia divs
    // Default is everipedia body
    let $body;
    if ($('.mw-parser-output').length > 0) $body = $($('.mw-parser-output')[0]);
    else if ($('.mw-content-ltr').length > 0) $body = $($('.mw-content-ltr')[0]);
    else $body = $('.blurb-wrap');

    // Split body into sections
    let sections: Section[] = splitIntoSections($body).map(parseSection);

    return sections;
}

function extractMetadata($: CheerioStatic): Metadata {
    const metadata: any = {};
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
            metadata[pairKey] = pairValue;
        }
    });

    return metadata;
}

function extractCitations($: CheerioStatic): Citation[] {
    const citations = [];
    $('li.link-row').each(function(index, element) {
        let citation: any = {};

        // Fetch the citation number
        citation.citation_id = citations.length;

        // Fetch the description
        let descriptionText = decode(
            $(element)
                .find('.link-description')
                .eq(0)
                .text()
                .trim(),
            'all'
        );

        // Find any links to other pages that appear in the link description
        citation.description = parseSentences(descriptionText);

        // Fetch the timestamp
        citation.timestamp =
            $(element)
                .find('.link-timestamp')
                .eq(0)
                .text()
                .trim() || null;

        // Fetch the MIME type
        citation.mime =
            pyToJS(
                $(element)
                    .find('.link-mime')
                    .eq(0)
                    .text()
                    .trim()
            ) || null;

        // Fetch the attribution info
        citation.attribution = pyToJS(
            $(element)
                .find('.link-attr')
                .eq(0)
                .text()
                .trim()
        );

        // Fetch the thumbnail
        citation.thumb = $(element)
            .find('.link-thumb')
            .eq(0)
            .attr('src');

        // Fetch the URL & social media type
        let href = $(element)
            .find('.link-url')
            .attr('href');
        if (!href)
            href = $(element)
                .find('.link-url-wrap')
                .text();

        if (href) {
            citation.url = href.trim();
            citation.social_type = socialURLType(citation.url);
        }

        // Find the url category
        citation.category = linkCategorizer(citation.url);

        // Add it to the list
        citations.push(citation);
    });

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
        media.type = $(this)
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
        switch (media.type) {
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

function extractMainPhoto($: CheerioStatic): Media {
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
        main_photo.caption = parseSentences(captionText);
    }

    // Try to find the photo attribution
    main_photo.attribution_url =
        pyToJS(
            $('.main-photo-og-url')
                .text()
                .trim()
        ) || null;

    return main_photo;
}

function extractInfoboxHtml($: CheerioStatic): string {
    const blobbox = $('div.blobbox-wrap');

    // no infobox found
    if (blobbox.length == 0) return null;

    const html = decode(
        $('div.blobbox-wrap')
            .html()
            .trim(),
        'all'
    );

    return html;
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
            rows: []
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
                tempValue = parseSentences(tempValue);

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
            rows: []
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
                tempValue = parseSentences(tempValue);

                // Add the value to the rows
                infoPackage.rows.push(tempValue);
            });

        // Add to the infobox list
        infoboxes.push(infoPackage);
    });

    return infoboxes;
}

function splitIntoSections($body: Cheerio): Cheerio[] {
    const bodyHtml = $body.html();
    return bodyHtml
        .split(/(?=<h[1-6])/gimu)
        .map((htmlSection) => htmlSection.trim())
        .map((htmlSection) => `<div class="section">${htmlSection}</div>`)
        .map((htmlSection) => cheerio.load(htmlSection))
        .map(($) => $('.section'));
}

function parseSection($section: Cheerio): Section {
    const section = { paragraphs: [], images: [] };

    // Get all images
    const $fixed_images = $section.find('.blurb-inline-image-container');
    $fixed_images.each((i, fixed_image_node) => {
        const $image = $fixed_images.eq(i);

        // Get the image node
        let theImgNode = $image.find('img.caption-img, img.tooltippableImage').eq(0);

        // Initialize the objects
        const image: Media = {
            type: 'fixed_image',
            url: theImgNode.attr('src'),
            mime: theImgNode.attr('data-mimetype'),
            thumb: null,
            caption: null
        };

        // Deal with images in tables
        if (!image.url) {
            const inline_image_token = $image.html().match(CAPTURE_REGEXES.inline_image);
            if (inline_image_token) {
                const parts = inline_image_token[0].split('|');
                image.url = parts[1];
                image.alt = parts[2];
                image.height = Number(parts[3].substring(1));
                image.width = Number(parts[4].substring(1));
                image.type = 'inline_image';
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
        if (image.url) image.url = decodeURIComponent(image.url);

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
        else if (paragraph.tag_type.match(/h[1-6]/gimu)) paragraph.items = parseSentences($element.text());
        // Lists
        else if (paragraph.tag_type.match(/(ul|ol)/gimu)) {
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

            const table = parseTable($element);
            paragraph.items.push(table);
        }

        // Add the object to the array
        section.paragraphs.push(paragraph);
    }

    return section;
}

// Sanitize a cheerio object and convert some of its HTML to Markdown
function sanitizeText($: CheerioStatic) {
    // Substitute all the links into something that is safe for the parser
    $('a.tooltippable ').each(function() {
        let old_slug = decodeURIComponent($(this).attr('data-username'));
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

    // Add whitespace after links when there's no space and it's followed by a letter
    const spaced_links = $.html().replace(/\[\[LINK\|[^\]]*\]\][a-zA-Z]/gimu, (token) => `${token} `);

    // Substitute all the citations into something that is safe for the parser
    $('a.tooltippableCarat').each(function() {
        const url = decodeURIComponent($(this).attr('data-username'));
        const plaintextString = `[[CITE|0|${url}]]`;
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
        const src = $(this).attr('src');
        const height = $(this).attr('height');
        const width = $(this).attr('width');
        const alt = $(this).attr('alt');

        // Replace the tag with the string
        const plaintextString = `[[INLINE_IMAGE|${src}|${alt}|h${height}|w${width}]]`;
        $(this).replaceWith(plaintextString);
    });

    // Remove bad tags
    const badTagSelectors = ['.thumbcaption .magnify', '.blurbimage-caption .magnify', '.blurb-wrap .thumbinner'];
    badTagSelectors.forEach((selector) => $(selector).remove());

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

    return $;
}

// Convert the plaintext strings for links and citations to the Markdown format
export function parseSentences(inputString: string): Sentence[] {
    if (!inputString) return [];

    // Create the sentence tokens
    const sentenceTokens = splitSentences(inputString);

    // Each sentence needs to be a dictionary
    // Need to text replace placeholders for citations and links
    return sentenceTokens.map(function(token, index) {
        // Initialize the return object
        let sentence = { type: 'sentence', index: index, text: token };

        // Quick regex clean
        sentence.text = sentence.text.replace(/ {1,}/gimu, ' ');

        // Return the object
        return sentence;
    });
}

// See if a given URL is a social media URL. If so, return the type
export function socialURLType(inputURL: string) {
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
        {
            type: 'myspace',
            regex: /myspace.com/gimu,
            exclusions: [/myspace.com\/.*\/.*/gimu, /blogs.myspace.com\/.*/gimu]
        },
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
    const splits = text.split(/(?<=[.!?]\s)/gm);
    return splits.map((split) => split.trim()).filter(Boolean);
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
    } else if (youtubeIdExists(inputString)) {
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
function youtubeIdExists(url: string) {
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
            return true;
        }
    }
    return false;
}

function markCitations($: CheerioStatic, citations: Citation[]): CheerioStatic {
    const cleaned_text = $.html().replace(CAPTURE_REGEXES.cite, (token) => {
        const parts = token.split('|');
        const url = parts[2];
        const link_id = citations.findIndex((cite) => cite.url == url);
        return `CITE|${link_id}|${url}`;
    });

    return cheerio.load(cleaned_text);
}

function parseTable($element: Cheerio): Table {
    const table: any = {
        type: 'wikitable'
    };

    // Set the table caption, if present
    const $caption = $element.children('caption');
    if ($caption.length > 0) table.caption = $caption.html().trim();

    // Deal with the colgroup
    // TODO

    // Setup the head, body, and foot
    const $table_containers = $element.children('thead, tbody, tfoot');
    for (let j = 0; j < $table_containers.length; j++) {
        const $table_container = $table_containers.eq(j);

        // Find the tag name (thead, tbody, or tfoot)
        let theTagName = $table_container[0].tagName.toLowerCase() || null;

        // Push the attributes into the parent object
        table[theTagName] = {
            attrs: $table_container[0].attribs,
            rows: []
        };
    }

    // Add the rows and cells
    const $rows = $element.find('tr');
    $rows.each(function(i, row) {
        const parentTag = row.parentNode.tagName;
        table[parentTag].rows.push({
            index: i,
            attrs: row.attribs,
            cells: []
        });

        const $cells = $rows.eq(i).find('td, th');
        $cells.each(function(j, cell) {
            table[parentTag].rows[i].cells.push({
                index: j,
                attrs: cell.attribs,
                tag_type: cell.tagName.toLowerCase(),
                // a lot of useless HTML tags are getting stripped out here when we grab only the text.
                // it's possible those HTML divs may contain useful content for a few articles.
                // if that turns out to be the case, this logic needs to be more complex.
                content: parseSentences(
                    $cells
                        .eq(j)
                        .text()
                        .trim()
                )
            });
        });
    });

    return table;
}
