import { CitationCategoryType } from './article';

export interface MimePack {
    ext: string;
    mime: string;
}

export interface PreviewResult {
    page_title: string;
    slug: string;
    main_photo: string;
    thumbnail: string;
    lang_code: string;
    ipfs_hash: string;
    text_preview: string;
    pageviews: number;
    page_note: string;
    is_adult_content: boolean;
    creation_timestamp: Date;
    lastmod_timestamp: Date;
    html_blob?: string;
}
export type WikiSearchResult = PreviewResult;

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

export interface FileFetchResult {
    file_buffer: Buffer,
    mime_pack: MimePack;
    category: CitationCategoryType;
}

export interface SchemaSearchResult {
    key: string;
    schema: string;
    addl_schematype: string;
    addl_schema_itemprop: string;
}

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
