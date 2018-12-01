import { Injectable } from '@nestjs/common';
import * as mongo from '../mongo.connection';

@Injectable()
export class RecentActivityService {
    async getAll(offset: Number): Promise<Array<any>> {
        const docs = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
        }));
        return docs.sort({ "data.block_num": -1 }).skip(offset).limit(100).toArray();
    }

    async getResults(offset): Promise<Array<any>> {
        const results = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "logpropres",
        }));
        return results.sort({"data.block_num": -1 }).limit(20).toArray();
    }

    async getProposals(offset): Promise<Array<any>> {
        const proposals = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "propose",
        }));
        return proposals.sort({ "data.block_num": -1 }).limit(20).toArray();
    }

    async getVotes(offset): Promise<Array<any>> {
        const votes = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "votebyhash",
        }))
        return votes.sort({ "data.block_num": -1 }).limit(20).toArray();
    }

    async getWikis(offset): Promise<any> {
        const results = await mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "logpropres",
            "data.trace.act.data.approved": 1,
        }));
        return results.sort({"data.block_num": -1 }).limit(20).toArray();
    }

}
