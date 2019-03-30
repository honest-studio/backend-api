import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { OAuthService } from './oauth.service';

@Controller('v2/oauth')
@ApiUseTags('OAuth')
export class OAuthController {
    constructor(private readonly oauthService: OAuthService) {}

    @Get('google-analytics')
    @ApiOperation({ title: 'For admin use only. Sign in and grant permissions for Google Analytics thru OAuth' })
    async googleAnalytics(@Query() query): Promise<any> {
        return await this.oauthService.googleAnalytics(query);
    }
}
