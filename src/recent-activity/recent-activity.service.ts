import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../feature-modules/database';
import { ProposalService, Proposal } from '../proposal';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';

@Injectable()
export class RecentActivityService {
    constructor(private mongo: MongoDbService, private proposalService: ProposalService) {}

    async getAll(query): Promise<Array<EosAction<any>>> {
        const docs = this.mongo.connection().actions.find({});
        return docs
            .sort({ block_num: -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getArticleActions(query): Promise<Array<EosAction<any>>> {
        const results = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr'
            })
            .sort({ block_num: -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        return results;
    }

    async getTokenActions(query): Promise<Array<EosAction<any>>> {
        const results = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'everipediaiq'
            })
            .sort({ block_num: -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        return results;
    }

    async getProposals(query): Promise<Array<Proposal>> {
        let find_query;
        if (query.expiring) {
            const now = Date.now() / 1000 | 0;
            find_query = {
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.endtime': { $lt: now }
            }
        }
        else {
            find_query = {
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo'
            }
        }
        const proposal_id_docs = await this.mongo.connection()
            .actions.find( 
                find_query,
                { projection: { 'trace.act.data.proposal_id': 1 } }
            )
            .sort({ block_num: -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        const proposal_ids = proposal_id_docs.map((doc) => doc.trace.act.data.proposal_id);
        const proposal_options = { 
            preview: query.preview,
            diff: query.diff 
        };
        const proposals = await this.proposalService.getProposals(proposal_ids, proposal_options);

        return Object.keys(proposals)
            .map(Number)
            .sort((a, b) => b - a)
            .map((proposal_id) => proposals[proposal_id]);
    }

}
