/**
 * Basic descriptor for title and page ID
 */
export interface ArticleOptions {
    title: string;
    pageID: number;
}

/**
 * Link to a page
 */
export interface PageLink {
    page: string;
    text: string;
    type?: string;
    site?: string;
}

export interface Inline {
    data: Sentence;
}

export interface Template {
    /**
     * Name (ID) of template to expand
     */
    template: string;

    /*
    // Sampling of some common template props that have been observed:
    name?: string;
    data: any;
    type: string;
    page: string;
    inline?: Inline;
    author?: string;
    year?: string;
    location?: string;
    pp?: string;
    p?: string;
    redirect?: string;
    links?: any;
    loc?: string;
    id?: string;
    */
}

/**
 * Extends {Template} with a dictionary of impossibly-idiosyncratic props
 */
export type TemplateWithProps = Template & { [idx: string]: any };

export interface TextFormat {
    bold: string[];
    italic: string[];
}

export interface Sentence {
    text: string;
    links: PageLink[];
    fmt?: TextFormat;
}
export interface Image {
    file: string;
    text: string;
}
export interface SectionData {
    title: string;
    depth: number;
    /**
     * Templates are endlessly flexible, and apart from having the 'template' key,
     * are essentially key/value dictionaries until their types are resolved
     */
    templates: TemplateWithProps[];
    sentences: Sentence[];
    images?: Image[];
    tables?: any[][];
    lists?: any[][];
}

export interface Section {
    data: SectionData;
    depth: number;
}

export interface Interwiki {}

export interface ArticleData {
    type: string;
    /**
     * Article sections and infoboxes
     */
    sections: Section[];
    interwiki: Interwiki;
    categories: string[];
    coordinates: any[];
    citations: any[];
}

export interface Infobox {}

export interface Media {
    type: string;
    url: string;
    thumb: string;
    caption: Sentence[];
    attribution_url?: string;
    mime?: string;
    link_id?: number;
}

export interface Metadata {
    link_count: number;
    page_lang: string;
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
    description: string;
    category: string;
    link_id: number;
    social_type: string;
    attr: string;
    timestamp: Date;
    mime: string;
    in_gallery: boolean;
    in_blurb: boolean;
    attribution_url: string;
    media_page_uuid: string;
}

/**
 * Root for article JSON as parsed from `wtf_wikipedia`
 */
export interface ArticleJson {
    page_title: string;
    main_photo: Media;
    infobox_html: string;
    sections: Section[];
    infoboxes: Infobox[];
    citations: Citation[];
    media: Media[];
    metadata: Metadata;
    amp_info: AmpInfo;

    categories?: string[];
    interwiki?: Interwiki;
    type?: string;
    coordinates?: any[];
}
