import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { MysqlService } from '../feature-modules/database';
import { SanitizeTextPreview } from '../utils/article-utils/article-tools';
import * as cheerio from 'cheerio';
import * as util from 'util';

@Injectable()
export class SearchService {
    constructor(private client: ElasticsearchService, private mysql: MysqlService) {}

    async searchTitle(query: string, langs?: string[]): Promise<any> {
        const searchJSON = {
            // size: 25000,
            min_score: 1.0001, // Make sure non-matches do not show up
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query: query,
                                fields: ['page_title.keyword'],
                                type: 'phrase',
                                boost: 4
                            }
                        },
                        // Elasticsearch 7.0+ does not allow this
                        // {
                        //     multi_match: {
                        //         query: query,
                        //         fields: ['page_title.keyword'],
                        //         type: 'phrase_prefix',
                        //         boost: 2
                        //     }
                        // },
                        {
                            multi_match: {
                                query: query,
                                fields: ['page_title'],
                                type: 'phrase_prefix',
                                slop: 5,
                                max_expansions: 250
                            }
                        }
                    ]
                }
            }
        };

        if (langs) {
            searchJSON.query.bool['must'] = {
                terms: { lang: langs }
            };
        }

        const searchResult = await this.client
            .search({
                index: 'articletable_main5',
                type: 'ep_template_v1',
                body: searchJSON
            })
            .toPromise();

        const canonical_ids: number[] = searchResult[0].hits.hits.map((h) => {
            return h._source.canonical_id;
        });
        if (canonical_ids.length == 0) return [];

        const result_rows: Array<any> = await this.mysql.TryQuery(
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
                art.lastmod_timestamp
            FROM enterlink_articletable AS art
            WHERE art.id IN (?) 
            ORDER BY FIELD(art.id, ?)`,
            [canonical_ids, canonical_ids]
        );

        // clean up text previews
        result_rows.forEach((row) => {
            row.page_title = SanitizeTextPreview(row.page_title);
            if (!row.text_preview) return; // continue
            row.text_preview = SanitizeTextPreview(row.text_preview);
        });

        return result_rows;
    }

    async searchSchemaByType(query: string, page_type: string): Promise<any> {
        return await this.mysql.TryQuery(
            `
            SELECT sch.mapped_keyword as 'key', sch.schema_keyword as 'schema', sch.schema_argument as 'addl_schematype', sch.addl_schema_default_itemprop as 'addl_schema_itemprop'
            FROM enterlink_schemaobject AS sch 
            WHERE sch.schema_for IN ('Thing', ?) 
            AND sch.exclude_from_dropdown=0 
            AND sch.mapped_keyword LIKE ?`,
            [page_type, query + '%']
        );
    }
}
