import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoDbService } from '../feature-modules';
import { PreviewService } from '../preview';

@Injectable()
export class ProposalService {
    constructor( private mongo: MongoDbService, private previewService: PreviewService ) {}

    async getProposals(proposal_ids: Array<number>, preview=false, diff_percent=false): Promise<any> {
        const proposals = {};
        
        proposal_ids.forEach(id => proposals[id] = {});
        proposal_ids.forEach(id => proposals[id].info = null);
        proposal_ids.forEach(id => proposals[id].votes = []);
        proposal_ids.forEach(id => proposals[id].result = null);

        const info = await this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'logpropinfo',
            'trace.act.data.proposal_id': { $in: proposal_ids }
        }).toArray();
        info.forEach(doc => proposals[Number(doc.trace.act.data.proposal_id)].info = doc);

        const votes = await this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'vote',
            'trace.act.data.proposal_id': { $in: proposal_ids }
        }).toArray();
        votes.forEach(doc => proposals[Number(doc.trace.act.data.proposal_id)].votes.push(doc));

        const results = await this.mongo.connection().actions.find({
            'trace.act.account': 'eparticlenew',
            'trace.act.name': 'logpropres',
            'trace.act.data.proposal_id': { $in: proposal_ids }
        });
        results.forEach(doc => proposals[Number(doc.trace.act.data.proposal_id)].result = doc);

        if (preview) {
            const ipfs_hashes = [];
            for (const id in proposals) {
                ipfs_hashes.push(proposals[id].info.trace.act.data.ipfs_hash);
            }
            const previews = this.previewService.getWikiPreviews(ipfs_hashes);
            for (const i in ipfs_hashes) {
                proposals[proposal_ids[i]].preview = previews[ipfs_hashes[i]];
            }
        }

        if (diff_percent) {
        }

        return proposals;
    }
}
