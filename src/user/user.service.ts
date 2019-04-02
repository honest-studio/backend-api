import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoDbService } from '../feature-modules/database';

export interface UserServiceOptions {
    limit: number;
    offset: number;
}

@Injectable()
export class UserService {
    constructor(private mongo: MongoDbService) {}

    async getStakes(account_name: string, options: UserServiceOptions) {
        const stakes = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'everipediaiq',
                'trace.act.name': 'transfer',
                'trace.act.data.to': 'eparticlectr',
                'trace.act.data.from': account_name
            })
            .sort({ block_num: -1 })
            .toArray();

        const refunds = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'everipediaiq',
                'trace.act.name': 'transfer',
                'trace.act.data.from': 'eparticlectr',
                'trace.act.data.to': account_name
            })
            .sort({ block_num: -1 })
            .toArray();

        const sum_stakes = stakes
            .map((s) => s.trace.act.data.quantity.split(' ')[0])
            .map(Number)
            .reduce((sum, addend) => (sum += addend), 0);

        const sum_refunds = refunds
            .map((s) => s.trace.act.data.quantity.split(' ')[0])
            .map(Number)
            .reduce((sum, addend) => (sum += addend), 0);

        return {
            stakes: stakes.slice(options.offset, options.offset + options.limit),
            refunds: refunds.slice(options.offset, options.offset + options.limit),
            sum_stakes,
            sum_refunds
        };
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

    async getActivity (account_name: string) {
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

        return { votes, proposals }
    }
}
