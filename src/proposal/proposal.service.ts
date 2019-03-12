import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PreviewService } from '../preview';
import { DiffService } from '../diff';
import { MongoDbService, EosAction, Propose, ProposalResult, Vote } from '../feature-modules/database';

export type Proposal = {
    proposal_id: number;
    info: EosAction<Propose>;
    result: EosAction<ProposalResult>;
    votes: Array<EosAction<Vote>>;
    preview?: any;
    diff?: any;
};

export type ProposalOptions = {
    preview: boolean;
    diff: 'full' | 'percent' | 'none';
};

@Injectable()
export class ProposalService {
    constructor(
        private mongo: MongoDbService,
        private previewService: PreviewService,
        @Inject(forwardRef(() => DiffService)) private diffService: DiffService
    ) {}

    async getProposals(proposal_ids: Array<number>, options: ProposalOptions): Promise<Array<Proposal>> {
        const proposals: Array<any> = proposal_ids.map((proposal_id) => {
            return { proposal_id };
        });

        const info = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.proposal_id': { $in: proposal_ids }
            })
            .toArray();
        info.forEach((doc) => (proposals.find((p) => p.proposal_id == doc.trace.act.data.proposal_id).info = doc));
        proposals
            .filter((p) => !p.info)
            .forEach((p) => (p.info = { error: `Proposal ${p.proposal_id} could not be found` }));

        const votes = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'vote',
                'trace.act.data.proposal_id': { $in: proposal_ids }
            })
            .toArray();
        proposals.forEach((prop) => (prop.votes = []));
        votes.forEach((vote) =>
            proposals.find((p) => p.proposal_id == vote.trace.act.data.proposal_id).votes.push(vote)
        );

        const results = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropres',
                'trace.act.data.proposal_id': { $in: proposal_ids }
            })
            .toArray();
        results.forEach(
            (result) => (proposals.find((p) => p.proposal_id == result.trace.act.data.proposal_id).result = result)
        );
        proposals
            .filter((p) => !p.result)
            .forEach((p) => (p.result = { error: `Proposal ${p.proposal_id} has not finalized` }));

        if (options.preview) {
            const ipfs_hashes = proposals.filter((p) => !p.info.error).map((p) => p.info.trace.act.data.ipfs_hash);
            const previews = await this.previewService.getWikiPreviews(ipfs_hashes);
            previews.forEach(
                (preview) =>
                    (proposals.find((p) => p.info.trace.act.data.ipfs_hash === preview.ipfs_hash).preview = preview)
            );
        }

        if (options.diff != 'none') {
            const diffs = await this.diffService.getDiffsByProposal(proposal_ids);
            if (options.diff === 'percent') diffs.forEach((diff) => delete diff.diff_wiki);
            diffs.forEach((diff) => (proposals.find((p) => p.proposal_id == diff.proposal_id).diff = diff));
        }

        return proposals;
    }
}
