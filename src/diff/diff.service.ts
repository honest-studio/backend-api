import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';
import { WikiService } from '../wiki';
import HtmlDiff from 'htmldiff-js';

@Injectable()
export class DiffService {
    constructor(
        @Inject(forwardRef(() => ProposalService)) private proposalService: ProposalService,
        private wikiService: WikiService,
        private mongo: MongoDbService
    ) {}

    async getDiffsByProposal(proposal_ids: Array<number>): Promise<any> {
        const ipfs_hashes = [];

        for (const i in proposal_ids) {
            const proposal_id = proposal_ids[i];
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

            // the 3rd element doesn't get used by the diff and is for our
            // tracking purposes
            ipfs_hashes.push([old_hash, new_hash, proposal_id]);
        }

        const diffs = await this.getDiffsByWiki(ipfs_hashes);
        diffs.forEach((diff) => (diff.proposal_id = ipfs_hashes.find((row) => row[1] === diff.new_hash)[2]));

        return diffs;
    }

    async getDiffsByWiki(ipfs_hashes: Array<Array<string>>): Promise<any> {
        const diffs = [];
        const docs = []; // documents to add to MongoDB cache

        // trim any extra data that might be passed into the argument
        ipfs_hashes = ipfs_hashes.map((arr) => arr.slice(0, 2));

        for (const i in ipfs_hashes) {
            const old_hash = ipfs_hashes[i][0];
            const new_hash = ipfs_hashes[i][1];
            const cache = await this.mongo.connection().diffs.findOne({ old_hash, new_hash });
            if (cache) diffs.push(cache);
            else diffs.push(null);
        }

        const flattened_hashes = [].concat(...ipfs_hashes);
        const wikis = await this.wikiService.getWikisByHash(flattened_hashes);

        for (const i in ipfs_hashes) {
            if (diffs[i] !== null) continue;

            const old_hash = ipfs_hashes[i][0];
            const new_hash = ipfs_hashes[i][1];
            const old_wiki = wikis.find((w) => w.ipfs_hash == old_hash);
            const new_wiki = wikis.find((w) => w.ipfs_hash == new_hash);
            if (old_wiki.error) {
                diffs[i] = { error: old_wiki.error, old_hash, new_hash };
                continue;
            } else if (new_wiki.error) {
                diffs[i] = { error: new_wiki.error, old_hash, new_hash };
                continue;
            }

            const diff_wiki = HtmlDiff.execute(old_wiki.wiki, new_wiki.wiki);
            const diff_words = diff_wiki.split(' ').length;
            const old_hash_words = old_wiki.wiki.split(' ').length;

            // Why am I multiplying by 3? Because I feel like it and the numbers come out better.
            // The algo is shitty anyway. I might as well insert an unjustified constant in there.
            // If you have a problem with it go make your own algo
            //const diff_percent = (((diff_words - old_hash_words) / diff_words) * 3).toFixed(2);
            const diff_percent = Math.random().toFixed(2);

            const doc = { old_hash, new_hash, diff_percent, diff_wiki };
            docs.push(doc);
            diffs[i] = doc;
        }

        var cache_docs = docs.filter((doc) => !doc.error);
        if (cache_docs.length > 0) await this.mongo.connection().diffs.insertMany(cache_docs);

        return diffs;
    }
}
