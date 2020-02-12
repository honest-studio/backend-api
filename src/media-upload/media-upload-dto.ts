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

    @ApiModelProperty({
        description: 'Name of the file. Will be sanitized later',
        required: true
    })
    @IsString()
    filename_override: string;

    // Can only have specific types of uploads
    @ApiModelProperty({
        description: 'The type of file being uploaded (ProfilePicture, CitationThumbnail, NewlinkFiles, or GalleryMediaItem)',
        required: true
    })
    @IsString()
    upload_type: string;
    // @ApiModelProperty({
    //     description: 'The type of file being uploaded (ProfilePicture, CitationThumbnail, NewlinkFiles, or GalleryMediaItem)',
    //     required: true
    // })
    // @IsString()
    // @Matches(/^(ProfilePicture|CitationThumbnail|GalleryMediaItem|NewlinkFiles)$/gimu, {
    //     message: 'Needs to be either ProfilePicture, CitationThumbnail, NewlinkFiles, or GalleryMediaItem'
    // })
    // upload_type: 'ProfilePicture|CitationThumbnail|GalleryMediaItem|NewlinkFiles';
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
    mediumPhotoURL?: string;
    thumbnailPhotoURL: string;
    tinythumbPhotoURL?: string;
    mime: string;
    category: CitationCategoryType;
    webp_original?: string;
    webp_medium?: string;
    webp_thumb?: string;
    webp_tinythumb?: string;
}

