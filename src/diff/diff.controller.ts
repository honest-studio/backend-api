import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
import { DiffService } from './diff.service';

@Controller('v2/diff')
@ApiUseTags('Diffs')
export class DiffController {
    constructor(private readonly diffService: DiffService) {}

    @Get('/proposal/:proposal_id')
    @ApiOperation({ title: 'Get diffs for edit proposals' })
    @ApiImplicitParam({
        name: 'proposal_id',
        description: `IPFS hashes of proposals. To get multiple proposals, separate hashes with a comma.
        Example 1: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ
        Example 2: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ,QmU2skAMU2p9H9KXdMXWjDmzfZYoE76ksAKvsNQHdRg8dp`
    })
    @ApiResponse({
        status: 200,
        description:
            'Returns the diff (or an array of diffs) between a proposal and its parent hash. Insertions in the diff_wiki are marked in the HTMl by &#60;ins&#62; and deletions are marked with &#60;del&#62;. These will typically render as <ins>underlines</ins> and <del>strikethroughs</del> in standard browsers.'
    })
    async getDiffByProposal(@Param('proposal_id') query_ids): Promise<any> {
        const proposal_ids: Array<number> = query_ids.split(',').map(Number);
        return await this.diffService.getDiffsByProposal(proposal_ids);
    }

    @Get('/wiki/:old_hash/:new_hash')
    @ApiOperation({ title: 'Get diff between 2 wikis' })
    @ApiImplicitParam({
        name: 'old_hash',
        description: 'IPFS hash of old wiki'
    })
    @ApiImplicitParam({
        name: 'new_hash',
        description: 'IPFS hash of new wiki'
    })
    async getDiffByWiki(@Param('old_hash') old_hash, @Param('new_hash') new_hash): Promise<any> {
        return await this.diffService.getDiffsByWiki([old_hash, new_hash]);
    }
}
