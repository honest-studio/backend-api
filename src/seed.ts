import * as WebSocket from 'ws';
import { readFileSync, writeFile } from 'fs';
import * as mongo from './mongo.connection';

let dfuse;
let lastMessageReceived;
const apiKey = "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NDc5MDM3NTYsImp0aSI6IjE0YzY4Yjk5LTM5NTctNDZjYi04OTBiLWVkODJiMjFjOTQ3NyIsImlhdCI6MTU0MjcxOTc1NiwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiJDaVFBNmNieWU1ekJJS1pJWFAxYnBZdi9oejVjcXpFRm9ySnVKUGsxZnExeDR5SGhKYUFTUEFBL0NMUnQ2TkdLT3F2V2w4cldCZVBPRDRwdGkyVWIyWllrNUxMVGhyMTViNWxBdUNUNXFvaXdjWHdsRS96NTMwdWJDZVRmK0pFSnp3SjlGdz09IiwidGllciI6ImJldGEtdjEiLCJzdGJsayI6MiwidiI6MX0.qTZ0FqT8GIfaY4xeuM-tFpTnw97Jr9r7CeZdfMRTVK8W6I8bRZGHEzRASbtsZDivlZ2c8YK22hVn70qiBuwF-Q";
const DEFAULT_BLOCK_START: number = 1000000;

async function set_indexes(): Promise<any> {
    const index1 = new Promise<any>((resolve, reject) => {
        mongo.connection().then(function (conn) {
            conn.actions.createIndex("data.trace.receipt.global_sequence", { unique: true }, function () {
                conn.client.close();
                resolve();
            });
        });
    });
    const index2 = new Promise<any>((resolve, reject) => {
        mongo.connection().then(function (conn) {
            conn.actions.createIndex({ "data.trace.act.name": 1, "data.trace.act.account": 1 }, {}, function () {
                conn.client.close();
                resolve();
            });
        });
    });
    return Promise.all([ index1, index2 ]);
}

async function get_start_block(account: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        mongo.connection().then(function (conn) {
            conn.actions.find({ "data.trace.act.account": account })
                .sort({ "data.block_num": -1 })
                .limit(1)
                .toArray(function (err: Error, result: Array<any>) {
                    if (result.length == 0) resolve(DEFAULT_BLOCK_START);
                    else resolve(result[0].data.block_num);
                    conn.client.close();
                });
        });
    });
}

function start () {
    dfuse = new WebSocket(`wss://mainnet.eos.dfuse.io/v1/stream?token=${apiKey}`, {
        headers: {
            Origin: "https://everipedia.org"
        }
    });

    dfuse.on('open', async () => {
        await set_indexes();
        
        const article_req = {
          type: "get_actions",
          req_id: "article_req",
          listen: true,
          data: {
            account: "eparticlectr",
          },
          start_block: await get_start_block("eparticlectr")
        };
        const token_req = {
          type: "get_actions",
          req_id: "token_req",
          listen: true,
          data: {
            account: "everipediaiq",
          },
          start_block: await get_start_block("everipediaiq")
        };
        const safesend_req = {
          type: "get_actions",
          req_id: "safesend_req",
          listen: true,
          data: {
            account: "iqsafesendiq",
          },
          start_block: await get_start_block("iqsafesendiq")
        };
        const fee_req = {
          type: "get_actions",
          req_id: "fee_req",
          listen: true,
          data: {
            account: "epiqtokenfee",
          },
          start_block: await get_start_block("epiqtokenfee")
        };

        dfuse.send(JSON.stringify(article_req));
        dfuse.send(JSON.stringify(token_req));
        //dfuse.send(JSON.stringify(safesend_req));
        //dfuse.send(JSON.stringify(fee_req));
    });

    dfuse.on('message', (msg_str: string) => {
        lastMessageReceived = new Date().getTime();
        const msg = JSON.parse(msg_str);
        if (msg.type != "action_trace") {
            console.log(msg);
            return;
        }
        mongo.connection().then(function (conn) {
            conn.actions.insertOne(msg, function (err: Error) {
                if (err) console.log(err);
                else {
                    const block_num = msg.data.block_num;
                    const account = msg.data.trace.act.account;
                    const name = msg.data.trace.act.name;
                    console.log(`Saved ${account}:${name} @ block ${block_num} to Mongo`);
                }
                conn.client.close();
            });
        });
    });

    dfuse.on('error', (e) => {
        console.log(e);
    });
}

function restartIfFailing () {
    const now = new Date().getTime();
    const THIRTY_SECONDS = 30*1000; // in milliseconds
    if (now > lastMessageReceived + THIRTY_SECONDS) {
        lastMessageReceived = now;
        console.log("No messages received in 30s. Restarting dfuse");

        dfuse.close();
        start();
    }
}
setInterval(restartIfFailing, 15*1000); // every 15 seconds

export { dfuse, start }
