import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { PreviewService } from './preview.service';

@Controller('v1/preview')
@ApiUseTags('Preview')
export class PreviewController {
    constructor(private readonly previewService: PreviewService) {}

    @Get('wiki/:ipfs_hash')
    @ApiOperation({ title: 'Get preview of a wiki' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: 'IPFS hash of a wiki - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    @ApiResponse({
        status: 200,
        description:
            `{
                title: Article title,
                mainimage: Main article image,
                thumbnail: Article main image thumbnail,
                page_lang: ISO 639 language code,
                ipfs_hash: Article IPFS hash,
                text_preview: Snippet of text from the article
            }`
    })
    async getWikiPreview(@Param('ipfs_hash') ipfs_hash): Promise<any> {
        return await this.previewService.getWikiPreview(ipfs_hash);
    }
}
