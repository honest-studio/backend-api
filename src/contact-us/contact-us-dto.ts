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


// @ApiImplicitParam({
//     name: 'contact_date',
//     required: true,
//     description: 'The date'
// })
// @ApiImplicitParam({
//     name: 'contact_text',
//     required: true,
//     description: 'The text of the contact us form'
// })
// @ApiImplicitParam({
//     name: 'contact_email',
//     required: true,
//     description: 'The email of the submitter'
// })
// @ApiImplicitParam({
//     name: 'contact_subject',
//     required: true,
//     description: 'Subject'
// })
// @ApiImplicitParam({
//     name: 'contact_type',
//     required: true,
//     description: 'The type of contact'
// })
// @ApiImplicitParam({
//     name: 'contact_ip',
//     required: true,
//     description: 'IP address of the contact'
// })
// @ApiImplicitParam({
//     name: 'contact_useragent',
//     required: true,
//     description: 'The user agent'
// })



// Mimetype interface
export interface MimePack {
    ext: string;
    mime: string;
}