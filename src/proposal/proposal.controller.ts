import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { ProposalSchema } from './proposal.query-schema';
import { Proposal, ProposalService } from './proposal.service';

@Controller('v2/proposal')
@ApiTags('Proposals')
export class ProposalController {
    constructor(private readonly proposalService: ProposalService) {}

    @Get('sync-orphan-hashes')
    @ApiOperation({ summary: 'Sync confirmed / approved proposals on EOS to the Everipedia cache' })
    @ApiResponse({
        status: 200,
        description: `returns an array of proposal objects: 
            [{
                info: proposal information,
                result: proposal result information,
                votes: an array of votes cast for a proposal,
                preview: wiki preview (optional),
                diff?: information related to the diff created by the proposal
            }, ... ]`
    })
    async syncOrphanHashes(): Promise<Array<any>> {
        return this.proposalService.syncOrphanHashes();
    }

    @Get(':proposal_ids')
    @ApiOperation({ summary: 'Get details of a proposal' })
    @ApiParam({
        name: 'proposal_ids',
        description: `IDs of proposals. To get multiple proposals, separate IDs with a comma.
        Example 1: 55
        Example 2: 55,92,332`
    })
    @ApiQuery({
        name: 'diff',
        description: `Include diff data in the proposals. Takes one of three values:
            'none': (default) Don't include diff data.
            'metadata': Only the return the metadata between the proposal and its parent.
            'full': Return the full wiki diff between the proposal and its parent. Warning: this can lead to large responses that lag on low-bandwidth connections. 

            Setting this option to 'metadata' or 'full' can add 1-5 seconds to the response time.`,
        required: false,
        type: Boolean
    })
    @ApiQuery({
        name: 'preview',
        type: 'boolean',
        required: false,
        description: 'returns wiki preview if set true'
    })
    @ApiQuery({
        name: 'cache',
        type: 'boolean',
        required: false,
        description: 'set false to bypass cache. default: true'
    })
    @ApiResponse({
        status: 200,
        description: `returns an array of proposal objects: 
            [{
                info: proposal information,
                result: proposal result information,
                votes: an array of votes cast for a proposal,
                preview: wiki preview (optional),
                diff?: information related to the diff created by the proposal
            }, ... ]`
    })
    @UsePipes(new JoiValidationPipe(ProposalSchema, ['query']))
    async getProposals(@Param('proposal_ids') query_ids: string, @Query() options): Promise<Array<Proposal>> {
        const proposal_ids = query_ids.split(',').map(Number);
        return this.proposalService.getProposals(proposal_ids, options);
    }


}
