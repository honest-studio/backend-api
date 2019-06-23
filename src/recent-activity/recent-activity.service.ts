import { Injectable } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { MongoDbService, MysqlService } from '../feature-modules/database';
import { EosAction } from '../feature-modules/database/mongodb-schema';
import { PreviewService } from '../preview/preview.service';
import { Proposal, ProposalService } from '../proposal';

@Injectable()
export class RecentActivityService {
    constructor(
        private mongo: MongoDbService,
        private proposalService: ProposalService,
        private mysql: MysqlService,
        private previewService: PreviewService,
    ) {}

    async getAll(query): Promise<Array<EosAction<any>>> {
        const docs = this.mongo.connection().actions.find({});
        return docs
            .sort({ block_num: -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getArticleActions(query): Promise<Array<EosAction<any>>> {
        const results = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr'
            })
            .sort({ block_num: -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        return results;
    }

    async getTokenActions(query): Promise<Array<EosAction<any>>> {
        const results = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'everipediaiq'
            })
            .sort({ block_num: -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        return results;
    }

    async getProposals(query): Promise<Array<Proposal>> {
        let find_query;
        let sort_direction;
        const now = (Date.now() / 1000) | 0;

        find_query = {
            'trace.act.account': 'eparticlectr',
            'trace.act.name': 'logpropinfo'
        };
        if (query.expiring) {
            find_query['trace.act.data.endtime'] = { $gt: now };
            sort_direction = 1;
        } else {
            sort_direction = -1;
        }
        if (query.completed) {
            find_query['trace.act.data.endtime'] = { $lt: now };
        }
        if (query.langs) {
            find_query['trace.act.data.lang_code'] = { $in: query.langs.split(',') };
        }
        const proposal_id_docs = await this.mongo
            .connection()
            .actions.find(find_query, { projection: { 'trace.act.data.proposal_id': 1 } })
            .sort({ 'trace.act.data.proposal_id': sort_direction })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        const proposal_ids = proposal_id_docs.map((doc) => doc.trace.act.data.proposal_id)
            .filter((v, i, a) => a.indexOf(v) === i);
                
        const proposal_options = {
            preview: query.preview,
            diff: query.diff
        };

        return this.proposalService.getProposals(proposal_ids, proposal_options);
    }

    async getTrendingWikis(langs: string[] = [], range: string = 'today', limit: number = 10) {
        if (range == 'today') {
            const top_slugs: Array<any> = await this.mysql.TryQuery(
                `
                SELECT path, COUNT(*) AS pageviews 
                FROM ep2_backend_requests
                WHERE path LIKE "/v2/wiki/slug/%"
                GROUP BY path
                ORDER BY pageviews DESC
                LIMIT ?
                `,
                [limit]
            );

            return top_slugs.map(row => ({
                slug: row.path.substring(row.path.lastIndexOf('/') + 1),
                lang_code: row.path.slice(19, row.path.lastIndexOf('/')),
                pageviews_today: row.pageviews,
                unique_pageviews_today: row.pageviews,
            }));
        }
        else if (range == 'all') {
            const top_pages: Array<any> = await this.mysql.TryQuery(
                `
                SELECT 
                    art.slug,
                    art.page_lang AS lang_code,
                    art.ipfs_hash_current AS ipfs_hash, 
                    art.pageviews AS pageviews
                FROM enterlink_articletable AS art 
                ORDER BY pageviews DESC
                LIMIT ?`,
                [limit]
            );

            return top_pages;
        }

    }
}
