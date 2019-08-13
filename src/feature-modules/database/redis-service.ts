import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private subscriber: Redis.Redis;
    private redis: Redis.Redis;
    private subscribed: Promise<boolean>;

    constructor() { 
        this.redis = new Redis();
        this.subscriber = new Redis();
        this.subscribed = this.subscriber.subscribe("eos_actions");
        this.subscriber.on("message", (channel, message) => {
            this.process_actions.call(this, JSON.parse(message));
        }); 
    }

    connection() {
        return this.redis;
    }
    
    async is_subscribed() {
        return this.subscribed;
    }

    async process_actions (actions) {
        let last_processed: any = await this.redis.get('eos_actions:last_processed');
        if (last_processed) last_processed = JSON.parse(last_processed);
        else {
            last_processed = {
                eparticlectr: {
                    global_sequence: 0,
                    block_num: 0,
                },
                everipediaiq: {
                    global_sequence: 0,
                    block_num: 0,
                }
            };
        }

        const pipeline = this.redis.pipeline();
        for (let action of actions) {
            if (Number(action.trace.receipt.global_sequence) <= last_processed[action.trace.act.account].global_sequence) {
                continue;
            }

            // mark last processed by contract
            last_processed[action.trace.act.account].block_num = action.block_num;
            last_processed[action.trace.act.account].global_sequence = Number(action.trace.receipt.global_sequence);

            // process action
            if (action.trace.act.name == "vote" || action.trace.act.name == "votebyhash") {
                const proposal_id = action.trace.act.data.proposal_id;
                pipeline.sadd(`proposal:${proposal_id}:votes`, JSON.stringify(action));
                const user = action.trace.act.data.voter;
                pipeline.incr(`user:${user}:num_votes`);
            }
            else if (action.trace.act.name == "logpropinfo") {
                const proposal_id = action.trace.act.data.proposal_id;
                const ipfs_hash = action.trace.act.data.ipfs_hash;
                const lang_code = action.trace.act.data.lang_code;
                const slug = action.trace.act.data.slug;
                pipeline.set(`proposal:${proposal_id}:info`, JSON.stringify(action));
                pipeline.set(`wiki:lang_${lang_code}:${slug}:last_proposed_hash`, ipfs_hash);
            }
            else if (action.trace.act.name == "logpropres") {
                const proposal_id = action.trace.act.data.proposal_id;
                pipeline.set(`proposal:${proposal_id}:result`, JSON.stringify(action));
                if (action.trace.act.data.approved === 1) {
                    const info = await this.redis.connection().get(`proposal:${proposal_id}:info`);
                    const ipfs_hash = info.trace.act.data.ipfs_hash;
                    pipeline.set(`wiki:lang_${lang_code}:${slug}:last_approved_hash`, ipfs_hash);
                }
            }
            else if (action.trace.act.name == "propose" || action.trace.act.name == "propose2") {
                const user = action.trace.act.data.proposer;
                pipeline.incr(`user:${user}:num_edits`);
            }
            else if (action.trace.act.name == "issue") {
                const user = action.trace.act.data.to;
                const amount = action.trace.act.data.quantity.split(' ')[0];
                // All-time leaderboard
                pipeline.zincrby("editor-leaderboard:all-time:rewards", amount, user);
            }
            else if (action.trace.act.name == "transfer") {
                if (action.trace.act.data.to == "eparticlectr") {
                    const user = action.trace.act.data.from;
                    const amount = action.trace.act.data.quantity.split(' ')[0];
                    pipeline.rpush(`user:${user}:stakes`, JSON.stringify(action));
                    pipeline.incrbyfloat(`user:${user}:sum_stakes`, amount);
                }
                else if (action.trace.act.data.from == "eparticlectr") {
                    const user = action.trace.act.data.to;
                    const amount = action.trace.act.data.quantity.split(' ')[0];
                    pipeline.rpush(`user:${user}:refunds`, JSON.stringify(action));
                    pipeline.incrbyfloat(`user:${user}:sum_refunds`, amount);
                }
            }
        }
        await pipeline.exec();
        return this.redis.set('eos_actions:last_processed', JSON.stringify(last_processed));
    }
}
