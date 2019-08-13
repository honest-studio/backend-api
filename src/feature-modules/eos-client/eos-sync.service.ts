import { Injectable } from '@nestjs/common';
import * as fetch from 'node-fetch';
import WebSocket from 'ws';
import { ConfigService } from '../../common';
import { MongoDbService } from '../database/mongodb-service';
import { RedisService } from '../database/redis-service';
import { ObjectId } from 'mongodb';


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

    constructor(private mongo: MongoDbService, private config: ConfigService, private redis: RedisService) {
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

    async catchupRedis () {
        const BATCH_SIZE = 25000;
        let article_block_num = 0;
        let token_block_num = 0;
        let last_processed: any = await this.redis.connection().get('eos_actions:last_processed');
        if (last_processed) {
            last_processed = JSON.parse(last_processed);
            token_block_num = last_processed.everipediaiq.block_num;
            article_block_num = last_processed.eparticlectr.block_num;
        }

        // catchup article actions
        while (true) {
            let query = { block_num: { $gte: article_block_num }};
            let actions = await this.mongo.connection().actions.find(query).limit(BATCH_SIZE).toArray();
            console.log(`EOS-SYNC-SERVICE: Publishing ${actions.length} eparticlectr actions since block ${article_block_num} to Redis`);

            this.redis.connection().publish("eos_actions", JSON.stringify(actions));
            if (actions.length < BATCH_SIZE) break;
            article_block_num = actions[actions.length - 1].block_num;
        }

        // catch up token actions
        while (true) {
            let query = { block_num: { $gte: token_block_num }};
            let actions = await this.mongo.connection().actions.find(query).limit(BATCH_SIZE).toArray();
            console.log(`EOS-SYNC-SERVICE: Publishing ${actions.length} eparticlectr actions since block ${token_block_num} to Redis`);

            this.redis.connection().publish("eos_actions", JSON.stringify(actions));
            if (actions.length < BATCH_SIZE) break;
            token_block_num = actions[actions.length - 1].block_num;
        }

        return true;
    }

    async catchupMongo () {
        const MAX_ACTIONS_PER_REQUEST = 100000;
        const DFUSE_ACTION_LOGGING = this.config.get("DFUSE_ACTION_LOGGING");
        const dfuse_catchup_url = this.config.get("DFUSE_CATCHUP_URL");
        if (!dfuse_catchup_url) {
            console.log(`EOS-SYNC-SERVICE: No DFUSE_CATCHUP_URL found. Skipping fast catchup`);
            return;
        }

        let more = true;
        while (more) {
            const article_start_block = await this.get_start_block('eparticlectr');
            const article_catchup_url = `${dfuse_catchup_url}/v2/chain/epactions/eparticlectr?since=${article_start_block}`;

            if (DFUSE_ACTION_LOGGING) console.log(`EOS-SYNC-SERVICE: Catching up on eparticlectr actions since block ${article_start_block}...`);
            const article_actions = await fetch(article_catchup_url, { headers: { 'Accept-encoding': 'gzip' }})
                .then(response => response.json())

            const filtered_actions = article_actions.filter(a => a.block_num != article_start_block);
            if (filtered_actions.length > 0) {
                const insertion = await this.mongo.connection().actions.insertMany(filtered_actions, { ordered: false });
                if (DFUSE_ACTION_LOGGING) console.log(`EOS-SYNC-SERVICE: Synced ${insertion.insertedCount} eparticlectr actions`);
            }
            if (article_actions.length < MAX_ACTIONS_PER_REQUEST) more = false;
        }

        more = true;
        while (more) {
            const token_start_block = await this.get_start_block('everipediaiq');
            const token_catchup_url = `${dfuse_catchup_url}/v2/chain/epactions/everipediaiq?since=${token_start_block}`;

            if (DFUSE_ACTION_LOGGING) console.log(`EOS-SYNC-SERVICE: Catching up on everipediaiq actions since block ${token_start_block}...`);
            const token_actions = await fetch(token_catchup_url, { headers: { 'Accept-encoding': 'gzip' }})
                .then(response => response.json())

            const filtered_actions = token_actions.filter(a => a.block_num != token_start_block);
            if (filtered_actions.length > 0) {
                const insertion = await this.mongo.connection().actions.insertMany(filtered_actions, { ordered: false });
                if (DFUSE_ACTION_LOGGING) console.log(`EOS-SYNC-SERVICE: Synced ${insertion.insertedCount} everipediaiq actions`);
            }
            if (token_actions.length < MAX_ACTIONS_PER_REQUEST) more = false;
        }
    }

    async startDfuse() {
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

            this.redis.connection().publish("eos_actions", JSON.stringify([msg.data]));
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
            this.startDfuse();
        }
    }

    async sync() {
        if (!this.config.get("DFUSE_SYNC")) {
            console.warn("EOS-SYNC-SERVICE: [WARN] Dfuse sync is turned off");
            return;
        }
        await this.redis.is_subscribed();
        await this.catchupRedis();
        await this.catchupMongo();
        this.startDfuse();
        setInterval(() => this.restartIfFailing.apply(this), 15 * 1000); // every 15 seconds
    }

}
