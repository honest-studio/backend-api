import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags, ApiImplicitBody } from '@nestjs/swagger';
import { HistoryService } from './history.service';

@Controller('v2/history')
@ApiUseTags('History')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @Get('wiki/:wiki_id')
    @ApiOperation({ title: 'Get edit history for a wiki' })
    @ApiImplicitParam({
        name: 'wiki_id',
        description: 'ID of a wiki'
    })
    @ApiResponse({
        status: 200,
        description: `Returns: an array of proposals for a wiki`
    })
    async getWikiHistory(@Param('wiki_id') wiki_id: string): Promise<any> {
        return this.historyService.getWikiHistory(Number(wiki_id));
    }
}
