import { Injectable } from '@nestjs/common';
import { ConfigService, ElasticSearchConfig } from '../common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
    constructor(private client: ElasticsearchService) {}

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
        return canonical_ids;
    }
}
