import { Injectable } from '@nestjs/common';
import { MysqlService } from '../feature-modules/database';
import { PageCategory, PageCategoryCollection, PreviewResult } from '../types/api';

@Injectable()
export class CategoryService {
    constructor(private mysql: MysqlService) {}
    async getPagesByCategoryID(category_id: number, limit?: number): Promise<PageCategoryCollection> {
        let limit_to_use = limit == undefined ? 1000 : limit;

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
            ORDER BY art.pageviews DESC
            LIMIT ?
            `,
            [category_id, category_id, limit_to_use]
        );

        // Pull out the info for the category itself
        let category_info: any = {};
        let the_keys = [];
        if (category_previews.length > 0){
            let first_result = category_previews[0];
            Object.keys(first_result).forEach(key => {
                if (key.indexOf('cat_') == 0) category_info[key] = first_result[key];
                else the_keys.push(key);
            })
        }

        // Pull out the previews
        let the_previews: PreviewResult[] = [];
        category_previews.forEach(prev => {
            let previewresult_obj: any = {};
            the_keys.forEach(key => {
                previewresult_obj[key] = prev[key];
            })
            the_previews.push(previewresult_obj);
        })

        return {
            category: category_info,
            previews: the_previews
        }
    }

    async getPagesByCategoryLangSlug(lang_code: string, slug: string, limit?: number): Promise<PageCategoryCollection> {
        let limit_to_use = limit == undefined ? 1000 : limit;
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
            ORDER BY art.pageviews DESC
            LIMIT ?
            `,
            [lang_code, slug, limit_to_use]
        );

        // Pull out the info for the category itself
        let category_info: any = {};
        let the_keys = [];
        if (category_previews.length > 0){
            let first_result = category_previews[0];
            Object.keys(first_result).forEach(key => {
                if (key.indexOf('cat_') == 0) category_info[key] = first_result[key];
                else the_keys.push(key);
            })
        }

        // Pull out the previews
        let the_previews: PreviewResult[] = [];
        category_previews.forEach(prev => {
            let previewresult_obj: any = {};
            the_keys.forEach(key => {
                previewresult_obj[key] = prev[key];
            })
            the_previews.push(previewresult_obj);
        })

        return {
            category: category_info,
            previews: the_previews
        };
    }
}
