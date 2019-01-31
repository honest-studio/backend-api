import { Injectable, NotFoundException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';
import { WikiService } from '../wiki';
import HtmlDiff from 'htmldiff-js';

@Injectable()
export class DiffService {
    constructor(
        private proposalService: ProposalService,
        private wikiService: WikiService,
        private mongo: MongoDbService
    ) {}

    async getDiffByProposal(proposal_hash: string): Promise<any> {
        return this.getDiffsByProposal([ proposal_hash ]);
    }

    async getDiffsByProposal(proposal_hashes: Array<string>): Promise<any> {
        const proposals = await this.proposalService.getProposals(proposal_hashes);
        const ipfs_hashes = proposals.map((p) => [
            p.data.trace.act.data.old_article_hash,
            p.data.trace.act.data.proposed_article_hash
        ]);
        return this.getDiffsByWiki(ipfs_hashes);
    }

    async getDiffByWiki(old_hash: string, new_hash: string): Promise<any> {
        const diffs = await this.getDiffsByWiki([[ old_hash, new_hash ]]);
        if (diffs[0].error && diffs[0].statusCode == 404)
            throw new NotFoundException(diffs[0].error);
        return diffs[0];
    }

    async getDiffsByWiki(ipfs_hashes: Array<Array<string>>): Promise<any> {
        const diffs = [];
        const docs = []; // documents to add to MongoDB cache

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
            const old_wiki = wikis[old_hash];
            const new_wiki = wikis[new_hash];
            if (!old_wiki) { 
            diffs[i] = { error: `${old_hash} could not be found`, statusCode: 404 };
                continue;
            }
            else if (!new_wiki) { 
                diffs[i] = { error: `${new_hash} could not be found`, statusCode: 404 };
                continue;
            }

            const diff_wiki = HtmlDiff.execute(old_wiki, new_wiki);
            const diff_words = diff_wiki.split(' ').length;
            const old_hash_words = old_wiki.split(' ').length;
            const diff_percent = (((diff_words - old_hash_words) / diff_words) * 100).toFixed(2);

            const doc = { old_hash, new_hash, diff_percent, diff_wiki };
            docs.push(doc);
            diffs[i] = doc;
        }

        var cache_docs = docs.filter(doc => !doc.error);
        if (cache_docs.length > 0)
            await this.mongo.connection().diffs.insert(cache_docs);

        return diffs;
    }
}
