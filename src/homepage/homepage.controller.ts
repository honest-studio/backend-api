import { Body, Controller, Get, Post, UsePipes, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { PageCategoryCollection, PageCategory } from '../types/api';
import { HomepageService } from './homepage.service';

@Controller('v2/homepage')
@ApiTags('Contact Us')
export class HomepageController {
    constructor(private readonly homepageService: HomepageService) {}

    @Get('/amp/lang_:lang_code')
    @ApiOperation({ summary: 'Get the AMP version of the homepage' })
    @ApiParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code for the homepage'
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getAMPHomepageCtrl(@Res() res, @Param('lang_code') lang_code): Promise<any> {
        return await this.homepageService.getAMPHomepage(res, lang_code);
    }


}
