import { Controller, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { AddRemoteIp } from '../utils/request-tools';

@Controller('v2/search')
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

    @Get('test/:query')
    @ApiOperation({ title: 'Shows injection of client IP into params' })
    @ApiImplicitParam({
        name: 'query',
        description: 'Search term',
        required: true,
        type: 'string'
    })
    async searchTest(@Param('query') query, @Req() request: Request): Promise<any> {
        // get original route params
        const reqParams = request.params;

        console.log('route params: ', reqParams);
        // with IP
        const enhancedReq = AddRemoteIp(reqParams, request);
        console.log('route params enhanced with client IP: ', enhancedReq);
        return await this.searchService.searchTitle(query);
    }
}
