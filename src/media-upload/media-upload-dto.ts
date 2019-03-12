import { IsString, Matches } from 'class-validator';
import { ApiModelProperty, ApiModelPropertyOptional, ApiConsumes } from '@nestjs/swagger';

// Parameters for the media upload
export class MediaUploadDto {
    @ApiModelProperty({ 
        description: "The language of the page where the image is being uploaded to",
        required: true
    })
    @IsString()
    lang: string;

    @ApiModelProperty({ 
        description: "The slug of the page where the image is being uploaded to",
        required: true 
    })
    @IsString()
    slug: string;

    @ApiModelProperty({ 
        description: "A description of the file",
        required: true 
    })
    @IsString()
    caption: string;

    // Can only have specific types of uploads
    @ApiModelProperty({ 
        description: "The type of file being uploaded (ProfilePicture, CitationThumbnail, or GalleryMediaItem)",
        required: true 
    })
    @IsString()
    @Matches(/^(ProfilePicture|CitationThumbnail|GalleryMediaItem)$/igum, {
        message: "Needs to be either ProfilePicture, CitationThumbnail, or GalleryMediaItem"
    })
    upload_type: 'ProfilePicture|CitationThumbnail|GalleryMediaItem';
}

// Mimetype interface
export interface MimePack {
    ext: string;
    mime: string;
}
