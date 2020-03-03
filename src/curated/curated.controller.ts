import { Inject, forwardRef, Body, UsePipes, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { CuratedService } from './curated.service';
import { CuratedQuerySchema } from './curated.query-schema';

@Controller('v2/curated')
@ApiTags('Curated Lists')
export class CuratedController {
    constructor(
        private readonly curatedService: CuratedService
    ) {}

    @Get('/')
    @ApiOperation({ summary: 'Get curated lists' })
    @ApiQuery({
        name: 'user',
        description: 'filter by user'
    })
    @ApiQuery({
        name: 'sort',
        description: 'recent | viewed | size'
    })
    @ApiResponse({
        status: 200,
        description: `A list of curated lists fitting the query parameters`
    })
    @UsePipes(new JoiValidationPipe(CuratedQuerySchema))
    async getPreviewsByHash(@Query() options): Promise<any> {
        return this.curatedService.getLists(options);
    }

}
