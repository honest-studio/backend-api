import { CitationCategoryType } from './article';

export interface MimePack {
    ext: string;
    mime: string;
}

interface PreviewResult {
    page_title: string;
    slug: string;
    main_photo: string;
    main_photo_category: CitationCategoryType;
    thumbnail: string;
    lang_code: string;
    ipfs_hash: string;
    text_preview: string;
    pageviews: number;
    page_note: string;
    page_type: string;
    is_adult_content: boolean;
    creation_timestamp: Date;
    lastmod_timestamp: Date;
    webp_large: string;
    webp_medium: string;
    webp_small: string;
    is_indexed: boolean;
    is_removed: boolean;
    html_blob?: string;
}

export interface ProfileSearchPack {
    searchterm: string
}

export interface PageCategory {
    id: number;
    lang: string;
    slug: string;
    title: string;
    description: string;
    img_full: string;
    img_full_webp: string;
    img_thumb: string;
    img_thumb_webp: string;

    schema_for?: string;
    schema_regex?: string;
    key_regex?: string;
    values_regex?: string;
    views?: number
}

export interface PageCategoryCollection {
    category: PageCategory;
    previews: PreviewResult[];
}

export type PageIndexedLinkCollection = string[];

export type WikiSearchResult = PreviewResult;

export type SearchType = 'article' | 'profile' | 'category';

export interface ExtendedSearchResult {
    articles: WikiSearchResult[],
    categories: PageCategory[],
    profiles: PublicProfileType[]
}

export interface BookInfoPack {
    title: string;
    thumb: string;
    url: string;
    isbn_10: string;
    isbn_13: string;
    author: string;
    publisher: string;
    published: string;
    description: Sentence[];
}

export interface PeriodicalInfoPack {
    title: string;
    thumb: string;
    url: string;
    issn: string;
    author: string;
    publisher: string;
    published: string;
    description: Sentence[];
}


export interface FileFetchResult {
    file_buffer: Buffer;
    mime_pack: MimePack;
    category: CitationCategoryType;
}

interface MergeResult {
    merged_json: ArticleJson;
    target_original_ipfs_hash: string;
}

export interface SchemaSearchResult {
    key: string;
    schema: string;
    addl_schematype: string;
    addl_schema_itemprop: string;
}

export interface MergeProposalParsePack {
    source: {
        slug: string;
        lang: string;
        ipfs_hash: string;
    };
    target: {
        slug: string;
        lang: string;
        ipfs_hash: string;
    };
    final_hash: string;
}

export interface Wikistbl2Item {
    id: number;
    slug: string;
    group_id: number;
    lang_code: string;
    ipfs_hash: string;
}

export interface Boost {
    id: number;
    slug: string;
    lang_code: string;
    booster: string;
    amount: number;
    timestamp: number;
}

export interface BoostActivityPack {
    boost: Boost;
    preview: PreviewResult;
}

export interface BoostsByWikiReturnPack {
    boost: Boost;
    preview: PreviewResult;
}

export interface BoostsByUserReturnPack {
    user: string;
    wiki_packs: BoostsByWikiReturnPack[]
}

export interface ProfileLanguageType {
    lang_code: string;
    level: number; // Should be 0-3
};

export interface ProfileLocationType {
    city: string;
    state: string;
    country: string;
};

export interface ProfilePlatformsType {
    platform: string;
    url: string;
};

export interface PublicProfileType {
    user: string; // 'imthemachine'
    about_me: string; // 'Chief Product Officer'
    display_name: string; // 'Daniel Liebeskind'
    img: string; // "https://everipedia.org/images/daniel_liebeskind.jpg"
    medium?: string // 640x640
    thumb?: string; // 320x320
    tinythumb?: string; // 100x100
    webp_original?: string; // 1201x1201
    webp_medium?: string; // 640x640 
    webp_thumb?: string; // 320x320
    webp_tinythumb?: string; // 100x100
    languages: ProfileLanguageType[]; // [{"lang_code":"EN","level":3}]
    location: ProfileLocationType; // {"city":"los angeles","country":"US","state":"CA"}
    platforms: ProfilePlatformsType[]; // [{"platform":"Instagram","url":"exploremagic"}]
    error?: string; // Gets added when user has no public profile instantiated.
};

/**
 * Describe a successful response to a media upload
 */
export interface MediaUploadResult {
    /**
     * Full URL of main photo, e.g., https://everipedia-storage.s3.amazonaws.com/ProfilePicture/lang_en/cardi-b/blob__64173.png
     */
    mainPhotoURL: string;
    /**
     * Dictionary reflecting safely-encoded vars captured on the server side
     */
    returnDict: {
        /**
         * URI-encoded extension as captured on the server
         */
        caption: string;
        /**
         * Filename excluding extension
         */
        filename: string;
    };

    /**
     * Full URL of thumbnail photo, e.g., https://everipedia-storage.s3.amazonaws.com/ProfilePicture/lang_en/cardi-b/blob__64173__thumb.png
     */
    thumbnailPhotoURL: string;
    /**
     * MIME type of the item (e.g. 'image/png' or 'application/pdf')
     */
    mime: string;
    /**
     * Category of the item (e.g. 'PHOTO' or 'VIDEO')
     */
    category: CitationCategoryType;
}
