import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { CacheService } from './cache.service';

@Controller('v2/cache')
@ApiUseTags('Cache')
export class CacheController {
    constructor(private readonly cacheService: CacheService) {}

    @Get('/wiki/:ipfs_hash')
    @ApiOperation({ title: 'Fetch and pin a wiki locally' })
    @ApiImplicitParam({
        name: 'ipfs_hash',
        description: 'IPFS hash of a wiki - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async cacheWiki(@Param('ipfs_hash') ipfs_hash): Promise<any> {
        return await this.cacheService.cacheWiki(ipfs_hash);
    }
}
