import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitQuery, ApiUseTags } from '@nestjs/swagger';
import { RecentActivityService, RecentActivityQuerySchema } from '.';
import { JoiValidationPipe } from '../common';

@Controller('v1/recent-activity')
@ApiUseTags('Recent Activity')
export class RecentActivityController {
    constructor(private readonly recentActivityService: RecentActivityService) {}

    @Get('all')
    @ApiImplicitQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiOperation({
        title: 'All recent on-chain activity',
        description: 'Returns 100 most recent actions on the eparticlectr smart contract'
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getAll(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getAll(query);
    }

    @Get('results')
    @ApiOperation({ title: 'Recent proposal results' })
    @ApiImplicitQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getResults(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getResults(query);
    }

    @Get('votes')
    @ApiOperation({ title: 'Recent on-chain votes' })
    @ApiImplicitQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getVotes(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getVotes(query);
    }

    @Get('proposals')
    @ApiOperation({ title: 'Recent proposals' })
    @ApiImplicitQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'preview',
        description: `Include page title, main photo, thumbnail, and text preview for each proposal.`,
        required: false,
        type: Boolean
    })
    @ApiImplicitQuery({
        name: 'diff_percent',
        description: `Include percentage of article changed by proposal.`,
        required: false,
        type: Boolean
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getProposals(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getProposals(query);
    }

    @Get('wikis')
    @ApiOperation({ title: 'Recent accepted wikis' })
    @ApiImplicitQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getWikis(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getWikis(query);
    }
}
