import { Body, Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import { ApiImplicitParam, ApiImplicitQuery, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { ArticleJson } from '../types/article';
import { MergeResult, Boost } from '../types/api';
import { WikiExtraInfo } from '../types/article-helpers';
import { WikiQuerySchema } from './wiki.query-schema';
import { WikiService, MergeInputPack } from './wiki.service';

@Controller('v2/wiki')
@ApiUseTags('Wikis')
export class WikiController {
    constructor(private readonly wikiService: WikiService) {}

    @Get('hash/:ipfs_hash')
    @ApiOperation({ title: 'Get wiki by IPFS hash' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: `IPFS hash of a wiki. To get multiple wikis, separate hashes with a comma.  
            Example 1: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ
            Example 2: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ,QmU2skAMU2p9H9KXdMXWjDmzfZYoE76ksAKvsNQHdRg8dp`
    })
    @ApiResponse({
        status: 200,
        description: `An JSON wiki or array of JSON wikis`
    })
    async getWikisByHash(@Param('ipfs_hash') query_hashes): Promise<ArticleJson[]> {
        const ipfs_hashes = query_hashes.split(',');
        return this.wikiService.getWikisByHash(ipfs_hashes);
    }

    @Get('boosts_by_langslug/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get boosts for a given langslug' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travismoore5036459'
    })
    @ApiResponse({
        status: 200,
        description: `returns an array of boosts`
    })
    async getBoostsByWikiLangSlug(@Param('lang_code') lang_code, @Param('slug') slug): Promise<Boost[]> {
        return this.wikiService.getBoostsByWikiLangSlug(lang_code, slug);
    }

    @Get('slug/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get wiki by article langslug' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travismoore5036459'
    })
    @ApiImplicitQuery({
        name: 'cache',
        description: `Set to false if you don't want to use the cache`
    })
    @ApiResponse({
        status: 200,
        description: `A JSON for the wiki encoded in UTF-8`
    })
    @UsePipes(new JoiValidationPipe(WikiQuerySchema, ['query']))
    async getWikiBySlug(@Param('lang_code') lang_code, @Param('slug') slug, @Query() options): Promise<ArticleJson> {
        this.wikiService.incrementPageviewCount(lang_code, slug);
        return this.wikiService.getWikiBySlug(lang_code, slug, options.cache);
    }

    @Get('schema/lang_:lang_code/:slug')
    @ApiOperation({
        title:
            'Get the schema.org for the page in JSON-LD format https://developers.google.com/search/docs/guides/intro-structured-data'
    })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travismoore5036459'
    })
    @ApiResponse({
        status: 200,
        description: `A JSON-LD for the wiki encoded in UTF-8`
    })
    async getSchemaBySlug(@Param('lang_code') lang_code, @Param('slug') slug): Promise<any> {
        return this.wikiService.getSchemaBySlug(lang_code, slug);
    }

    @Get('amp/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get AMP HTML for a given article' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travismoore5036459'
    })
    @ApiImplicitQuery({
        name: 'cache',
        description: `Set to false if you don't want to use the cache`
    })
    @ApiResponse({
        status: 200,
        description: `An AMP HTML wiki encoded in UTF-8`
    })
    async getAMPBySlug(@Param('lang_code') lang_code, @Param('slug') slug, @Query() options): Promise<any> {
        this.wikiService.incrementPageviewCount(lang_code, slug);
        return this.wikiService.getAMPBySlug(lang_code, slug, options.cache);
    }

    @Get('group/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get all the language versions of a page' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travismoore5036459'
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of the languages available`
    })
    async getWikiGroups(@Param('lang_code') lang_code, @Param('slug') slug): Promise<any> {
        return this.wikiService.getWikiGroups(lang_code, slug);
    }

    @Get('extra/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get extra info for a wiki' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travismoore5036459'
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of the languages available`
    })
    async getWikiExtras(@Param('lang_code') lang_code, @Param('slug') slug): Promise<WikiExtraInfo> {
        return this.wikiService.getWikiExtras(lang_code, slug);
    }

    @Post('/')
    @ApiOperation({ 
        title: 'Submit a wiki to IPFS',
        description: `The submitted wiki must be a JSON in ArticleJson format with the ipfs_hash set to null. 
        The ArticleJson spec is available at https://github.com/EveripediaNetwork/backend-api/blob/master/src/utils/article-utils/article-dto.ts
        An example ArticleJson can be accessed at https://api.everipedia.org/v2/wiki/slug/lang_en/cardi-b 
        For the data to be stored properly, an article submission with the specified hash must occur on the EOS mainnet within 90 seconds.
        There is a downvote bot that automatically downvotes unreachable wikis.
        Using this endpoint guarantees that your article will be reachable, but it is not the only way to prevent downvotes. 
        Any wiki that is accessible within the IPFS network will not be downvoted. 
        Be careful though, the IPFS network is notoriously unreliable and a wiki you feel is properly hosted may not actually be accessible by the network.`
    })
    @ApiResponse({
        status: 200,
        description: `Returns the ipfs_hash of the submitted wiki`
    })
    async submitWiki(@Body() wiki): Promise<any> {
        return this.wikiService.submitWiki(wiki);
    }

    @Post('get-merged-result')
    @ApiOperation({ title: 'Get the result of merging two wiki articles' })
    async getMergedWikiCtrl(@Body() pack: MergeInputPack): Promise<MergeResult> {
        return this.wikiService.getMergedWiki(pack);
    }

    // @Post('/bot-submit')
    // @ApiOperation({ 
    //     title: 'Submit a wiki via a bot',
    //     description: `The submitted wiki must be a JSON in ArticleJson format with the ipfs_hash set to null. 
    //     The ArticleJson spec is available at https://github.com/EveripediaNetwork/backend-api/blob/master/src/utils/article-utils/article-dto.ts
    //     An example ArticleJson can be accessed at https://api.everipedia.org/v2/wiki/slug/lang_en/cardi-b 
    //     For the data to be stored properly, an article submission with the specified hash must occur on the EOS mainnet within 90 seconds.
    //     There is a downvote bot that automatically downvotes unreachable wikis.
    //     Using this endpoint guarantees that your article will be reachable, but it is not the only way to prevent downvotes. 
    //     Any wiki that is accessible within the IPFS network will not be downvoted. 
    //     Be careful though, the IPFS network is notoriously unreliable and a wiki you feel is properly hosted may not actually be accessible by the network.`
    // })
    // @ApiImplicitQuery({
    //     name: 'token',
    //     description: `Token required to process`
    // })
    // @ApiImplicitQuery({
    //     name: 'bypass_ipfs',
    //     description: `Use IPFS hash inside the ArticleJSON instead of generating one on the backend`
    // })
    // @ApiResponse({
    //     status: 200,
    //     description: `Returns the ipfs_hash of the submitted wiki`
    // })
    // async submitWikiViaBot(@Body() wiki, @Query() options): Promise<any> {
    //     return this.wikiService.submitWikiViaBot(wiki, options.token, options.bypass_ipfs);
    // }
}
