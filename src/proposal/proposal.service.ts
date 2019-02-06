import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoDbService } from '../feature-modules';
import * as fetch from 'node-fetch';
import { ConfigService, CopyLeaksConfig, IpfsService } from '../common';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';
import { WikiService } from '../wiki/wiki.service';
import HtmlDiff from 'htmldiff-js';

@Injectable()
export class ProposalService {
    private readonly copyLeaksConfig: CopyLeaksConfig;

    constructor(
        config: ConfigService,
        private ipfs: IpfsService,
        private mongo: MongoDbService,
        private wikiService: WikiService
    ) {
        this.copyLeaksConfig = config.get('copyLeaksConfig');
    }

    async getProposal(proposal_id: number): Promise<EosAction<Propose>> {
        const proposal = await this.mongo.connection().actions.findOne({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'logpropinfo',
            'trace.act.data.proposal_id': proposal_id
        });
        if (!proposal) throw new NotFoundException('Proposal not found');
        else return proposal;
    }

    async getProposals(proposal_ids: Array<number>): Promise<Array<EosAction<Propose>>> {
        return this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'logpropinfo',
            'trace.act.data.proposal_id': { $in: proposal_ids }
        }).toArray();
    }

    async getVotes(proposal_id: number): Promise<Array<EosAction<Vote>>> {
        return this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlenew',
                'trace.act.name': 'vote',
                'trace.act.data.proposal_id': proposal_id
            })
            .toArray();
    }
    async getResult(proposal_id: number): Promise<ProposalResult> {
        const result = await this.mongo.connection().actions.findOne({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'logpropres',
            'trace.act.data.proposal_id': proposal_id
        });

        if (result) return result.trace.act.data;

        const proposal = await this.getProposal(proposal_id);
        if (proposal.error) throw new NotFoundException('Proposal not found');

        const votes = await this.getVotes(proposal_id);

        const ret = {
            proposal_id: proposal_id,
            wiki_id: proposal.trace.act.data.wiki_id,
            approved: 0,
            yes_votes: 50,
            no_votes: 0
        };

        votes.forEach(function(vote) {
            if (vote.trace.act.data.approve) ret.yes_votes += vote.trace.act.data.amount;
            else ret.no_votes += vote.trace.act.data.amount;
        });
        if (ret.yes_votes > ret.no_votes) ret.approved = 1;

        const starttime = new Date(proposal.trace.block_time).getTime();
        const now = new Date().getTime();
        const SIX_HOURS = 6 * 3600 * 1000; // in milliseconds
        if (now < starttime + SIX_HOURS) ret.approved = -1;

        return ret;
    }
}
