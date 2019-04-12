// Link to an Everipedia page
// The interface is listed here for documentation, but the
// links are actually marked up inline in sentence text with
// the format:
// [[ LINK|${lang_code}|${slug}|${text} ]]
export interface WikiLink {
    index?: number;
    lang_code: string;
    slug: string;
    text: string; // the link's display text
}

export type DiffType = 'add' | 'delete' | 'none';

export type CitationCategoryType = 'NONE' | 'PICTURE' | 'GIF' | 'YOUTUBE' | 'NORMAL_VIDEO' | 'AUDIO';

export type MediaCategoryType = 'NONE' | 'PICTURE' | 'GIF' | 'YOUTUBE' | 'NORMAL_VIDEO' | 'AUDIO';

export interface Sentence {
    type: string; // sentence
    index: number;
    text: string; // contains inline WikiLink markup + some light markdown for formatting
    diff?: DiffType;
}

export interface ListItem {
    type: string; // list_item
    index: number;
    sentences: Sentence[];
    tag_type: string; // li
    diff?: DiffType;
}

export type ParagraphItem = Sentence | ListItem | Table;

export interface Paragraph {
    index: number;
    items: ParagraphItem[];
    tag_type: string;
    attrs: {};
}

export interface Section {
    paragraphs: Paragraph[];
    images: Media[];
}

export type InfoboxValue = Sentence;
export interface Infobox {
    key: string;
    schema: string;
    addlSchematype: string;
    addlSchemaItemProp: string;
    values: InfoboxValue[]; 
    diff?: DiffType;
}

export interface Media {
    type: string; // section_image, main_photo, inline_image
    url: string;
    caption: Sentence[]; 
    thumb?: string;
    timestamp?: Date;
    attribution_url?: string;
    mime?: string;
    alt?: string;
    height?: number;
    width?: number;
    category?: MediaCategoryType;
    diff?: DiffType;
}

// Valid Metadata keys
    //page_lang?: string;
    //page_type?: string;
    //is_removed?: boolean;
    //is_adult_content?: boolean;
    //creation_timestamp?: Date;
    //last_modified?: Date;
    //url_slug?: string;
    //url_slug_alternate?: string;
    //sub_page_type?: string;
    //is_wikipedia_import?: boolean;
    //is_indexed?: boolean;
    //bing_index_override?: boolean;
    //is_locked?: boolean;
    //ipfs_hash: string;
// Valid Metadata keys for diffs only:
    //old_hash: string;
    //new_hash: string;
    //proposal_id: number;
export interface Metadata {
    key: string;
    value: any;
    diff?: DiffType;
}

export interface AmpInfo {
    load_youtube_js: boolean;
    load_audio_js: boolean;
    load_video_js: boolean;
    lightboxes: any[];
    diff?: DiffType;
}

export interface Citation {
    url: string;
    thumb: string;
    description: Sentence[];
    category: CitationCategoryType;
    citation_id: number;
    social_type: string;
    attribution: string;
    timestamp: Date;
    mime: string;
    in_blurb?: boolean;
    diff?: DiffType;
}

export interface Table {
    type: string; // wikitable
    caption: string;
    thead: TableSection;
    tbody: TableSection;
    tfoot: TableSection;
}

export interface TableSection {
    attrs: {};
    rows: TableRow[];
}

export interface TableRow {
    index: number;
    attrs: {};
    cells: TableCell[];
    diff?: DiffType;
}

export interface TableCell {
    index: number;
    attrs: {};
    tag_type: string;
    content: Sentence[];
}

export interface ArticleJson {
    page_title: Sentence[];
    main_photo: Media[];
    infobox_html: string;
    page_body: Section[];
    infoboxes: Infobox[];
    citations: Citation[];
    media_gallery: Media[];
    metadata: Metadata[];
    amp_info: AmpInfo;

    ipfs_hash?: string;
    categories?: string[];
}
