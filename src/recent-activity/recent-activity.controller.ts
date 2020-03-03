import { Controller, Get, Query, UsePipes, Inject, forwardRef } from '@nestjs/common';
import { ApiQuery, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecentActivityQuerySchema, RecentActivityService } from '.';
import { JoiValidationPipe } from '../common';
import { BoostActivityPack } from '../types/api';

@Controller('v2/recent-activity')
@ApiTags('Recent Activity')
export class RecentActivityController {
    constructor(
        private readonly recentActivityService: RecentActivityService
    ) {}
    @Get('all')
    @ApiOperation({
        summary: 'Recent actions on the Everipedia Network smart contracts',
        description:
            'All actions flowing through the Everipedia Network smart contracts. Currently consists of the eparticlectr and everipediaiq contracts'
    })
    @ApiQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'lang',
        description: 'Filter by language',
        required: false,
        type: String
    })
    @ApiOperation({
        summary: 'All recent on-chain activity',
        description: 'Returns 100 most recent actions on the eparticlectr smart contract'
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getAll(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getAll(query);
    }

    @Get('eparticlectr')
    @ApiOperation({
        summary: 'Recent article contract actions',
        description: 'All actions flowing through the eparticlectr contract'
    })
    @ApiQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiQuery({
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
        summary: 'Recent token contract actions',
        description:
            'All actions flowing through the everipediaiq contract. Use this endpoint if you want to track transfers.'
    })
    @ApiQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiQuery({
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
    @ApiOperation({ summary: 'Recent proposals' })
    @ApiQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'cache',
        type: 'boolean',
        required: false,
        description: 'set false to bypass cache. default: true'
    })
    @ApiQuery({
        name: 'preview',
        description: `Include page title, main photo, thumbnail, and text preview for each proposal.`,
        required: false,
        type: Boolean
    })
    @ApiQuery({
        name: 'account_name',
        description: `Filter by EOS account name`,
        required: false,
        type: String
    })
    @ApiQuery({
        name: 'diff',
        description: `Include diff data in the proposals. Takes one of three values:
            'none': (default) Don't include diff data.
            'metadata': Only return metadata about the such as diff_percent, old_hash, new_hash, etc.
            'full': Return the full wiki diff between the proposal and its parent. Warning: this can lead to large responses that lag on low-bandwidth connections. 

            Setting this option to 'metadata' or 'full' can add 1-2 seconds to the response time.`,
        required: false,
        type: Boolean
    })
    @ApiQuery({
        name: 'expiring',
        description: `Get expiring proposals instead of the most recent ones`,
        required: false,
        type: Boolean
    })
    @ApiQuery({
        name: 'completed',
        description: `Get completed proposals instead of the most recent ones`,
        required: false,
        type: Boolean
    })
    @ApiQuery({
        name: 'langs',
        description: `Language(s) if you wish to restrict the return output.
            Default: Return all languages
            Example: /v2/recent-activity/proposals?langs=en,es`,
        required: false,
        isArray: true,
        type: 'string'
    })
    @ApiQuery({
        name: 'voter',
        description: `Specify a username to filter by proposals that a user has voted on`,
        required: false,
        type: 'string'
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getProposals(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getProposals(query);
    }

    @Get('boosts')
    @ApiOperation({ summary: 'Recent boosts' })
    @ApiQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'preview',
        description: `Include page title, main photo, thumbnail, and text preview for each proposal.`,
        required: false,
        type: Boolean
    })
    @ApiQuery({
        name: 'account_name',
        description: `Filter by EOS account name`,
        required: false,
        type: String
    })
    @ApiQuery({
        name: 'langs',
        description: `Language(s) if you wish to restrict the return output.
            Default: Return all languages
            Example: /v2/recent-activity/proposals?langs=en,es`,
        required: false,
        isArray: true,
        type: 'string'
    })
    @ApiQuery({
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
    @ApiOperation({ summary: 'Trending wikis' })
    @ApiQuery({
        name: 'lang',
        description: `Language if you wish to restrict the return output.`,
        required: false,
        type: 'string'
    })
    @ApiQuery({
        name: 'range',
        description: `The date span across which to check. today | all. Default = today`,
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'user_agent',
        description: 'User agent. Needed for WebP. Use "chrome" to serve WebP (if available) or "safari" to serve normal',
        required: false,
        type: String
    })
    @ApiQuery({
        name: 'cache',
        description: 'Use the cached version if available. Default=true',
        required: false,
        type: String
    })
    @UsePipes(new JoiValidationPipe(RecentActivityQuerySchema))
    async getTrendingWikis(@Query() query): Promise<Array<any>> {
        return await this.recentActivityService.getTrendingWikis(query.lang, query.range, query.limit, query.cache);
    }
}
