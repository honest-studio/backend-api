import { Injectable } from '@nestjs/common';
import { DiffService } from '../diff';
import { MongoDbService } from '../feature-modules/database';
import { Proposal, ProposalOptions, ProposalService } from '../proposal';

@Injectable()
export class HistoryService {
    constructor(
        private mongo: MongoDbService,
        private proposalService: ProposalService,
        private diffService: DiffService
    ) {}

    async getWikiHistory(lang_code: string, slug: string, options: ProposalOptions): Promise<Array<Proposal>> {
        const proposal_id_docs = await this.mongo
            .connection()
            .actions.find(
                {
                    'trace.act.account': 'eparticlectr',
                    'trace.act.name': 'logpropinfo',
                    'trace.act.data.slug': slug,
                    'trace.act.data.lang_code': lang_code
                },
                { projection: { 'trace.act.data.proposal_id': 1 } }
            )
            .sort({ 'trace.act.data.proposal_id': -1 })
            .toArray();
        const proposal_ids = proposal_id_docs
            .map((doc) => doc.trace.act.data.proposal_id)
            .filter((v, i, arr) => arr.indexOf(v) === i) // get unique values
            .map(Number);

        const proposals = await this.proposalService.getProposals(proposal_ids, options);

        return proposals;
    }
}
