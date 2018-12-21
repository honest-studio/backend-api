import { MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { MongoDbService } from './mongodb-service';
import { DfuseConfig, ConfigService } from '../../common';
import * as WebSocket from 'ws';

@Injectable()
export class EosSyncService {
    private readonly mongoDbService: MongoDbService;
    private readonly dfuse: WebSocket;
    private readonly dfuseConfig: DfuseConfig;
    private readonly DEFAULT_BLOCK_START: number = 1000000;
    private lastMessageReceived: number;

    constructor(mongo: MongoDbService, config: ConfigService) {
        this.mongoDbService = mongo;
        this.dfuseConfig = config.get('dfuseConfig');
        const url = `${this.dfuseConfig.dfuseWsEndpoint}?token=${this.dfuseConfig.dfuseApiKey}`;
        this.dfuse = new WebSocket(url, {
            headers: {
                Origin: this.dfuseConfig.dfuseOriginUrl
            }
        });
    }

    async set_indexes(): Promise<any> {
        const index1 = this.mongoDbService
            .connection()
            .actions.createIndex('data.trace.receipt.global_sequence', { unique: true });

        const index2 = this.mongoDbService
            .connection()
            .actions.createIndex({ 'data.trace.act.name': 1, 'data.trace.act.account': 1 });

        const index3 = this.mongoDbService.connection().wikis.createIndex({ ipfs_hash: 1 });

        const index4 = this.mongoDbService.connection().wikis.createIndex({ 'data.trace.act.account': 1 });

        const index5: Promise<any> = this.mongoDbService.connection().wikis.createIndex({ 'data.block_num': -1 });

        return Promise.all([index1, index2, index3, index4, index5]);
    }

    async get_start_block(account: string, default_start_block: number = this.DEFAULT_BLOCK_START): Promise<number> {
        return this.mongoDbService
            .connection()
            .actions.find({ 'data.trace.act.account': account })
            .sort({ 'data.block_num': -1 })
            .limit(1)
            .toArray()
            .then((result: Array<any>) => {
                if (result.length == 0) return default_start_block;
                else return result[0].data.block_num;
            });
    }

    async start() {
        this.dfuse.on('open', async () => {
            try {
                await this.set_indexes();
            } catch (e) {
                console.log('MongoDBService: Indexes already set. Continuing.');
            }

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

        this.dfuse.on('message', (msg_str: string) => {
            this.lastMessageReceived = new Date().getTime();

            const msg = JSON.parse(msg_str);
            if (msg.type != 'action_trace') {
                console.log(msg);
                return;
            }
            this.mongoDbService
                .connection()
                .actions.insertOne(msg)
                .then(() => {
                    const block_num = msg.data.block_num;
                    const account = msg.data.trace.act.account;
                    const name = msg.data.trace.act.name;
                    console.log(`DFUSE: Saved ${account}:${name} @ block ${block_num} to Mongo`);
                });
        });

        this.dfuse.on('error', (e) => {
            console.log(e);
        });
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
