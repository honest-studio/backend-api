import { Injectable } from '@nestjs/common';
import { MongoDbService, MysqlService } from '../feature-modules/database';
import { IpfsService } from '../common';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';
import { WikiService } from '../wiki/wiki.service';
import { PreviewService } from '../preview/preview.service';
import { DiffService } from '../diff/diff.service';
import HtmlDiff from 'htmldiff-js';
import * as cheerio from 'cheerio';

@Injectable()
export class RecentActivityService {
    constructor(private mongo: MongoDbService, private mysql: MysqlService, private ipfs: IpfsService, private previewService: PreviewService, private diffService: DiffService) {}

    async getAll(query): Promise<Array<EosAction<any>>> {
        const docs = this.mongo.connection().actions.find({
            'data.trace.act.account': 'eparticlectr'
        });
        return docs
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getResults(query): Promise<Array<EosAction<ProposalResult>>> {
        const results = this.mongo.connection().actions.find({
            'data.trace.act.account': 'eparticlectr',
            'data.trace.act.name': 'logpropres'
        });
        return results
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getProposals(query): Promise<Array<EosAction<Propose>>> {
        const docs = this.mongo.connection().actions.find({
            'data.trace.act.account': 'eparticlectr',
            'data.trace.act.name': 'propose'
        });

        const proposals = await docs
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        if (query.preview) {
            const proposal_hashes = proposals.map(p => p.data.trace.act.data.proposed_article_hash);
            const previews = await this.previewService.getWikiPreviews(proposal_hashes);
            for (const i in proposals) {
                proposals[i].preview = previews[proposal_hashes[i]];
            }
        }

        if (query.diff_percent) {
            const proposal_hashes = proposals.map(p => p.data.trace.act.data.proposed_article_hash);
            const diffs = await this.diffService.getDiffsByProposal(proposal_hashes);
            for (const i in proposals) {
                if (!diffs[i].error)
                    proposals[i].diff_percent = diffs[i].diff_percent;
                else
                    proposals[i].diff_percent = null;
            }
        }

        return proposals;
    }

    async getVotes(query): Promise<Array<EosAction<Vote>>> {
        const votes = this.mongo.connection().actions.find({
            'data.trace.act.account': 'eparticlectr',
            'data.trace.act.name': 'votebyhash'
        });
        return votes
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getWikis(query): Promise<Array<EosAction<ProposalResult>>> {
        const results = this.mongo.connection().actions.find({
            'data.trace.act.account': 'eparticlectr',
            'data.trace.act.name': 'logpropres',
            'data.trace.act.data.approved': 1
        });
        return results
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }
}
