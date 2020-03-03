import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ApiQuery, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { StatQuerySchema } from './stat.query-schema';
import { StatService } from './stat.service';
import { ChainService } from '../chain/chain.service';

@Controller('v2/stat')
@ApiTags('Stats')
export class StatController {
    constructor(private readonly statService: StatService, private chainService: ChainService) {}

    @Get('editor-leaderboard')
    @ApiOperation({ summary: 'All-time editor leaderboard' })
    @ApiQuery({
        name: 'period',
        description: `today | this-week | this-month | all-time`,
        required: false
    })
    @ApiQuery({
        name: 'lang',
        description: 'Filter by language',
        required: false,
        type: String
    })
    @ApiQuery({
        name: 'cache',
        description: `Set to false if you don't want to use the cache`,
        required: false
    })
    @ApiQuery({
        name: 'limit',
        description: `Number of rows to return. Default: 10`,
        required: false
    })
    @ApiQuery({
        name: 'sortby',
        description: `Sort by a field. 'iq', 'votes', or 'edits'. Default: 'iq'`,
        required: false
    })
    @ApiQuery({
        name: 'user',
        description: `If specified, the user provided will be listed in the returned array with their rank as the last item in the array`,
        required: false
    })
    @UsePipes(new JoiValidationPipe(StatQuerySchema, ['query']))
    async editorLeaderboard(@Query() query): Promise<any> {
        return await this.statService.editorLeaderboard(query);
    }

    @Get('site-usage')
    @ApiOperation({ summary: 'All-time site usage' })
    @ApiQuery({
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
        summary: 'Edit-related statistics'
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
        summary: 'IQ Circulating Supply',
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
