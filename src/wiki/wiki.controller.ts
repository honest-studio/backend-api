import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { WikiService } from './wiki.service';

@Controller('v1/wiki')
@ApiUseTags('Wikis')
export class WikiController {
    constructor(private readonly wikiService: WikiService) {}

    @Get(':ipfs_hash')
    @ApiOperation({ title: 'Get IPFS document for a wiki' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: 'IPFS hash of a wiki - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getWiki(@Param('ipfs_hash') ipfs_hash): Promise<any> {
        return await this.wikiService.getWiki(ipfs_hash);
    }

    @Get(':ipfs_hash/history')
    @ApiOperation({ title: 'Get edit history for a wiki' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: 'IPFS hash of a wiki - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    @ApiResponse({
        status: 200,
        description: `Returns an array of IPFS hashes. The first item in the array is the most recent proposal, 
            and each subsequent hash is the parent of the one before it`
    })
    async getHistory(@Param('ipfs_hash') ipfs_hash): Promise<any> {
        return this.wikiService.getHistory(ipfs_hash);
    }
}
