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

export interface SeeAlso {
    lang_string: string;
    slug: string;
    title: string;
    thumbnail_url: string;
    snippet: string;
}

export interface SeeAlsoCountGroup {
    count: number;
    data: SeeAlso;
}

export interface SeeAlsoCollection {
    [key: string]: SeeAlsoCountGroup;
}

export interface Sentence {
    type: string; // sentence
    index: number;
    text: string; // contains inline WikiLink markup + some light markdown for formatting
}

export interface AMPParseCollection {
    text: string;
    lightboxes: string[];
    seealsos: SeeAlso[];
}

export interface ListItem {
    type: string; // list_item
    index: number;
    sentences: Sentence[];
    tag_type: string; // li
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

export interface Infobox {
    key: string;
    schema: string;
    addlSchemaItemProp: string;
    addlSchematype: string;
    values: Sentence[]; // each sentence is an individual value
}

export interface Media {
    type: string; // section_image, main_photo, inline_image
    url: string;
    caption: Sentence[]; // TODO: change to string
    thumb?: string;
    timestamp?: Date;
    attribution_url?: string;
    mime?: string;
    alt?: string;
    height?: number;
    width?: number;
    category?: string;
}

export interface Metadata {
    link_count?: number;
    page_lang?: string;
    page_type?: string;
    is_removed?: boolean;
    is_adult_content?: boolean;
    creation_timestamp?: Date;
    last_modified?: Date;
    url_slug?: string;
    url_slug_alternate?: string;
    sub_page_type?: string;
    is_wikipedia_import?: boolean;
    is_indexed?: boolean;
    bing_index_override?: boolean;
    is_locked?: boolean;
    pageviews?: number;
    ipfs_hash: string;
}

export interface AmpInfo {
    load_youtube_js: boolean;
    load_audio_js: boolean;
    load_video_js: boolean;
    lightboxes: any[];
}

export interface Citation {
    url: string;
    thumb: string;
    description: Sentence[];
    category: string;
    citation_id: number;
    social_type: string;
    attribution: string;
    timestamp: Date;
    mime: string;
    in_blurb?: boolean;
}

export interface Table {
    type: string; // table
    caption: string;
    thead?: TableSection;
    tbody: TableSection;
    tfoot?: TableSection;
}

export interface TableSection {
    attrs: {};
    rows: TableRow[];
}

export interface TableRow {
    index: number;
    attrs: {};
    cells: TableCell[];
}

export interface TableCell {
    index: number;
    attrs: {};
    tag_type: string;
    content: Sentence[];
}

export interface ArticleJson {
    page_title: string;
    main_photo: Media;
    infobox_html: string;
    page_body: Section[];
    infoboxes: Infobox[];
    citations: Citation[];
    media_gallery: Media[];
    metadata: Metadata;
    amp_info: AmpInfo;

    categories?: string[];
    type?: string;
}
