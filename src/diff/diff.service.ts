import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { MongoDbService } from '../feature-modules/database';
import { WikiService } from '../wiki';
import { diffArticleJson } from '../utils/article-utils/article-differ';
import { ArticleJson } from '../utils/article-utils/article-dto';

@Injectable()
export class DiffService {
    constructor(private wikiService: WikiService, private mongo: MongoDbService) {}

    async getDiffsByProposal(proposal_ids: Array<number>): Promise<Array<ArticleJson>> {
        const ipfs_hashes = [];
        const proposal_hashes = [];

        const diffs = [];
        for (const i in proposal_ids) {
            const proposal_id = proposal_ids[i];

            // check for cached diff
            const cached_diff = await this.mongo.connection().diffs.findOne({ 
                metadata: { $elemMatch: { key: 'proposal_id', 'value': proposal_id }}
            })
            if (cached_diff) {
                diffs.push(cached_diff);
                continue;
            }

            const proposal = await this.mongo.connection().actions.findOne({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.proposal_id': proposal_id
            });

            if (!proposal) throw new NotFoundException(`Proposal ${proposal_id} could not be found`);

            const new_hash = proposal.trace.act.data.ipfs_hash;
            const wiki_id = proposal.trace.act.data.wiki_id;

            const old_proposals = await this.mongo
                .connection()
                .actions.find({
                    'trace.act.account': 'eparticlectr',
                    'trace.act.name': 'logpropinfo',
                    'trace.act.data.wiki_id': wiki_id,
                    'trace.act.data.proposal_id': { $lt: proposal_id }
                })
                .sort({ 'trace.act.data.proposal_id': -1 })
                .limit(1)
                .toArray();

            let old_hash;
            if (old_proposals.length == 0)
                // The proposal doesn't have a parent
                // Qmc5m94Gu7z62RC8waSKkZUrCCBJPyHbkpmGzEePxy2oXJ is an empty file
                old_hash = 'Qmc5m94Gu7z62RC8waSKkZUrCCBJPyHbkpmGzEePxy2oXJ';
            else old_hash = old_proposals[0].trace.act.data.ipfs_hash;

            ipfs_hashes.push(old_hash, new_hash);
            proposal_hashes.push({ proposal_id, old_hash, new_hash });
        }
        const wikis = await this.wikiService.getWikisByHash(ipfs_hashes);

        proposal_hashes.forEach((prop) => {
            const old_wiki = wikis.find((w) => w.ipfs_hash == prop.old_hash);
            const new_wiki = wikis.find((w) => w.ipfs_hash == prop.new_hash);
            try {
                const diff_wiki = diffArticleJson(old_wiki, new_wiki);
                diff_wiki.metadata.push({ key: 'proposal_id', value: prop.proposal_id });

                // cache result
                this.mongo.connection().diffs.insertOne(diff_wiki);

                diffs.push(diff_wiki);
            } catch (e) {
                diffs.push({ error: "Error while diffing proposal " + prop.proposal_id });
            }
        });

        return diffs;
    }

    // TODO: add caching
    async getDiffByHash(old_hash: string, new_hash: string): Promise<ArticleJson> {
        const cached_diff = await this.mongo
            .connection()
            .diffs.findOne({
            })

        const wikis = await this.wikiService.getWikisByHash([old_hash, new_hash]);

        const old_wiki = wikis.find((w) => w.ipfs_hash == old_hash);
        const new_wiki = wikis.find((w) => w.ipfs_hash == new_hash);
        const diff_wiki = await diffArticleJson(old_wiki, new_wiki);

        // cache result
        this.mongo.connection().diffs.insertOne(diff_wiki);

        return diff_wiki;
    }

}
