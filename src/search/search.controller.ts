import { Controller, Get, Param, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiImplicitParam, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { AddRemoteIp } from '../utils/request-tools';

@Controller('v2/search')
@ApiUseTags('Search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get('title/:query')
    @ApiOperation({ title: 'Search the Everipedia database by article title and optionally, by language' })
    @ApiImplicitParam({
        name: 'query',
        description: 'Search term',
        required: true,
        type: 'string'
    })
    @ApiImplicitParam({
        name: 'langs',
        description: 'Language(s). Example: /v2/search/title/travis%20moore?langs=["en,"es"]',
        required: false,
        type: 'string'
    })
    async searchTitle(@Param('query') query, @Query('langs') langs): Promise<any> {
        return await this.searchService.searchTitle(query, langs);
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

    @Get('test/:query')
    @ApiOperation({ title: 'Shows injection of client IP into params' })
    @ApiImplicitParam({
        name: 'query',
        description: 'Search term',
        required: true,
        type: 'string'
    })
    async searchTitleTest(@Param('query') query, @Query('langs') langs): Promise<any> {
        if (langs) langs = langs.split(',');
        return await this.searchService.searchTitle(query, langs);
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
