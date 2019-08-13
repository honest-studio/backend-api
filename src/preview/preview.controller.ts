import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags, ApiImplicitQuery, ApiImplicitBody } from '@nestjs/swagger';
import { renderAMPHoverBlurb, renderAMPHoverLink } from '../utils/article-utils';
import { PreviewService } from './preview.service';
import { WikiService } from '../wiki/wiki.service';
import { ArticleJson } from '../types/article';
import { PreviewResult } from '../types/api';

@Controller('v2/preview')
@ApiUseTags('Preview')
export class PreviewController {
    constructor(
        private readonly previewService: PreviewService,
        private wikiService: WikiService
    ) {}

    @Get('hash/:ipfs_hashes')
    @ApiOperation({ title: 'Get preview of a wiki' })
    @ApiImplicitParam({
        name: 'ipfs_hashes',
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
    async getPreviewsByHash(@Param('ipfs_hashes') query_hashes): Promise<PreviewResult[]> {
        const ipfs_hashes = query_hashes.split(',');
        return this.previewService.getPreviewsByHash(ipfs_hashes);
    }

    @Post('slug/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get preview of a wiki' })
    @ApiImplicitParam({
        name: 'slug',
        description: 'slug for the wiki'
    })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'ISO 639 language code'
    })
    @ApiImplicitBody({
        name: 'user_agent',
        description: 'user agent type',
        type: String
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
    async getWikiPreviewBySlug(@Param('lang_code') lang_code, @Param('slug') slug, @Body() options): Promise<PreviewResult> {
        const previews = await this.previewService.getPreviewsBySlug([{ lang_code, slug }], options.user_agent);
        return previews[0];
    }

    @Get('amp-hoverblurb/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get AMP Hoverblurb HTML for a given article' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travis-moore'
    })
    @ApiResponse({
        status: 200,
        description: `An AMP HTML wiki encoded in UTF-8`
    })
    async getAMPHoverBlurbBySlugCtrl(@Param('lang_code') lang_code, @Param('slug') slug): Promise<string> {
        const previews = await this.previewService.getPreviewsBySlug([{ lang_code, slug }], 'chrome');
        return renderAMPHoverBlurb(previews[0]);
    }

    @Get('amp-hoverlink/:ipfs_hash/')
    @ApiOperation({ title: 'Get AMP Hoverlink HTML for a given article' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: `IPFS hash of a wiki. To get multiple wikis, separate hashes with a comma.  
            Example 1: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ
            Example 2: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ,QmU2skAMU2p9H9KXdMXWjDmzfZYoE76ksAKvsNQHdRg8dp`
    })
    @ApiImplicitQuery({
        name: 'target_url',
        description: `The URL of the citation`
    })
    @ApiResponse({
        status: 200,
        description: `An AMP HTML wiki encoded in UTF-8`
    })
    async getAMPHoverLink(@Param('ipfs_hash') ipfs_hash, @Query() options): Promise<string> {
        const theArticles = await this.wikiService.getWikisByHash([ipfs_hash]);
        return renderAMPHoverLink(theArticles[0], options.target_url);
    }

    @Post('slugs')
    @ApiOperation({ 
        title: 'Get preview for multiple wikis', 
        description: `Body format: An array of WikiIdentity objects, as well as a user agent. Example:
            {
                array: [
                    { "lang_code": "en", "slug": "Donald_Trump" },
                    { "lang_code": "en", "slug": "worbli" },
                    { "lang_code": "kr", "slug": "Donald_Trump" },
                    { "lang_code": "es", "slug": "jonah_kabidiman" },
                ],
                user_agent: 'chrome'
            }
        `
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
    async getWikiPreviewsBySlug(@Body() options): Promise<any> {
        return this.previewService.getPreviewsBySlug(options.array, options.user_agent);
    }
}
