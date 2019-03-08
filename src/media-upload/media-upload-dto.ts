// Can only have specific types of uploads
export type PhotoUploadTypes = "ProfilePicture" | "CitationThumbnail" | "GalleryMediaItem";

// Parameters for the media upload
export interface MediaUploadParams {
    caption: string;
    upload_type: PhotoUploadTypes;
}

// Mimetype interface
export interface MimePack {
    ext: string;
    mime: string;
}