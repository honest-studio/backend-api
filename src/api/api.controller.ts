import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam } from '@nestjs/swagger';
import { ApiService } from './api.service';

@Controller('v1')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('proposal/:proposal_hash')
  @ApiOperation({ title: "Get details of a proposal" })
  @ApiImplicitParam({ name: 'proposal_hash', 
    description: "IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ" })
  async getProposal(@Param('proposal_hash') proposal_hash): Promise<any> {
    return await this.apiService.getProposal(proposal_hash);
  }

  @Get('votes/:proposal_hash')
  @ApiOperation({ title: "Get votes for a proposal" })
  @ApiImplicitParam({ name: 'proposal_hash', 
    description: "IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ" })
  async getVotes(@Param('proposal_hash') proposal_hash): Promise<any> {
    return await this.apiService.getVotes(proposal_hash);
  }

  @Get('result/:proposal_hash')
  @ApiOperation({ title: "Get result of a proposal" })
  @ApiResponse({ status: 200, description: `
            proposal_hash:
            yes_votes:
            no_votes:
            approved: -1 => pending edit, 0 => rejected, 1 => approved`
  })
  @ApiImplicitParam({ name: 'proposal_hash', 
    description: "IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ" })
  async getResult(@Param('proposal_hash') proposal_hash): Promise<any> {
    return await this.apiService.getResult(proposal_hash);
  }

  @Get('plagiarism/:proposal_hash')
  @ApiOperation({ title: "Get plagiarism report for a proposal: Limited Availability" })
  @ApiImplicitParam({ name: 'proposal_hash', 
    description: "IPFS hash of a proposal - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ" })
  async getPlagiarism(@Param('proposal_hash') proposal_hash): Promise<any> {
    return await this.apiService.getPlagiarism(proposal_hash);
  }

  @Get('wiki/:ipfs_hash')
  @ApiOperation({ title: "Get IPFS document for a wiki" })
  @ApiImplicitParam({ name: 'ipfs_hash', 
    description: "IPFS hash of a wiki - Example: QmSfsV4eibHioKZLD1w4T8UGjx2g9DWvgwPweuKm4AcEZQ" })
  async getWiki(@Param('ipfs_hash') ipfs_hash): Promise<any> {
    return await this.apiService.getWiki(ipfs_hash);
  }
}
