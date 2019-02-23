import { Controller, Get, Post, Req, Param, Query, UsePipes } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiImplicitParam,
    ApiUseTags,
    ApiImplicitBody,
    ApiImplicitQuery
} from '@nestjs/swagger';
import { WikiService } from './wiki.service';
import { WikiQuerySchema } from './wiki.query-schema';
import { JoiValidationPipe } from '../common';
import * as rawbody from 'raw-body';

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
    @ApiImplicitQuery({
        name: 'json',
        description: `Return the wiki in a parsed JSON format instead of raw HTML. The JSON will eventually become a replacement for the HTML`,
        required: false,
        type: Boolean
    })
    @ApiResponse({
        status: 200,
        description: `An HTML wiki or key-value object with hashes as keys to HTML wikis encoded in UTF-8`
    })
    @UsePipes(new JoiValidationPipe(WikiQuerySchema, ['query']))
    async getWikiByHash(@Param('ipfs_hash') query_hashes, @Query() query): Promise<any> {
        const ipfs_hashes = query_hashes.split(',');
        if (ipfs_hashes.length == 1) return await this.wikiService.getWikiByHash(ipfs_hashes[0], query);
        else return await this.wikiService.getWikisByHash(ipfs_hashes, query);
    }

    @Get('id/:wiki_id')
    @ApiOperation({ title: 'Get wiki by ID' })
    @ApiImplicitParam({
        name: 'wiki_id',
        description: `ID of a wiki. To get multiple wikis, separate IDs with a comma.  
            Example 1: 10
            Example 2: 10,1000000063,323`
    })
    @ApiImplicitQuery({
        name: 'json',
        description: `Return the wiki in a parsed JSON format instead of raw HTML. The JSON will eventually become a replacement for the HTML`,
        required: false,
        type: Boolean
    })
    @ApiResponse({
        status: 200,
        description: `An HTML wiki or key-value object with hashes as keys to HTML wikis encoded in UTF-8`
    })
    @UsePipes(new JoiValidationPipe(WikiQuerySchema, ['query']))
    async getWikiById(@Param('wiki_id') query_id: string, @Query() query): Promise<any> {
        const wiki_id = Number(query_id);
        return this.wikiService.getWikiById(wiki_id, query);
    }

    @Get('title/:article_title')
    @ApiOperation({ title: 'Get wiki by article title' })
    @ApiImplicitParam({
        name: 'article_title',
        description: 'The article slug (will later be the on-chain article title) Example: travis-moore'
    })
    @ApiImplicitQuery({
        name: 'json',
        description: `Return the wiki in a parsed JSON format instead of raw HTML. The JSON will eventually become a replacement for the HTML`,
        required: false,
        type: Boolean
    })
    @ApiResponse({
        status: 200,
        description: `An HTML wiki encoded in UTF-8`
    })
    @UsePipes(new JoiValidationPipe(WikiQuerySchema, ['query']))
    async getWikiByTitle(@Param('article_title') article_title, @Query() query): Promise<any> {
        return await this.wikiService.getWikiByTitle(article_title, query);
    }

    @Post('/')
    @ApiOperation({ title: 'Submit a wiki to IPFS' })
    @ApiResponse({
        status: 200,
        description: `Success`
    })
    async submitWiki(_, @Req() req): Promise<any> {
        const raw = await rawbody(req);
        return this.wikiService.submitWiki(raw.toString());
    }
}
