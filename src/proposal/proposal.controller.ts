import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { ProposalService } from './proposal.service';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';

@Controller('v1/proposal')
@ApiUseTags('Proposals')
export class ProposalController {
    constructor(private readonly proposalService: ProposalService) {}

    @Get(':proposal_hash')
    @ApiOperation({ title: 'Get details of a proposal' })
    @ApiImplicitParam({
        name: 'proposal_hash',
        description: 'IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getProposal(@Param('proposal_hash') proposal_hash): Promise<EosAction<Propose>> {
        return await this.proposalService.getProposal(proposal_hash);
    }

    @Get(':proposal_hash/votes')
    @ApiOperation({ title: 'Get votes for a proposal' })
    @ApiImplicitParam({
        name: 'proposal_hash',
        description: 'IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getVotes(@Param('proposal_hash') proposal_hash): Promise<Array<EosAction<Vote>>> {
        return await this.proposalService.getVotes(proposal_hash);
    }

    @Get(':proposal_hash/result')
    @ApiOperation({ title: 'Get result of a proposal' })
    @ApiResponse({
        status: 200,
        description: `
            proposal_hash:
            yes_votes:
            no_votes:
            approved: -1 => pending edit, 0 => rejected, 1 => approved`
    })
    @ApiImplicitParam({
        name: 'proposal_hash',
        description: 'IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getResult(@Param('proposal_hash') proposal_hash): Promise<ProposalResult> {
        return await this.proposalService.getResult(proposal_hash);
    }

    @Get(':proposal_hash/plagiarism')
    @ApiOperation({ title: 'Get plagiarism report for a proposal: Limited Availability' })
    @ApiImplicitParam({
        name: 'proposal_hash',
        description: 'IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getPlagiarism(@Param('proposal_hash') proposal_hash): Promise<any> {
        return await this.proposalService.getPlagiarism(proposal_hash);
    }

    @Get(':proposal_hash/diff')
    @ApiOperation({ title: 'Get diff between proposed and old version' })
    @ApiResponse({
        status: 200,
        description: ''
    })
    @ApiImplicitParam({
        name: 'proposal_hash',
        description: 'IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ'
    })
    async getDiff(@Param('proposal_hash') proposal_hash): Promise<any> {
        return this.proposalService.getDiff(proposal_hash);
    }
}
