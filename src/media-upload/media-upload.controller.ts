import { Controller, Body, Get, Param, Post, Query, Req, UseInterceptors, FileInterceptor, UploadedFile  } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitFile, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
import { MediaUploadService } from './media-upload.service';
import { MediaUploadParams } from './media-upload-dto';
import * as rawbody from 'raw-body';

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
    // Need to add a validator here later
    // @UsePipes(new JoiValidationPipe(HistoryWikiSchema, ['query']))
    uploadMedia(@UploadedFile() file, @Body() message: MediaUploadParams) {
        console.log(file);
        console.log(message);
    }
}
