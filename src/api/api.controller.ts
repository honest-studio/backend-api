import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiService } from './api.service';

@Controller('v1')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('proposal/:proposal_hash')
  @ApiOperation({ title: "Get details of a proposal" })
  async getProposal(@Param('proposal_hash') proposal_hash): Promise<any> {
    return await this.apiService.getProposal(proposal_hash);
  }

  @Get('votes/:proposal_hash')
  @ApiOperation({ title: "Get votes for a proposal" })
  async getVotes(@Param('proposal_hash') proposal_hash): Promise<any> {
    return await this.apiService.getVotes(proposal_hash);
  }

  @Get('result/:proposal_hash')
  @ApiOperation({ title: "Get result of a proposal" })
  async getResult(@Param('proposal_hash') proposal_hash): Promise<any> {
    return await this.apiService.getResult(proposal_hash);
  }

}
