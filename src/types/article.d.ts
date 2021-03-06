import { PreviewResult } from './api';

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

export type CitationCategoryType = 'NONE' | 'PICTURE' | 'GIF' | 'YOUTUBE' | 'NORMAL_VIDEO' | 'AUDIO' | 'BOOK' | 'PERIODICAL' | 'FILE';

export type CaptionType = 'main-photo-caption' | 'media-gallery-caption' | 'inline-image-caption' ;

export type MediaType = 'section_image' | 'main_photo' | 'inline_image' | 'normal';

export type TableCellType = 'th' | 'td';

export type TagClass = 'inline' | 'block' | 'void';

export type ActivityType = 'edit' | 'merge' | 'page-removal' | 'undo-merge' | 'undo-page-removal';

export interface Sentence {
    type: string; // sentence
    index?: number;
    text: string; // contains inline WikiLink markup + some light markdown for formatting
    diff?: DiffType;
}

export type NestedContentItem = NestedTextItem | NestedTagItem;

export interface NestedTextItem {
    type: 'text';
    content: Sentence[];
}

export interface NestedTagItem {
    type: 'tag';
    tag_type: string;
    tag_class: TagClass;
    attrs: {};
    content: NestedContentItem[]; // allow for recursion
}

export interface ListItem {
    type: string; // list_item
    index?: number;
    sentences: Sentence[];
    tag_type: string; // li
    diff?: DiffType;
}

export type ParagraphItem = Sentence | ListItem | Table | DescList | Samp;

export interface Paragraph {
    index?: number;
    items: ParagraphItem[];
    tag_type: string;
    attrs: {};
}

export interface Section {
    paragraphs: Paragraph[];
    images: Media[];
}

export type InfoboxValue = {
    index?: number;
    sentences: Sentence[];
    diff?: DiffType;
}

export interface Infobox {
    key: string;
    schema: string;
    addlSchematype: string;
    addlSchemaItemProp: string;
    values: InfoboxValue[]; 
    diff?: DiffType;
}

type EmbedDisplaySize = 'small' | 'medium' | 'large';

interface Media {
    type: MediaType;
    url: string;
    caption: Sentence[];
    medium?: string;
    thumb?: string;
    tinythumb?: string;
    timestamp?: Date;
    attribution_url?: string;
    mime?: string;
    alt?: string;
    height?: number;
    width?: number;
    category?: CitationCategoryType;
    diff?: DiffType;
    srcSet?: string;
    media_props?: MediaProps;
    display_size?: EmbedDisplaySize
}

export interface MediaProps {
    type: MediaType;
    height?: number;
    width?: number;
    srcSet?: string;
    webp_original?: string;
    webp_medium?: string;
    webp_thumb?: string;
    webp_tinythumb?: string;
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
    //diff_changes: number; # Number of entities changed by the diff
    //diff_percent: number; # Percentage of document changed by diff
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
    media_props?: MediaProps;
    in_blurb?: boolean;
    diff?: DiffType;
    display_size?: EmbedDisplaySize;
}

export interface Samp {
    type: 'samp';
    attrs: {};
    items: NestedContentItem[];
}

export interface DescList {
    type: 'dl';
    attrs: {};
    items: DescListItem[];
}

export interface DescListItem {
    index?: number;
    tag_type: 'dt' | 'dd';
    tag_class: TagClass;
    attrs: {};
    content: NestedContentItem[];
}

export interface Table {
    type: 'wikitable' | 'body-table';
    attrs: {};
    caption: TableCaption;
    thead: TableSection;
    tbody: TableSection;
    tfoot: TableSection;
}

export interface TableCaption {
    attrs: {};
    sentences: Sentence[];
}

export interface TableSection {
    attrs: {};
    rows: TableRow[];
}

export interface TableRow {
    index?: number;
    attrs: {};
    tag_type: "tr";
    tag_class: TagClass;
    cells: TableCell[];
    diff?: DiffType;
}

export interface TableCell {
    index?: number;
    attrs: {};
    tag_type: TableCellType;
    tag_class: TagClass;
    content: NestedContentItem[];
}

export type PageType =
    | 'CreativeWork'
    | 'Event'
    | 'List'
    | 'MedicalEntity'
    | 'Organization'
    | 'Person'
    | 'Place'
    | 'Product'
    | 'Thing';

export interface ArticleJson {
    page_title: Sentence[];
    main_photo: Media[];
    infobox_html: Table;
    page_body: Section[];
    infoboxes: Infobox[];
    citations: Citation[];
    media_gallery: Media[];
    metadata: Metadata[];
    amp_info: AmpInfo;

    ipfs_hash?: string;
    categories?: number[];
    redirect_wikilangslug?: string;
}

