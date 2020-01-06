import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { CategoryService } from '../category';
import { UserService } from '../user';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { MysqlService } from '../feature-modules/database';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { SearchType, ExtendedSearchResult, PreviewResult, ProfileSearchPack } from '../types/api';
const util = require('util');

export interface SearchQueryPack {
    query: string,
    langs?: string[],
    from?: number,
    offset?: number,
    filters?: SearchType[]
}

@Injectable()
export class SearchService {
    constructor(
        private client: ElasticsearchService, 
        private mysql: MysqlService,
        @Inject(forwardRef(() => CategoryService)) private categoryService: CategoryService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
    ) {}

    async searchTitle(pack: SearchQueryPack): Promise<PreviewResult[]> {
        const { query, langs, from, offset } = pack;
        const searchJSON = {
            from: from ? from : 0,
            size: offset ? offset : 40,
            timeout: '2000ms',
            min_score: 1.0001,
            query: {
                function_score: {
                    query: {
                        bool: {
                            filter: [],
                            must: [],
                            should: [
                                {
                                    multi_match: {
                                        query: query,
                                        fields: ['page_title.keyword'],
                                        type: 'phrase',
                                        boost: 20,
                                    }
                                },
                                {
                                    multi_match: {
                                        query: query,
                                        fields: ['page_title'],
                                        type: 'phrase_prefix',
                                        slop: 5,
                                        max_expansions: 35000,
                                        boost: 20,
                                    }
                                }
                            ],
                            minimum_should_match: 1
                        }
                    },
                    functions: [
                        {
                            script_score:{
                                script: "doc['pageviews'].value * 0.02"
                            }
                        },
                    ],
                    boost_mode: 'sum'
                },
            }
        };

        if (langs) {
            searchJSON.query.function_score.query.bool.must.push({
                terms: { lang: langs }
            });
        }

        searchJSON.query.function_score.query.bool.filter.push({
            exists: {
                field: "pageviews"
            }
        });
        searchJSON.query.function_score.query.bool.filter.push({
            exists: {
                field: "page_title"
            }
        });
        

        // console.log(util.inspect(searchJSON, {showHidden: false, depth: null, chalk: true}));
        // console.log(JSON.stringify(searchJSON, null, 2))

        let searchResult;
        try {
            searchResult = await this.client
                .search({
                    index: 'articletable_main5',
                    type: 'ep_template_v1',
                    body: searchJSON,
                    // timeout: '1250ms',
                })
                .toPromise();
        } catch (e) {
            if (e.message == "[null_pointer_exception] null")
                return [];
            else throw e;
        }

        const canonical_ids: number[] = searchResult[0].hits.hits.map((h) => {
            return parseInt(h._source.canonical_id);
        });
        if (canonical_ids.length == 0) return [];

        // console.log(canonical_ids);

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
                art.page_type,
                art.is_adult_content, 
                art.creation_timestamp,
                art.lastmod_timestamp
            FROM enterlink_articletable AS art
            WHERE 
                art.id IN (?)
                AND art.is_removed = 0
            ORDER BY art.is_adult_content ASC, FIELD(art.id, ?)`,
            [canonical_ids, canonical_ids]
        );

        // Clean up text previews
        result_rows.forEach((row) => {
            row.page_title = sanitizeTextPreview(row.page_title);
            if (!row.text_preview) return; // continue
            row.text_preview = sanitizeTextPreview(row.text_preview);
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

    async searchExtended(pack: SearchQueryPack): Promise<ExtendedSearchResult> {
        const { query, langs, from, offset, filters } = pack;
        let result_pack: ExtendedSearchResult = {
            articles: [],
            categories: [],
            profiles: []
        };

        let [articles, categories, profiles ] = await Promise.all([
            this.searchTitle(pack),
            this.categoryService.search({ lang: pack.langs[0], schema_for: 'ANYTHING', searchterm: pack.query }),
            []
        ])

        return result_pack;
    }
}
