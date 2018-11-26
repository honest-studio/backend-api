import { Injectable } from '@nestjs/common';
import * as mongo from '../mongo.connection';

@Injectable()
export class ApiService {
    async getProposal(proposal_hash: string): Promise<any> {
        return mongo.connection().then(con => con.actions.findOne({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "propose",
            "data.trace.act.data.proposed_article_hash": proposal_hash 
        }));
    }
    async getVotes(proposal_hash: string): Promise<any> {
        return mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "votebyhash",
            "data.trace.act.data.proposal_hash": proposal_hash 
        }).toArray());
    }
    async getResult(proposal_hash: string): Promise<any> {
        return mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "logpropres",
            "data.trace.act.data.proposal": proposal_hash 
        }).toArray());
    }
}
