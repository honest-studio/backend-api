import { Controller, Get, Post, Req, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags, ApiImplicitBody } from '@nestjs/swagger';
import { WikiService } from './wiki.service';
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
    @ApiResponse({
        status: 200,
        description: `An HTML wiki or key-value object with hashes as keys to HTML wikis encoded in UTF-8`
    })
    async getWikiByHash(@Param('ipfs_hash') query_hashes): Promise<any> {
        const ipfs_hashes = query_hashes.split(',');
        if (ipfs_hashes.length == 1)
            return await this.wikiService.getWikiByHash(ipfs_hashes[0]);
        else
            return await this.wikiService.getWikisByHash(ipfs_hashes);
    }

    @Get('id/:wiki_id')
    @ApiOperation({ title: 'Get wiki by ID' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: `IPFS hash of a wiki. To get multiple wikis, separate hashes with a comma.  
            Example 1: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ
            Example 2: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ,QmU2skAMU2p9H9KXdMXWjDmzfZYoE76ksAKvsNQHdRg8dp`
    })
    @ApiResponse({
        status: 200,
        description: `An HTML wiki or key-value object with hashes as keys to HTML wikis encoded in UTF-8`
    })
    async getWikiById(@Param('wiki_id') query_id: string): Promise<any> {
        const wiki_id = Number(query_id);
        return this.wikiService.getWikiById(wiki_id);
    }

    @Get('title/:article_title')
    @ApiOperation({ title: 'Get wiki by article title' })
    @ApiImplicitParam({
        name: 'article_title',
        description: 'The article slug (will later be the on-chain article title) Example: travis-moore'
    })
    @ApiResponse({
        status: 200,
        description: `An HTML wiki encoded in UTF-8`
    })
    async getWikiByTitle(@Param('article_title') article_title): Promise<any> {
        return await this.wikiService.getWikiByTitle(article_title);
    }

    @Post('/')
    @ApiOperation({ title: "Submit a wiki to IPFS" })
    @ApiResponse({
        status: 200,
        description: `Success`
    })
    async submitWiki(_, @Req() req): Promise<any> {
        const raw = await rawbody(req);
        return this.wikiService.submitWiki(raw.toString());
    }
}
