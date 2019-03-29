import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { OauthService } from './stat.service';

@Controller('v2/stat')
@ApiUseTags('Stats')
export class StatController {
    constructor(private readonly statService: StatService) {}

    @Get('google-analytics')
    @ApiOperation({ title: 'For admin use only. Sign in and grant permissions for Google Analytics thru OAuth' })
    async googleAnalytics(@Query() query): Promise<any> {
        return await this.oauthService.googleAnalytics();
    }
}
