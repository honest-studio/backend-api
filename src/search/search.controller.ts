import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { SearchQueryPack, SearchService } from './search.service';

@Controller('v2/search')
@ApiUseTags('Search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Post('title')
    @ApiOperation({ 
        title: `Search the Everipedia database by article title`
    })
    @ApiResponse({
        status: 200,
        description: `Returns search results`
    })
    async submitWiki(@Body() pack: SearchQueryPack): Promise<any> {
        return this.searchService.searchTitle(pack);
    }

    @Get('schema-by-type/:query')
    @ApiOperation({ title: 'Search for available ' })
    @ApiImplicitParam({
        name: 'query',
        description: 'Search term',
        required: true,
        type: 'string'
    })
    @ApiImplicitParam({
        name: 'page_type',
        description: 'Schema.org type for the page (e.g. Person, Organization, etc)',
        required: true,
        type: 'string'
    })
    async searchSchemaByType(@Param('query') query, @Query('page_type') page_type): Promise<any> {
        return await this.searchService.searchSchemaByType(query, page_type);
    }

    //@Get('test/:query')
    //@ApiOperation({ title: 'Shows injection of client IP into params' })
    //@ApiImplicitParam({
    //    name: 'query',
    //    description: 'Search term',
    //    required: true,
    //    type: 'string'
    //})
    //async searchTest(@Param('query') query, @Req() request: Request): Promise<any> {
    //    // get original route params
    //    const reqParams = request.params;

    //    console.log('route params: ', reqParams);
    //    // with IP
    //    const enhancedReq = AddRemoteIp(reqParams, request);
    //    console.log('route params enhanced with client IP: ', enhancedReq);
    //    return await this.searchService.searchTitle(query);
    //}
}
