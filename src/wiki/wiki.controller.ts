import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
import { WikiService } from './wiki.service';

@Controller('v1/wiki')
@ApiUseTags('Wikis')
export class WikiController {
    constructor(private readonly wikiService: WikiService) {}

    @Get('hash/:ipfs_hash')
    @ApiOperation({ title: 'Get wiki by IPFS hash' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: 'IPFS hash of a wiki - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getWikiByHash(@Param('ipfs_hash') ipfs_hash): Promise<any> {
        return await this.wikiService.getWikiByHash(ipfs_hash);
    }

    @Get('hashes')
    @ApiOperation({ title: 'Get multiple wikis by IPFS hash' })
    @ApiImplicitQuery({
        name: 'hashes',
        description: 'Array of IPFS hashes of wikis - Example: /v1/wiki/hashes?hashes[]=QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ&hashes[]=QmTbt2AFYFbyF1cae7AuXiYfEWEsDVgnth2Z5X4YBceu6z',
        type: 'String',
        isArray: true
    })
    async getWikisByHash(@Query('hashes') ipfs_hashes): Promise<any> {
        return await this.wikiService.getWikisByHash(ipfs_hashes);
    }

    @Get('title/:article_title')
    @ApiOperation({ title: 'Get wiki by article title' })
    @ApiImplicitParam({
        name: 'article_title',
        description: 'The article slug (will later be the on-chain article title) Example: travis-moore'
    })
    async getWikiByTitle(@Param('article_title') article_title): Promise<any> {
        return await this.wikiService.getWikiByTitle(article_title);
    }
}
