import { Injectable } from '@nestjs/common';
import * as BooleanTools from 'boolean';
import { MongoDbService, RedisService, MysqlService } from '../feature-modules/database';

export interface LeaderboardOptions {
    period: 'today' | 'this-week' | 'this-month' | 'all-time';
    cache: boolean;
    limit: number;
    lang: string;
    sortby: 'iq' | 'votes' | 'edits';
    user?: string;
}

@Injectable()
export class StatService {
    constructor(private mongo: MongoDbService, private mysql: MysqlService, private redis: RedisService) {}

    private readonly EDITOR_LEADERBOARD_CACHE_EXPIRE_MS = 10 * 60 * 1000; // 10 minutes
    private readonly SITE_USAGE_CACHE_EXPIRE_MS = 30 * 60 * 1000; // 30 minutes
    private readonly GENESIS_BLOCK_TIMESTAMP = 1528470488;

    async editorLeaderboard(options: LeaderboardOptions): Promise<any> {
        const lang = options && options.lang ? options.lang : 'en';
        const sortby = options && options.sortby == 'iq' ? 'cumulative_iq_rewards' : options.sortby;

        if (options.period == 'all-time') {
            const rewards = await this.redis.connection().zrevrange('editor-leaderboard:all-time:rewards', 1, options.limit + 1, 'WITHSCORES');
            let doc = [];
            for (let i=0; i < rewards.length; i++) {
                if (i % 2 == 0) doc.push({ user: rewards[i] });
                else doc[doc.length - 1].cumulative_iq_rewards = Number(rewards[i]);
            }
            const pipeline = this.redis.connection().pipeline();
            for (let row of doc) {
                pipeline.get(`user:${row.user}:num_edits`);
                pipeline.get(`user:${row.user}:num_votes`);
            }
            const edits_votes = await pipeline.exec();
            for (let i=0; i < edits_votes.length; i++) {
                if (i % 2 == 0) doc[Math.floor(i/2)].edits = Number(edits_votes[i][1]);
                else doc[Math.floor(i/2)].votes = Number(edits_votes[i][1]);
            }
            let sorted = doc.sort((a,b) => b[sortby] - a[sortby])
            if (options.user) {
                const pipeline_user = this.redis.connection().pipeline();
                pipeline_user.zrevrank('editor-leaderboard:all-time:rewards', options.user);
                pipeline_user.zscore('editor-leaderboard:all-time:rewards', options.user);
                pipeline_user.get(`user:${options.user}:num_edits`);
                pipeline_user.get(`user:${options.user}:num_votes`);
                const user_values = await pipeline_user.exec();

                const rank = user_values[0][1] ? user_values[0][1] : 1000;
                const cumulative_iq_rewards = user_values[1][1] ? user_values[1][1] : 0;
                const edits = user_values[2][1] ? user_values[2][1] : 0;
                const votes = user_values[3][1] ? user_values[3][1] : 0;

                sorted.push({ user: options.user, rank, cumulative_iq_rewards, edits, votes });
            }
            return sorted;
        }

        const cache = await this.redis.connection().get(`editor-leaderboard:${options.period}`);
        if (cache && options.cache) {
            const sorted = JSON.parse(cache).editor_rewards
                .sort((a,b) => b[sortby] - a[sortby])
            if (options.user) return this.addUserToLeaderboard(sorted, options);
            else return sorted.slice(0, options.limit);
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
        if (options.period == 'today') {
            startblock = approx_head_block - 2*86400;
        } else if (options.period == 'this-week') {
            startblock = approx_head_block - 2*86400*7;
        } else if (options.period == 'this-month') {
            startblock = approx_head_block - 2*86400*30;
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
        this.redis.connection().set(`editor-leaderboard:${options.period}`, JSON.stringify(doc));
        this.redis.connection().expire(`editor-leaderboard:${options.period}`, 3600);

        const sorted = editor_rewards
            .sort((a,b) => b[sortby] - a[sortby])
        if (options.user) return this.addUserToLeaderboard(sorted, options);
        else return sorted.slice(0, options.limit);
    }

    // Helper function to add a specified user to the end of the leaderboard
    addUserToLeaderboard(sorted_leaders, options: LeaderboardOptions) {
        let user;
        const index = sorted_leaders.findIndex(row => row.user == options.user);
        if (index == -1) user = { user: options.user, edits: 0, votes: 0, cumulative_iq_rewards: 0, rank: 1000 };
        else {
            user = JSON.parse(JSON.stringify(sorted_leaders[index])); // clone the object
            user.rank = index + 1;
        }

        const leaders = sorted_leaders.slice(0, options.limit);
        leaders.push(user);
        return leaders;
    }

    async siteUsage(options: any): Promise<any> {
        const lang = options && options.lang ? options.lang : 'en';
        let doc: any = await this.redis.connection().get('site_usage');

        if (doc) {
            doc = JSON.parse(doc);
            doc.timestamp = new Date(doc.timestamp);
        }
        else {
            doc = {
                key: 'site_usage',
                timestamp: new Date('2015-01-01'),
                total_article_count: [{ num_articles: 0 }],
                total_pageviews: 0,
                total_editors: 0,
                total_iq_rewards: 0,
                original_pages: 0,
                total_edits: 0
            };
        }

        const pipeline = this.redis.connection().pipeline();
        pipeline.get("stat:total_edits");
        pipeline.scard("stat:unique_editors");
        pipeline.get("stat:total_iq_rewards");
        const values = await pipeline.exec();
        doc.total_edits = Number(values[0][1]);
        doc.total_editors = Number(values[1][1]);
        doc.total_iq_rewards = (Number(values[2][1]) - 1e10).toFixed(3)

        const mysql_date = doc.timestamp.toISOString().slice(0, 19).replace('T', ' ');
        const new_article_count: Array<any> = await this.mysql.TryQuery(
            `SELECT COUNT(*) AS num_articles 
            FROM enterlink_articletable art
            WHERE 
                art.is_removed = 0
                AND art.redirect_page_id IS NULL
                AND creation_timestamp > ?
                AND art.page_lang = ?
            `,
            [mysql_date, lang],
            180000
        );
        doc.total_article_count[0].num_articles += new_article_count[0].num_articles;

        if (doc.total_pageviews == 0) {
            const total_pageviews: Array<any> = await this.mysql.TryQuery(
                `SELECT SUM(pageviews) AS pageviews 
                FROM enterlink_articletable art
                WHERE 
                    art.is_removed = 0
                    AND art.redirect_page_id IS NULL
                    AND art.page_lang = ?
                `,
                [lang],
                180000
            );
            doc.total_pageviews = total_pageviews;
        }
        else {
            const new_pageviews: Array<any> = await this.mysql.TryQuery(
                `SELECT COUNT(*) as new_pageviews
                FROM ep2_backend_requests
                WHERE timestamp > ?
                `,
                [mysql_date],
                10000
            );
            doc.total_pageviews[0].pageviews += new_pageviews[0].new_pageviews;
        }

        // Once in 1000 requests, re-generate it from scratch to keep the tallying honest
        // and deal with random issues like *cough* scrapers *cough*
        const random2 = Math.random();
        if (random2 < 0.001) {
            const original_pages: Array<any> = await this.mysql.TryQuery(
                `SELECT COUNT(*) AS count 
                FROM enterlink_articletable 
                WHERE 
                    page_note IS NULL
                    AND redirect_page_id IS NULL
                    AND is_removed = 0
                    AND art.page_lang = ?
                    `,
                [mysql_date, lang],
                60000
            );
            doc.original_pages = original_pages[0].count;
        }
        else {
            const new_original_pages: Array<any> = await this.mysql.TryQuery(
                `SELECT COUNT(*) AS count 
                FROM enterlink_articletable 
                WHERE 
                    page_note IS NULL
                    AND creation_timestamp > ?
                    AND redirect_page_id IS NULL
                    AND is_removed = 0
                    AND page_lang = ?
                    `,
                [mysql_date, lang],
                60000
            )
            doc.original_pages += new_original_pages[0].count;
        }

        // Update the timestamp and block number
        doc.timestamp = new Date();
        const block_docs = await this.mongo.connection().actions
            .find()
            .sort({ block_num: -1 })
            .limit(1)
            .toArray();
        
        doc.block_num = block_docs[0].block_num;

        this.redis.connection().set('site_usage', JSON.stringify(doc));

        return doc;
    }

    async getEditStats() {
        let last_block_processed = 59902500;
        let num_edits_by_day = {};
        let editors_by_day = {};
        let num_editors_by_day = {};
        let users_by_day = {};
        let num_users_by_day = {};

        let cache: any = await this.redis.connection().get('stats:edits');
        if (cache) {
            cache = JSON.parse(cache);
            last_block_processed = cache.last_block_processed;
            cache.num_edits.forEach(row => num_edits_by_day[row[0]] = row[1]);
            cache.num_editors.forEach(row => num_editors_by_day[row[0]] = row[1]);
            cache.num_chain_users.forEach(row => num_users_by_day[row[0]] = row[1]);
            cache.unique_editors.forEach(row => editors_by_day[row[0]] = new Set(row[1]));
            cache.unique_users.forEach(row => users_by_day[row[0]] = new Set(row[1]));
        }   

        while (true) {
            const action_docs = await this.mongo.connection().actions
                .find({ 'block_num': { $gte: last_block_processed }})
                .sort({ 'block_num': 1 })
                .limit(50000)
                .toArray();

            for (let doc of action_docs) {
                if (doc.block_num <= last_block_processed) continue;

                const day = new Date(doc.block_time).toISOString().slice(0,10);
                if(!users_by_day[day]) users_by_day[day] = new Set();

                if (doc.trace.act.name == "logpropinfo") {
                    if (num_edits_by_day[day]) num_edits_by_day[day] += 1;
                    else num_edits_by_day[day] = 1;

                    if(!editors_by_day[day]) editors_by_day[day] = new Set();
                    editors_by_day[day].add(doc.trace.act.data.proposer);
                    num_editors_by_day[day] = editors_by_day[day].size;

                    users_by_day[day].add(doc.trace.act.data.proposer);
                }
                else if (doc.trace.act.name == "transfer") {
                    users_by_day[day].add(doc.trace.act.data.from);
                    users_by_day[day].add(doc.trace.act.data.to);
                }
                else if (doc.trace.act.name == "vote") {
                    users_by_day[day].add(doc.trace.act.data.voter);
                }
                num_users_by_day[day] = users_by_day[day].size;

            }

            last_block_processed = action_docs[action_docs.length - 1].block_num;

            if (action_docs.length < 50000) break;
        }

        const num_edits = Object.keys(num_edits_by_day)
            .sort((b,a) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => [date, num_edits_by_day[date]]);

        const num_editors = Object.keys(num_editors_by_day)
            .sort((b,a) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => [ date, num_editors_by_day[date]]);

        const num_chain_users = Object.keys(num_users_by_day)
            .sort((b,a) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => [date, num_users_by_day[date]]);

        const unique_editors = Object.keys(editors_by_day)
            .sort((b,a) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => [date, Array.from(editors_by_day[date])]);

        const unique_users = Object.keys(users_by_day)
            .sort((b,a) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => [date, Array.from(users_by_day[date])]);


        const result = { num_edits, num_editors, num_chain_users, unique_editors, unique_users, last_block_processed };
        this.redis.connection().set('stats:edits', JSON.stringify(result));

        return result;


    }
}
