import { Injectable } from '@nestjs/common';
import * as mongo from '../mongo.connection';

@Injectable()
export class RecentActivityService {
    async getAll(): Promise<any> {
        const docs = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
        }));
        return docs.sort({ "data.block_num": -1 }).limit(100).toArray();
    }

    async getResults(): Promise<any> {
        const results = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "logpropres",
        }));
        return results.sort({"data.block_num": -1 }).limit(20).toArray();
    }

    async getProposals(): Promise<any> {
        const proposals = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "propose",
        }));
        return proposals.sort({ "data.block_num": -1 }).limit(20).toArray();
    }

    async getVotes(): Promise<any> {
        const votes = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "votebyhash",
        }))
        return votes.sort({ "data.block_num": -1 }).limit(20).toArray();
    }

}
