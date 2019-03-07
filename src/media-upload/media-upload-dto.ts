export type PhotoUploadTypes = "ProfilePicture" | "CitationThumbnail" | "GalleryMediaItem";

export interface MediaUploadParams {
    caption: string;
    upload_type: PhotoUploadTypes;
}