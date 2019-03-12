import { Controller, Get, Param, Query, UsePipes, BadRequestException, } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiImplicitQuery, ApiUseTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { HistoryWikiSchema } from './history.query-schema';
import { JoiValidationPipe } from '../common';

@Controller('v2/history')
@ApiUseTags('History')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @Get('wiki/:lang_code/:slug')
    @ApiOperation({ title: 'Get edit history for a wiki' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travis-moore'
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
    async getWikiHistory(@Param('lang_code') lang_code: string, @Param('slug') slug, @Query() query): Promise<any> {
        if (lang_code.substring(0,5) != 'lang_') throw new BadRequestException(`lang_code must start with 'lang_'`);
        lang_code = lang_code.substring(5);
        return this.historyService.getWikiHistory(lang_code, slug, query);
    }
}
