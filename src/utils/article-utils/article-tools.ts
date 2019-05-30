import { Citation, Media, ArticleJson, Sentence, Paragraph, ListItem, Table, TableCaption, TableRow, TableCell, NestedContentItem } from './article-dto';
import { SeeAlso, SeeAlsoCollection, InlineImage } from './article-types';
import { AMPParseCollection, LanguagePack } from './article-types';
import cheerio from 'cheerio';
import crypto from 'crypto';
import decode from 'unescape';
import urlSlug from 'url-slug';
import tag from 'html-tag';
import striptags from 'striptags';
const normalizeUrl = require('normalize-url');
import MarkdownIt from 'markdown-it';
import * as htmlparser2 from 'htmlparser2';
import {
    getYouTubeID,
    CAPTURE_REGEXES,
} from './article-converter';

// From react-attr-converter
const ReactAttrConvertMap = { 
    htmlFor: 'for',
    className: 'class',
    accept: 'accept',
    acceptCharset: 'acceptcharset',
    accessKey: 'accesskey',
    action: 'action',
    allowFullScreen: 'allowfullscreen',
    allowTransparency: 'allowtransparency',
    alt: 'alt',
    async: 'async',
    autoComplete: 'autocomplete',
    autoFocus: 'autofocus',
    autoPlay: 'autoplay',
    capture: 'capture',
    cellPadding: 'cellpadding',
    cellSpacing: 'cellspacing',
    challenge: 'challenge',
    charSet: 'charset',
    checked: 'checked',
    cite: 'cite',
    classID: 'classid',
    colSpan: 'colspan',
    cols: 'cols',
    content: 'content',
    contentEditable: 'contenteditable',
    contextMenu: 'contextmenu',
    controls: 'controls',
    coords: 'coords',
    crossOrigin: 'crossorigin',
    data: 'data',
    dateTime: 'datetime',
    default: 'default',
    defer: 'defer',
    dir: 'dir',
    disabled: 'disabled',
    download: 'download',
    draggable: 'draggable',
    encType: 'enctype',
    form: 'form',
    formAction: 'formaction',
    formEncType: 'formenctype',
    formMethod: 'formmethod',
    formNoValidate: 'formnovalidate',
    formTarget: 'formtarget',
    frameBorder: 'frameborder',
    headers: 'headers',
    height: 'height',
    hidden: 'hidden',
    high: 'high',
    href: 'href',
    hrefLang: 'hreflang',
    httpEquiv: 'httpequiv',
    icon: 'icon',
    id: 'id',
    inputMode: 'inputmode',
    integrity: 'integrity',
    is: 'is',
    keyParams: 'keyparams',
    keyType: 'keytype',
    kind: 'kind',
    label: 'label',
    lang: 'lang',
    list: 'list',
    loop: 'loop',
    low: 'low',
    manifest: 'manifest',
    marginHeight: 'marginheight',
    marginWidth: 'marginwidth',
    max: 'max',
    maxLength: 'maxlength',
    media: 'media',
    mediaGroup: 'mediagroup',
    method: 'method',
    min: 'min',
    minLength: 'minlength',
    multiple: 'multiple',
    muted: 'muted',
    name: 'name',
    noValidate: 'novalidate',
    nonce: 'nonce',
    open: 'open',
    optimum: 'optimum',
    pattern: 'pattern',
    placeholder: 'placeholder',
    poster: 'poster',
    preload: 'preload',
    profile: 'profile',
    radioGroup: 'radiogroup',
    readOnly: 'readonly',
    rel: 'rel',
    required: 'required',
    reversed: 'reversed',
    role: 'role',
    rowSpan: 'rowspan',
    rows: 'rows',
    sandbox: 'sandbox',
    scope: 'scope',
    scoped: 'scoped',
    scrolling: 'scrolling',
    seamless: 'seamless',
    selected: 'selected',
    shape: 'shape',
    size: 'size',
    sizes: 'sizes',
    span: 'span',
    spellCheck: 'spellcheck',
    src: 'src',
    srcDoc: 'srcdoc',
    srcLang: 'srclang',
    srcSet: 'srcset',
    start: 'start',
    step: 'step',
    style: 'style',
    summary: 'summary',
    tabIndex: 'tabindex',
    target: 'target',
    title: 'title',
    type: 'type',
    useMap: 'usemap',
    value: 'value',
    width: 'width',
    wmode: 'wmode',
    wrap: 'wrap',
    accentHeight: 'accentheight',
    accumulate: 'accumulate',
    additive: 'additive',
    alignmentBaseline: 'alignmentbaseline',
    allowReorder: 'allowreorder',
    alphabetic: 'alphabetic',
    amplitude: 'amplitude',
    arabicForm: 'arabicform',
    ascent: 'ascent',
    attributeName: 'attributename',
    attributeType: 'attributetype',
    autoReverse: 'autoreverse',
    azimuth: 'azimuth',
    baseFrequency: 'basefrequency',
    baseProfile: 'baseprofile',
    baselineShift: 'baselineshift',
    bbox: 'bbox',
    begin: 'begin',
    bias: 'bias',
    by: 'by',
    calcMode: 'calcmode',
    capHeight: 'capheight',
    clip: 'clip',
    clipPath: 'clippath',
    clipPathUnits: 'clippathunits',
    clipRule: 'cliprule',
    colorInterpolation: 'colorinterpolation',
    colorInterpolationFilters: 'colorinterpolationfilters',
    colorProfile: 'colorprofile',
    colorRendering: 'colorrendering',
    contentScriptType: 'contentscripttype',
    contentStyleType: 'contentstyletype',
    cursor: 'cursor',
    cx: 'cx',
    cy: 'cy',
    d: 'd',
    decelerate: 'decelerate',
    descent: 'descent',
    diffuseConstant: 'diffuseconstant',
    direction: 'direction',
    display: 'display',
    divisor: 'divisor',
    dominantBaseline: 'dominantbaseline',
    dur: 'dur',
    dx: 'dx',
    dy: 'dy',
    edgeMode: 'edgemode',
    elevation: 'elevation',
    enableBackground: 'enablebackground',
    end: 'end',
    exponent: 'exponent',
    externalResourcesRequired: 'externalresourcesrequired',
    fill: 'fill',
    fillOpacity: 'fillopacity',
    fillRule: 'fillrule',
    filter: 'filter',
    filterRes: 'filterres',
    filterUnits: 'filterunits',
    floodColor: 'floodcolor',
    floodOpacity: 'floodopacity',
    focusable: 'focusable',
    fontFamily: 'fontfamily',
    fontSize: 'fontsize',
    fontSizeAdjust: 'fontsizeadjust',
    fontStretch: 'fontstretch',
    fontStyle: 'fontstyle',
    fontVariant: 'fontvariant',
    fontWeight: 'fontweight',
    format: 'format',
    from: 'from',
    fx: 'fx',
    fy: 'fy',
    g1: 'g1',
    g2: 'g2',
    glyphName: 'glyphname',
    glyphOrientationHorizontal: 'glyphorientationhorizontal',
    glyphOrientationVertical: 'glyphorientationvertical',
    glyphRef: 'glyphref',
    gradientTransform: 'gradienttransform',
    gradientUnits: 'gradientunits',
    hanging: 'hanging',
    horizAdvX: 'horizadvx',
    horizOriginX: 'horizoriginx',
    ideographic: 'ideographic',
    imageRendering: 'imagerendering',
    in: 'in',
    in2: 'in2',
    intercept: 'intercept',
    k: 'k',
    k1: 'k1',
    k2: 'k2',
    k3: 'k3',
    k4: 'k4',
    kernelMatrix: 'kernelmatrix',
    kernelUnitLength: 'kernelunitlength',
    kerning: 'kerning',
    keyPoints: 'keypoints',
    keySplines: 'keysplines',
    keyTimes: 'keytimes',
    lengthAdjust: 'lengthadjust',
    letterSpacing: 'letterspacing',
    lightingColor: 'lightingcolor',
    limitingConeAngle: 'limitingconeangle',
    local: 'local',
    markerEnd: 'markerend',
    markerHeight: 'markerheight',
    markerMid: 'markermid',
    markerStart: 'markerstart',
    markerUnits: 'markerunits',
    markerWidth: 'markerwidth',
    mask: 'mask',
    maskContentUnits: 'maskcontentunits',
    maskUnits: 'maskunits',
    mathematical: 'mathematical',
    mode: 'mode',
    numOctaves: 'numoctaves',
    offset: 'offset',
    opacity: 'opacity',
    operator: 'operator',
    order: 'order',
    orient: 'orient',
    orientation: 'orientation',
    origin: 'origin',
    overflow: 'overflow',
    overlinePosition: 'overlineposition',
    overlineThickness: 'overlinethickness',
    paintOrder: 'paintorder',
    panose1: 'panose1',
    pathLength: 'pathlength',
    patternContentUnits: 'patterncontentunits',
    patternTransform: 'patterntransform',
    patternUnits: 'patternunits',
    pointerEvents: 'pointerevents',
    points: 'points',
    pointsAtX: 'pointsatx',
    pointsAtY: 'pointsaty',
    pointsAtZ: 'pointsatz',
    preserveAlpha: 'preservealpha',
    preserveAspectRatio: 'preserveaspectratio',
    primitiveUnits: 'primitiveunits',
    r: 'r',
    radius: 'radius',
    refX: 'refx',
    refY: 'refy',
    renderingIntent: 'renderingintent',
    repeatCount: 'repeatcount',
    repeatDur: 'repeatdur',
    requiredExtensions: 'requiredextensions',
    requiredFeatures: 'requiredfeatures',
    restart: 'restart',
    result: 'result',
    rotate: 'rotate',
    rx: 'rx',
    ry: 'ry',
    scale: 'scale',
    seed: 'seed',
    shapeRendering: 'shaperendering',
    slope: 'slope',
    spacing: 'spacing',
    specularConstant: 'specularconstant',
    specularExponent: 'specularexponent',
    speed: 'speed',
    spreadMethod: 'spreadmethod',
    startOffset: 'startoffset',
    stdDeviation: 'stddeviation',
    stemh: 'stemh',
    stemv: 'stemv',
    stitchTiles: 'stitchtiles',
    stopColor: 'stopcolor',
    stopOpacity: 'stopopacity',
    strikethroughPosition: 'strikethroughposition',
    strikethroughThickness: 'strikethroughthickness',
    string: 'string',
    stroke: 'stroke',
    strokeDasharray: 'strokedasharray',
    strokeDashoffset: 'strokedashoffset',
    strokeLinecap: 'strokelinecap',
    strokeLinejoin: 'strokelinejoin',
    strokeMiterlimit: 'strokemiterlimit',
    strokeOpacity: 'strokeopacity',
    strokeWidth: 'strokewidth',
    surfaceScale: 'surfacescale',
    systemLanguage: 'systemlanguage',
    tableValues: 'tablevalues',
    targetX: 'targetx',
    targetY: 'targety',
    textAnchor: 'textanchor',
    textDecoration: 'textdecoration',
    textLength: 'textlength',
    textRendering: 'textrendering',
    to: 'to',
    transform: 'transform',
    u1: 'u1',
    u2: 'u2',
    underlinePosition: 'underlineposition',
    underlineThickness: 'underlinethickness',
    unicode: 'unicode',
    unicodeBidi: 'unicodebidi',
    unicodeRange: 'unicoderange',
    unitsPerEm: 'unitsperem',
    vAlphabetic: 'valphabetic',
    vHanging: 'vhanging',
    vIdeographic: 'videographic',
    vMathematical: 'vmathematical',
    values: 'values',
    vectorEffect: 'vectoreffect',
    version: 'version',
    vertAdvY: 'vertadvy',
    vertOriginX: 'vertoriginx',
    vertOriginY: 'vertoriginy',
    viewBox: 'viewbox',
    viewTarget: 'viewtarget',
    visibility: 'visibility',
    widths: 'widths',
    wordSpacing: 'wordspacing',
    writingMode: 'writingmode',
    x: 'x',
    x1: 'x1',
    x2: 'x2',
    xChannelSelector: 'xchannelselector',
    xHeight: 'xheight',
    xlinkActuate: 'xlinkactuate',
    xlinkArcrole: 'xlinkarcrole',
    xlinkHref: 'xlinkhref',
    xlinkRole: 'xlinkrole',
    xlinkShow: 'xlinkshow',
    xlinkTitle: 'xlinktitle',
    xlinkType: 'xlinktype',
    xmlns: 'xmlns',
    xmlnsXlink: 'xmlnsxlink',
    xmlBase: 'xmlbase',
    xmlLang: 'xmllang',
    xmlSpace: 'xmlspace',
    y: 'y',
    y1: 'y1',
    y2: 'y2',
    yChannelSelector: 'ychannelselector',
    z: 'z',
    zoomAndPan: 'zoomandpan',
    onAbort: 'onabort',
    onAnimationEnd: 'onanimationend',
    onAnimationIteration: 'onanimationiteration',
    onAnimationStart: 'onanimationstart',
    onBlur: 'onblur',
    onCanPlay: 'oncanplay',
    onCanPlayThrough: 'oncanplaythrough',
    onChange: 'onchange',
    onClick: 'onclick',
    onCompositionEnd: 'oncompositionend',
    onCompositionStart: 'oncompositionstart',
    onCompositionUpdate: 'oncompositionupdate',
    onContextMenu: 'oncontextmenu',
    onCopy: 'oncopy',
    onCut: 'oncut',
    onDoubleClick: 'ondoubleclick',
    onDrag: 'ondrag',
    onDragEnd: 'ondragend',
    onDragEnter: 'ondragenter',
    onDragExit: 'ondragexit',
    onDragLeave: 'ondragleave',
    onDragOver: 'ondragover',
    onDragStart: 'ondragstart',
    onDrop: 'ondrop',
    onDurationChange: 'ondurationchange',
    onEmptied: 'onemptied',
    onEncrypted: 'onencrypted',
    onEnded: 'onended',
    onError: 'onerror',
    onFocus: 'onfocus',
    onInput: 'oninput',
    onKeyDown: 'onkeydown',
    onKeyPress: 'onkeypress',
    onKeyUp: 'onkeyup',
    onLoad: 'onload',
    onLoadedData: 'onloadeddata',
    onLoadedMetadata: 'onloadedmetadata',
    onLoadStart: 'onloadstart',
    onMouseDown: 'onmousedown',
    onMouseEnter: 'onmouseenter',
    onMouseLeave: 'onmouseleave',
    onMouseMove: 'onmousemove',
    onMouseOut: 'onmouseout',
    onMouseOver: 'onmouseover',
    onMouseUp: 'onmouseup',
    onPaste: 'onpaste',
    onPause: 'onpause',
    onPlay: 'onplay',
    onPlaying: 'onplaying',
    onProgress: 'onprogress',
    onRateChange: 'onratechange',
    onScroll: 'onscroll',
    onSeeked: 'onseeked',
    onSeeking: 'onseeking',
    onSelect: 'onselect',
    onStalled: 'onstalled',
    onSubmit: 'onsubmit',
    onSuspend: 'onsuspend',
    onTimeUpdate: 'ontimeupdate',
    onTouchCancel: 'ontouchcancel',
    onTouchEnd: 'ontouchend',
    onTouchMove: 'ontouchmove',
    onTouchStart: 'ontouchstart',
    onTransitionEnd: 'ontransitionend',
    onVolumeChange: 'onvolumechange',
    onWaiting: 'onwaiting',
    onWheel: 'onwheel' 
}

