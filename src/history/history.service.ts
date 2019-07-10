import { Injectable } from '@nestjs/common';
import { DiffService } from '../diff';
import { MongoDbService, MysqlService } from '../feature-modules/database';
import { Proposal, ProposalOptions, ProposalService } from '../proposal';

@Injectable()
export class HistoryService {
    constructor(
        private mongo: MongoDbService,
        private mysql: MysqlService,
        private proposalService: ProposalService,
        private diffService: DiffService
    ) {}

    async getWikiHistory(lang_code: string, slug: string, options: ProposalOptions): Promise<Array<Proposal>> {
        // the slugs are sometimes getting submitted with URL encoding
        // idk why, I just work with what I have ¯\_(ツ)_/¯
        // so we search for both regular and encoded slugs
        const mysql_slug = this.mysql.cleanSlugForMysql(slug);
        let proposal_id_docs = await this.mongo
            .connection()
            .actions.find(
                {
                    'trace.act.account': 'eparticlectr',
                    'trace.act.name': 'logpropinfo',
                    $or: [
                        { 'trace.act.data.slug': slug },
                        { 'trace.act.data.slug': mysql_slug },
                    ],
                    'trace.act.data.lang_code': lang_code
                },
                { projection: { 'trace.act.data.proposal_id': 1 } }
            )
            .sort({ 'trace.act.data.proposal_id': -1 })
            .toArray();

        // If the proposal isn't found yet, try more slugs 
        if (!proposal_id_docs.length){
            proposal_id_docs = await this.mongo
            .connection()
            .actions.find(
                {
                    'trace.act.account': 'eparticlectr',
                    'trace.act.name': 'logpropinfo',
                    $or: [
                        { 'trace.act.data.slug': encodeURIComponent(slug) },
                        { 'trace.act.data.slug': encodeURIComponent(mysql_slug) },
                    ],
                    'trace.act.data.lang_code': lang_code
                },
                { projection: { 'trace.act.data.proposal_id': 1 } }
            )
            .sort({ 'trace.act.data.proposal_id': -1 })
            .toArray();
        }

        const proposal_ids = proposal_id_docs
            .map((doc) => doc.trace.act.data.proposal_id)
            .filter((v, i, arr) => arr.indexOf(v) === i) // get unique values
            .map(Number);

        const proposals = await this.proposalService.getProposals(proposal_ids, options);

        return proposals;
    }
}
