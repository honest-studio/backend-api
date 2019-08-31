import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiffService } from '../diff';
import { EosAction, MongoDbService, MysqlService, RedisService, ProposalResult, Propose, Vote } from '../feature-modules/database';
import { PreviewService } from '../preview';
import { BrowserInfo } from 'detect-browser';

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
    diff: 'full' | 'metadata' | 'none';
    user_agent: string;
};

@Injectable()
export class ProposalService {
    constructor(
        private mongo: MongoDbService,
        private mysql: MysqlService,
        @Inject(forwardRef(() => PreviewService)) private previewService: PreviewService,
        private redis: RedisService,
        @Inject(forwardRef(() => DiffService)) private diffService: DiffService
    ) {}

    async getProposals(proposal_ids: Array<number>, options: ProposalOptions): Promise<Array<Proposal>> {
        const proposals: Array<any> = proposal_ids.map((proposal_id) => {
            return { proposal_id };
        });

        const pipeline = this.redis.connection().pipeline();
        proposal_ids.forEach(proposal_id => pipeline.get(`proposal:${proposal_id}:info`));
        proposal_ids.forEach(proposal_id => pipeline.smembers(`proposal:${proposal_id}:votes`));
        proposal_ids.forEach(proposal_id => pipeline.get(`proposal:${proposal_id}:result`));
        const values = await pipeline.exec();

        const len = proposal_ids.length;
        for (let i=0; i < len; i++) {
            const proposal_id = proposal_ids[i];
            proposals[i].info = JSON.parse(values[i][1]);
            if (!proposals[i].info)
                proposals[i].info = { error: `Proposal ${proposal_id} could not be found` };
            try {
                proposals[i].votes = values[i + len][1].map(v => JSON.parse(v));
            } catch {
                proposals[i].votes = [];
            }
            proposals[i].result = JSON.parse(values[i + 2*len][1]);
            if (!proposals[i].result)
                proposals[i].result = { error: `Proposal ${proposal_id} has not finalized` };
        }

        if (options.preview) {
            const packs = proposals
                .filter((p) => !p.info.error)
                .map((p) => ({ lang_code: p.info.trace.act.data.lang_code, slug: p.info.trace.act.data.slug }));
            let previews;
            try {
                previews = await this.previewService.getPreviewsBySlug(packs, options.user_agent as any);
            } catch (e) {
                if (e.message.error == "Could not find wikis") previews = [];
                else throw e;
            }

            previews.forEach((preview) => {
                proposals.forEach(p => {
                    if (!p.info.error && this.mysql.cleanSlugForMysql(p.info.trace.act.data.slug) === preview.slug)
                        p.preview = preview;
                })
            });

            // mark unfound previews
            proposals.forEach(p => {
                if (p.info.error)
                    p.preview = { error: `Non-existent proposal` };
                else if (!p.preview) 
                    p.preview = { error: `Could not find preview for ${p.info.trace.act.data.lang_code}/${p.info.trace.act.data.slug}` };
            });
        }

        if (options.diff != 'none') {
            const metadata_only = (options.diff == "metadata");
            const diffs = await this.diffService.getDiffsByProposal(proposal_ids, metadata_only, options.cache );
            diffs.forEach(diff => {
                const diff_proposal_id = diff.metadata.find(m => m.key == 'proposal_id').value;
                const proposal = proposals.find((p) => p.proposal_id == diff_proposal_id);
                proposal.diff = diff;
            });
        }

        return proposals;
    }
}
