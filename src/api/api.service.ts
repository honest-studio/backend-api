import { Injectable } from '@nestjs/common';
import * as mongo from '../mongo.connection';

@Injectable()
export class ApiService {
    async getProposal(proposal_hash: string): Promise<any> {
        const proposal = await mongo.connection().then(con => con.actions.findOne({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "propose",
            "data.trace.act.data.proposed_article_hash": proposal_hash 
        }));
        if (!proposal) return { "error": "Proposal not found" };
        else return proposal;
    }
    async getVotes(proposal_hash: string): Promise<any> {
        return mongo.connection().then(con => con.actions.find({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "votebyhash",
            "data.trace.act.data.proposal_hash": proposal_hash 
        }).toArray());
    }
    async getResult(proposal_hash: string): Promise<any> {
        const result = await mongo.connection().then(con => con.actions.findOne({
            "data.trace.act.account": "eparticlectr",
            "data.trace.act.name": "logpropres",
            "data.trace.act.data.proposal": proposal_hash 
        }));

        if (result) return result;

        const proposal = await this.getProposal(proposal_hash);
        if (proposal.error) return { "error": "Proposal not found" };

        const votes = await this.getVotes(proposal_hash);

        const ret = {
            proposal: proposal_hash,
            approved: false,
            finalized: false,
            yes_votes: 50,
            no_votes: 0
        }

        votes.forEach(function (vote) {
            if (vote.data.trace.act.data.approve)
                ret.yes_votes += vote.data.trace.act.data.amount;
            else
                ret.no_votes += vote.data.trace.act.data.amount;
        });
        if (ret.yes_votes > ret.no_votes) ret.approved = true;

        const starttime = new Date(proposal.data.trace.block_time).getTime();
        const now = new Date().getTime();
        const SIX_HOURS = 6*3600*1000; // in milliseconds
        if (now > starttime + SIX_HOURS)
            ret.finalized = true;

        return ret;

    }
    async getPlagiarism(proposal_hash: string): Promise<any> {
        return { "error": "Not implemented yet" }
    }
    async getWiki(ipfs_hash: string): Promise<any> {
        return { "error": "Not implemented yet" }
    }
}
