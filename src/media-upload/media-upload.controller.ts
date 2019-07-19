import { Body, Controller, Post, UploadedFile, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiImplicitFile, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { FileFetchResult, MediaUploadResult, MediaUploadDto, MediaUploadDtoNoFile } from './media-upload-dto';
import { MediaUploadService, UrlPack } from './media-upload.service';
const path = require('path');

@Controller('v2/media-upload')
@ApiUseTags('Media Upload')
export class MediaUploadController {
    constructor(private readonly MediaUploadService: MediaUploadService) {}

    @Post('get-favicon')
    @ApiOperation({ title: 'Get a favicon for a url' })
    async getFaviconCtrl(@Body() pack: UrlPack): Promise<any> {
        return this.MediaUploadService.getFavicon(pack);
    }

    @Post('get-remote-file')
    @ApiOperation({ title: 'Get a remote file' })
    async getRemoteFileCtrl(@Body() pack: UrlPack): Promise<FileFetchResult> {
        return this.MediaUploadService.getRemoteFile(pack);
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
    async uploadMedia(@UploadedFile() file, @Body(new ValidationPipe()) message: MediaUploadDto): Promise<MediaUploadResult> {
        return this.MediaUploadService.processMedia(
            file.buffer,
            message.lang,
            message.slug,
            path.parse(file.originalname).name,
            message.upload_type,
            message.caption
        );
    }

    @Post('/upload-no-file')
    @ApiOperation({ title: 'Upload media' })
    @ApiResponse({
        status: 200,
        description: `Success`
    })
    async uploadMediaNoFile(@Body(new ValidationPipe()) message: MediaUploadDtoNoFile): Promise<MediaUploadResult> {
        let resultBuffer = await this.MediaUploadService.getImageBufferFromURL(message.url);
        return this.MediaUploadService.processMedia(
            resultBuffer,
            message.lang,
            message.slug,
            message.identifier,
            message.upload_type,
            message.caption
        );
    }
}
