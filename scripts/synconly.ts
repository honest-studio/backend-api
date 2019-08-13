// In production , there are multiple instances running of the repo
// To prevent the multiple nodes from duplicating sync work and causing DB lockups
// this script should be used in a separate process

import fetch from 'node-fetch';
import WebSocket from 'ws';
import { Collection, Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import Redis from 'ioredis';

let lastMessageReceived = Date.now();
let dfuseJwtToken;
let dfuse;
const redis = new Redis();

dotenv.config();

const config = {
    get: (param) => process.env[param]
};

const mongo_actions_promise: Promise<Collection> = new Promise((resolve, reject) => {
    MongoClient.connect(config.get("MONGODB_URL"), { poolSize: 10, useNewUrlParser: true }, (err, client) => {
        if (err) {
            console.error(err);
            reject(err);
            return;
        }
        const db = client.db(config.get("MONGODB_DATABASE_NAME"));
        const actions = db.collection('actions');
        resolve(actions);
    });
});

const DFUSE_AUTH_URL = 'https://auth.dfuse.io/v1/auth/issue';

async function get_start_block(account) {
    const mongo_actions = await mongo_actions_promise;
    return mongo_actions.find({ 'trace.act.account': account })
        .sort({ block_num: -1 })
        .limit(1)
        .toArray()
        .then((result) => {
        const config_start_block = Number(config.get("DFUSE_START_BLOCK"));
        if (result.length == 0)
            return config_start_block;
        const db_block = result[0].block_num;
        return Math.max(config_start_block, db_block);
    });
}

async function start() {
    const dfuseToken = await obtainDfuseToken();
    try {
        const url = `${config.get("DFUSE_API_WEBSOCKET_ENDPOINT")}?token=${dfuseToken.token}`;
        dfuse = new WebSocket(url, {
            headers: {
                Origin: config.get("DFUSE_API_ORIGIN_URL")
            }
        });
    }
    catch (err) {
        console.log('failed to connect to websocket in eos-sync-service ', err);
    }
    dfuse.on('open', async () => {
        const article_req = {
            type: 'get_actions',
            req_id: 'article_req',
            listen: true,
            data: {
                account: 'eparticlectr'
            },
            start_block: await get_start_block('eparticlectr')
        };
        const token_req = {
            type: 'get_actions',
            req_id: 'token_req',
            listen: true,
            data: {
                account: 'everipediaiq'
            },
            start_block: await get_start_block('everipediaiq')
        };
        dfuse.send(JSON.stringify(article_req));
        dfuse.send(JSON.stringify(token_req));
    });
    dfuse.on('error', (err) => {
        console.log('-- error connecting to dfuse: ', err);
    });
    dfuse.on('message', async (msg_str) => {
        lastMessageReceived = Date.now();
        const msg = JSON.parse(msg_str);
        if (msg.type != 'action_trace') {
            console.log(msg);
            return;
        }
        const mongo_actions = await mongo_actions_promise;
        mongo_actions.insertOne(msg.data)
            .then(() => {
                const block_num = msg.data.block_num;
                const account = msg.data.trace.act.account;
                const name = msg.data.trace.act.name;
                redis.publish("eos_actions", JSON.stringify([msg.data]));
                console.log(`MONGO: Saved ${account}:${name} @ block ${block_num}`);
            })
            .catch((err) => {
                if (err.code == 11000) {
                    console.log(`MONGO: Ignoring duplicate action. This is expected behavior during server restarts or cluster deployments`);
                }
                else {
                    console.log('MONGO: Error inserting action ', msg, ' \n Error message on insert: ', err);
                    throw err;
                }
            });
    });
    dfuse.on('error', (e) => {
        console.log('DFUSE: ERROR: ', e);
    });
}

async function obtainDfuseToken() {
    return fetch(DFUSE_AUTH_URL, {
        method: 'POST',
        body: JSON.stringify({ api_key: config.get("DFUSE_API_KEY") })
    }).then((response) => response.json());
}

function restartIfFailing() {
    const now = Date.now();
    const THIRTY_SECONDS = 30 * 1000;
    if (now > lastMessageReceived + THIRTY_SECONDS) {
        lastMessageReceived = now;
        console.log('No messages received in 30s. Restarting dfuse');
        if (dfuse)
            dfuse.close();
        start();
    }
}

async function replayRedis () {
    await redis.flushdb();
    console.log(`REDIS: Flushed DB. Replaying actions`);

    const BATCH_SIZE = 50000;
    const mongo_actions = await mongo_actions_promise;
    let article_block_num = 0;
    let token_block_num = 0;
    let last_processed: any = await redis.get('eos_actions:last_processed');
    if (last_processed) {
        last_processed = JSON.parse(last_processed);
        token_block_num = last_processed.everipediaiq.block_num;
        article_block_num = last_processed.eparticlectr.block_num;
    }

    // catchup article actions
    while (true) {
        let query = { block_num: { $gte: article_block_num }, 'trace.act.account': 'eparticlectr' };
        let actions = await mongo_actions.find(query).limit(BATCH_SIZE).toArray();
        console.log(`EOS-SYNC-SERVICE: Syncing ${actions.length} eparticlectr actions since block ${article_block_num} to Redis`);

        await redis_process_actions(actions);
        if (actions.length < BATCH_SIZE) break;
        article_block_num = actions[actions.length - 1].block_num;
    }

    // catch up token actions
    while (true) {
        let query = { block_num: { $gte: token_block_num }, 'trace.act.account': 'everipediaiq' };
        let actions = await mongo_actions.find(query).limit(BATCH_SIZE).toArray();
        console.log(`EOS-SYNC-SERVICE: Syncing ${actions.length} everipediaiq actions since block ${token_block_num} to Redis`);

        await redis_process_actions(actions);
        if (actions.length < BATCH_SIZE) break;
        token_block_num = actions[actions.length - 1].block_num;
    }

    return true;
}

async function redis_process_actions (actions) {
    let last_processed: any = await redis.get('eos_actions:last_processed');
    if (last_processed) last_processed = JSON.parse(last_processed);
    else {
        last_processed = {
            eparticlectr: {
                block_num: 0,
            },
            everipediaiq: {
                block_num: 0,
            }
        };
    }

    let pipeline = redis.pipeline();
    let results = [];
    for (let action of actions) {
        // Make sure this action hasn't already been processed
        // Re-processing happens a lot during restarts and replays
        const processed = await redis.get(`eos_actions:global_sequence:${action.trace.receipt.global_sequence}`);
        if (processed) continue;
        else await redis.set(`eos_actions:global_sequence:${action.trace.receipt.global_sequence}`, 1);

        // mark last processed by contract
        last_processed[action.trace.act.account].block_num = action.block_num;

        // process action
        const pipeline = redis.pipeline();
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
            // v1 results are done based on proposal hash
            // v2 results are done based on proposal ID
            const proposal_id = action.trace.act.data.proposal_id;
            const proposal = action.trace.act.data.proposal;
            const key = proposal_id ? proposal_id : proposal;
            pipeline.set(`proposal:${key}:result`, JSON.stringify(action));

            if (proposal_id) {
                const info = JSON.parse(await redis.get(`proposal:${proposal_id}:info`));
                try {
                    const ipfs_hash = info.trace.act.data.ipfs_hash;
                    const lang_code = info.trace.act.data.lang_code;
                    const slug = info.trace.act.data.slug;
                    pipeline.set(`wiki:lang_${lang_code}:${slug}:last_approved_hash`, ipfs_hash);
                } catch {
                    // some proposals dont have info strangely enough
                    console.log(`REDIS: No info found for proposal ${proposal_id}`);
                }
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
        await pipeline.exec();
    }


    return redis.set('eos_actions:last_processed', JSON.stringify(last_processed));
}


async function main () {
    await replayRedis();
    start();
    setInterval(() => restartIfFailing.apply(this), 15 * 1000);
}

main();
