export interface AMPParseCollection {
    text: string;
    lightboxes: string[];
}

export interface SeeAlso {
    lang: string;
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

export interface InlineImage {
    src: string;
    srcSet: string;
    alt: string;
    height: string;
    width: string;
}

export interface WikiExtraInfo {
    pageviews: number;
    see_also: SeeAlso[];
    alt_langs: LanguagePack[];
}

export interface LanguagePack {
    lang: string;
    article_title: string;
    slug: string;
}

export interface WikiIdentity {
    lang_code: string;
    slug: string;
}
