import { Injectable } from '@nestjs/common';
import { ConfigService, ElasticSearchConfig } from '../common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { MysqlService } from '../feature-modules/database';

@Injectable()
export class SearchService {
constructor(private client: ElasticsearchService,
            private mysql: MysqlService) {}

    async searchTitle(query: string): Promise<any> {
        const searchResult = await this.client
            .search({
                index: 'articletable_main2',
                type: 'enterlink_articletable_main2',
                body: {
                    query: {
                        bool: {
                            should: [
                                {
                                    multi_match: {
                                        query: query,
                                        fields: ['page_title'],
                                        type: 'phrase_prefix',
                                        slop: 5,
                                        max_expansions: 250
                                    }
                                },
                                {
                                    multi_match: {
                                        query: query,
                                        fields: ['page_title'],
                                        type: 'phrase',
                                        boost: 5
                                    }
                                }
                            ]
                        }
                    }
                }
            })
            .toPromise();
        const canonical_ids = searchResult[0].hits.hits.map((h) => h._source.canonical_id);
        return new Promise((resolve, reject) => {
            this.mysql.pool().query(`
                SELECT art.page_title, art.slug, art.photo_thumb_url, art.pageviews, art.is_adult_content, art.blurb_snippet,
                art.photo_url, art.ipfs_hash_current, art.page_lang 
                FROM enterlink_articletable AS art
                WHERE art.id IN (${canonical_ids.join(',')})`, 
                function(err, rows) { 
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}
