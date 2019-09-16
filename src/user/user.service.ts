import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { Boost, BoostsByWikiReturnPack, BoostsByUserReturnPack, Wikistbl2Item } from '../types/api';
import { MongoDbService, RedisService } from '../feature-modules/database';
import { PreviewService } from '../preview';
import { WikiService } from '../wiki/';
import { ChainService } from '../chain';

export interface UserServiceOptions {
    limit: number;
    offset: number;
}

@Injectable()
export class UserService {
    constructor(
        private mongo: MongoDbService, 
        private redis: RedisService,
        @Inject(forwardRef(() => PreviewService)) private previewService: PreviewService,
        @Inject(forwardRef(() => WikiService)) private wikiService: WikiService,
        private chain: ChainService
    ) {}

    async getStakes(account_name: string, options: UserServiceOptions) {
        const pipeline = this.redis.connection().pipeline();
        pipeline.lrange(`user:${account_name}:stakes`, options.offset, options.limit);
        pipeline.lrange(`user:${account_name}:refunds`, options.offset, options.limit);
        pipeline.get(`user:${account_name}:sum_stakes`);
        pipeline.get(`user:${account_name}:sum_refunds`);
        const values = await pipeline.exec();

        let sum_stakes = 0;
        if (values[2][1]) sum_stakes += Number(values[2][1]);
        if (values[3][1]) sum_stakes -= Number(values[3][1]);

        return {
            stakes: values[0][1].map(v => JSON.parse(v)),
            refunds: values[1][1].map(v => JSON.parse(v)),
            sum_stakes
        };
    }

    async getBoostsByUser(account_name: string): Promise<BoostsByUserReturnPack> {
        // TODO: Needs to be implemented using ChainService
        let theBoostsBody = {
            "code": "eparticlectr",
            "table": "booststbl",
            "scope": "eparticlectr",
            "index_position": "secondary",
            "key_type": "name",
            "upper_bound": account_name,
            "lower_bound": account_name,
            "json": true
        };

        // Get all of the boosts for the user
        let boostResults = await this.chain.getTableRows(theBoostsBody);
        let theBoosts: Boost[] = boostResults.rows;

        // Get the previews
        let theWikis: BoostsByWikiReturnPack[] = await Promise.all(theBoosts.map(async (boost) => {
            let thePreview = await this.previewService.getPreviewsBySlug([{
                lang_code: boost.lang_code,
                slug: boost.slug
            }], "safari")[0];
            return {
                boosts: [boost],
                preview: thePreview,
            }
        }))

        // Prepare the BoostsByUserReturnPack
        let returnPack: BoostsByUserReturnPack = {
            user: account_name,
            wikis: theWikis
        }
        return returnPack;
    }

    async getRewards(account_name: string, options: UserServiceOptions) {
        const rewards = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'everipediaiq',
                'trace.act.name': 'issue',
                'trace.act.data.to': account_name
            })
            .sort({ block_num: -1 })
            .toArray();

        const slashes = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'slashnotify',
                'trace.act.data.slashee': account_name
            })
            .sort({ block_num: -1 })
            .toArray();

        const sum_rewards = rewards
            .map((s) => s.trace.act.data.quantity.split(' ')[0])
            .map(Number)
            .reduce((sum, addend) => (sum += addend), 0);

        // sum up the iq-seconds of slash time. 1 IQ slashed for 1 second is 1 iq-second
        const sum_slashes = slashes
            .map((s) => [s.trace.act.data.amount, s.trace.act.data.seconds])
            .reduce((sum, row) => (sum += row[0] * row[1]), 0);

        return {
            sum_rewards,
            sum_slashes: {
                number: slashes.length,
                iq_seconds: sum_slashes
            },
            rewards: rewards.slice(options.offset, options.offset + options.limit),
            slashes: slashes.slice(options.offset, options.offset + options.limit)
        };
    }

    async getActivity(account_name: string) {
        const votes = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'vote',
                'trace.act.data.voter': account_name
            })
            .toArray();

        const proposals = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.proposer': account_name
            })
            .toArray();

        return { votes, proposals };
    }
}
