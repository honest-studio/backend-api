import { Injectable, forwardRef, Inject, NotFoundException } from '@nestjs/common';
import { Boost, BoostsByWikiReturnPack, BoostsByUserReturnPack, Wikistbl2Item, ProfileSearchPack, PublicProfileType } from '../types/api';
import { WikiIdentity } from '../types/article-helpers';
import { MongoDbService, RedisService } from '../feature-modules/database';
import { PreviewService } from '../preview';
import { WikiService } from '../wiki/';
import { ChainService } from '../chain';
const util = require('util');
const _ = require('lodash');

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
        pipeline.smembers(`user:${account_name}:stakes`);
        pipeline.smembers(`user:${account_name}:refunds`);
        pipeline.get(`user:${account_name}:sum_stakes`);
        pipeline.get(`user:${account_name}:sum_refunds`);
        const values = await pipeline.exec();

        let sum_stakes = 0;
        if (values[2] && values[2][1]) sum_stakes += Number(values[2][1]);
        if (values[3] && values[3][1]) sum_stakes -= Number(values[3][1]);

        return {
            stakes: values[0] ? values[0][1].map(v => JSON.parse(v)).slice(options.offset, options.offset + options.limit) : [],
            refunds: values[1] ? values[1][1].map(v => JSON.parse(v)).slice(options.offset, options.offset + options.limit) : [],
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

        // Change later
        theBoosts = theBoosts = [
            {
                id: 1,
                slug: 'travismoore5036459',
                lang_code: 'en',
                booster: 'eosiochicken',
                amount: 77777,
                timestamp: 1573854499
            },
            {
                id: 8,
                slug: 'everipedia',
                lang_code: 'en',
                booster: 'eosiochicken',
                amount: 500,
                timestamp: 1573812499
            },
            {
                id: 9,
                slug: 'samkazemian12',
                lang_code: 'en',
                booster: 'eosiochicken',
                amount: 5750,
                timestamp: 1573802499
            },
            {
                id: 15,
                slug: 'list-of-prominent-everipedia-editors',
                lang_code: 'en',
                booster: 'eosiochicken',
                amount: 15750,
                timestamp: 1573202499
            }
        ]

        

        // Order the boosts by highest amount first
        theBoosts = _.orderBy(theBoosts, ['amount'],['desc']); 

        // Get the WikiIdentities
        let the_wiki_identities: WikiIdentity[] = theBoosts.map(boost => {
            return { slug: boost.slug, lang_code: boost.lang_code }
        })

        // Get the previews
        let thePreviews = await this.previewService.getPreviewsBySlug(the_wiki_identities, "safari");

        // Fill in the packs
        let theWikiPacks: BoostsByWikiReturnPack[] = theBoosts.map(boost => {
            let return_pack = {
                boost: boost,
                preview: null,
            };
            for (let p = 0; p < thePreviews.length; p++){
                let the_prev = thePreviews[p];
                if (the_prev.slug == boost.slug && the_prev.lang_code == boost.lang_code){
                    return {
                        ...return_pack,
                        preview: the_prev
                    }
                }
            } 
            return return_pack;
        })
        

        // console.log(util.inspect(theWikiPacks, {showHidden: false, depth: null, chalk: true}));

        // Prepare the BoostsByUserReturnPack
        let returnPack: BoostsByUserReturnPack = {
            user: account_name,
            wiki_packs: theWikiPacks
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

    // calculate current and best editing streaks for users
    async getProfiles (users) {
        const pipeline = this.redis.connection().pipeline();
        for (let user of users) {
            pipeline.smembers(`user:${user}:proposals`);
            pipeline.get(`user:${user}:num_edits`);
            pipeline.get(`user:${user}:profile`);
            pipeline.get(`user:${user}:num_votes`);
            pipeline.zscore(`editor-leaderboard:all-time:rewards`, user);
        }
        pipeline.get('eos_actions:last_block_processed');
        pipeline.get('editor-leaderboard:today');
        pipeline.get('editor-leaderboard:this-week');
        pipeline.get('editor-leaderboard:this-month');
        const values = await pipeline.exec();

        const latest_block = values[values.length - 4][1];
        const info = {}
        for (let i=0; i < users.length; i++) {
            const user = users[i];
            let current = 0;
            let best = 0;
            let profile = null;
            let activity = { 
                today: { edits: 0, votes: 0, cumulative_iq_rewards: 0}, 
                this_week: { edits: 0, votes: 0, cumulative_iq_rewards: 0}, 
                this_month: { edits: 0, votes: 0, cumulative_iq_rewards: 0}, 
                all_time: { edits: 0, votes: 0, cumulative_iq_rewards: 0}
            }
            if (values[i*5 + 1][1]) activity.all_time.edits = Number(values[i*5 + 1][1]);
            if (values[i*5 + 2][1]) profile = JSON.parse(values[i*5 + 2][1]);
            if (values[i*5 + 3][1]) activity.all_time.votes = Number(values[i*5 + 3][1]);
            if (values[i*5 + 4][1]) activity.all_time.cumulative_iq_rewards = Number(values[i*5 + 4][1]);

            // Pull IQ rewards for time frames from editor leaderboards
            if (values[values.length - 3][1])
                activity.today = JSON.parse(values[values.length - 3][1]).editor_rewards.find(row => row.user == user);
            if (values[values.length - 2][1])
                activity.this_week = JSON.parse(values[values.length - 2][1]).editor_rewards.find(row => row.user == user);
            if (values[values.length - 1][1])
                activity.this_month = JSON.parse(values[values.length - 1][1]).editor_rewards.find(row => row.user == user);

            if (values[i*5][1] && values[i*5][1].length > 0) {
                let proposals = values[i*5][1];

                // sort proposals from earliest to newest
                proposals = proposals
                    .map(p => JSON.parse(p))
                    .sort((a,b) => a.block_num - b.block_num);

                // streaks are calculated based on UTC calendar days
                // if you go 24 hours without editing, your streak ends
                let streak_start = Math.floor(new Date(proposals[0].block_time).getTime() / 86400000);
                let last_date = Math.floor(new Date(proposals[proposals.length - 1].block_time).getTime() / 86400000);
                for (let proposal of proposals) {
                    let prop_date = Math.floor(new Date(proposal.block_time).getTime() / 86400000);
                    if (prop_date - last_date <= 1) {
                        current = prop_date - streak_start + 1;
                    }
                    else {
                        best = Math.max(best, current);
                        current = 1;
                        streak_start = prop_date;
                    }
                    last_date = prop_date;
                }
                // if the most recent proposal isnt within the last day, current streak is 0
                if (proposals.length > 0 && proposals[proposals.length - 1].block_num + 250000 <= latest_block) current = 0;
                best = Math.max(best, current);
            }
            info[user] = { current, best, activity, profile }
        }

        return info;
    }

    async getProfile(account_name: string) {
        const profile = await this.redis.connection().get(`user:${account_name}:profile`);
        if (!profile) throw new NotFoundException({ error: "User has no profile" });
        return JSON.parse(profile);
    }

    async searchProfiles(pack: ProfileSearchPack): Promise<PublicProfileType[]> {
        let find_query = {
            'trace.act.account': 'epsovreignid',
            'trace.act.name': 'userinsert',
            $or: [ 
                { 'trace.act.data.user': { $regex: pack.searchterm, $options: 'i' } }, 
                { 'trace.act.data.display_name': { $regex: pack.searchterm, $options: 'i' } }, 
                { 'trace.act.data.about_me': { $regex: pack.searchterm, $options: 'i' } },
            ]
        };

        let profile_docs = await this.mongo
            .connection()
            .actions.find(find_query)
            .sort({ block_num: -1 })
            .toArray();

        let seen_usernames: string[] = [];
        profile_docs = profile_docs && profile_docs.map((doc, doc_idx) => {
            let raw_profile: PublicProfileType = doc.trace.act.data;
            if(raw_profile && seen_usernames.indexOf(raw_profile.user) == -1){
                seen_usernames.push(raw_profile.user);
                return raw_profile;
            }
            else return null;
        }).filter(p => p);

        return profile_docs;

    }
}
