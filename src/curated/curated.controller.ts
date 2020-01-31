import { Inject, forwardRef, Body, UsePipes, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags, ApiImplicitQuery, ApiImplicitBody } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { CuratedService } from './curated.service';
import { CuratedQuerySchema } from './curated.query-schema';

@Controller('v2/curated')
@ApiUseTags('Curated Lists')
export class CuratedController {
    constructor(
        private readonly curatedService: CuratedService
    ) {}

    @Get('/')
    @ApiOperation({ title: 'Get curated lists' })
    @ApiImplicitQuery({
        name: 'user',
        description: 'filter by user'
    })
    @ApiImplicitQuery({
        name: 'sort',
        description: 'recent | viewed | size'
    })
    @ApiResponse({
        status: 200,
        description: `A list of curated lists fitting the query parameters`
    })
    // @UsePipes(new JoiValidationPipe(CuratedQuerySchema, 'query'))
    async getPreviewsByHash(@Query() options): Promise<any> {
        return this.curatedService.getLists(options);
    }

}
