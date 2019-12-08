import { Body, Controller, Get, Post, UsePipes, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags, ApiImplicitParam, ApiImplicitQuery } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { PageCategoryCollection, PageCategory } from '../types/api';
import { CategoryService, CategorySearchPack } from './category.service';

@Controller('v2/category')
@ApiUseTags('Contact Us')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('/bycategoryid/:category_id')
    @ApiOperation({ title: 'Get all the previews for pages belonging to a category, specified by its category id' })
    @ApiImplicitParam({
        name: 'category_id',
        description: 'The category id (an integer)'
    })
    @ApiImplicitQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
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
    @ApiOperation({ title: 'Get all the previews for pages belonging to a category, specified by its language and slug' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code for the category'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The category page slug. Each category has a unique (lang_code + slug). Example: instagram-stars'
    })
    @ApiImplicitQuery({
        name: 'offset',
        description: 'Number of records to skip. Default=0',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'limit',
        description: 'Number of records to return. Min=1, Max=100, Default=10',
        required: false,
        type: Number
    })
    @ApiImplicitQuery({
        name: 'show_adult_content',
        description: 'Allow adult content to show up in results. Default is no.',
        required: false,
        type: Number
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getPagesByCategoryLangSlug(@Param('lang_code') lang_code, @Param('slug') slug, @Query() query): Promise<PageCategoryCollection> {
        return await this.categoryService.getPagesByCategoryLangSlug(lang_code, slug, query);
    }

    @Get('/homepage/:lang')
    @ApiOperation({ title: 'Get the category pages to show on the homepage' })
    @ApiImplicitParam({
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
    @ApiOperation({ title: 'Get the AMP version of the category page' })
    @ApiImplicitParam({
        name: 'lang_code',
        description: 'An ISO 639-1 language code for the category'
    })
    @ApiImplicitParam({
        name: 'slug',
        description: 'The category page slug. Each category has a unique (lang_code + slug). Example: instagram-stars'
    })
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getAMPCategoryPageCtrl(@Res() res, @Param('lang_code') lang_code, @Param('slug') slug): Promise<any> {
        return await this.categoryService.getAMPCategoryPage(res, lang_code, slug);
    }

    @Post('search')
    @ApiOperation({ 
        title: `Search category titles`
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
        title: `Get categories by their IDs`
    })
    @ApiResponse({
        status: 200,
        description: `Returns an array of categories`
    })
    async categoriesByIDs(@Body() ids: number[]): Promise<PageCategory[]> {
        return this.categoryService.categoriesByIDs(ids);
    }

}
