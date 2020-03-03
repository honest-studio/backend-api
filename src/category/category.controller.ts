import { Body, Controller, Get, Post, UsePipes, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { PageCategoryCollection, PageCategory } from '../types/api';
import { CategoryService, CategorySearchPack, CategoryCreatePack } from './category.service';

@Controller('v2/category')
@ApiTags('Contact Us')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('/bycategoryid/:category_id')
    @ApiOperation({ summary: 'Get all the previews for pages belonging to a category, specified by its category id' })
    @ApiParam({
        name: 'category_id',
        description: 'The category id (an integer)'
    })
    @ApiQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'show_adult_content',
        description: 'Allow adult content to show up in results. Default is no.',
        required: false,
        type: Number
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getPagesByCategoryID(@Param('category_id') category_id, @Query() query): Promise<PageCategoryCollection> {
        return await this.categoryService.getPagesByCategoryID(category_id, query);
    }

    @Get('/bylangslug/lang_:lang_code/:slug')
    @ApiOperation({ summary: 'Get all the previews for pages belonging to a category, specified by its language and slug' })
    @ApiParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code for the category'
    })
    @ApiParam({
        name: 'slug',
        description: 'The category page slug. Each category has a unique (lang_code + slug). Example: instagram-stars'
    })
    @ApiQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'show_adult_content',
        description: 'Allow adult content to show up in results. Default is no.',
        required: false,
        type: Number
    })
    @ApiQuery({
        name: 'increment_view_count',
        description: 'Whether to increase the page count. Default is no.',
        required: false,
        type: Boolean
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getPagesByCategoryLangSlug(@Param('lang_code') lang_code, @Param('slug') slug, @Query() query): Promise<PageCategoryCollection> {
        if (query && query.increment_view_count) this.categoryService.incrementViewCount(lang_code, slug);
        return await this.categoryService.getPagesByCategoryLangSlug(lang_code, slug, query);
    }

    @Get('/homepage/:lang')
    @ApiOperation({ summary: 'Get the category pages to show on the homepage' })
    @ApiParam({
        name: 'lang',
        description: 'The language of the category page'
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getHomepageCategories(@Param('lang') lang): Promise<PageCategory[]> {
        return await this.categoryService.getHomepageCategories(lang);
    }

    @Get('/amp/lang_:lang_code/:slug')
    @ApiOperation({ summary: 'Get the AMP version of the category page' })
    @ApiParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code for the category'
    })
    @ApiParam({
        name: 'slug',
        description: 'The category page slug. Each category has a unique (lang_code + slug). Example: instagram-stars'
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getAMPCategoryPageCtrl(@Res() res, @Param('lang_code') lang_code, @Param('slug') slug): Promise<any> {
        this.categoryService.incrementViewCount(lang_code, slug);
        return await this.categoryService.getAMPCategoryPage(res, lang_code, slug);
    }

    @Post('create')
    @ApiOperation({ 
        summary: `Create a new category`
    })
    @ApiResponse({
        status: 200,
        description: `Returns the newly-created category`
    })
    async createCtrl(@Body() pack: CategoryCreatePack): Promise<PageCategory> {
        return this.categoryService.create(pack);
    }

    @Post('search')
    @ApiOperation({ 
        summary: `Search category titles`
    })
    @ApiResponse({
        status: 200,
        description: `Returns search results`
    })
    async search(@Body() pack: CategorySearchPack): Promise<PageCategory[]> {
        return this.categoryService.search(pack);
    }

    @Post('categoriesbyids')
    @ApiOperation({ 
        summary: `Get categories by their IDs`
    })
    @ApiResponse({
        status: 200,
        description: `Returns an array of categories`
    })
    async categoriesByIDs(@Body() ids: number[]): Promise<PageCategory[]> {
        return this.categoryService.categoriesByIDs(ids);
    }

}
