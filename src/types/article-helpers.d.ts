import { PageIndexedLinkCollection, PageCategory, PageCategoryCollection } from './api';

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
    is_indexed: boolean;
    is_removed: boolean;
}

export interface SeeAlsoCountGroup {
    count: number;
    data: SeeAlsoType;
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
    see_also: SeeAlsoType[];
    alt_langs: LanguagePack[];
    schema: {[key: string]: any};
    canonical_slug: string;
    canonical_lang: string;
    link_collection: PageIndexedLinkCollection;
    page_categories: PageCategory[];
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
    ipfs_hash?: string; // Useful to find missing / unsynced hashes
}
