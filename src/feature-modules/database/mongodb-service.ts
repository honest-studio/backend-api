import { Injectable } from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';
import { ConfigService } from '../../common';

// placeholder entities for mongodb
export type ActionEntity = any;
export type PlagiarismEntity = any;
export type WikiEntity = any;
export type JsonWikiEntity = any;
export type StatEntity = any;
export type OAuthTokenEntity = any;

export type AppConnectionInstance = {
    client: MongoClient;
    db: Db;
    actions: Collection<ActionEntity>;
    statistics: Collection<StatEntity>;
    json_wikis: Collection<JsonWikiEntity>;
    oauth_tokens: Collection<OAuthTokenEntity>;
};

/**
 * Call in a service like:
 * constructor(mongo: MongoDbService) {
 *       this.mongoService = mongo;
 *  }
 */
@Injectable()
export class MongoDbService {
    private appConnectionInstance: AppConnectionInstance;

    constructor(private config: ConfigService) {}

    async connect(): Promise<AppConnectionInstance> {
        if (this.appConnectionInstance) return this.appConnectionInstance;
        console.log(`-- in mongoDbservice.connect() -- connecting to ${this.config.get("MONGODB_URL")}`);
        try {
            this.appConnectionInstance = await new Promise<AppConnectionInstance>((resolve, reject) => {
                MongoClient.connect(
                    this.config.get("MONGODB_URL"),
                    { poolSize: 10, useNewUrlParser: true },
                    (err: Error, client: MongoClient) => {
                        if (err) {
                            console.warn('Is the MongoDB daemon running? Run install/ubuntu_deps.sh to initialize');
                            console.error(err);
                            reject(err);
                        } else if (!client) {
                            console.error('Mongo client unavailable!');
                            reject(new Error('Mongo client unavailable'));
                        } else {
                            const db = client.db(this.config.get("MONGODB_DATABASE_NAME"));
                            const actions = db.collection('actions');
                            const json_wikis = db.collection('json_wikis');
                            const statistics = db.collection('statistics');
                            const oauth_tokens = db.collection('oauth_tokens');
                            resolve({ client, db, actions, json_wikis, statistics, oauth_tokens });
                        }
                    }
                );
            });
        } catch (ex) {
            console.log('Failed to connect to mongodb: ', ex);
        }

        console.log('-- in mongoDbservice.connect() - set indices');
        await this.set_indexes();
        console.log('-- in mongoDbservice.connect() - returning');
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
        const index1 = this.connection().actions.createIndex({ 'trace.receipt.global_sequence': 1 }, { unique: true });

        const index2 = this.connection().actions.createIndex({ 'trace.act.name': 1, 'trace.act.account': 1 });

        const index3 = this.connection().json_wikis.createIndex({ 'ipfs_hash': 1 }, { unique: true });

        const index4 = this.connection().actions.createIndex({ 'block_num': 1 });

        return Promise.all([index1, index2, index3, index4]);
    }
}
