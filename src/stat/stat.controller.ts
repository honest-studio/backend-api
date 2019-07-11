import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ApiImplicitQuery, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { StatQuerySchema } from './stat.query-schema';
import { StatService } from './stat.service';

@Controller('v2/stat')
@ApiUseTags('Stats')
export class StatController {
    constructor(private readonly statService: StatService) {}

    @Get('editor-leaderboard')
    @ApiOperation({ title: 'All-time editor leaderboard' })
    @ApiImplicitQuery({
        name: 'period',
        description: `today | this-week | this-month | all-time`,
        required: false
    })
    @ApiImplicitQuery({
        name: 'since',
        description: `UNIX timestamp of point in time to start leaderboard calculation
            If specified, this overrides 'period'.
            Example: 1553712876`,
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
}
