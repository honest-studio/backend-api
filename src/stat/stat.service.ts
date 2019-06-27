import { Injectable } from '@nestjs/common';
import { MongoDbService, MysqlService } from '../feature-modules/database';
import * as BooleanTools from 'boolean';

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
        // temporarily force all month and all-time leaderboard queries
        // to the cache. running these queries bricks the server
        // today and this-week don't require a cache so this is basically 
        // ignoring options.cache
        if (options.period == 'all-time' || 
            options.period == 'this-month') {
            const cache = await this.mongo.connection().statistics.findOne({ 
                key: 'editor_leaderboard',
                period: options.period
            });
            if (cache) {
                delete cache._id;
                return cache.editor_rewards.slice(0, options.limit);
            }
        }

        const approx_head_block_res = await this.mongo.connection().actions.find({
            'trace.act.account': 'everipediaiq',
            'trace.act.name': 'transfer'
        })
        .sort({ block_num: -1 })
        .limit(1)
        .toArray();
        const approx_head_block = approx_head_block_res[0].block_num;

        let startblock;
        if (options.since) {
            const secsDiff = (Date.now() / 1000 | 0) - options.since;
            startblock = approx_head_block - 2*secsDiff;
        } else if (options.period == 'today') {
            startblock = approx_head_block - 2*86400;
        } else if (options.period == 'this-week') {
            startblock = approx_head_block - 2*86400*7;
        } else if (options.period == 'this-month') {
            startblock = approx_head_block - 2*86400*30;
        } else if (options.period == 'all-time') {
            startblock = 15000000;
        }
        let editor_rewards = await this.mongo
            .connection()
            .actions.mapReduce(
                `function () { emit( this.trace.act.data.to, Number(this.trace.act.data.quantity.split(' ')[0]) ) }`,
                'function (key, values) { return Array.sum(values) }',
                {
                    query: {
                        'block_num': { $gt: startblock },
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

        // Get number of edits and votes per user
        let edits = await this.mongo
            .connection()
            .actions.mapReduce(
                `function () { emit( this.trace.act.data.proposer, 1) }`,
                'function (key, values) { return Array.sum(values) }',
                {
                    query: {
                        'block_num': { $gt: startblock },
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
        let votes = await this.mongo
            .connection()
            .actions.mapReduce(
                `function () { emit( this.trace.act.data.voter, 1) }`,
                'function (key, values) { return Array.sum(values) }',
                {
                    query: {
                        'block_num': { $gt: startblock },
                        'trace.act.account': 'eparticlectr',
                        '$or': [
                            { 'trace.act.name': 'votebyhash' },
                            { 'trace.act.name': 'vote' }
                        ]
                    },
                    out: { inline: 1 }
                }
            );
        edits = edits.filter(e => e.value > 0);

        // assign number of edits and votes to editor
        for (let i in editor_rewards) {
            const edits_row = edits.find(row => row._id == editor_rewards[i].user);
            if (edits_row) editor_rewards[i].edits = edits_row.value;
            else editor_rewards[i].edits = 0;

            const votes_row = votes.find(row => row._id == editor_rewards[i].user);
            if (votes_row) editor_rewards[i].votes = votes_row.value;
            else editor_rewards[i].votes = 0;
        }

        // clear old cache and cache new result
        const doc = {
            key: 'editor_leaderboard',
            period: options.period,
            timestamp: new Date(),
            editor_rewards
        };
        this.mongo.connection().statistics.replaceOne({ key: 'editor_leaderboard', period: options.period }, doc, { upsert: true });

        return editor_rewards.slice(0, options.limit);
    }

    async siteUsage(use_cache: boolean = true): Promise<any> {
        // TEMPORARY: Just return the cache no matter what
        // const cache = await this.mongo.connection().statistics.findOne({ key: 'site_usage' });
        // if (cache) return cache;

        // pull from cache if available
        // console.log("cache: ", BooleanTools.default(use_cache))
        if (BooleanTools.default(use_cache)) {
           const cache = await this.mongo.connection().statistics.findOne({ key: 'site_usage' });
           if (cache) {
               const cache_age = Date.now() - cache.timestamp.getTime();
               if (cache_age < this.SITE_USAGE_CACHE_EXPIRE_MS) return cache;
               else delete cache._id;
           }
        }
        
        const total_article_count: Array<any> = await this.mysql.TryQuery(
            `SELECT COUNT(*) AS num_articles 
            FROM enterlink_articletable art
            WHERE 
                art.is_removed = 0
                AND art.redirect_page_id IS NULL
            `,
            [],
            60000
        );

        const total_pageviews: Array<any> = await this.mysql.TryQuery(
            `SELECT SUM(pageviews) AS pageviews 
            FROM enterlink_articletable art
            WHERE 
                art.is_removed = 0
                AND art.redirect_page_id IS NULL
            `,
            [],
            180000
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
                page_note IS NULL
                AND redirect_page_id IS NULL
                AND is_removed = 0`,
            [],
            60000
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
