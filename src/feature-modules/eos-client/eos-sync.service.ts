import { MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../database/mongodb-service';
import { ConfigService } from '../../common';
import * as fetch from 'node-fetch';
import WebSocket from 'ws';

export interface DfuseToken {
    token: string; // JWT
    expires_at: number;
}

@Injectable()
export class EosSyncService {
    private lastMessageReceived: number;
    private dfuseJwtToken: string;
    private dfuse: WebSocket;

    public DFUSE_AUTH_URL = 'https://auth.dfuse.io/v1/auth/issue';

    constructor(private mongo: MongoDbService, private config: ConfigService) {
        this.lastMessageReceived = Date.now();
    }

    // you can override the start block from the DB with the 
    // DFUSE_START_BLOCK config parameter
    async get_start_block(account: string): Promise<number> {
        return this.mongo
            .connection()
            .actions.find({ 'trace.act.account': account })
            .sort({ block_num: -1 })
            .limit(1)
            .toArray()
            .then((result: Array<any>) => {
                const config_start_block = Number(this.config.get("DFUSE_START_BLOCK"));
                if (result.length == 0) return config_start_block;
                const db_block = result[0].block_num;
                return Math.max(config_start_block, db_block);
            });
    }

    async catchup () {
        const dfuse_catchup_url = this.config.get("DFUSE_CATCHUP_URL");
        console.log(dfuse_catchup_url);
        if (!dfuse_catchup_url)
            return;


        const article_startblock = await this.get_start_block('eparticlectr');
        const token_startblock = await this.get_start_block('everipediaiq');
        const article_catchup_url = `${dfuse_catchup_url}/v2/chain/epactions/eparticlectr?since=${article_startblock}`;
        const token_catchup_url = `${dfuse_catchup_url}/v2/chain/epactions/everipediaiq?since=${token_startblock}`;

        console.log(`EOS-SYNC-SERVICE: Catching up on eparticlectr actions since block ${article_startblock}...`);
        const article_actions = await fetch(article_catchup_url, { headers: { 'Accept-encoding': 'gzip' }})
            .then(response => response.json())
        if (article_actions.length > 0) {
            const insertion = await this.mongo.connection().actions.insertMany(article_actions, { ordered: false });
            console.log(`EOS-SYNC-SERVICE: Synced ${insertion.insertedCount} eparticlectr actions`);
        }

        console.log(`EOS-SYNC-SERVICE: Catching up on everipediaiq actions since block ${token_startblock}...`);
        const token_actions = await fetch(token_catchup_url, { headers: { 'Accept-encoding': 'gzip' }})
            .then(response => response.json())
        if (token_actions.length > 0) {
            const insertion = await this.mongo.connection().actions.insertMany(token_actions, { ordered: false });
            console.log(`EOS-SYNC-SERVICE: Synced ${insertion.insertedCount} everipediaiq actions`);
        }
    }

    async start() {
        const dfuseToken = await this.obtainDfuseToken();

        try {
            const url = `${this.config.get("DFUSE_API_WEBSOCKET_ENDPOINT")}?token=${dfuseToken.token}`;
            this.dfuse = new WebSocket(url, {
                headers: {
                    Origin: this.config.get("DFUSE_API_ORIGIN_URL")
                }
            });
        } catch (err) {
            console.log('failed to connect to websocket in eos-sync-service ', err);
        }

        this.dfuse.on('open', async () => {
            const article_req = {
                type: 'get_actions',
                req_id: 'article_req',
                listen: true,
                data: {
                    account: 'eparticlectr'
                },
                start_block: await this.get_start_block('eparticlectr')
            };
            const token_req = {
                type: 'get_actions',
                req_id: 'token_req',
                listen: true,
                data: {
                    account: 'everipediaiq'
                },
                start_block: await this.get_start_block('everipediaiq')
            };

            this.dfuse.send(JSON.stringify(article_req));
            this.dfuse.send(JSON.stringify(token_req));
        });
        this.dfuse.on('error', (err) => {
            console.log('-- error connecting to dfuse: ', err);
        });
        this.dfuse.on('message', (msg_str: string) => {
            this.lastMessageReceived = Date.now();

            const msg = JSON.parse(msg_str);
            if (msg.type != 'action_trace') {
                if (this.config.get("DFUSE_ACTION_LOGGING"))
                    console.log(msg);
                return;
            }
            this.mongo
                .connection()
                .actions.insertOne(msg.data)
                .then(() => {
                    const block_num = msg.data.block_num;
                    const account = msg.data.trace.act.account;
                    const name = msg.data.trace.act.name;
                    if (this.config.get("DFUSE_ACTION_LOGGING"))
                        console.log(`EOS-SYNC-SERVICE: Saved ${account}:${name} @ block ${block_num} to Mongo`);
                })
                .catch((err) => {
                    if (err.code == 11000) {
                        if (this.config.get("DFUSE_ACTION_LOGGING"))
                            console.log(`EOS-SYNC-SERVICE: Ignoring duplicate action. This is expected behavior during server restarts or cluster deployments`);
                    }
                    else {
                        console.log('EOS-SYNC-SERVICE: Error inserting action ', msg, ' \n Error message on insert: ', err);
                        throw err;
                    }
                });
        });

        this.dfuse.on('error', (e) => {
            console.log('EOS-SYNC-SERVICE: Dfuse error: ', e);
        });
    }

    async obtainDfuseToken(): Promise<DfuseToken> {
        return fetch(this.DFUSE_AUTH_URL, {
            method: 'POST',
            body: JSON.stringify({ api_key: this.config.get("DFUSE_API_KEY") })
        }).then((response) => response.json());
   }

    restartIfFailing() {
        const now = Date.now();
        const THIRTY_SECONDS = 30 * 1000; // in milliseconds
        if (now > this.lastMessageReceived + THIRTY_SECONDS) {
            this.lastMessageReceived = now;
            console.log('No messages received in 30s. Restarting dfuse');

            if (this.dfuse) this.dfuse.close();
            this.start();
        }
    }

    async sync() {
        await this.catchup();
        this.start();
        setInterval(() => this.restartIfFailing.apply(this), 15 * 1000); // every 15 seconds
    }
}
