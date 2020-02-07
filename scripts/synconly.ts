// In production , there are multiple instances running of the repo
// To prevent the multiple nodes from duplicating sync work and causing DB lockups
// this script should be used in a separate process

import fetch from 'node-fetch';
import WebSocket from 'ws';
import { Collection, Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import Redis from 'ioredis';
const { createDfuseClient } = require("@dfuse/client")


let lastMessageReceived = Date.now();
let dfuseJwtToken;
let dfuse;
let streams = [];
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
            const proposer = action.trace.act.data.proposer;
            const lang_code = action.trace.act.data.lang_code;
            const slug = action.trace.act.data.slug;
            const endtime = action.trace.act.data.endtime;
            const ttl = endtime - (Date.now() / 1000 | 0);
            pipeline.set(`proposal:${proposal_id}:info`, JSON.stringify(action));
            pipeline.zadd(`wiki:lang_${lang_code}:${slug}:proposals`, proposal_id, proposal_id);
            pipeline.sadd(`user:${proposer}:proposals`, JSON.stringify(action));
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
            // Block 59902500 is the start block for the 2.0 smart contracts
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
        else if (action.trace.act.name == "userinsert") {
            const user = action.trace.act.data.user;
            const profile = action.trace.act.data;
            pipeline.set(`user:${user}:profile`, JSON.stringify(profile));
        }
        else if (action.trace.act.name == "mkreferendum") {
            const proposal_id = action.trace.act.data.proposal_id;
            pipeline.set(`proposal:${proposal_id}:referendum`, 1);
        }
        pipeline.set(`eos_actions:global_sequence:${action.trace.receipt.global_sequence}`, 1);
        await pipeline.exec();
    }


    return true;
}

// Helper function for dfuse websocket
async function webSocketFactory(url: string, protocols: string[] = []) {
    const webSocket = new WebSocket(url, protocols, {
      handshakeTimeout: 30 * 1000, // 30s
      maxPayload: 200 * 1024 * 1000 * 1000 // 200Mb
    })

    const onUpgrade = (response) => {
      console.log("Socket upgrade response status code.", response.statusCode)

      // You need to remove the listener at some point since this factory
      // is called at each reconnection with the remote endpoint!
      webSocket.removeListener("upgrade", onUpgrade)
    }

    webSocket.on("upgrade", onUpgrade)

    return webSocket;
}

async function start () {
    const apiKey = config.get("DFUSE_API_KEY");
    const client = createDfuseClient({ 
        apiKey, 
        network: "mainnet", 
        httpClientOptions: { fetch },
        graphqlStreamClientOptions: {
          socketOptions: {
            // The WebSocket factory used for GraphQL stream must use this special protocols set
            // We intend on making the library handle this for you automatically in the future,
            // for now, it's required otherwise, the GraphQL will not connect correctly.
            webSocketFactory: (url) => webSocketFactory(url, ["graphql-ws"])
          }
        },
        streamClientOptions: {
          socketOptions: {
            webSocketFactory: (url) => webSocketFactory(url)
          }
        }
     });
    const profile_start_block = await get_start_block('epsovreignid');
    const token_start_block = await get_start_block('everipediaiq');
    const article_start_block = await get_start_block('eparticlectr');

    const fields = `{
          undo 
          cursor
          trace {
            id
            block {
              num
              timestamp
            }
            id
            matchingActions {
              account
              name
              json
              seq
              receiver
            }
        }
      }
    }`;

    const stream_token = `subscription($cursor: String!) {
        searchTransactionsForward(query: "receiver:everipediaiq", cursor: $cursor, lowBlockNum: ${token_start_block} ) 
            ${fields}`;
    const stream_article = `subscription($cursor: String!) {
        searchTransactionsForward(query: "receiver:eparticlectr", cursor: $cursor, lowBlockNum: ${article_start_block} ) 
            ${fields}`;
    const stream_profile = `subscription($cursor: String!) {
        searchTransactionsForward(query: "receiver:epsovreignid", cursor: $cursor, lowBlockNum: ${profile_start_block} ) 
            ${fields}`;
    

    streams[0] = await client.graphql(stream_token, graphql_callback);
    streams[1] = await client.graphql(stream_article, graphql_callback);
    streams[2] = await client.graphql(stream_profile, graphql_callback);
}
            
async function graphql_callback (message, stream) {
    lastMessageReceived = Date.now();

    if (message.type === "data") {
        const data = message.data.searchTransactionsForward;
        const actions = data.trace.matchingActions;
        const docs = convertNewDocToOld(data);

        stream.mark({ cursor: data.cursor })
        
        for (let doc of docs) {
            const mongo_actions = await mongo_actions_promise;
            mongo_actions.insertOne(doc)
                .then(() => {
                    const block_num = doc.block_num;
                    const account = doc.trace.act.account;
                    const name = doc.trace.act.name;
                    if (DFUSE_ACTION_LOGGING) console.log(`MONGO: Saved ${account}:${name} @ block ${block_num}`);
                })
                .catch((err) => {
                    console.log('error');
                    if (err.code == 11000) {
                        if (DFUSE_ACTION_LOGGING) console.log(`MONGO: Ignoring duplicate action. This is expected behavior during server restarts or cluster deployments`);
                    }
                    else {
                        if (DFUSE_ACTION_LOGGING) console.log('MONGO: Error inserting action ', doc, ' \n Error message on insert: ', err);
                        throw err;
                    }
                });

            // Process actions to Redis
            await redis_process_actions([doc])
            let last_block_processed = doc.block_num; 
            await redis.set(`eos_actions:last_block_processed`, last_block_processed);

            // publish proposal results
            if (doc.trace.act.name == "logpropres") redis.publish("action:logpropres", JSON.stringify(doc));
        }

    }
    else console.log(message);
}

function convertNewDocToOld (data): any[] {
    return data.trace.matchingActions.map((action) => ({
        trx_id: data.trace.id,
        block_num: data.trace.block.num,
        block_time: data.trace.block.timestamp,
        trace: {
            act: {
                name: action.name,
                account: action.account,
                data: action.json
            },
            receipt: {
                global_sequence: action.seq
            }
        }
    }));
}

async function restartRegularly() {
    lastMessageReceived = Date.now();
    console.log('Restarting dfuse.');
    for (let stream of streams) {
        await stream.unregisterStream();
    }
    start();
}


async function main () {
    if (config.get("REDIS_REPLAY") && config.get("REDIS_REPLAY") === "true") {
        await redis.flushdb();
        console.log(`REDIS: Flushed DB. Replaying...`);
    }
    await catchupRedis();
    start();
    setInterval(restartRegularly, 300000); // every 5 min
}

main();
