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
        });
        return results
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getProposals(query): Promise<Array<EosAction<Propose>>> {
        const proposal_id_docs = await this.mongo.connection().actions.find({
                'trace.act.account': 'eparticlenew',
                'trace.act.name': 'logpropinfo'
            }, { projection: { 'trace.act.data.proposal_id': 1 }})
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
        console.log(proposal_id_docs);
        
        const proposal_ids = proposal_id_docs.map(doc => doc.trace.act.data.proposal_id);
        console.log(proposal_ids);

        return this.proposalService.getProposals(proposal_ids, query.preview, query.diff_percent);
    }

    async getVotes(query): Promise<Array<EosAction<Vote>>> {
        const votes = this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'vote'
        });
        return votes
            .sort({ 'data.block_num': -1 })
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
