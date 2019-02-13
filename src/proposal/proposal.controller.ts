import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
import { ProposalService } from './proposal.service';

@Controller('v2/proposal')
@ApiUseTags('Proposals')
export class ProposalController {
    constructor(private readonly proposalService: ProposalService) {}

    @Get(':proposal_ids')
    @ApiOperation({ title: 'Get details of a proposal' })
    @ApiImplicitParam({
        name: 'proposal_ids',
        description: `IDs of proposals. To get multiple proposals, separate IDs with a comma.
        Example 1: 55
        Example 2: 55,92,332`
    })
    @ApiImplicitQuery({
        name: 'diff_percent',
        type: 'boolean',
        description: 'returns percentage difference from previous version if set true'
    })
    @ApiImplicitQuery({
        name: 'preview',
        type: 'boolean',
        description: 'returns wiki preview if set true'
    })
    @ApiResponse({
        status: 200,
        description: `returns an array of proposal objects: 
            [{
                info: proposal information,
                result: proposal result information,
                votes: an array of votes cast for a proposal,
                preview: wiki preview (optional),
                diff_percent: percentage difference from previous version (optional)
            }, ... ]`
    })
    async getProposal(
        @Param('proposal_ids') query_ids: string,
        @Query('preview') preview_query,
        @Query('diff_percent') diff_percent_query
    ): Promise<any> {
        const proposal_ids = query_ids.split(',').map(Number);
        const preview = Boolean(preview_query);
        const diff_percent = Boolean(diff_percent_query);
        return this.proposalService.getProposals(proposal_ids, preview, diff_percent);
    }
}
