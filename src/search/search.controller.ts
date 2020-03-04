import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchQueryPack, SearchService } from './search.service';
import { ExtendedSearchResult, PreviewResult } from '../types/api';

@Controller('v2/search')
@ApiTags('Search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Post('title')
    @ApiOperation({ 
        summary: `Search the Everipedia database by article title, POST version`
    })
    @ApiResponse({
        status: 200,
        description: `Returns search results`
    })
    async searchTitleCtrlPost(@Body() pack: SearchQueryPack): Promise<PreviewResult[]> {
        return this.searchService.searchTitle(pack);
    }

    @Post('extended')
    @ApiOperation({ 
        summary: `Search Everipedia articles, categories, and profiles by a search term`
    })
    @ApiResponse({
        status: 200,
        description: `Returns search results`
    })
    async searchExtendedCtrlPost(@Body() pack: SearchQueryPack): Promise<ExtendedSearchResult> {
        return this.searchService.searchExtended(pack);
    }

    @Get('title/lang_:lang_code/:searchterm')
    @ApiOperation({ 
        summary: `Search the Everipedia database by article title, GET version`
    })
    @ApiResponse({
        status: 200,
        description: `Returns search results`
    })
    async searchTitleCtrlGet(@Param('lang_code') lang_code, @Param('searchterm') searchterm): Promise<any> {
        let pack = {
            query: searchterm,
            langs: [lang_code]
        };
        return this.searchService.searchTitle(pack);
    }

    @Get('schema-by-type/:query')
    @ApiOperation({ summary: 'Search for available ' })
    @ApiParam({
        name: 'query',
        description: 'Search term',
        required: true,
        type: 'string'
    })
    @ApiParam({
        name: 'page_type',
        description: 'Schema.org type for the page (e.g. Person, Organization, etc)',
        required: true,
        type: 'string'
    })
    async searchSchemaByType(@Param('query') query, @Query('page_type') page_type): Promise<any> {
        return await this.searchService.searchSchemaByType(query, page_type);
    }

    //@Get('test/:query')
    //@ApiOperation({ summary: 'Shows injection of client IP into params' })
    //@ApiParam({
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
