import fetch from 'node-fetch';
import WebSocket from 'ws';
import { Collection, Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';

let lastMessageReceived = Date.now();
let dfuseJwtToken;
let dfuse;

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
        const db = client.db(this.config.get("MONGODB_DATABASE_NAME"));
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
            if (config.get("DFUSE_ACTION_LOGGING"))
                console.log(msg);
            return;
        }
        const mongo_actions = await mongo_actions_promise;
        mongo_actions.insertOne(msg.data)
            .then(() => {
                const block_num = msg.data.block_num;
                const account = msg.data.trace.act.account;
                const name = msg.data.trace.act.name;
                if (config.get("DFUSE_ACTION_LOGGING"))
                    console.log(`EOS-SYNC-SERVICE: Saved ${account}:${name} @ block ${block_num} to Mongo`);
            })
            .catch((err) => {
                if (err.code == 11000) {
                    if (config.get("DFUSE_ACTION_LOGGING"))
                        console.log(`EOS-SYNC-SERVICE: Ignoring duplicate action. This is expected behavior during server restarts or cluster deployments`);
                }
                else {
                    console.log('EOS-SYNC-SERVICE: Error inserting action ', msg, ' \n Error message on insert: ', err);
                    throw err;
                }
            });
    });
    dfuse.on('error', (e) => {
        console.log('EOS-SYNC-SERVICE: Dfuse error: ', e);
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
function sync() {
    start();
    setInterval(() => restartIfFailing.apply(this), 15 * 1000);
}
