import {
    Controller,
    Body,
    Get,
    Param,
    Post,
    Query,
    Req,
    UseInterceptors,
    UploadedFile,
    ValidationPipe,
    UsePipes
} from '@nestjs/common';
import {
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiImplicitParam,
    ApiImplicitBody,
    ApiImplicitFile,
    ApiUseTags,
    ApiImplicitQuery
} from '@nestjs/swagger';
import { MediaUploadService } from './media-upload.service';
import { MediaUploadDto } from './media-upload-dto';
import * as rawbody from 'raw-body';
import { FileInterceptor } from '@nestjs/platform-express';
const path = require('path');

@Controller('v2/media-upload')
@ApiUseTags('Media Upload')
export class MediaUploadController {
    constructor(private readonly MediaUploadService: MediaUploadService) {}

    @Get('get-favicon/:encoded_url')
    @ApiOperation({ title: 'Get a favicon for a url' })
    @ApiImplicitParam({
        name: 'encoded_url',
        description: 'An encoded URL of the target site'
    })
    async getWikiHistory(@Param('encoded_url') encoded_url: string): Promise<any> {
        return this.MediaUploadService.getFavicon(encoded_url);
    }

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
        return this.MediaUploadService.processMedia(
            file.buffer,
            message.lang,
            message.slug,
            path.parse(file.originalname).name,
            message.upload_type,
            message.caption
        );
    }
}
