import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { MongoDbService, MysqlService, RedisService } from '../feature-modules/database';
import { EosAction } from '../feature-modules/database/mongodb-schema';
import { PreviewService } from '../preview/preview.service';
import { Proposal, ProposalService } from '../proposal';
import { ActivityType } from '../types/article';
import { ConfigService } from '../common';
const util = require('util');
import { Boost, BoostActivityPack } from '../types/api';
@Injectable()
export class RecentActivityService {
    private readonly TRENDING_CACHE_EXPIRE_MS = 10 * 60 * 1000;

    constructor(
        private mongo: MongoDbService,
        private redis: RedisService,
        private proposalService: ProposalService,
        private config: ConfigService,
        private mysql: MysqlService,
        @Inject(forwardRef(() => PreviewService)) private previewService: PreviewService
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
        if (query.langs == 'zh') query.langs = 'zh-hans';
        if (query.voter && query.account_name)
            throw new BadRequestException("voter and account_name cannot be used together");

        let find_query;
        let sort_direction;
        const now = (Date.now() / 1000) | 0;

        find_query = {
            'trace.act.account': 'eparticlectr',
        };
        if (query.voter) {
            find_query['trace.act.name'] = 'vote';
            find_query['trace.act.data.voter'] = query.voter;
        }
        else {
            find_query['trace.act.name'] = 'logpropinfo';
        }
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
        if (query.langs && !query.voter) {
            find_query['trace.act.data.lang_code'] = query.langs;
        }
        let proposal_id_docs = await this.mongo
            .connection()
            .actions.find(find_query, { projection: { 'trace.act.data': 1 } })
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

        let proposals = await this.proposalService.getProposals(proposal_ids, proposal_options);
        if (query.voter && query.langs) {
            const langs = query.langs.split(' ');
            proposals = proposals.filter(p => langs.includes(p.info.trace.act.data.lang_code));
        }

        return proposals;
    }

    async getRecentBoosts(query): Promise<BoostActivityPack[]> {
        let find_query;
        let sort_direction;
        const now = (Date.now() / 1000) | 0;
        sort_direction = -1;

        find_query = {
            'trace.act.account': 'eparticlectr',
            'trace.act.name': 'logboostinv'
        };
        if (query.account_name) {
            find_query['trace.act.data.booster'] = query.account_name;
        }
        if (query.langs) {
            find_query['trace.act.data.lang_code'] = { $in: query.langs.split(',') };
        }
        const boost_docs = await this.mongo
            .connection()
            .actions.find(find_query)
            .sort({ 'trace.act.data.timestamp': sort_direction })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        // Prepare the skeleton for returning 
        let return_packs = boost_docs.map(doc => {
            return {
                boost: doc.trace.act.data,
                preview: null
            }
        })

        // Fetch previews and add them to the return pack, if applicable
        if (query.preview){
            let wiki_identities = return_packs.map(rtp => {
                return {
                    lang_code: rtp.boost.lang_code,
                    slug: rtp.boost.slug
                }
            })

            // Get the previews
            let preview_results = await this.previewService.getPreviewsBySlug(wiki_identities, query.user_agent);

            // Fill the return packs with the previews
            return_packs = return_packs.map(rtp => {
                let current_pack = rtp;
                for (let i = 0; i < preview_results.length; i++){
                    let prev = preview_results[i];
                    if (rtp.boost.slug == prev.slug && rtp.boost.lang_code == prev.lang_code){
                        current_pack.preview = prev;
                        break;
                    }
                };
                return current_pack;
            })
            
            return return_packs;
        }
        else return return_packs;

    }

    async getTrendingWikis(lang: string = 'en', range: string = 'today', limit: number = 20) {
        let langToUse = lang;
        if (lang == 'zh') langToUse = 'zh-hans';
        if (range == 'today') {
            try {
                // check cache first
                const cache = await this.redis.connection().get(`trending_pages:${langToUse}:today`);
                if (cache) {
                    let parsed_cache = JSON.parse(cache);
                    if (parsed_cache && parsed_cache.length >= 6) return parsed_cache.slice(0, limit);
                }

                // No cache (or too small)? Compute it
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
                                    expressions: `/wiki/lang_${langToUse}`,
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
                pipeline.set(`trending_pages:${langToUse}:today`, JSON.stringify(trending));
                pipeline.expire(`trending_pages:${langToUse}:today`, 3600);
                pipeline.exec();

                return trending.slice(0, limit);
            }
            catch (e) {
                const top_pages: Array<any> = await this.mysql.TryQuery(
                    `
                    SELECT 
                        art.slug,
                        art.page_lang AS lang_code,
                        art.ipfs_hash_current AS ipfs_hash, 
                        art.pageviews AS pageviews
                    FROM enterlink_articletable AS art 
                    WHERE art.page_lang = ?
                    ORDER BY pageviews DESC
                    LIMIT ?`,
                    [langToUse, 1000]
                );

                let cache_slice = top_pages.slice(0, 100);

                const pipeline = this.redis.connection().pipeline();
                pipeline.set(`trending_pages:${langToUse}:today`, JSON.stringify(cache_slice));
                pipeline.expire(`trending_pages:${langToUse}:today`, 3600);
                pipeline.exec();
    
                return top_pages.slice(0, limit);
            }
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
                WHERE art.page_lang = ?
                ORDER BY pageviews DESC
                LIMIT ?`,
                [langToUse, limit]
            );

            return top_pages;
        }

    }
}
