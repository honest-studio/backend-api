import { MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { MongoDbConnectionConfig, ConfigService } from '../../common';


// placeholder entities for mongodb
export type ActionEntity = any;
export type PlagiarismEntity = any;
export type WikiEntity = any;

export type AppConnectionInstance = {
    client: MongoClient;
    db: Db;
    actions: Collection<ActionEntity>;
    plagiarism: Collection<PlagiarismEntity>;
    wikis: Collection<WikiEntity>;
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
                        const plagiarism = db.collection('plagiarism');
                        const wikis = db.collection('wikis');
                        resolve({ client, db, actions, plagiarism, wikis });
                    }
                }
            );
        });
        return this.appConnectionInstance;
    }

    /**
     * get a connection to MongoDB
     */
    connection(): AppConnectionInstance {
        return this.appConnectionInstance;
    }
}
