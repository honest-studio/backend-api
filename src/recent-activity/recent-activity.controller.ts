import { Controller, Get, Query, UsePipes, Inject, forwardRef } from '@nestjs/common';
import { ApiImplicitQuery, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { RecentActivityQuerySchema, RecentActivityService } from '.';
import { JoiValidationPipe } from '../common';
import { BoostActivityPack } from '../types/api';

@Controller('v2/recent-activity')
@ApiUseTags('Recent Activity')
export class RecentActivityController {
    constructor(
        private readonly recentActivityService: RecentActivityService
    ) {}
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
    @ApiImplicitQuery({
        name: 'user_agent',
        type: 'string',
        required: false,
        description: 'user agent for the request. Important for WebP issues'
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
        name: 'cache',
        type: 'boolean',
        required: false,
        description: 'set false to bypass cache. default: true'
    })
    @ApiImplicitQuery({
        name: 'preview',
        description: `Include page title, main photo, thumbnail, and text preview for each proposal.`,
        required: false,
        type: Boolean
    })
    @ApiImplicitQuery({
        name: 'account_name',
        description: `Filter by EOS account name`,
        required: false,
        type: String
    })
    @ApiImplicitQuery({
        name: 'diff',
        description: `Include diff data in the proposals. Takes one of three values:
            'none': (default) Don't include diff data.
            'metadata': Only return metadata about the such as diff_percent, old_hash, new_hash, etc.
            'full': Return the full wiki diff between the proposal and its parent. Warning: this can lead to large responses that lag on low-bandwidth connections. 

            Setting this option to 'metadata' or 'full' can add 1-2 seconds to the response time.`,
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
        name: 'completed',
        description: `Get completed proposals instead of the most recent ones`,
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

    @Get('boosts')
    @ApiOperation({ title: 'Recent boosts' })
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
        name: 'cache',
        type: 'boolean',
        required: false,
        description: 'set false to bypass cache. default: true'
    })
    @ApiImplicitQuery({
        name: 'preview',
        description: `Include page title, main photo, thumbnail, and text preview for each proposal.`,
        required: false,
        type: Boolean
    })
    @ApiImplicitQuery({
        name: 'account_name',
        description: `Filter by EOS account name`,
        required: false,
        type: String
    })
    @ApiImplicitQuery({
        name: 'diff',
        description: `Include diff data in the proposals. Takes one of three values:
            'none': (default) Don't include diff data.
            'metadata': Only return metadata about the such as diff_percent, old_hash, new_hash, etc.
            'full': Return the full wiki diff between the proposal and its parent. Warning: this can lead to large responses that lag on low-bandwidth connections. 

            Setting this option to 'metadata' or 'full' can add 1-2 seconds to the response time.`,
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
    @ApiImplicitQuery({
        name: 'user_agent',
        description: 'User agent. Needed for WebP. Use "chrome" to serve WebP (if available) or "safari" to serve normal',
        required: false,
        type: String
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getRecentBoosts(@Query() query): Promise<BoostActivityPack[]> {
        return await this.recentActivityService.getRecentBoosts(query);
    }

    @Get('trending')
    @ApiOperation({ title: 'Trending wikis' })
    @ApiImplicitQuery({
        name: 'langs',
        description: `Language(s) if you wish to restrict the return output.
            Default: Return all languages
            Example: /v2/recent-activity/trending?langs=en,es`,
        required: false,
        isArray: true,
        type: 'string'
    })
    @ApiImplicitQuery({
        name: 'range',
        description: `The date span across which to check. today | all. Default = today`,
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
        name: 'user_agent',
        description: 'User agent. Needed for WebP. Use "chrome" to serve WebP (if available) or "safari" to serve normal',
        required: false,
        type: String
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getTrendingWikis(@Query() query): Promise<Array<any>> {
        let langs = [];
        if (query.langs) langs = query.langs.split(',');
        return await this.recentActivityService.getTrendingWikis(langs, query.range, query.limit);
    }
}
