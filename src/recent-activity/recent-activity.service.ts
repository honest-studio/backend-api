import { Injectable } from '@nestjs/common';
import { MongoDbService, MysqlService, RedisService } from '../feature-modules/database';
import { EosAction } from '../feature-modules/database/mongodb-schema';
import { PreviewService } from '../preview/preview.service';
import { Proposal, ProposalService } from '../proposal';
import { ActivityType } from '../types/article';
import { ConfigService } from '../common';
const util = require('util');

@Injectable()
export class RecentActivityService {
    private readonly TRENDING_CACHE_EXPIRE_MS = 10 * 60 * 1000;

    constructor(
        private mongo: MongoDbService,
        private redis: RedisService,
        private proposalService: ProposalService,
        private config: ConfigService,
        private mysql: MysqlService,
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
        if (query.account_name) {
            find_query['trace.act.data.proposer'] = query.account_name;
        }
        if (query.completed) {
            const last_finalized = await this.mongo.connection()
                .actions.find({
                    'trace.act.account': 'eparticlectr',
                    'trace.act.name': 'logpropres'
                })
                .sort({ 'trace.act.data.proposal_id': -1 })
                .limit(1)
                .toArray();
            find_query['trace.act.data.proposal_id'] = { $lt: last_finalized[0].trace.act.data.proposal_id };
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
            diff: query.diff,
            user_agent: query.user_agent,
            cache: query.cache
        };

        return this.proposalService.getProposals(proposal_ids, proposal_options);
    }

    async getTrendingWikis(langs: string[] = [], range: string = 'today', limit: number = 10) {
        if (range == 'today') {
            // check cache first
            const cache = await this.redis.connection().get(`trending_pages:today`);
            if (cache) {
                return JSON.parse(cache).slice(0, limit);
            }

            // No cache? Compute it
            const client_id = this.config.get("GOOGLE_API_CLIENT_ID");
            const client_secret = this.config.get("GOOGLE_API_CLIENT_SECRET");
            const refresh_token = this.config.get("GOOGLE_API_REFRESH_TOKEN");
            const access_token = await fetch("https://www.googleapis.com/oauth2/v4/token", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}&grant_type=refresh_token`
            })
            .then(response => response.json())
            .then(json => json.access_token);

            const analytics_view_id = this.config.get("GOOGLE_ANALYTICS_VIEW_ID");
            const rows = await fetch(`https://analyticsreporting.googleapis.com/v4/reports:batchGet`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify({
                    "reportRequests": [{
                        viewId: analytics_view_id,
                        dateRanges: [{"startDate": "yesterday", "endDate": "today"}],
                        metrics: [
                            {"expression": "ga:pageviews" },
                            {"expression": "ga:uniquePageviews" }
                        ],
                        dimensions: [{"name": "ga:pagePath"}],
                        dimensionFilterClauses: [{ 
                            filters: [{
                                dimensionName: "ga:pagePath",
                                operator: "BEGINS_WITH",
                                expressions: "/wiki/",
                            }]
                        }],
                        orderBys: [{ "fieldName": "ga:pageviews", "sortOrder": "DESCENDING" }],
                        pageSize: 100
                    }]
                })
            })
            .then(response => response.json())
            .then(json => json.reports[0].data.rows);

            // combine AMP and regular views
            const viewcounts = {};
            for (let r of rows) {
                let slug = r.dimensions[0];
                if (slug.slice(-4) == "/amp")
                    slug = slug.slice(0, -4);
                slug = slug.substring(slug.lastIndexOf('/') + 1);
                if (viewcounts[slug]) {
                    viewcounts[slug].pageviews += Number(r.metrics[0].values[0]);
                    viewcounts[slug].unique_pageviews += Number(r.metrics[0].values[1]);
                }
                else viewcounts[slug] = {
                    lang_code: r.dimensions[0].slice(11,13),
                    pageviews: Number(r.metrics[0].values[0]),
                    unique_pageviews: Number(r.metrics[0].values[1])
                };
            }

            const trending = Object.keys(viewcounts).map(slug => ({
                slug, ...viewcounts[slug]
            }))
            .sort((a,b) => b.unique_pageviews - a.unique_pageviews);



            const pipeline = this.redis.connection().pipeline();
            pipeline.set('trending_pages:today', JSON.stringify(trending));
            pipeline.expire('trending_pages:today', 3600);
            pipeline.exec();

            return trending.slice(0, limit);
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
