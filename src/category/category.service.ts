import { Injectable } from '@nestjs/common';
import { MysqlService } from '../feature-modules/database';
import { PreviewResult } from '../types/api';

@Injectable()
export class CategoryService {
    constructor(private mysql: MysqlService) {}
    async getPagesByCategoryID(category_id: number, limit?: number): Promise<PreviewResult[]> {
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
                art.is_indexed
            FROM 
                enterlink_pagecategory_collection cat_collection 
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
            [category_id, limit_to_use]
        );

        return category_previews;
    }

    async getPagesByCategoryLangSlug(lang_code: string, slug: string, limit?: number): Promise<PreviewResult[]> {
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
                art.is_indexed
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

        return category_previews;
    }
}
