import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ApiImplicitQuery, ApiOperation, ApiUseTags } from '@nestjs/swagger';
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
    async siteUsage(): Promise<any> {
        return await this.statService.siteUsage();
    }

    //@Get('uniques')
    //@ApiImplicitQuery({
    //    name: 'starttime',
    //    description: `Start date as a UNIX timestamp.`,
    //    required: false
    //})
    //@ApiImplicitQuery({
    //    name: 'endtime',
    //    description: `End date as a UNIX timestamp.`,
    //    required: false
    //})
    //@UsePipes(new JoiValidationPipe(StatQuerySchema, ['query']))
    //async getUniques(@Query() query): Promise<any> {
    //    return await this.statService.getUniques(query);
    //}

    @Get('token-supply')
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
