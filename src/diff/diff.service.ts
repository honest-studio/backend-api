import { Injectable, NotFoundException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';
import { WikiService } from '../wiki';
import HtmlDiff from 'htmldiff-js';

@Injectable()
export class DiffService {
    constructor(private proposalService: ProposalService, private wikiService: WikiService, private mongo: MongoDbService) {}

    async getDiffByProposal(proposal_hash: string): Promise<any> {
        const proposal = await this.proposalService.getProposal(proposal_hash);
        const old_hash = proposal.data.trace.act.data.old_article_hash;
        const new_hash = proposal_hash;
        return this.getDiffByWiki(old_hash, new_hash);
    }

    async getDiffsByProposal(proposal_hashes: Array<string>): Promise<any> {
        const proposals = await this.proposalService.getProposals(proposal_hashes);
        const ipfs_hashes = proposals.map(p => [
            p.data.trace.act.data.old_article_hash, 
            p.data.trace.act.data.proposed_article_hash
        ]);
        return this.getDiffsByWiki(ipfs_hashes);
    }

    async getDiffByWiki(old_hash: string, new_hash: string): Promise<any> {
        const cache = this.mongo.connection().diffs.findOne({ old_hash, new_hash });
        if (cache) return cache;

        const wikis = this.wikiService.getWikisByHash([old_hash, new_hash]);
        const old_wiki = wikis[old_hash];
        const new_wiki = wikis[new_hash];
        if (old_wiki === null)
            throw new NotFoundException("Old wiki could not be found");
        if (new_wiki === null)
            throw new NotFoundException("New wiki could not be found");

        const diff_wiki = HtmlDiff.execute(old_wiki, new_wiki);
        const diff_words = diff_wiki.split(' ').length;
        const old_hash_words = old_wiki.split(' ').length;
        const diff_percent = (((diff_words - old_hash_words) / diff_words) * 100).toFixed(2);

        // cache result
        const doc = { old_hash, new_hash, diff_percent, diff_wiki };
        await this.mongo.connection().diffs.insertOne(doc);

        return doc;
    }

    async getDiffsByWiki(ipfs_hashes: Array<Array<string>>): Promise<any> {
        const diffs = [];
        const docs = []; // documents to add to MongoDB cache

        for (const i in ipfs_hashes) {
            const old_hash = ipfs_hashes[i][0];
            const new_hash = ipfs_hashes[i][1];
            const cache = this.mongo.connection().diffs.findOne({ old_hash, new_hash });
            if (cache) diffs[i] = cache;
            else diffs[i] = null;
        }

        const flattened_hashes = [].concat(...ipfs_hashes);
        const wikis = this.wikiService.getWikisByHash(flattened_hashes);

        for (const i in ipfs_hashes) {
            if (diffs[i] !== null)
                continue;

            const old_hash = ipfs_hashes[i][0];
            const new_hash = ipfs_hashes[i][1];
            const old_wiki = wikis[old_hash];
            const new_wiki = wikis[new_hash];
            if (old_wiki === null)
                diffs.push({ "error": "Old wiki could not be found" });
            if (new_wiki === null)
                diffs.push({ "error": "New wiki could not be found" });

            const diff_wiki = HtmlDiff.execute(old_wiki, new_wiki);
            const diff_words = diff_wiki.split(' ').length;
            const old_hash_words = old_wiki.split(' ').length;
            const diff_percent = (((diff_words - old_hash_words) / diff_words) * 100).toFixed(2);

            const doc = { old_hash, new_hash, diff_percent, diff_wiki };
            docs.push(doc);
            diffs[i] = doc;
        }

        await this.mongo.connection().diffs.insert(docs);

        return diffs;
    }
}
