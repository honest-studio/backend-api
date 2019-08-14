import { Controller, Get, Param } from '@nestjs/common';
import { ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { ArticleJson } from '../types/article';
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
        Example 1: 33
        Example 2: 33,739,203`
    })
    @ApiResponse({
        status: 200,
        description:
            'Returns the diff (or an array of diffs) between a proposal and its parent hash. Insertions in the diff_wiki are marked in the HTMl by &#60;ins&#62; and deletions are marked with &#60;del&#62;. These will typically render as <ins>underlines</ins> and <del>strikethroughs</del> in standard browsers.'
    })
    async getDiffByProposal(@Param('proposal_id') query_ids): Promise<Array<ArticleJson>> {
        const proposal_ids: Array<number> = query_ids.split(',').map(Number);
        const diffs = await this.diffService.getDiffsByProposal(proposal_ids);
        if (diffs.length == 0) throw new NotFoundException(
        return diffs;
    }
}
