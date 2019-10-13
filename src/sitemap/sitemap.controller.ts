import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiImplicitParam, ApiImplicitQuery, ApiOperation, ApiProduces, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { SitemapService } from './sitemap.service';

@Controller('v2/sitemap')
@ApiUseTags('Sitemap')
export class SitemapController {
    constructor(private readonly sitemapService: SitemapService) {}

    @Get('recent/:lang')
    @ApiProduces('application/xml')
    @ApiOperation({
        title: '1000 most recently edited pages',
        description:
            'Optionally filtered by language and a limit'
    })
    @ApiImplicitParam({
        name: 'lang',
        description: "An ISO 639-1 language code. Defaults to 'en'",
        required: false,
        type: String
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: 'Number of URLS to sitemap (10 - 100000). Default is 1000',
        required: false,
        type: Number
    })
    @ApiResponse({
        status: 200,
        type: 'application/xml',
        description: `An XML sitemap`
    })
    // @UsePipes(new JoiValidationPipe(SitemapQuerySchema))
    async getSitemapXML(@Res() res, @Param('lang') lang: string, @Query() options): Promise<any> {
        if (lang.slice(-4) == ".xml") lang = lang.slice(0, -4);
        return this.sitemapService.getSitemapRecent(res, lang, options.limit);
    }

    @Get('generate-static/:lang')
    @ApiOperation({
        title: 'Generate a static sitemap',
        description:
            'Generate a static sitemap filtered by language'
    })
    @ApiImplicitParam({
        name: 'lang',
        description: "An ISO 639-1 language code. Defaults to 'en'",
        type: String
    })
    @ApiResponse({
        status: 200,
        type: 'text/plain',
        description: `Sitemaps have been generated`
    })
    async getStaticSitemap(@Param('lang') lang: string): Promise<any> {
        return this.sitemapService.generateStaticSitemaps(lang);
    }

    @Get('categories/:lang')
    @ApiProduces('application/xml')
    @ApiOperation({
        title: 'Sitemap of category pages',
        description: ''
    })
    @ApiImplicitParam({
        name: 'lang',
        description: "An ISO 639-1 language code. Defaults to 'en'",
        required: false,
        type: String
    })
    @ApiResponse({
        status: 200,
        type: 'application/xml',
        description: `An XML sitemap`
    })
    // @UsePipes(new JoiValidationPipe(SitemapQuerySchema))
    async getCategoriesSitemapXML(@Res() res, @Param('lang') lang: string, @Query() options): Promise<any> {
        if (lang.slice(-4) == ".xml") lang = lang.slice(0, -4);
        return this.sitemapService.getCategoriesSitemap(res, lang);
    }

}
