import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';

@Injectable()
export class RecentActivityService {
    constructor(private mongo: MongoDbService, private proposalService: ProposalService) {}

    async getAll(query): Promise<Array<EosAction<any>>> {
        const docs = this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlenew'
        });
        return docs
            .sort({ 'block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getResults(query): Promise<Array<EosAction<ProposalResult>>> {
        const results = await this.mongo.connection().actions.find({
                'trace.act.account': 'eparticlenew',
                'trace.act.name': 'logpropres'
            })
            .sort({ 'block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        return results;
    }

    async getProposals(query): Promise<Array<EosAction<Propose>>> {
        const proposal_id_docs = await this.mongo.connection().actions.find({
                'trace.act.account': 'eparticlenew',
                'trace.act.name': 'logpropinfo'
            }, { projection: { 'trace.act.data.proposal_id': 1 }})
            .sort({ 'block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
        
        const proposal_ids = proposal_id_docs.map(doc => doc.trace.act.data.proposal_id);
        const proposals = await this.proposalService.getProposals(proposal_ids, query.preview, query.diff_percent);

        return Object.keys(proposals)
            .map(Number)
            .sort((a,b) => b - a)
            .map(proposal_id => proposals[proposal_id])
    }

    async getVotes(query): Promise<Array<EosAction<Vote>>> {
        const votes = this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'vote'
        });
        return votes
            .sort({ 'block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getWikis(query): Promise<Array<EosAction<ProposalResult>>> {
        const results = this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'logpropres',
            'trace.act.data.approved': 1
        });
        return results
            .sort({ 'block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }
}
