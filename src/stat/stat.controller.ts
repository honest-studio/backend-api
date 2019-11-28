import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ApiImplicitQuery, ApiOperation, ApiUseTags, ApiResponse } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { StatQuerySchema } from './stat.query-schema';
import { StatService } from './stat.service';
import { ChainService } from '../chain/chain.service';

@Controller('v2/stat')
@ApiUseTags('Stats')
export class StatController {
    constructor(private readonly statService: StatService, private chainService: ChainService) {}

    @Get('editor-leaderboard')
    @ApiOperation({ title: 'All-time editor leaderboard' })
    @ApiImplicitQuery({
        name: 'period',
        description: `today | this-week | this-month | all-time`,
        required: false
    })
    @ApiImplicitQuery({
        name: 'lang',
        description: 'Filter by language',
        required: false,
        type: String
    })
    @ApiImplicitQuery({
        name: 'cache',
        description: `Set to false if you don't want to use the cache`,
        required: false
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: `Number of rows to return. Default: 10`,
        required: false
    })
    @UsePipes(new JoiValidationPipe(StatQuerySchema, ['query']))
    async editorLeaderboard(@Query() query): Promise<any> {
        return await this.statService.editorLeaderboard(query);
    }

    @Get('site-usage')
    @ApiOperation({ title: 'All-time site usage' })
    @ApiImplicitQuery({
        name: 'lang',
        description: 'Filter by language',
        required: false,
        type: String
    })
    async siteUsage(@Query() query): Promise<any> {
        return await this.statService.siteUsage(query);
    }

    @Get('edits')
    @ApiOperation({ 
        title: 'Edit-related statistics'
    })
    @ApiResponse({
        status: 200,
        description: `{
            **last_block_processed**: The last block included in the datasets returned by this endpoint,
            **num_edits**: 2-D array. historical number of on-chain edits per day,
            **num_editors**: 2-D array: historical number of on-chain unique editors per day,
            **num_chain_users**: 2-D array: historical number of on-chain unique users across all Everipedia smart contracts per day,
            **unique_editors**: 2-D array: historical list of active editors by day,
            **unique_users**: 2-D array: historical list of active users by day,
        }`
    })
    async getEditStats(): Promise<any> {
        return await this.statService.getEditStats();
    }

    @Get('token-supply')
    @ApiOperation({ 
        title: 'IQ Circulating Supply',
        description: `This endpoint was created specifically for coinmarketcap.com and outputs in plain text 
            the current circulating supply of IQ.`
    })
    async tokenSupply(): Promise<any> {
        return this.chainService.getTableRows({
            code: "everipediaiq",
            table: "stat",
            scope: "IQ",
            json: true
        })
        .then(response => response.rows[0].supply.split(' ')[0]);
    }
}
