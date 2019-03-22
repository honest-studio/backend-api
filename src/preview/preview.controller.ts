import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { PreviewService } from './preview.service';

@Controller('v2/preview')
@ApiUseTags('Preview')
export class PreviewController {
    constructor(private readonly previewService: PreviewService) {}

    @Get('hash/:ipfs_hashes')
    @ApiOperation({ title: 'Get preview of a wiki' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: `IPFS hash of a wiki. To get multiple wikis, separate hashes with a comma.  
            Example 1: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ
            Example 2: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ,QmU2skAMU2p9H9KXdMXWjDmzfZYoE76ksAKvsNQHdRg8dp`
    })
    @ApiResponse({
        status: 200,
        description: `Object or array of objects with the following schema:
            {
                title: Article title,
                mainimage: Main article image,
                thumbnail: Article main image thumbnail,
                page_lang: ISO 639 language code,
                ipfs_hash: Article IPFS hash,
                text_preview: Snippet of text from the article
            }`
    })
    async getPreviewsByHash(@Param('ipfs_hashes') query_hashes): Promise<any> {
        const ipfs_hashes = query_hashes.split(',');
        return this.previewService.getPreviewsByHash(ipfs_hashes);
    }

    @Get('slug/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get preview of a wiki' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'ISO 639 language code'
    })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'ISO 639 language code'
    })
    @ApiResponse({
        status: 200,
        description: `Object or array of objects with the following schema:
            {
                title: Article title,
                mainimage: Main article image,
                thumbnail: Article main image thumbnail,
                page_lang: ISO 639 language code,
                ipfs_hash: Article IPFS hash,
                text_preview: Snippet of text from the article
            }`
    })
    async getWikiPreviewBySlug(@Param('lang_code') lang_code, @Param('slug') slug): Promise<any> {
        return this.previewService.getPreviewBySlug(lang_code, slug);
    }
}
