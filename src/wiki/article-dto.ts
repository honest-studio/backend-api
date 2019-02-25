/**
 * Link to a page
 */
export interface PageLink {
    page: string;
    text: string;
    type?: string;
    site?: string;
}

export interface Sentence {
    type: string; // sentence | inline-image | fixed
    index: number;
    text: string;
    links: PageLink[];
}

export interface Paragraph {
    index: number;
    items: Sentence[];
    tag_type: string;
    attrs: { string : string };
}

export interface Section {
    paragraphs: Paragraph;
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
    type?: string;
}
