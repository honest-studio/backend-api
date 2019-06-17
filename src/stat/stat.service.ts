import { Injectable } from '@nestjs/common';
import { MongoDbService, MysqlService } from '../feature-modules/database';

export interface LeaderboardOptions {
    period: 'today' | 'this-week' | 'this-month' | 'all-time';
    since: number; // UNIX timestamp. overrides period
    cache: boolean;
    limit: number;
}

@Injectable()
export class StatService {
    constructor(private mongo: MongoDbService, private mysql: MysqlService) {}

    private readonly EDITOR_LEADERBOARD_CACHE_EXPIRE_MS = 10 * 60 * 1000; // 10 minutes
    private readonly SITE_USAGE_CACHE_EXPIRE_MS = 30 * 60 * 1000; // 30 minutes
    private readonly GENESIS_BLOCK_TIMESTAMP = 1528470488;

    async editorLeaderboard(options: LeaderboardOptions): Promise<any> {
        // pull from cache if available
        if (options.cache) {
            const cache = await this.mongo.connection().statistics.findOne({ 
                key: 'editor_leaderboard',
                period: options.period
            });
            if (cache) {
                delete cache._id;
                const cache_age = Date.now() - cache.timestamp.getTime();
                if (cache_age < this.EDITOR_LEADERBOARD_CACHE_EXPIRE_MS) return cache.editor_rewards.slice(0, options.limit);
            }
        }

        let starttime;
        if (options.since) {
            starttime = options.since * 1000;
        } else if (options.period == 'today') {
            starttime = Date.now() - 24 * 3600 * 1000;
        } else if (options.period == 'this-week') {
            starttime = Date.now() - 7 * 24 * 3600 * 1000;
        } else if (options.period == 'this-month') {
            starttime = Date.now() - 30 * 24 * 3600 * 1000;
        } else if (options.period == 'all-time') {
            starttime = 0;
        }
        let editor_rewards = await this.mongo
            .connection()
            .actions.mapReduce(
                `function () { emit( this.trace.act.data.to, new Date(this.block_time) > ${starttime} ? Number(this.trace.act.data.quantity.split(' ')[0]) : 0) }`,
                'function (key, values) { return Array.sum(values) }',
                {
                    query: {
                        'block_num': { $gt: 15000000 },
                        'trace.act.account': 'everipediaiq',
                        'trace.act.name': 'issue'
                    },
                    out: { inline: 1 }
                }
            );

        // Get the first 100 rows so you can cache them all
        // Then slice off whatever number you need when you return it
        editor_rewards = editor_rewards
            .sort((a, b) => b.value - a.value)
            .slice(0, 100)
            .map((doc) => ({ user: doc._id, cumulative_iq_rewards: Number(doc.value.toFixed(3)) }));
        let edits = await this.mongo
            .connection()
            .actions.mapReduce(
                `function () { emit( this.trace.act.data.proposer, new Date(this.block_time) > ${starttime} ? 1:0) }`,
                'function (key, values) { return Array.sum(values) }',
                {
                    query: {
                        'trace.act.account': 'eparticlectr',
                        '$or': [
                            { 'trace.act.name': 'propose' },
                            { 'trace.act.name': 'propose2' }
                        ]
                    },
                    out: { inline: 1 }
                }
            );
        edits = edits.filter(e => e.value > 0);

        // assign number of edits to editor
        for (let i in editor_rewards) {
            const edits_row = edits.find(row => row._id == editor_rewards[i].user);
            if (edits_row) editor_rewards[i].edits = edits_row.value;
            else editor_rewards[i].edits = 0;
        }

        // clear old cache and cache new result
        const doc = {
            key: 'editor_leaderboard',
            period: options.period,
            timestamp: new Date(),
            editor_rewards
        };
        this.mongo.connection().statistics.deleteMany({ key: 'editor_leaderboard', period: options.period });
        this.mongo.connection().statistics.insertOne(doc);

        return editor_rewards.slice(0, options.limit);
    }

    async siteUsage(use_cache: boolean = true): Promise<any> {
        // pull from cache if available
        if (use_cache) {
            const cache = await this.mongo.connection().statistics.findOne({ key: 'site_usage' });
            if (cache) {
                delete cache._id;
                const cache_age = Date.now() - cache.timestamp.getTime();
                if (cache_age < this.SITE_USAGE_CACHE_EXPIRE_MS) return cache;
            }
        }

        const total_article_count: Array<any> = await this.mysql.TryQuery(
            `SELECT COUNT(*) AS num_articles FROM enterlink_articletable`
        );

        const total_pageviews: Array<any> = await this.mysql.TryQuery(
            `SELECT SUM(pageviews) AS pageviews FROM enterlink_articletable`
        );

        let total_edits: any = await this.mongo
            .connection()
            .actions.count({ $or: [
                { 'trace.act.name': 'propose' },
                { 'trace.act.name': 'propose2' }
            ]});

        let total_editors: any = await this.mongo
            .connection()
            .actions.aggregate([
                { $group: { _id: '$trace.act.data.proposer' } },
                { $group: { _id: 1, count: { $sum: 1 } } }
            ])
            .toArray();
        total_editors = total_editors[0].count;

        let total_iq_rewards = await this.mongo
            .connection()
            .actions.mapReduce(
                'function () { emit( 1, Number(this.trace.act.data.quantity.split(" ")[0]) ) }',
                'function (key, values) { return Array.sum(values) }',
                {
                    query: {
                        'block_num': { $gt: 15000000 },
                        'trace.act.account': 'everipediaiq',
                        'trace.act.name': 'issue'
                    },
                    out: { inline: 1 }
                }
            );
        if (total_iq_rewards.length > 0) total_iq_rewards = Number(total_iq_rewards[0].value.toFixed(3));
        else total_iq_rewards = 0;

        const original_pages_rows: Array<any> = await this.mysql.TryQuery(
            `SELECT COUNT(*) AS count 
            FROM enterlink_articletable 
            WHERE 
                page_note IS NULL AND
                redirect_page_id IS NULL AND
                is_removed = 0`,
            [],
            20000
        )
        const original_pages = (original_pages_rows != undefined) && 
                               (original_pages_rows.length > 0 ? original_pages_rows[0].count : 0);

        // clear old cache and cache new result
        const doc = {
            key: 'site_usage',
            timestamp: new Date(),
            total_article_count,
            total_pageviews,
            total_editors,
            total_iq_rewards,
            original_pages,
            total_edits
        };
        this.mongo.connection().statistics.deleteMany({ key: 'site_usage' });
        this.mongo.connection().statistics.insertOne(doc);

        return doc;
    }
}
