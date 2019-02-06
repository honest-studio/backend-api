import { MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { MongoDbConnectionConfig, ConfigService } from '../../common';

// placeholder entities for mongodb
export type ActionEntity = any;
export type PlagiarismEntity = any;
export type WikiEntity = any;
export type DiffEntity = any;

export type AppConnectionInstance = {
    client: MongoClient;
    db: Db;
    actions: Collection<ActionEntity>;
    diffs: Collection<DiffEntity>;
};

/**
 * Call in a service like:
 * constructor(mongo: MongoDbService) {
 *       this.mongoService = mongo;
 *  }
 */
@Injectable()
export class MongoDbService {
    private readonly mongoConfig: MongoDbConnectionConfig;
    private appConnectionInstance: AppConnectionInstance;

    constructor(config: ConfigService) {
        this.mongoConfig = config.get('mongoConfig');
    }

    async connect(): Promise<AppConnectionInstance> {
        if (this.appConnectionInstance) return this.appConnectionInstance;

        this.appConnectionInstance = await new Promise<AppConnectionInstance>((resolve, reject) => {
            MongoClient.connect(
                this.mongoConfig.mongoConnUrl,
                { poolSize: 10 },
                (err: Error, client: MongoClient) => {
                    if (err) {
                        console.warn('Is the MongoDB daemon running? Run install/ubuntu_deps.sh to initialize');
                        console.error(err);
                        reject(err);
                    } else if (!client) {
                        console.error('Mongo client unavailable!');
                        reject(new Error('Mongo client unavailable'));
                    } else {
                        const db = client.db(this.mongoConfig.mongoDbName);
                        const actions = db.collection('actions');
                        const diffs = db.collection('diffs');
                        resolve({ client, db, actions, diffs });
                    }
                }
            );
        });

        await this.set_indexes();

        return this.appConnectionInstance;
    }

    /**
     * get a connection to MongoDB
     */
    connection(): AppConnectionInstance {
        return this.appConnectionInstance;
    }

    /**
     * set indexes on Mongo collections
     */
    async set_indexes(): Promise<any> {
        const index1 = this.connection().actions.createIndex(
            { 'trace.receipt.global_sequence': 1 },
            { unique: true }
        );

        const index2 = this.connection().actions.createIndex({ 'trace.act.name': 1, 'trace.act.account': 1 });

        const index3 = this.connection().diffs.createIndex({ old_hash: 1, new_hash: 1 }, { unique: true });

        return Promise.all([index1, index2, index3]);
    }
}
