import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitQuery, ApiUseTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { HistoryWikiSchema } from  './history.query-schema';
import { JoiValidationPipe } from '../common';

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
    @UsePipes(new JoiValidationPipe(HistoryWikiSchema, ['query']))
    async getWikiHistory(@Param('wiki_id') wiki_id: string, @Query() query): Promise<any> {
        return this.historyService.getWikiHistory(Number(wiki_id), query);
    }
}