export const AMP_REGEXES_PRE = [
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
    /\sonmouseout=".*?"/gimu
];
export const AMP_REGEXES_POST = [
    /border=".*?"/gimu,
    /pic_id=".*?"/gimu,
    /style=".*?"/gimu,
    /style='.*?'/gimu,
    /xml:lang=".*?"/gimu,
    /\sstyle="color:\s#71b8e4;"/gimu,
    /\sstyle="color:\s#71b8e4;\sfont-face:\sbold;\stext-decoration:\snone;"/gimu
];
export const AMP_BAD_TAGS = [
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
export const AMP_BAD_CLASSES = [
    'mwe-math-fallback-image-inline',
    'sortkey',
    'mw-graph-img',
    'oly_at__img',
    'timeline-wrapper',
    'PopUpMediaTransform'
];



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
                $('a').replaceWith(openButtonTag);

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
                $(iframeTag).attr(
                    'src',
                    `https://www.everipedia.org/AJAX-REQUEST/AJAX_Hoverblurb/${linkCodeAndSlugNoWiki}/`
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
                $('a').replaceWith(openButtonTag);

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
            } else {
                // Remove the citation text
                newText = text.replace(link, "");
            }
        } else if (isInlineImage > 0) {
            if (!snippetMode) {
                // Load the HTML into htmlparser2 beforehand since it is more forgiving
                let dom = htmlparser2.parseDOM('<img />', { decodeEntities: true });

                // Load the HTML into cheerio for parsing
                let $ = cheerio.load(dom);
                const unique_id = crypto.randomBytes(5).toString('hex');

                let result = CAPTURE_REGEXES.inline_image_match.exec(text);
                if (result && result[1] !== undefined && result[1] != '') {
                    let workingImage: InlineImage = {
                        src: result ? normalizeUrl(result[1]) : '',
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
    allSentences.push(...(passedJSON.main_photo[0].caption as Sentence[]));
    passedJSON.infoboxes.forEach((infobox, index) => {
        allSentences.push(...(infobox.values as Sentence[]));
    });
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
