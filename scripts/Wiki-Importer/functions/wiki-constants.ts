import { PageType } from '../../../src/types/article';

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
        WIKI_LANG_CODE: "r",
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
    "zh-hans": {
        WIKI_LANG_CODE: "zh-hans",
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

export const REPLACE_CLASSES_PREPARSE_UNIVERSAL = [["infobox_v3", "infobox", "table"], ["infobox_v2", "infobox", "table"]];
export const PRECLEAN_BAD_FILE_REGEXES = /.*Picto_infobox.*|.*Crystal_Clear_action_info.*|.*Blue_pencil.*|.*CentralAutoLogin.*|.*Twemoji.*|.*Gtk-dialog.*|.*Info_Simple.*/gimu;
export const PRECLEAN_IMG_FIX_REGEXES = /^\/w\/extensions.*/gimu;
export const PRECLEAN_BAD_CLASSES = [/mw-authority-control/gimu, /sisterlinks/gimu, /commonscat/gimu, /navigation-only/gimu, /bandeau/gimu, /homonymie/gimu, /magnify/gimu];
export const PRECLEAN_BAD_CLASSES_DELETE_PARENTS = [{'extiw': /wikidata/gimu}];
export const POSTCLEAN_BAD_ELEMENTS_DELETE_PARENTS = [{'id': /Note/gimu}, {'id': /'مراجع/gimu}];
export const POSTCLEAN_BAD_ELEMENTS_BUT_KEEP_CHILDS = [/mw-parser-output/gimu];
export const NON_AMP_BAD_TAGS = [ 'head', 'noscript', 'map', 'math', 'mi', 'mo', 'mtd', 'mrow', 'mspace', 'mtext', 'msub', 'msup', 'mstyle', 'semantics', 'usemap', 'xml', 'worddocument', 'mathpr', 'mathfont'];

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

// Add the parent tag of any bad elements in a wikipedia page you would like to remove in all scrapes to the below list
// ex: <div id="siteSub"></div> this makes sure that any time a span tag with id=siteSub is on a wikipedia page, it will get removed
// use this list to add format removal exception tags to make the scrape look nicer over time
export const PRECLEAN_BAD_ELEMENTS: ElementCleaningPack[] = [
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
    { tag: "div", id: null, class: "mw-authority-control" }, 
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
    { tag: "table", id: null, class: "toccolours" }, // Jank table of contents
    { tag: "table", id: null, class: "vertical-navbox nowraplinks nowraplinks hlist" },
    { tag: "table", id: null, class: "vertical-navbox nowraplinks vcard hlist" }, // Another variation of the series tables above ^
    { tag: "table", id: null, class: "metadata plainlinks ambox ambox-style ambox-citation_style" },
    { tag: "table", id: null, class: "metadata plainlinks ambox ambox-content ambox-Refimprove" },
    { tag: "table", id: null, class: "vertical-navbox vcard plainlist" }, 
    { tag: "table", id: null, class: "mbox-small plainlinks sistersitebox" }, // Table for sistersite like "check out wikinews" bs
    { tag: "table", id: null, class: "navbox" }, // Portal navigation tables
    { tag: "table", id: null, class: "metadata mbox-small noprint selfref" }, // Notice for rendering warning emoji page etc
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
]

// Some elements need to be unwrapped
export const PRECLEAN_UNWRAP_ELEMENTS: ElementCleaningPack[] = [
    { parent: { class: 'thumbcaption'}, tag: "center", id: null, class: null }, // Shows up in captions sometimes
    { tag: "small", id: null, class: null }, 
    { tag: "a", id: null, class: 'new' }, // Redlinks
]

// Clean these up after the citations are parsed out
export const POST_CITATION_CHOP_BELOW: ElementCleaningPack[] = [
    { parent: { tag: 'h2'}, tag: "span", id: "Notes", class: null }, // Notes section
    { parent: { tag: 'h2'}, tag: "span", id: "References", class: null }, // References section
    { parent: { tag: 'h2'}, tag: "span", id: "Bibliography", class: null }, // References section
    { parent: { tag: 'h2'}, tag: "span", id: "External_links", class: null }, // References section
    { tag: "div", id: null, class: "mw-references-wrap" }, // References section
]

export interface PageTypeCluePack {
    id: string,
    class: string
    page_type: PageType
}

// Clues in the infobox to help determine the page type
export const INFOBOX_PAGE_TYPE_CLUES: PageTypeCluePack[] = [
    { id: null, class: 'biota', page_type: 'Thing'},
    { id: null, class: 'biography', page_type: 'Person'},
    { id: null, class: 'geography', page_type: 'Place'},
    { id: null, class: 'haudio', page_type: 'CreativeWork'},
    { id: null, class: 'hmedia', page_type: 'CreativeWork'},
    { id: null, class: 'hproduct', page_type: 'Product'},
];
