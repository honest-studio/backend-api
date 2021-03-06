import { PageType } from '../../../src/types/article';

export interface ReplaceClassPack {
    target_selector: string,
    target_class: string,
    replacement_tag: string
    replacement_class: string
}

export interface ElementCleaningPack {
    parent?: {
        tag?: string
        id?: string
        class?: string,
    },
    tag: string,
    id: string,
    class: string
}

export interface PageTypeSelectorCluePack {
    selector: string,
    page_type: PageType,
    sub_page_type: string
}

export interface PageTypeRegexCluePack {
    regex: RegExp,
    page_type: PageType,
    sub_page_type: string
}

export const WIKI_LANG_PACKAGES = {
    ar: {
        WIKI_LANG_CODE: "ar",
        WIKI_ROOT_URL: "https://ar.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6962",
        WIKI_ADDITIONAL_SLICE_TERMS: ['وصلات خارجية', 'انظر أيضا',],
        WIKI_TITLE_SLICE: " - ويكيبيديا، الموسوعة الحرة",
        WIKI_FILE_UNICODE: "ملف:",
        WIKI_LINK_COMMENT: "الإصدار الأصلي من هذه الصفحة هو ويكيبيديا ، يمكنك تحرير الصفحة هنا على Everipedia.",
        WIKI_REMOVE_CLASSES_PREPARSE: [/bandeau-portail/gimu],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    },
    de: {
        WIKI_LANG_CODE: "de",
        WIKI_ROOT_URL: "https://de.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6958",
        WIKI_ADDITIONAL_SLICE_TERMS: ['Einzelnachweise', 'Weblinks', 'Literatur', 'Siehe auch'],
        WIKI_TITLE_SLICE: " – Wikipedia",
        WIKI_FILE_UNICODE: "Datei:",
        WIKI_LINK_COMMENT: "Die Originalversion dieser Seite stammt aus Wikipedia. Sie können die Seite hier auf Everipedia bearbeiten.",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: [['float-right', 'infobox', 'table']]
    },
    en: {
        WIKI_LANG_CODE: "en",
        WIKI_ROOT_URL: "https://en.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6969",
        WIKI_ADDITIONAL_SLICE_TERMS: [],
        WIKI_TITLE_SLICE: " - Wikipedia",
        WIKI_FILE_UNICODE: "File%3A",
        WIKI_LINK_COMMENT: "The original version of this page is from Wikipedia, you can edit the page right here on Everipedia.",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    },
    es: {
        WIKI_LANG_CODE: "es",
        WIKI_ROOT_URL: "https://es.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6965",
        WIKI_ADDITIONAL_SLICE_TERMS: ['Véase también', 'Referencias', 'Bibliografía', 'Enlaces externos', 'Enlaces externos y referencias', 'Notas', "Véase"],
        WIKI_TITLE_SLICE: " — Wikipedia",
        WIKI_FILE_UNICODE: "Archivo:",
        WIKI_LINK_COMMENT: "La versión original de esta página es de Wikipedia. Puedes editar la página aquí mismo en Everipedia.",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    },
    fr: {
        WIKI_LANG_CODE: "fr",
        WIKI_ROOT_URL: "https://fr.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6959",
        WIKI_ADDITIONAL_SLICE_TERMS: ['Liens externes', 'Articles connexes', 'Lien externe', 'Notes et références', 'Voir aussi', 'Annexes', "Notes", 'Bibliographie', 'Références'],
        WIKI_TITLE_SLICE: " — Wikipédia",
        WIKI_FILE_UNICODE: "Fichier:",
        WIKI_LINK_COMMENT: "La version originale de cette page provient de Wikipedia, vous pouvez la modifier ici, sur Everipedia.",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: [['entete', 'ep-blobbox-tbl-hdr', ''], ['DebutCarte', 'ep-blbbox-pic-frame-ctr', '']]
    },
    hi: {
        WIKI_LANG_CODE: "hi",
        WIKI_ROOT_URL: "https://hi.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6963",
        WIKI_ADDITIONAL_SLICE_TERMS: ['सन्दर्भ', 'इन्हें भी देखें', 'बाहरी कड़ियाँ'],
        WIKI_TITLE_SLICE: "- विकिपीडिया",
        WIKI_FILE_UNICODE: "चित्र:",
        WIKI_LINK_COMMENT: "इस पृष्ठ का मूल संस्करण विकिपीडिया से है, आप यहां पृष्ठ को एवरिपीडिया पर संपादित कर सकते हैं।",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    },
    it: {
        WIKI_LANG_CODE: "it",
        WIKI_ROOT_URL: "https://it.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6964",
        WIKI_ADDITIONAL_SLICE_TERMS: ['Altri progetti', 'Collegamenti esterni', 'Voci correlate', 'Bibliografia', 'Pagine correlate'],
        WIKI_TITLE_SLICE: " — Wikipedia",
        WIKI_FILE_UNICODE: "File:",
        WIKI_LINK_COMMENT: "La versione originale di questa pagina è di Wikipedia, puoi modificare la pagina qui su Everipedia.",
        WIKI_REMOVE_CLASSES_PREPARSE: [/avviso-disambigua/gimu],
        WIKI_REPLACE_CLASSES_PREPARSE: [["sinottico_testo_centrale", "switcher-container", ''], ["sinottico", "infobox", '']]
    },
    ko: {
        WIKI_LANG_CODE: "ko",
        WIKI_ROOT_URL: "https://ko.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6968",
        WIKI_ADDITIONAL_SLICE_TERMS: ['참조', '외부 링크', '각주', '참고 문헌', '같이 보기', '관련 항목', '참고 자료'],
        WIKI_TITLE_SLICE: " - 위키백과, 우리 모두의",
        WIKI_FILE_UNICODE: "%ED%8C%8C%EC%9D%BC:",
        WIKI_LINK_COMMENT: "위키백과의 문서를 기반으로 한 본 문서는, 에브리디아에서 자유롭게 수정할 수 있습니다.",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    },
    pt: {
        WIKI_LANG_CODE: "pt",
        WIKI_ROOT_URL: "https://pt.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6961",
        WIKI_ADDITIONAL_SLICE_TERMS: ['Referências', 'Ver também', 'Ligações externas', 'Notas', 'Bibliografia'],
        WIKI_TITLE_SLICE: " – Wikipédia",
        WIKI_FILE_UNICODE: "Ficheiro:",
        WIKI_LINK_COMMENT: "A versão original desta página é da Wikipedia, você pode editar a página aqui mesmo na Everipedia.",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    },
    ru: {
        WIKI_LANG_CODE: "ru",
        WIKI_ROOT_URL: "https://ru.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6966",
        WIKI_ADDITIONAL_SLICE_TERMS: ['Ссылки', 'Примечания', 'См. также', 'Литература', 'Комментарии', 'навигация'],
        WIKI_TITLE_SLICE: " — Википедия",
        WIKI_FILE_UNICODE: "%D0%A4%D0%B0%D0%B9%D0%BB:",
        WIKI_LINK_COMMENT: "Исходная версия этой страницы импортирована из Википедии. Вы можете редактировать её здесь, на Эврипедии.",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    },
    sv: {
        WIKI_LANG_CODE: "sv",
        WIKI_ROOT_URL: "https://sv.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6960",
        WIKI_ADDITIONAL_SLICE_TERMS: ['Se även', 'Externa länkar', 'Vidare läsning', 'Bibliografi', 'Noter', 'Fotnoter', 'Källor', 'Referenser'],
        WIKI_TITLE_SLICE: " – Wikipedia",
        WIKI_FILE_UNICODE: "%D0%A4%D0%B0%D0%B9%D0%BB:",
        WIKI_LINK_COMMENT: "Den ursprungliga versionen av den här sidan är från Wikipedia, du kan redigera sidan här på Everipedia.",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    },
    "zh": {
        WIKI_LANG_CODE: "zh",
        WIKI_ROOT_URL: "https://zh.wikipedia.org",
        WIKI_FACEBOOKID_PREFIX: "6967",
        WIKI_ADDITIONAL_SLICE_TERMS: ['相关阅读', '参考文献', '參見', '註释', '外部連結', '延伸閱讀', '参见', '外部链接', '参考资料和註釋', '参看'],
        WIKI_TITLE_SLICE: " - 维基百科，自由的百科全书",
        WIKI_FILE_UNICODE: '%E6%96%87%E4%BB%B6',
        WIKI_LINK_COMMENT: "本页面源自维基百科，你可以在Everipedia上编辑该页面了",
        WIKI_REMOVE_CLASSES_PREPARSE: [],
        WIKI_REPLACE_CLASSES_PREPARSE: []
    }
};

