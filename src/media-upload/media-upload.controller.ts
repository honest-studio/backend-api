import { Controller, Body, Get, Param, Post, Query, Req, UseInterceptors, FileInterceptor, UploadedFile, ValidationPipe  } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitFile, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
import { MediaUploadService } from './media-upload.service';
import { MediaUploadDto } from './media-upload-dto';
import * as rawbody from 'raw-body';
const path = require('path');

@Controller('v2/media-upload')
@ApiUseTags('Media Upload')
export class MediaUploadController {
    constructor(private readonly MediaUploadService: MediaUploadService) {}

    @Post('/')
    @ApiOperation({ title: 'Upload media' })
    @ApiResponse({
        status: 200,
        description: `Success`
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ 
        name: 'file',
		required: true,
        description: 'The media file data'
    })
    @ApiImplicitParam({
        name: 'caption',
        description: 'A description of the file'
    })
    @ApiImplicitParam({
        name: 'upload_type',
        required: true,
        description: 'The type of file being uploaded (ProfilePicture, CitationThumbnail, or GalleryMediaItem)'
    })
    @ApiImplicitParam({
        name: 'slug',
        required: true,
        description: 'The slug of the page where the image is being uploaded to'
    })
    @ApiImplicitParam({
        name: 'lang',
        required: true,
        description: 'The language of the page where the image is being uploaded to'
    })
    // Need to add a validator here later
    async uploadMedia(@UploadedFile() file, @Body(new ValidationPipe()) message: MediaUploadDto): Promise<any> {
        return this.MediaUploadService.processMedia(file.buffer, message.lang, message.slug, path.parse(file.originalname).name, message.upload_type, message.caption);
    }
}
