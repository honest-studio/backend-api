import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { ProposalService } from './proposal.service';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';

export type ProposeOrArray = (EosAction<Propose> | Array<EosAction<Propose>>)

@Controller('v2/proposal')
@ApiUseTags('Proposals')
export class ProposalController {
    constructor(private readonly proposalService: ProposalService) {}

    @Get(':proposal_id')
    @ApiOperation({ title: 'Get details of a proposal' })
    @ApiImplicitParam({
        name: 'proposal_id',
        description: `IPFS hashes of proposals. To get multiple proposals, separate hashes with a comma.
        Example 1: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ
        Example 2: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ,QmU2skAMU2p9H9KXdMXWjDmzfZYoE76ksAKvsNQHdRg8dp`
    })
    async getProposal(@Param('proposal_id') query_ids: string): Promise<ProposeOrArray> {
        const proposal_ids = query_ids.split(',').map(Number);
        if (proposal_ids.length == 1)
            return this.proposalService.getProposal(proposal_ids[0]);
        else
            return this.proposalService.getProposals(proposal_ids);
    }

    @Get(':proposal_id/votes')
    @ApiOperation({ title: 'Get votes for a proposal' })
    @ApiImplicitParam({
        name: 'proposal_id',
        description: 'IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getVotes(@Param('proposal_id') proposal_id: string): Promise<Array<EosAction<Vote>>> {
        return await this.proposalService.getVotes(Number(proposal_id));
    }

    @Get(':proposal_id/result')
    @ApiOperation({ title: 'Get result of a proposal' })
    @ApiResponse({
        status: 200,
        description: `
            proposal_id:
            yes_votes:
            no_votes:
            approved: -1 => pending edit, 0 => rejected, 1 => approved`
    })
    @ApiImplicitParam({
        name: 'proposal_id',
        description: 'IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getResult(@Param('proposal_id') proposal_id: string): Promise<ProposalResult> {
        return await this.proposalService.getResult(Number(proposal_id));
    }
}
