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
const DFUSE_ACTION_LOGGING = (config.get("DFUSE_ACTION_LOGGING") && config.get("DFUSE_ACTION_LOGGING") === "true");

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
        console.error('failed to connect to websocket in scripts/synconly.ts ', err);
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
            if (DFUSE_ACTION_LOGGING) console.log(msg);
            return;
        }
        const mongo_actions = await mongo_actions_promise;
        mongo_actions.insertOne(msg.data)
            .then(() => {
                const block_num = msg.data.block_num;
                const account = msg.data.trace.act.account;
                const name = msg.data.trace.act.name;
                if (DFUSE_ACTION_LOGGING) console.log(`MONGO: Saved ${account}:${name} @ block ${block_num}`);
            })
            .catch((err) => {
                if (err.code == 11000) {
                    if (DFUSE_ACTION_LOGGING) console.log(`MONGO: Ignoring duplicate action. This is expected behavior during server restarts or cluster deployments`);
                }
                else {
                    if (DFUSE_ACTION_LOGGING) console.log('MONGO: Error inserting action ', msg, ' \n Error message on insert: ', err);
                    throw err;
                }
            });
        redis_process_actions([msg.data])

        // publish proposal results
        if (msg.data.trace.act.name == "logpropres") redis.publish("action:logpropres", JSON.stringify(msg.data));
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

async function catchupRedis () {
    const BATCH_SIZE = 50000;
    const mongo_actions = await mongo_actions_promise;

    let last_block_processed: any = await redis.get(`eos_actions:last_block_processed`);
    if (!last_block_processed) last_block_processed = 0;
    else last_block_processed = Number(last_block_processed);

    // catchup actions
    while (true) {
        let query = { block_num: { $gte: last_block_processed }};
        let actions = await mongo_actions.find(query).limit(BATCH_SIZE).toArray();
        if (DFUSE_ACTION_LOGGING) console.log(`REDIS: Syncing ${actions.length} actions since block ${last_block_processed} to Redis`);

        await redis_process_actions(actions);
        if (actions.length > 0)
            last_block_processed = actions[actions.length - 1].block_num; 
        await redis.set(`eos_actions:last_block_processed`, last_block_processed);

        if (actions.length < BATCH_SIZE) break;
    }

    return true;
}

async function redis_process_actions (actions) {
    let results = [];
    for (let action of actions) {
        // Make sure this action hasn't already been processed
        // Re-processing happens a lot during restarts and replays
        const processed = await redis.get(`eos_actions:global_sequence:${action.trace.receipt.global_sequence}`);
        if (processed) continue;

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
            const endtime = action.trace.act.data.endtime;
            const ttl = endtime - (Date.now() / 1000 | 0);
            pipeline.set(`proposal:${proposal_id}:info`, JSON.stringify(action));
            pipeline.zadd(`wiki:lang_${lang_code}:${slug}:proposals`, proposal_id, proposal_id);
            if (ttl > 0) {
                pipeline.set(`wiki:lang_${lang_code}:${slug}:last_proposed_hash`, ipfs_hash);
                pipeline.expire(`wiki:lang_${lang_code}:${slug}:last_proposed_hash`, ttl);
            }
        }
        else if (action.trace.act.name == "logpropres") {
            // v1 results are done based on proposal hash
            // v2 results are done based on proposal ID
            const approved = action.trace.act.data.approved;
            const proposal_id = action.trace.act.data.proposal_id;
            const proposal = action.trace.act.data.proposal;
            const key = proposal_id ? proposal_id : proposal;
            pipeline.set(`proposal:${key}:result`, JSON.stringify(action));

            if (proposal_id && approved === 1) {
                const info = JSON.parse(await redis.get(`proposal:${proposal_id}:info`));
                try {
                    const ipfs_hash = info.trace.act.data.ipfs_hash;
                    const lang_code = info.trace.act.data.lang_code;
                    const slug = info.trace.act.data.slug;
                    const endtime = info.trace.act.data.endtime;
                    pipeline.set(`wiki:lang_${lang_code}:${slug}:last_approved_hash`, ipfs_hash);
                    pipeline.set(`wiki:lang_${lang_code}:${slug}:last_updated`, endtime);

                    const removal = info.trace.act.data.comment.includes("PAGE_REMOVAL");
                    if (removal)
                        pipeline.set(`wiki:lang_${lang_code}:${slug}:last_approved_hash`, "removed");
                } catch {
                    // some proposals dont have info strangely enough
                    // mark as unprocessed and continue
                    if (DFUSE_ACTION_LOGGING) console.log(`REDIS: No info found for proposal ${proposal_id}. Not processing action`);
                    await redis.del(`eos_actions:global_sequence:${action.trace.receipt.global_sequence}`);
                    continue;
                }
            }
        }
        else if (action.trace.act.name == "propose" || action.trace.act.name == "propose2") {
            const user = action.trace.act.data.proposer;
            pipeline.incr(`user:${user}:num_edits`);
            pipeline.incr(`stat:total_edits`);
            pipeline.sadd(`stat:unique_editors`, user);
        }
        else if (action.trace.act.name == "issue") {
            const user = action.trace.act.data.to;
            const amount = action.trace.act.data.quantity.split(' ')[0];
            // All-time leaderboard
            pipeline.zincrby("editor-leaderboard:all-time:rewards", amount, user);
            pipeline.incrbyfloat("stat:total_iq_rewards", amount);
        }
        else if (action.trace.act.name == "transfer") {
            if (action.trace.act.data.to == "eparticlectr" && action.trace.receipt.receiver == "everipediaiq") {
                const user = action.trace.act.data.from;
                const amount = action.trace.act.data.quantity.split(' ')[0];
                pipeline.rpush(`user:${user}:stakes`, JSON.stringify(action));
                pipeline.incrbyfloat(`user:${user}:sum_stakes`, amount);
            }
            else if (action.trace.act.data.from == "eparticlectr" && action.trace.receipt.receiver == "everipediaiq") {
                const user = action.trace.act.data.to;
                const amount = action.trace.act.data.quantity.split(' ')[0];
                pipeline.rpush(`user:${user}:refunds`, JSON.stringify(action));
                pipeline.incrbyfloat(`user:${user}:sum_refunds`, amount);
            }
        }
        else if (action.trace.act.name == "brainmeiq") {
            const user = action.trace.act.data.staker;
            const amount = action.trace.act.data.amount;
            pipeline.rpush(`user:${user}:stakes`, JSON.stringify(action));
            pipeline.incrbyfloat(`user:${user}:sum_stakes`, amount);
        }
        await pipeline.exec();
    }


    return true;
}


