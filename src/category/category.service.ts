import { Injectable, Res } from '@nestjs/common';
import { MysqlService } from '../feature-modules/database';
import { PageCategory, PageCategoryCollection, PreviewResult } from '../types/api';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { CategoryAMPRenderPartial } from './amp/category-amp-render-partial';
import * as SqlString from 'sqlstring';
const crypto = require('crypto');

const HOMEPAGE_CATEGORY_IDS = [1, 2, 3, 4, 4234, 371, 4071, 4068, 4066, 4069, 4072, 4070, 16926];

export interface CategorySearchPack {
    lang: string,
    schema_for: string, 
    searchterm: string
}

@Injectable()
export class CategoryService {
    constructor(private mysql: MysqlService) {}
    async getPagesByCategoryID(category_id: number, query: any): Promise<PageCategoryCollection> {
        let limit_to_use = query.limit == undefined ? 20 : parseInt(query.limit);
        let offset_to_use = query.offset == undefined ? 0 : parseInt(query.offset);
        let show_adult = query.show_adult_content == undefined ? 0 : parseInt(query.offset);
        let show_adult_string = "AND art.is_adult_content=0";
        if (show_adult) show_adult_string = '';

        let category_previews: any[] = await this.mysql.TryQuery(
            `
            SELECT 
                art.page_title, 
                art.slug,
                art.photo_url AS main_photo, 
                art.photo_thumb_url AS thumbnail,
                art.page_lang AS lang_code,
                art.ipfs_hash_current AS ipfs_hash, 
                art.blurb_snippet AS text_preview, 
                art.pageviews, 
                art.page_note,
                art.is_adult_content, 
                art.creation_timestamp,
                art.lastmod_timestamp,
                art.is_removed,
                art.webp_large,
                art.webp_medium,
                art.webp_small,
                art.is_indexed,
                cat.id AS cat_id,
                cat.lang AS cat_lang,
                cat.slug AS cat_slug,
                cat.title AS cat_title,
                cat.description AS cat_description,
                cat.img_full AS cat_img_full,
                cat.img_full_webp AS cat_img_full_webp,
                cat.img_thumb AS cat_img_thumb,
                cat.img_thumb_webp AS cat_img_thumb_webp
            FROM 
                enterlink_pagecategory_collection cat_collection 
            INNER JOIN
                enterlink_pagecategory cat ON cat.id=?
            INNER JOIN
                enterlink_articletable art ON cat_collection.articletable_id=art.id
            WHERE 
                art.is_removed = 0
                AND art.is_indexed = 1
                AND redirect_page_id IS NULL
                AND cat_collection.category_id = ?
                ${show_adult_string}
            ORDER BY art.pageviews DESC
            LIMIT ?
            OFFSET ?
            `,
            [category_id, category_id, limit_to_use, offset_to_use],
            10000
        );

        // Pull out the info for the category itself
        let category_info: any = {};
        let the_keys = [];
        if (category_previews.length > 0){
            let first_result = category_previews[0];
            Object.keys(first_result).forEach(key => {
                if (key.indexOf('cat_') == 0) category_info[key.replace('cat_', '')] = first_result[key];
                else the_keys.push(key);
            })
        }

        // Pull out the previews
        let the_previews: PreviewResult[] = [];
        category_previews.forEach(prev => {
            let previewresult_obj: any = {};
            the_keys.forEach(key => {
                let the_value = prev[key];

                // Sanitize the text if applicable
                if(key.search(/page_title|text_preview/gimu) >= 0) the_value = sanitizeTextPreview(the_value);
                previewresult_obj[key] = the_value;
            });
            the_previews.push(previewresult_obj);
        })
        return {
            category: category_info,
            previews: the_previews
        }
    }

