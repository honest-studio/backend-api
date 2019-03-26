import { Injectable } from '@nestjs/common';
import { MongoDbService, MysqlService } from '../feature-modules/database';

@Injectable()
export class StatService {
    constructor(private mongo: MongoDbService, private mysql: MysqlService) {}

    async editorLeaderboard(): Promise<any> {
        const editor_rewards = await this.mongo
            .connection()
            .actions.mapReduce(
                'function () { emit( this.trace.act.data.to, Number(this.trace.act.data.quantity.split(" ")[0]) ) }',
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

    async siteUsage(): Promise<any> {
        // pull from cache if available
        const cache = await this.mongo.connection().stats.findOne({ key: "site_usage" });
        if (cache) return cache;

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
        const doc = { key: "site_usage", total_article_count, total_pageviews, total_editors, total_iq_rewards };
        this.mongo.connection().stats.deleteMany({ key: "site_usage" });
        this.mongo.connection().stats.insertOne(doc);

        return doc;
    }
}
