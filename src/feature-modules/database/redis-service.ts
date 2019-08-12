import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private redis: Redis;

    constructor() { 
        this.redis = new Redis();
        this.redis.subscribe("eos_actions");
        this.redis.on("message", function(channel, message) {
            if (channel == "eos_actions")
                this.process_actions(JSON.parse(message));
        });

    }

    connection() {
        return this.redis;
    }

    async process_actions (actions) {

        while (true) {
            const last_processed = await this.redis.get('mongo:last_processed');
            let last_global_sequence = 0;
            if (last_processed) {
                last_global_sequence = JSON.parse(last_processed).global_sequence;
            }

            const pipeline = this.redis.pipeline();
            for (let action of actions) {
                if (action.trace.receipt.global_sequence <= last_global_sequence) {
                    console.log(`Skipping action ${action.trace.receipt.global_sequence}: Already processed`);
                    continue;
                }
                if (action.trace.act.name == "vote" || action.trace.act.name == "votebyhash") {
                    const proposal_id = action.trace.act.data.proposal_id;
                    pipeline.sadd(`proposal:${proposal_id}:votes`, JSON.stringify(action));
                    const user = action.trace.act.data.voter;
                    pipeline.incr(`user:${user}:num_votes`);
                }
                else if (action.trace.act.name == "logpropinfo") {
                    const proposal_id = action.trace.act.data.proposal_id;
                    pipeline.set(`proposal:${proposal_id}:info`, JSON.stringify(action));
                }
                else if (action.trace.act.name == "logpropres") {
                    const proposal_id = action.trace.act.data.proposal_id;
                    pipeline.set(`proposal:${proposal_id}:result`, JSON.stringify(action));
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
            if (actions.length == 0) break;
            else {
                pipeline.exec();
                const last_processed = {
                    global_sequence: Number(actions[actions.length - 1].trace.receipt.global_sequence),
                    block_num: actions[actions.length - 1].block_num
                };
                await this.redis.set('mongo:last_processed', JSON.stringify(last_processed));
            }
        } 
        console.log(`REDIS: Done building cache`);

    }
}
