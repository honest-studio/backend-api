import { MongoClient, Db, Collection } from 'mongodb';

const url: string = 'mongodb://localhost:27017';
const database: string = 'Everipedia';

// placeholder entities for mongodb
type ActionEntity = any;
type PlagiarismEntity = any;
type WikiEntity = any;

/**
 * Connection for various resources
 */
export type AppConnectionInstance = {
    client: MongoClient;
    db: Db;
    actions: Collection<ActionEntity>;
    plagiarism: Collection<PlagiarismEntity>;
    wikis: Collection<WikiEntity>;
};

async function connection(): Promise<AppConnectionInstance> {
    return new Promise<AppConnectionInstance>((resolve, reject) => {
        MongoClient.connect(
            url,
            (err: Error, client: MongoClient) => {
                if (err) {
                    console.warn('Is the MongoDB daemon running? Run install/ubuntu_deps.sh to initialize');
                    console.error(err);
                    reject(err);
                } else if (!client) {
                    console.error('Mongo client unavailable!');
                    reject(new Error('Mongo client unavailable'));
                } else {
                    const db = client.db(database);
                    const actions = db.collection('actions');
                    const plagiarism = db.collection('plagiarism');
                    const wikis = db.collection('wikis');
                    resolve({ client, db, actions, plagiarism, wikis });
                }
            }
        );
    });
}

export { url, database, connection };