// Kartographer (Open Maps)
export const KARTOGRAPHER_PIXEL_WIDTH = 400;

// Max pixels for an image
export const IMAGE_MAX_PIXELS = 6250000;

// Regex for preserving whitespace
export const WHITESPACE_PRESERVATION_REGEX = /^(\s*)?([^\s]*)(\s*)?$/gimu;

// Strip out these crappy images because they look ugly and also mess up the profile-picture-finding algorithm
export const PRECLEAN_BAD_FILE_REGEXES = /.*Picto_infobox.*|.*Crystal_Clear_action_info.*|.*Blue_pencil.*|.*CentralAutoLogin.*|.*Twemoji.*|.*Gtk-dialog.*|.*Info_Simple.*/gimu;

export const PRECLEAN_IMG_FIX_REGEXES = /^\/w\/extensions.*|^\/api\/rest_v1/gimu;
export const PRECLEAN_BAD_CLASSES_DELETE_PARENTS = [{'extiw': /wikidata/gimu}];
export const POSTCLEAN_BAD_ELEMENTS_DELETE_PARENTS = [{'id': /Note/gimu}, {'id': /'مراجع/gimu}];
export const POSTCLEAN_BAD_ELEMENTS_BUT_KEEP_CHILDS = [/mw-parser-output/gimu];
export const NON_AMP_BAD_TAGS = [ 'font', 'head', 'noscript', 'map', 'math', 'mi', 'mo', 'mtd', 'mrow', 'mspace', 'mtext', 'msub', 'msup', 'mstyle', 'semantics', 'usemap', 'xml', 'worddocument', 'mathpr', 'mathfont'];

export const WIKI_SYNC_RECENTCHANGES_FILTER_REGEX = /Talk:|Wikipedia:|Template:|User talk:|Portal:|User:|Draft:|Category:/gimu;


// Replace tags with certain classes
export const REPLACE_CLASSES_PREPARSE_UNIVERSAL: ReplaceClassPack[] = [
    { target_selector: "table", target_class: "infobox_v3", replacement_tag: "table", replacement_class: "infobox" },
    { target_selector: "table", target_class: "infobox_v2", replacement_tag: "table", replacement_class: "infobox" },
    { target_selector: "table", target_class: "toccolours", replacement_tag: "table", replacement_class: "wikitable" },
    { target_selector: "table.tracklist:not(.infobox)", target_class: "tracklist", replacement_tag: "table", replacement_class: "wikitable tracklist" },
    { target_selector: "table.vevent:not(.infobox)", target_class: "vevent", replacement_tag: "table", replacement_class: "wikitable vevent" },
];

// Add the parent tag of any bad elements in a wikipedia page you would like to remove in all scrapes to the below list
// ex: <div id="siteSub"></div> this makes sure that any time a span tag with id=siteSub is on a wikipedia page, it will get removed
// use this list to add format removal exception tags to make the scrape look nicer over time
export const PRECLEAN_BAD_ELEMENTS: ElementCleaningPack[] = [
    { tag: null, id: "noarticletext", class: null }, 
    { tag: null, id: null, class: "shortdescription" }, 
    { tag: null, id: null, class: "mw-authority-control" }, 
    { tag: null, id: null, class: "mw-empty-elt" }, 
    { tag: null, id: null, class: "sisterlinks" }, 
    { tag: null, id: null, class: "commonscat" }, 
    { tag: null, id: null, class: "navigation-only" }, 
    { tag: null, id: null, class: "bandeau" }, 
    { tag: null, id: null, class: "homonymie" }, 
    { tag: "div", id: null, class: "notice plainlinks" }, // Any notices at the top of the page
    { tag: "div", id: "toc", class: "toc" }, // Table of contents, the content table at the beginning of articles
    { tag: "span", id: null, class: "mw-editsection" }, // Edit buttons next to headings
    { tag: "div", id: "jump-to-nav", class: "mw-jump" }, // Nav heading at the top of article
    { tag: "div", id: "catlinks", class: "catlinks" }, // Bottom footer sectional links
    { tag: "span", id: "coordinates", class: null }, // Rando coordinates at the top of many pages
    { tag: "div", id: "siteSub", class: null }, // Motto "From Wikipedia, the Free Encyclopedia"
    { tag: "div", id: "jump-to-nav", class: "mw-jump" }, // More variation for the top of wikipedia
    { tag: "div", id: "contentSub", class: null }, // More varition of wikipedia top banner
    { tag: "div", id: "mw-indicator-good-star", class: "mw-indicator" }, // For the star or + sign at the top of articles for marking them
    { tag: "div", id: "mw-indicator-featured-star", class: "mw-indicator" }, // For featured star instead of + sign up ^
    { tag: "div", id: "mw-indicator-spoken-icon", class: "mw-indicator" }, // Speaker icon for top right of articles
    { tag: "div", id: "mw-indicator-pp-default", class: "mw-indicator" }, // Lock icon for top right of article
    { tag: "span", id: null, class: "noprint" }, 
    { tag: "div", id: null, class: "mw-indicators" }, // The entire parent div of the indicator icons ^
    { tag: "h1", id: "firstHeading", class: "firstHeading" }, // Main title of the entire page
    { tag: "div", id: "footer", class: null }, // Footer of the entire page
    { tag: "div", id: "siteNotice", class: null }, // Big notice on top of the page
    { tag: "div", id: null, class: "printfooter" }, // Another variation of footer above
    { tag: "div", id: null, class: "noprint portal tright" }, // Div for right aligned portals
    { tag: "div", id: null, class: "hatnote" }, // The note at the top of an article before it starts
    { tag: "div", id: null, class: "dablink" }, // Another redirector notice
    { tag: "div", id: null, class: "dabhide" }, // Another redirector notice
    { tag: "div", id: null, class: "visualClear" }, // Random crap in the footer area
    { tag: "div", id: "mw-navigation", class: null }, // Footer section that houses nav options
    { tag: "table", id: null, class: "vertical-navbox nowraplinks plainlist" }, 
    { tag: "table", id: null, class: "navbox" }, // Another variation of a navbox
    // { tag: "table", id: null, class: "toccolours" }, // Jank table of contents
    { tag: "table", id: null, class: "vertical-navbox nowraplinks nowraplinks hlist" },
    { tag: "table", id: null, class: "vertical-navbox nowraplinks vcard hlist" }, // Another variation of the series tables above ^
    { tag: null, id: null, class: "metadata" }, // Metadata
    { tag: "table", id: null, class: "metadata plainlinks ambox ambox-style ambox-citation_style" },
    { tag: "table", id: null, class: "metadata plainlinks ambox ambox-content ambox-Refimprove" },
    { tag: "table", id: null, class: "box-Empty_section" },
    { tag: "table", id: null, class: "ambox-content" },
    { tag: "table", id: null, class: "vertical-navbox vcard plainlist" }, 
    { tag: "table", id: null, class: "mbox-small plainlinks sistersitebox" }, // Table for sistersite like "check out wikinews" bs
    { tag: "table", id: null, class: "navbox" }, // Portal navigation tables
    { tag: "table", id: null, class: "metadata mbox-small noprint selfref" }, // Notice for rendering warning emoji page etc
    { tag: null, id: null, class: "noprint" }, // Appears at the bottom, usually
    { tag: "div", id: null, class: "toclimit-3" }, // Weird whitespace after the table of contents on big articles like /wikipedia/
    { tag: "div", id: null, class: "toclimit-2" }, 
    { tag: "div", id: null, class: "toclimit-1" }, 
    { tag: "li", id: null, class: "nv-view" }, // Navbar mini
    { tag: "li", id: null, class: "nv-talk" }, // Navbar mini
    { tag: "li", id: null, class: "nv-edit" }, // Navbar mini
    { tag: "div", id: null, class: "printfooter" }, // Retrieved from bullshit at the end of blurbs
    { tag: "div", id: null, class: "mw-empty-li-1" }, // Empty lines in blob boxes
    { tag: "span", id: "coordinates", class: null }, 
    { tag: "span", id: null, class: 'mw-cite-backlink' }, // Citations
    { tag: "div", id: null, class: "magnify" }, // Shows up in captions sometimes
    { parent: { class: 'thumbcaption'}, tag: "div", id: null, class: "magnify" }, // Shows up in captions sometimes
    // { tag: "div", id: null, class: "mw-references-wrap" }, 
    { tag: "div", id: null, class: "navbox" }, // Various navboxes
    { tag: "table", id: null, class: "stub" }, // Stub notice
    { tag: "table", id: 'disambigbox', class: null }, // Disambiguation box
    { tag: null, id: null, class: 'mwe-math-mathml-inline' }, // Math stuff. You will be using the inline image fallback
    { tag: null, id: null, class: 'mwe-math-mathml-a11y' }, // Math stuff. You will be using the inline image fallback
]

// Some elements need to be unwrapped
export const PRECLEAN_UNWRAP_ELEMENTS: ElementCleaningPack[] = [
    { parent: { class: 'thumbcaption'}, tag: "center", id: null, class: null }, // Shows up in captions sometimes
    { tag: "small", id: null, class: null }, 
    { tag: null, id: null, class: 'mw-collapsible'}, // Collapsible stuff should be expanded by default
    { tag: null, id: null, class: 'mw-collapsible-content'}, // Collapsible stuff should be expanded by default
    { tag: null, id: null, class: 'div-col'}, // Some ul's and ol's get wrapped by divs
    { tag: "a", id: null, class: 'new' }, // Redlinks
    { tag: "span", id: null, class: 'binomial' }, // Animal species binomial
    { tag: "a", id: null, class: 'selflink' }, // Self links
    { parent: { tag: 'th' }, tag: "p", id: null, class: null }, // th > p
    { parent: { tag: 'td' }, tag: "p", id: null, class: null }, // td > p
    { tag: null, id: null, class: 'overflowbugx' }, // Appears sometimes. Mainly style-related

]

// Clean these up after the citations are parsed out
export const POST_CITATION_CHOP_BELOW: ElementCleaningPack[] = [
    { parent: { tag: 'h2'}, tag: "span", id: "Notes", class: null }, // Notes section
    { parent: { tag: 'h2'}, tag: "span", id: "References", class: null }, // References section
    { parent: { tag: 'h2'}, tag: "span", id: "Bibliography", class: null }, // References section
    { parent: { tag: 'h2'}, tag: "span", id: "External_links", class: null }, // References section
    { parent: { tag: 'h2'}, tag: "span", id: "Footnotes", class: null }, // References section
    { parent: { tag: 'h2'}, tag: "span", id: "Gallery", class: null }, // Image gallery section
    { parent: { tag: 'h2'}, tag: "span", id: "Notes_and_references", class: null }, // Notes and references
    { parent: { tag: 'h2'}, tag: "span", id: "References_and_footnotes", class: null }, // References and footnotes
    { tag: "div", id: null, class: "mw-references-wrap" }, // References section
]

// Clues in the infobox id and class to help determine the page type
export const INFOBOX_OUTER_PAGE_TYPE_CLUES: PageTypeSelectorCluePack[] = [
    { selector: 'table.infobox.biota', page_type: 'Thing', sub_page_type: null },
    { selector: 'table.infobox.biography', page_type: 'Person', sub_page_type: null },
    { selector: 'table.infobox.geography', page_type: 'Place', sub_page_type: null },
    { selector: 'table.infobox.haudio', page_type: 'CreativeWork', sub_page_type: null },
    { selector: 'table.infobox.hmedia', page_type: 'CreativeWork', sub_page_type: null },
    { selector: 'table.infobox.hproduct', page_type: 'Product', sub_page_type: null },
];

// Clues inside the infobox to help determine the page type
export const INFOBOX_INNER_PAGE_TYPE_CLUES: PageTypeSelectorCluePack[] = [
    { selector: 'a.mw-kartographer-container', page_type: 'Place', sub_page_type: null },
    { selector: '.geo-default', page_type: 'Place', sub_page_type: null },
];

// Page type clues
// Remember, you can tally regex matches to confer 'strength' to a type deduction
// TODO: Not used at the moment. Can incorporate later
export const INFOBOX_PAGE_TYPE_KEYWORDS: {[key in PageType]: PageTypeRegexCluePack[]} = {
    'CreativeWork': [
        { regex: /Directed by|Cinematography|Music by|Distributed by|Screenplay by|Starring|Release date|Running time/gimu, page_type: 'CreativeWork', sub_page_type: null },
    ],
    'Event': [],
    'List': [],
    'MedicalEntity': [],
    'Organization': [],
    'Person': [
        { regex: /Born|Residence|Occupation|Spouse|Children/gimu, page_type: 'Person', sub_page_type: null },
    ],
    'Place': [],
    'Product': [],
    'Thing': [],
}