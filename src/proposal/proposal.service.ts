import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { MongoDbService } from '../feature-modules';
import { PreviewService } from '../preview';
import { DiffService } from '../diff';

@Injectable()
export class ProposalService {
    constructor(
        private mongo: MongoDbService,
        private previewService: PreviewService,
        @Inject(forwardRef(() => DiffService)) private diffService: DiffService
    ) {}

    async getProposals(
        proposal_ids: Array<number>,
        preview: boolean = false,
        diff_percent: boolean = false
    ): Promise<any> {
        const proposals = {};

        proposal_ids.forEach((id) => (proposals[id] = {}));
        proposal_ids.forEach((id) => (proposals[id].info = null));
        proposal_ids.forEach((id) => (proposals[id].votes = []));
        proposal_ids.forEach((id) => (proposals[id].result = null));

        const info = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.proposal_id': { $in: proposal_ids }
            })
            .toArray();
        info.forEach((doc) => (proposals[doc.trace.act.data.proposal_id].info = doc));

        const votes = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'vote',
                'trace.act.data.proposal_id': { $in: proposal_ids }
            })
            .toArray();
        votes.forEach((doc) => proposals[doc.trace.act.data.proposal_id].votes.push(doc));

        const results = await this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlectr',
            'trace.act.name': 'logpropres',
            'trace.act.data.proposal_id': { $in: proposal_ids }
        });
        results.forEach((doc) => (proposals[doc.trace.act.data.proposal_id].result = doc));

        if (preview) {
            const ipfs_hashes = [];
            for (const id in proposals) {
                ipfs_hashes.push(proposals[id].info.trace.act.data.ipfs_hash);
            }
            const previews = await this.previewService.getWikiPreviews(ipfs_hashes);
            for (const i in ipfs_hashes) {
                proposals[proposal_ids[i]].preview = previews[ipfs_hashes[i]];
            }
        }

        if (diff_percent) {
            const diffs = await this.diffService.getDiffsByProposal(proposal_ids);
            for (const i in diffs) {
                proposals[proposal_ids[i]].diff_percent = diffs[i].diff_percent;
            }
        }

        return proposals;
    }
}
