import { MongoClient } from 'mongodb';

const url: string = "mongodb://localhost:27017";
const database: string = "Everipedia";
const collection: string = "actions";

function connection(): Promise<any> {
    return new Promise<any>(function (resolve, reject) {
        MongoClient.connect(url, function (err: Error, client: MongoClient) {
            const db = client.db(database);
            const actions = db.collection("actions");
            const plagiarism = db.collection("plagiarism");
            const wikis = db.collection("wikis");
            resolve({ client, db, actions, plagiarism, wikis });
        });
    });
}

export { url, database, connection }
