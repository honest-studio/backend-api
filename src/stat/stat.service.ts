import { Injectable } from '@nestjs/common';
import { MongoDbService, MysqlService } from '../feature-modules/database';

export interface LeaderboardOptions {
    period: 'today' | 'this-week' | 'this-month' | 'all-time';
    since: number; // UNIX timestamp. overrides period
    cache: boolean; 
}

@Injectable()
export class StatService {
    constructor(private mongo: MongoDbService, private mysql: MysqlService) {}
    
    private readonly SITE_USAGE_CACHE_EXPIRE_MS = 30 * 60 * 1000; // 30 minutes
    private readonly GENESIS_BLOCK_TIMESTAMP = 1528470488;

    async editorLeaderboard(options: LeaderboardOptions): Promise<any> {
        let starttime;
        if (options.since) {
            starttime = options.since * 1000;
        }
        else if (options.period == 'today') {
            starttime = Date.now() - 24*3600*1000;
        }
        else if (options.period == 'this-week') {
            starttime = Date.now() - 7*24*3600*1000;
        }
        else if (options.period == 'this-month') {
            starttime = Date.now() - 30*24*3600*1000;
        }
        else if (options.period == 'all-time') {
            starttime = 0;
        }
        const editor_rewards = await this.mongo
            .connection()
            .actions.mapReduce(
                `function () { emit( this.trace.act.data.to, new Date(this.block_time) > ${starttime} ? Number(this.trace.act.data.quantity.split(' ')[0]) : 0) }`,
                'function (key, values) { return Array.sum(values) }',
                {
                    query: {
                        'trace.act.account': 'everipediaiq',
                        'trace.act.name': 'issue'
                    },
                    out: { inline: 1 }
                }
            );

        return editor_rewards
            .sort((a,b) => b.value - a.value)
            .map(doc => ({ user: doc._id, cumulative_iq_rewards: Number(doc.value.toFixed(3)) }))
            .slice(0,10);
    }

    async siteUsage(use_cache: boolean = true): Promise<any> {
        // pull from cache if available
        if (use_cache) {
            const cache = await this.mongo.connection().statistics.findOne({ key: "site_usage" });
            if (cache) {
                delete cache._id;
                const cache_age = Date.now() - cache.timestamp.getTime();
                if (cache_age < this.SITE_USAGE_CACHE_EXPIRE_MS)
                    return cache;
            }
        }
            

        const total_article_count: Array<any> = await new Promise((resolve, reject) => {
            this.mysql
                .pool()
                .query(`SELECT COUNT(*) AS num_articles FROM enterlink_articletable`, function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows[0].num_articles);
                });
        });

        const total_pageviews: Array<any> = await new Promise((resolve, reject) => {
            this.mysql
                .pool()
                .query(`SELECT SUM(pageviews) AS pageviews FROM enterlink_articletable`, function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows[0].pageviews);
                });
        });

        let total_editors: any = await this.mongo
            .connection()
            .actions.aggregate([
               {$group : {_id : "$trace.act.data.proposer"} }, 
               {$group: {_id:1, count: {$sum : 1 }}}
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
                        'trace.act.account': 'everipediaiq',
                        'trace.act.name': 'issue'
                    },
                    out: { inline: 1 }
                }
            );
        total_iq_rewards = Number(total_iq_rewards[0].value.toFixed(3));

        // clear old cache and cache new result
        const doc = { 
            key: "site_usage", 
            timestamp: new Date(),
            total_article_count, 
            total_pageviews, 
            total_editors, 
            total_iq_rewards 
        };
        this.mongo.connection().statistics.deleteMany({ key: "site_usage" });
        this.mongo.connection().statistics.insertOne(doc);

        return doc;
    }
}
