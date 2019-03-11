import { IsString, Matches } from 'class-validator';

// Parameters for the media upload
export class ContactUSDto {
    @IsString()
    lang: string;

    @IsString()
    slug: string;

    @IsString()
    caption: string;

    // Can only have specific types of uploads
    @IsString()
    @Matches(/^(ProfilePicture|CitationThumbnail|GalleryMediaItem)$/igum, {
        message: "Needs to be either ProfilePicture, CitationThumbnail, or GalleryMediaItem"
    })
    upload_type: string;
}

// Mimetype interface
export interface MimePack {
    ext: string;
    mime: string;
}