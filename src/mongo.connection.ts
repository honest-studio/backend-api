import { MongoClient } from 'mongodb';

const url: string = "mongodb://localhost:27017";
const database: string = "Everipedia";
const collection: string = "actions";

function connection(): Promise<any> {
    return new Promise<any>(function (resolve, reject) {
        MongoClient.connect(url, function (err: Error, client: MongoClient) {
            const db = client.db(database);
            const actions = db.collection("actions");
            resolve({ client, db, actions });
        });
    });
}

export { url, database, connection }
