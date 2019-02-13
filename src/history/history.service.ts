import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';

@Injectable()
export class HistoryService {
    constructor(
        private mongo: MongoDbService,
        @Inject(forwardRef(() => ProposalService)) private proposalService: ProposalService
    ) {}

    async getWikiHistory(wiki_id: number): Promise<Array<any>> {
        const proposal_id_docs = await this.mongo
            .connection()
            .actions.find(
                {
                    'trace.act.account': 'eparticlectr',
                    'trace.act.name': { $in: ['logpropres', 'logpropinfo'] },
                    'trace.act.data.wiki_id': wiki_id
                },
                { projection: { 'trace.act.data.proposal_id': 1 } }
            )
            .toArray();
        const proposal_ids = proposal_id_docs
            .map((doc) => doc.trace.act.data.proposal_id)
            .filter((v, i, arr) => arr.indexOf(v) === i) // get unique values
            .map(Number);

        const proposals = await this.proposalService.getProposals(proposal_ids);
        return Object.keys(proposals)
            .map(Number)
            .sort((a, b) => b - a)
            .map((proposal_id) => proposals[proposal_id]);
    }
}
