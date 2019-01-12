import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@Controller('v1/search')
@ApiUseTags('Search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get('title/:query')
    @ApiOperation({ title: 'Search the Everipedia database by article title' })
    @ApiImplicitParam({
        name: 'query',
        description: 'Search term',
        required: true,
        type: 'string'
    })
    async searchTitle(@Param('query') query): Promise<any> {
        return await this.searchService.searchTitle(query);
    }
}
