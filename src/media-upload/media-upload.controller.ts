import { Controller, Body, Get, Param, Post, Query, Req, UseInterceptors, FileInterceptor, UploadedFile, ValidationPipe, UsePipes  } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitBody, ApiImplicitFile, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
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
    // KNOWN ISSUE: /docs issue with application/json and multipart/form-data
    // https://github.com/nestjs/swagger/issues/167
    async uploadMedia(@UploadedFile() file, @Body(new ValidationPipe()) message: MediaUploadDto): Promise<any> {
        return this.MediaUploadService.processMedia(file.buffer, message.lang, message.slug, path.parse(file.originalname).name, message.upload_type, message.caption);
    }
}
