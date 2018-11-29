import { MongoClient } from 'mongodb';

const url: string = "mongodb://localhost:27017";
const database: string = "Everipedia";
const collection: string = "actions";

async function connection(): Promise<any> {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(url, function (err: Error, client: MongoClient) {
            if (err) {
                console.warn("Is the MongoDB daemon running? Run install/ubuntu_deps.sh to initialize");
                console.error(err);
                reject(err);
            }
            const db = client.db(database);
            const actions = db.collection("actions");
            const plagiarism = db.collection("plagiarism");
            const wikis = db.collection("wikis");
            resolve({ client, db, actions, plagiarism, wikis });
        });
    });
}

export { url, database, connection }
