import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { DiffService } from './diff.service';

@Controller('v1/diff')
@ApiUseTags('Diffs')
export class DiffController {
    constructor(private readonly diffService: DiffService) {}

    @Get('/proposal/:proposal_hash')
    @ApiOperation({ title: 'Get diff of an edit proposal' })
    @ApiImplicitParam({
        name: 'proposal_hash',
        description: 'IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    @ApiResponse({
        status: 200,
        description:
            'Returns the diff between a proposal and its parent hash. Insertions in the diff_wiki are marked in the HTMl by &#60;ins&#62; and deletions are marked with &#60;del&#62;. These will typically render as <ins>underlines</ins> and <del>strikethroughs</del> in standard browsers.'
    })
    async getDiffByProposal(@Param('proposal_hash') proposal_hash): Promise<any> {
        return await this.diffService.getDiffByProposal(proposal_hash);
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
        return await this.diffService.getDiffByWiki(old_hash, new_hash);
    }
}
