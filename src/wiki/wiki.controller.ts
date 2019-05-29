import { Controller, Get, Post, Body, Param, Query, UsePipes } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiImplicitParam,
    ApiUseTags,
    ApiImplicitBody,
    ApiImplicitQuery
} from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { WikiService } from './wiki.service';
import { WikiQuerySchema } from './wiki.query-schema';
import { ArticleJson } from '../utils/article-utils/article-dto';
import { WikiExtraInfo } from '../utils/article-utils/article-types';
import * as rawbody from 'raw-body';
import * as boolean from 'boolean';


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

    @Get('slug/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get wiki by article title' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travis-moore'
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
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travis-moore'
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
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travis-moore'
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
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travis-moore'
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
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travis-moore'
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
        description: `The submitted wiki must be a JSON in ArticleJson format with the ipfs_hash set to null`
    })
    @ApiResponse({
        status: 200,
        description: `Returns the ipfs_hash of the submitted wiki`
    })
    async submitWiki(@Body() wiki): Promise<any> {
        return this.wikiService.submitWiki(wiki);
    }
}
