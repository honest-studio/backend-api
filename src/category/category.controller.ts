import { Body, Controller, Get, UsePipes, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags, ApiImplicitParam } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { PreviewResult } from '../types/api';
import { CategoryService } from './category.service';

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
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getPagesByCategoryID(@Param('category_id') category_id): Promise<PreviewResult[]> {
        return await this.categoryService.getPagesByCategoryID(category_id);
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
    @ApiResponse({
        status: 200,
        description: `A JSON with a list of all the pages belonging to that category`
    })
    async getPagesByCategoryLangSlug(@Param('lang_code') lang_code, @Param('slug') slug): Promise<PreviewResult[]> {
        return await this.categoryService.getPagesByCategoryLangSlug(lang_code, slug);
    }
}
