import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CitationCategoryType } from '../types/article';

export interface PhotoExtraData {
    width: number;
    height: number;
    mime: string;
}

// Parameters for the media upload
export class MediaUploadDto {
    @ApiModelProperty({
        description: 'The language of the page where the image is being uploaded to',
        required: true
    })
    @IsString()
    lang: string;

    @ApiModelProperty({
        description: 'The slug of the page where the image is being uploaded to',
        required: true
    })
    @IsString()
    slug: string;

    @ApiModelProperty({
        description: 'A description of the file',
        required: true
    })
    @IsString()
    caption: string;

    // Can only have specific types of uploads
    @ApiModelProperty({
        description: 'The type of file being uploaded (ProfilePicture, CitationThumbnail, or GalleryMediaItem)',
        required: true
    })
    @IsString()
    upload_type: string;
    // @ApiModelProperty({
    //     description: 'The type of file being uploaded (ProfilePicture, CitationThumbnail, or GalleryMediaItem)',
    //     required: true
    // })
    // @IsString()
    // @Matches(/^(ProfilePicture|CitationThumbnail|GalleryMediaItem)$/gimu, {
    //     message: 'Needs to be either ProfilePicture, CitationThumbnail, or GalleryMediaItem'
    // })
    // upload_type: 'ProfilePicture|CitationThumbnail|GalleryMediaItem';
}

// Parameters for the media upload
export class MediaUploadDtoNoFile extends MediaUploadDto {
    @ApiModelProperty({
        description: 'The url of the target file to upload to S3',
        required: true
    })
    @IsString()
    url: string;

    @ApiModelProperty({
        description: 'Filename / identifier prefix',
        required: true
    })
    @IsString()
    identifier: string;
}

// Mimetype interface
export interface MimePack {
    ext: string;
    mime: string;
}

export interface FileFetchResult {
    file_buffer: Buffer,
    mime_pack: MimePack;
    category: CitationCategoryType;
}

/**
 * Describe a successful response to a media upload
 */
export interface MediaUploadResult {
    mainPhotoURL: string;
    returnDict: {
        caption: string;
        filename: string;
    };
    thumbnailPhotoURL: string;
    mime: string;
    category: CitationCategoryType;
    webp_original?: string;
    webp_medium?: string;
    webp_thumb?: string;
}

