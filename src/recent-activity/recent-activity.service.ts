import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../feature-modules/database';
import { ProposalService, Proposal } from '../proposal';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';
import { OAuthService } from '../oauth/oauth.service';
import { PreviewService } from '../preview/preview.service';
import * as fetch from 'node-fetch';

@Injectable()
export class RecentActivityService {
    constructor(
        private mongo: MongoDbService,
        private proposalService: ProposalService,
        private oauthService: OAuthService,
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

        const proposal_ids = proposal_id_docs.map((doc) => doc.trace.act.data.proposal_id);
        const proposal_options = {
            preview: query.preview,
            diff: query.diff
        };

        return this.proposalService.getProposals(proposal_ids, proposal_options);
    }

    async getTrendingWikis(langs: string[] = []) {
        const access_token = await this.oauthService.getGoogleAnalyticsToken();
        let match_tokens;
        if (langs.length > 0)
            match_tokens = langs.map(lang => `/v2/wiki/slug/lang_${lang}`);
        else
            match_tokens = [`/v2/wiki/slug/lang_`];

        const body = {
            reportRequests: [
                {
                    viewId: '192421339',
                    dateRanges: [{ startDate: '2019-01-01', endDate: '2019-11-30' }],
                    dimensions: [{ name: 'ga:pagePath' }],
                    dimensionFilterClauses: [
                        {
                            filters: [
                                {
                                    dimensionName: 'ga:pagePath',
                                    operator: 'PARTIAL',
                                    expressions: match_tokens
                                }
                            ]
                        }
                    ],
                    metrics: [{ expression: 'ga:pageviews' }, { expression: 'ga:uniquePageviews' }],
                    orderBys: [{ fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' }]
                }
            ]
        };
        const report = await fetch('https://analyticsreporting.googleapis.com/v4/reports:batchGet', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                Authorization: `Bearer ${access_token.token}`
            }
        }).then((response) => response.json());

        if (!report.reports[0].data.rows)
            return [];

        const trending = report.reports[0].data.rows.map((row) => ({
            slug: row.dimensions[0].slice(14).split('/')[1],
            lang_code: row.dimensions[0].slice(14).split('/')[0].slice(5),
            pageviews_today: Number(row.metrics[0].values[0]),
            unique_pageviews_today: Number(row.metrics[0].values[1])
        }));

        return trending;
    }
}
