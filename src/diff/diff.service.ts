import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoDbService, RedisService } from '../feature-modules/database';
import { ArticleJson } from '../types/article';
import { diffArticleJson } from '../utils/article-utils/article-differ';
import { WikiService } from '../wiki';

@Injectable()
export class DiffService {
    constructor(private wikiService: WikiService, private mongo: MongoDbService, private redis: RedisService) {}

    async getDiffsByProposal(proposal_ids: Array<number>, metadata_only: boolean = false): Promise<Array<ArticleJson>> {
        const ipfs_hashes = [];
        const proposal_hashes = [];

        // Redis cache get
        const pipeline = this.redis.connection().pipeline();
        for (let proposal_id of proposal_ids) {
            if (metadata_only)
                pipeline.get(`proposal:${proposal_id}:diff:metadata`);
            else
                pipeline.get(`proposal:${proposal_id}:diff`);
        }
        const values = await pipeline.exec();

        const diffs = [];
        const uncached_proposals = [];
        for (let i in values) {
            if (values[i][1])
                diffs.push(JSON.parse(values[i][1]));
            else
                uncached_proposals.push(proposal_ids[i]);
        }

        for (const i in uncached_proposals) {
            const proposal_id = uncached_proposals[i];

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

        const pipeline2 = this.redis.connection().pipeline();
        proposal_hashes.forEach((prop) => {
            const old_wiki = wikis.find((w) => w.ipfs_hash == prop.old_hash);
            const new_wiki = wikis.find((w) => w.ipfs_hash == prop.new_hash);
            try {
                const diff_wiki = diffArticleJson(old_wiki, new_wiki);
                diff_wiki.metadata.push({ key: 'proposal_id', value: prop.proposal_id });

                // cache result
                pipeline2.set(`proposal:${prop.proposal_id}:diff`, JSON.stringify(diff_wiki));
                pipeline2.set(`proposal:${prop.proposal_id}:diff:metadata`, JSON.stringify({ metadata: diff_wiki.metadata }));

                if (metadata_only)
                    diffs.push({ metadata: diff_wiki.metadata });
                else
                    diffs.push(diff_wiki);
            } catch (e) {
                diffs.push({ 
                    error: "Error while diffing proposal " + prop.proposal_id,
                    metadata: [{ key: "proposal_id", value: prop.proposal_id }]
                })
            }
        });
        pipeline2.exec();

        return diffs;
    }
}
