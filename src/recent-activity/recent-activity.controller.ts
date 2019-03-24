import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitQuery, ApiUseTags } from '@nestjs/swagger';
import { RecentActivityService, RecentActivityQuerySchema } from '.';
import { JoiValidationPipe } from '../common';

@Controller('v2/recent-activity')
@ApiUseTags('Recent Activity')
export class RecentActivityController {
    constructor(private readonly recentActivityService: RecentActivityService) {}

    @Get('all')
    @ApiOperation({
        title: 'Recent actions on the Everipedia Network smart contracts',
        description:
            'All actions flowing through the Everipedia Network smart contracts. Currently consists of the eparticlectr and everipediaiq contracts'
    })
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

    @Get('eparticlectr')
    @ApiOperation({
        title: 'Recent article contract actions',
        description: 'All actions flowing through the eparticlectr contract'
    })
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
    async getArticleActions(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getArticleActions(query);
    }

    @Get('everipediaiq')
    @ApiOperation({
        title: 'Recent token contract actions',
        description:
            'All actions flowing through the everipediaiq contract. Use this endpoint if you want to track transfers.'
    })
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
    async getTokenActions(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getTokenActions(query);
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
        name: 'diff',
        description: `Include diff data in the proposals. Takes one of three values:
            'none': (default) Don't include diff data.
            'percent': Only the return the percentage difference between the proposal and its parent.
            'full': Return the full wiki diff between the proposal and its parent. Warning: this can lead to large responses that lag on low-bandwidth connections. 

            Setting this option to 'percent' or 'full' can add 1-5 seconds to the response time.`,
        required: false,
        type: Boolean
    })
    @ApiImplicitQuery({
        name: 'expiring',
        description: `Get expiring proposals instead of the most recent ones`,
        required: false,
        type: Boolean
    })
    @ApiImplicitQuery({
        name: 'langs',
        description: `Language(s) if you wish to restrict the return output.
            Default: Return all languages
            Example: /v2/recent-activity/proposals?langs=en,es`,
        required: false,
        isArray: true,
        type: 'string'
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getProposals(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getProposals(query);
    }
}
