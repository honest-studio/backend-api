import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { RecentActivityService } from './recent-activity.service';

@Controller('v1/recent-activity')
@ApiUseTags('Recent Activity')
export class RecentActivityController {
  constructor(private readonly recentActivityService: RecentActivityService) {}

  @Get('all')
  @ApiOperation({ title: "All recent on-chain activity" })
  async getAll(): Promise<any> {
    return await this.recentActivityService.getAll();
  }

  @Get('results')
  @ApiOperation({ title: "Recent proposal results" })
  async getResults(): Promise<any> {
    return await this.recentActivityService.getResults();
  }

  @Get('votes')
  @ApiOperation({ title: "Recent on-chain votes" })
  async getVotes(): Promise<any> {
    return await this.recentActivityService.getVotes();
  }

  @Get('proposals')
  @ApiOperation({ title: "Recent proposals" })
  async getProposals(): Promise<any> {
    return await this.recentActivityService.getProposals();
  }
}