    async getPagesByCategoryLangSlug(lang_code: string, slug: string, query: any): Promise<PageCategoryCollection> {
        let limit_to_use = (query && query.limit && query.limit == undefined) ? 20 : parseInt(query.limit);
        let offset_to_use = (query && query.offset && query.offset == undefined) ? 0 : parseInt(query.offset);
        let show_adult = (query && query.show_adult_content && query.show_adult_content) == undefined ? 0 : parseInt(query.offset);
        let show_adult_string = "AND art.is_adult_content=0";
        if (show_adult) show_adult_string = '';

        let category_previews: any[] = await this.mysql.TryQuery(
            `
            SELECT 
                art.page_title, 
                art.slug,
                art.photo_url AS main_photo, 
                art.photo_thumb_url AS thumbnail,
                art.page_lang AS lang_code,
                art.ipfs_hash_current AS ipfs_hash, 
                art.blurb_snippet AS text_preview, 
                art.pageviews, 
                art.page_note,
                art.is_adult_content, 
                art.creation_timestamp,
                art.lastmod_timestamp,
                art.is_removed,
                art.webp_large,
                art.webp_medium,
                art.webp_small,
                art.is_indexed,
                cat.id AS cat_id,
                cat.lang AS cat_lang,
                cat.slug AS cat_slug,
                cat.title AS cat_title,
                cat.description AS cat_description,
                cat.img_full AS cat_img_full,
                cat.img_full_webp AS cat_img_full_webp,
                cat.img_thumb AS cat_img_thumb,
                cat.img_thumb_webp AS cat_img_thumb_webp
            FROM 
                enterlink_pagecategory cat 
            INNER JOIN
                enterlink_pagecategory_collection cat_collection ON cat_collection.category_id=cat.id
            INNER JOIN
                enterlink_articletable art ON cat_collection.articletable_id=art.id
            WHERE 
                cat.lang = ? 
                AND cat.slug = ?
                AND art.is_removed = 0
                AND art.is_indexed = 1
                AND redirect_page_id IS NULL
                ${show_adult_string}
            ORDER BY art.pageviews DESC
            LIMIT ?
            OFFSET ?
            `,
            [lang_code, slug, limit_to_use, offset_to_use],
            10000
        );

        // Pull out the info for the category itself
        let category_info: any = {};
        let the_keys = [];
        if (category_previews.length > 0){
            let first_result = category_previews[0];
            Object.keys(first_result).forEach(key => {
                if (key.indexOf('cat_') == 0) category_info[key.replace('cat_', '')] = first_result[key];
                else the_keys.push(key);
            })
        }

        // Pull out the previews
        let the_previews: PreviewResult[] = [];
        category_previews.forEach(prev => {
            let previewresult_obj: any = {};
            the_keys.forEach(key => {
                let the_value = prev[key];

                // Sanitize the text if applicable
                if(key.search(/page_title|text_preview/gimu) >= 0) the_value = sanitizeTextPreview(the_value);
                previewresult_obj[key] = the_value;
            });
            the_previews.push(previewresult_obj);
        })

        return {
            category: category_info,
            previews: the_previews
        };
    }

    async getAMPCategoryPage(@Res() res, lang_code: string, slug: string): Promise<any> {
        let category_collection = await this.getPagesByCategoryLangSlug(
            lang_code, 
            slug, 
            { limit: 40, offset: 0, show_adult_content: false }
        );
        let category_html_string = '';
        const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
        let arp = new CategoryAMPRenderPartial(category_collection);
        let the_category = category_collection && category_collection.category;
        let the_previews = category_collection && category_collection.previews;

        let BLURB_SNIPPET_PLAINTEXT = (the_category && the_category.description) ? the_category.description.replace(/["“”‘’]/gmiu, "\'") : "";

        const theHTML = `
            <!DOCTYPE html>
            <html amp lang="${lang_code}">
                <head>
                    ${arp.renderHead(BLURB_SNIPPET_PLAINTEXT, RANDOMSTRING)}
                </head>
                <body>
                    ${arp.renderHeaderBar()}
                    <main id="mainEntityId">
                        ${arp.renderMainBar()}
                        ${arp.renderCategories()}
                        ${arp.renderBreadcrumb()}
                    </main>
                    <footer class="ftr everi_footer">
                        ${arp.renderFooter()}
                    </footer>
                    <amp-lightbox id="usermenu-lightbox" layout="nodisplay">
                        ${arp.renderUserMenu()}
                    </amp-lightbox> 
                    <amp-lightbox id="share-lightbox" layout="nodisplay">
                        ${arp.renderShareLightbox()}
                    </amp-lightbox>
                    ${arp.renderAnalyticsBlock()}
                </body>
            </html>
        `

        res
            .header('Content-Type', 'text/html')
            .status(200)
            .send(theHTML);
    }

    async getHomepageCategories(lang: string): Promise<PageCategory[]> {
        
        let categories: any[] = await this.mysql.TryQuery(
            `
            SELECT *
            FROM 
                enterlink_pagecategory cat 
            WHERE 
                cat.lang = ? 
                AND cat.id IN (?)
            `,
            [lang, HOMEPAGE_CATEGORY_IDS],
            10000
        );

        return categories;
    }

    async search(pack: CategorySearchPack): Promise<PageCategory[]> {
        let categories: any[] = await this.mysql.TryQuery(
            `
            SELECT *
            FROM 
                enterlink_pagecategory cat 
            WHERE 
                cat.lang = ? 
                AND (cat.schema_for = ? OR cat.schema_for = 'Thing')
                AND (
                    cat.title REGEXP ? 
                    OR cat.schema_regex REGEXP ? 
                    OR cat.key_regex REGEXP ? 
                    OR cat.values_regex REGEXP ?    
                )
            `,
            [pack.lang, pack.schema_for, pack.searchterm, pack.searchterm, pack.searchterm, pack.searchterm]
        );
        return categories;
    }

    async categoriesByIDs(ids: number[]): Promise<PageCategory[]> {
        if (ids.length == 0) return [];
        let categories: any[] = await this.mysql.TryQuery(
            `
            SELECT *
            FROM 
                enterlink_pagecategory cat 
            WHERE 
                cat.id IN (?)
            `,
            [ids]
        );
        return categories;
    }

}
