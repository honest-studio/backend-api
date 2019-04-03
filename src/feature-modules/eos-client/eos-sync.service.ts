import { MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../database/mongodb-service';
import { DfuseConfig, ConfigService } from '../../common';
import * as fetch from 'node-fetch';
import * as WebSocket from 'ws';

export interface DfuseToken {
    token: string; // JWT
    expires_at: number;
}

@Injectable()
export class EosSyncService {
    private readonly mongoDbService: MongoDbService;
    private readonly dfuseStartBlock;
    private readonly dfuseConfig: DfuseConfig;
    private lastMessageReceived: number;
    private dfuseJwtToken: string;
    private dfuse: WebSocket;

    public DFUSE_AUTH_URL = 'https://auth.dfuse.io/v1/auth/issue';

    constructor(mongo: MongoDbService, config: ConfigService) {
        this.mongoDbService = mongo;
        this.dfuseConfig = config.get('dfuseConfig');
    }

    async get_start_block(account: string, default_start_block: number = this.dfuseStartBlock): Promise<number> {
        return this.mongoDbService
            .connection()
            .actions.find({ 'trace.act.account': account })
            .sort({ block_num: -1 })
            .limit(1)
            .toArray()
            .then((result: Array<any>) => {
                if (result.length == 0) return default_start_block;
                const db_block = result[0].block_num;
                return Math.max(default_start_block, db_block);
            });
    }

    async start() {
        const dfuseToken = await this.obtainDfuseToken();

        try {
            const url = `${this.dfuseConfig.dfuseWsEndpoint}?token=${dfuseToken.token}`;
            this.dfuse = new WebSocket(url, {
                headers: {
                    Origin: this.dfuseConfig.dfuseOriginUrl
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
            const safesend_req = {
                type: 'get_actions',
                req_id: 'safesend_req',
                listen: true,
                data: {
                    account: 'iqsafesendiq'
                },
                start_block: await this.get_start_block('iqsafesendiq')
            };
            const fee_req = {
                type: 'get_actions',
                req_id: 'fee_req',
                listen: true,
                data: {
                    account: 'epiqtokenfee'
                },
                start_block: await this.get_start_block('epiqtokenfee')
            };

            this.dfuse.send(JSON.stringify(article_req));
            this.dfuse.send(JSON.stringify(token_req));
            //dfuse.send(JSON.stringify(safesend_req));
            //dfuse.send(JSON.stringify(fee_req));
        });
        this.dfuse.on('error', (err) => {
            console.log('-- error connecting to dfuse: ', err);
        });
        this.dfuse.on('message', (msg_str: string) => {
            this.lastMessageReceived = new Date().getTime();

            const msg = JSON.parse(msg_str);
            if (msg.type != 'action_trace') {
                // console.log(msg);
                return;
            }
            this.mongoDbService
                .connection()
                .actions.insertOne(msg.data)
                .then(() => {
                    const block_num = msg.data.block_num;
                    const account = msg.data.trace.act.account;
                    const name = msg.data.trace.act.name;
                    console.log(`DFUSE: Saved ${account}:${name} @ block ${block_num} to Mongo`);
                })
                .catch((err) => {
                    console.log('Eos-Sync-Service: Error inserting action ', msg, ' \n Error message on insert: ', err);
                });
        });

        this.dfuse.on('error', (e) => {
            console.log('Dfuse error in eos-sync-service: ', e);
        });
    }

    async obtainDfuseToken(): Promise<DfuseToken> {
        return fetch(this.DFUSE_AUTH_URL, {
            method: 'POST',
            body: JSON.stringify({ api_key: this.dfuseConfig.dfuseApiKey })
        }).then((response) => response.json());
    }

    restartIfFailing() {
        const now = new Date().getTime();
        const THIRTY_SECONDS = 30 * 1000; // in milliseconds
        if (now > this.lastMessageReceived + THIRTY_SECONDS) {
            this.lastMessageReceived = now;
            console.log('No messages received in 30s. Restarting dfuse');

            this.dfuse.close();
            this.start();
        }
    }

    sync() {
        this.start();
        setInterval(this.restartIfFailing, 15 * 1000); // every 15 seconds
    }
}
