import { PageIndexedLinkCollection } from './api';

export interface AMPParseCollection {
    text: string;
    lightboxes: string[];
}

export interface SeeAlsoType {
    slug: string;
    page_title: string;
    lang_code: string;
    thumbnail: string;
    main_photo: string;
    text_preview: string;
    is_indexed: string;
    is_removed: string;
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
    class?: string;
}

export interface WikiExtraInfo {
    pageviews: number;
    see_also: SeeAlso[];
    alt_langs: LanguagePack[];
    schema: {[key: string]: any};
    canonical_slug: string;
    canonical_lang: string;
    link_collection: PageIndexedLinkCollection;
}

export interface LanguagePack {
    lang: string;
    article_title: string;
    slug: string;
}

export interface SitemapPack {
    id: number;
    lang: string;
    slug: string;
}

export interface WikiIdentity {
    lang_code: string;
    slug: string;
}
