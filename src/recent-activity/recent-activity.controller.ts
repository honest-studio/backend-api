import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitQuery, ApiUseTags } from '@nestjs/swagger';
import { RecentActivityService } from './recent-activity.service';

@Controller('v1/recent-activity')
@ApiUseTags('Recent Activity')
export class RecentActivityController {
  constructor(private readonly recentActivityService: RecentActivityService) {}

  @Get('all')
  @ApiImplicitQuery({ name: "offset", description: "Number of records to skip", required: false, type: Number })
  @ApiOperation({ title: "All recent on-chain activity", description: "Returns 100 most recent actions on the eparticlectr smart contract" })
  async getAll(@Query('offset', new ParseIntPipe()) offset = 0): Promise<Array<any>> {
    return await this.recentActivityService.getAll(offset);
  }

  @Get('results')
  @ApiImplicitQuery({ name: "offset", description: "Number of records to skip", required: false, type: Number })
  @ApiOperation({ title: "Recent proposal results" })
  async getResults(@Query('offset', new ParseIntPipe()) offset = 0): Promise<Array<any>> {
    return await this.recentActivityService.getResults(offset);
  }

  @Get('votes')
  @ApiImplicitQuery({ name: "offset", description: "Number of records to skip", required: false, type: Number })
  @ApiOperation({ title: "Recent on-chain votes" })
  async getVotes(@Query('offset', new ParseIntPipe()) offset = 0): Promise<Array<any>> {
    return await this.recentActivityService.getVotes(offset);
  }

  @Get('proposals')
  @ApiImplicitQuery({ name: "offset", description: "Number of records to skip", required: false, type: Number })
  @ApiOperation({ title: "Recent proposals" })
  async getProposals(@Query('offset') offset): Promise<Array<any>> {
    return await this.recentActivityService.getProposals(offset);
  }

  @Get('wikis')
  @ApiImplicitQuery({ name: "offset", description: "Number of records to skip", required: false, type: Number })
  @ApiOperation({ title: "Recent accepted wikis" })
  async getWikis(@Query('offset') offset): Promise<Array<any>> {
    return await this.recentActivityService.getWikis(offset);
  }
}
