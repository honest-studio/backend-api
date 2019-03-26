import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { StatService } from './stat.service';

@Controller('v2/stat')
@ApiUseTags('Stats')
export class StatController {
    constructor(private readonly statService: StatService) {}

    @Get('editor-leaderboard')
    @ApiOperation({ title: 'All-time editor leaderboard' })
    async editorLeaderboard(): Promise<any> {
        return await this.statService.editorLeaderboard();
    }

    @Get('site-usage')
    @ApiOperation({ title: 'All-time site usage' })
    async siteUsage(): Promise<any> {
        return await this.statService.siteUsage();
    }
}
