import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiImplicitParam, ApiImplicitQuery, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { HistoryWikiSchema } from './history.query-schema';
import { HistoryService } from './history.service';

@Controller('v2/history')
@ApiUseTags('History')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @Get('wiki/lang_:lang_code/:slug')
    @ApiOperation({ title: 'Get edit history for a wiki' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code (zh-hans for Mandarin)'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The article slug. Each article has a unique (slug + lang_code). Example: travismoore5036459'
    })
    @ApiImplicitQuery({
        name: 'diff',
        description: `Include diff data in the proposals. Takes one of three values:
            'none': (default) Don't include diff data.
            'metadata': Only return metadata about the such as diff_percent, old_hash, new_hash, etc.
            'full': Return the full wiki diff between the proposal and its parent. Warning: this can lead to large responses that lag on low-bandwidth connections. 

            Setting this option to 'metadata' or 'full' can add 1-2 seconds to the response time.`,
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
        return this.historyService.getWikiHistory(lang_code, slug, query);
    }
}