async function catchupMongo () {
    const MAX_ACTIONS_PER_REQUEST = 100000;
    const dfuse_catchup_url = config.get("DFUSE_CATCHUP_URL");
    if (!dfuse_catchup_url) {
        if (DFUSE_ACTION_LOGGING) console.log(`MONGO: No DFUSE_CATCHUP_URL found. Skipping fast catchup`);
        return;
    }
    const mongo_actions = await mongo_actions_promise;

    let more = true;
    while (more) {
        const article_start_block = await get_start_block('eparticlectr');
        const article_catchup_url = `${dfuse_catchup_url}/v2/chain/epactions/eparticlectr?since=${article_start_block}`;

        if (DFUSE_ACTION_LOGGING) console.log(`MONGO: Catching up on eparticlectr actions since block ${article_start_block}...`);
        const article_actions = await fetch(article_catchup_url, { headers: { 'Accept-encoding': 'gzip' }})
            .then(response => response.json())

        const filtered_actions = article_actions.filter(a => a.block_num != article_start_block);
        if (filtered_actions.length > 0) {
            const insertion = await mongo_actions.insertMany(filtered_actions, { ordered: false });
            if (DFUSE_ACTION_LOGGING) console.log(`MONGO: Synced ${insertion.insertedCount} eparticlectr actions`);
        }
        if (article_actions.length < MAX_ACTIONS_PER_REQUEST) more = false;
    }

    more = true;
    while (more) {
        const token_start_block = await get_start_block('everipediaiq');
        const token_catchup_url = `${dfuse_catchup_url}/v2/chain/epactions/everipediaiq?since=${token_start_block}`;

        if (DFUSE_ACTION_LOGGING) console.log(`MONGO: Catching up on everipediaiq actions since block ${token_start_block}...`);
        const token_actions = await fetch(token_catchup_url, { headers: { 'Accept-encoding': 'gzip' }})
            .then(response => response.json())

        const filtered_actions = token_actions.filter(a => a.block_num != token_start_block);
        if (filtered_actions.length > 0) {
            const insertion = await mongo_actions.insertMany(filtered_actions, { ordered: false });
            if (DFUSE_ACTION_LOGGING) console.log(`MONGO: Synced ${insertion.insertedCount} everipediaiq actions`);
        }
        if (token_actions.length < MAX_ACTIONS_PER_REQUEST) more = false;
    }
}


async function main () {
    await catchupMongo();
    if (config.get("REDIS_REPLAY") && config.get("REDIS_REPLAY") === "true") {
        await redis.flushdb();
        console.log(`REDIS: Flushed DB. Replaying...`);
    }
    catchupRedis();
    start();
    setInterval(() => restartIfFailing.apply(this), 15 * 1000);
}

main();
