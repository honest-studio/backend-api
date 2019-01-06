import { MongoClient, Db, Collection } from 'mongodb';
import { Injectable, Inject } from '@nestjs/common';
import { BaseProvider, StatusHubService, MongoDbConnectionConfig, ConfigService } from '../../common';
import { ServiceName, StatusText, DiToken } from '../../shared';

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
export class MongoDbService extends BaseProvider {
    private readonly mongoConfig: MongoDbConnectionConfig;
    private appConnectionInstance: AppConnectionInstance;

    constructor(@Inject(DiToken.MongoDbClientToken) private client:MongoClient, private config: ConfigService, protected statusHub: StatusHubService) {
        super(statusHub, ServiceName.MONGODB_SVC);
        this.mongoConfig = config.get('mongoConfig');
    }
/*
    private setConnectionInstance = ():Promise<AppConnectionInstance> => {
        return new Promise<AppConnectionInstance>((resolve, reject) => {

        }
    }
    */

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
                    this.onServiceError(StatusText.ERR_DB_CONN_NOT_ESTABLISHED);
                    reject(err);
                } else if (!client) {
                    this.onServiceError(StatusText.ERR_DB_CONN_NOT_INITIALIZED);
                    console.error('Mongo client unavailable!');
                    reject(new Error('Mongo client unavailable'));
                } else {
                    const db = client.db(this.mongoConfig.mongoDbName);
                    const actions = db.collection('actions');
                    const plagiarism = db.collection('plagiarism');
                    const wikis = db.collection('wikis');
                    this.onServiceStarted();
                    resolve({ client, db, actions, plagiarism, wikis });
                }
            }
        );
    });
    return this.appConnectionInstance;
}

    async xconnect(): Promise<AppConnectionInstance> {
        if (this.appConnectionInstance) return this.appConnectionInstance;

        this.appConnectionInstance = await new Promise<AppConnectionInstance>((resolve, reject) => {
            MongoClient.connect(
                this.mongoConfig.mongoConnUrl,
                { poolSize: 10 },
                (err: Error, client: MongoClient) => {
                    if (err) {
                        console.warn('Is the MongoDB daemon running? Run install/ubuntu_deps.sh to initialize');
                        console.error(err);
                        this.onServiceError(StatusText.ERR_DB_CONN_NOT_ESTABLISHED);
                        reject(err);
                    } else if (!client) {
                        this.onServiceError(StatusText.ERR_DB_CONN_NOT_INITIALIZED);
                        console.error('Mongo client unavailable!');
                        reject(new Error('Mongo client unavailable'));
                    } else {
                        const db = client.db(this.mongoConfig.mongoDbName);
                        const actions = db.collection('actions');
                        const plagiarism = db.collection('plagiarism');
                        const wikis = db.collection('wikis');
                        this.onServiceStarted();
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
