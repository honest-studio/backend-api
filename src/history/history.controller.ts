import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitQuery, ApiUseTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { HistoryWikiSchema } from './history.query-schema';
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
        name: 'preview',
        type: 'boolean',
        required: false,
        description: 'returns wiki preview if set true'
    })
    @UsePipes(new JoiValidationPipe(HistoryWikiSchema, ['query']))
    async getWikiHistory(@Param('wiki_id') wiki_id: string, @Query() query): Promise<any> {
        return this.historyService.getWikiHistory(Number(wiki_id), query);
    }
}
