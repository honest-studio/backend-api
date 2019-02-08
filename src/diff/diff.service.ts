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

    async getDiffsByProposal(proposal_ids: Array<number>): Promise<any> {
        for (const in proposal_ids) {
            const proposal_id = proposal_ids[i];
            const docs = await this.mongo.connection().actions.find({
                'trace.act.account': 'eparticlenew',
                'trace.act.name': { $in: ['logpropres', 'logpropinfo'] },
                'trace.act.data.proposal_id': proposal_id
            }).toArray();

            let wiki_id;
            if (docs[0].trace.act.data.wiki_id != -1)
                wiki_id = docs[0].trace.act.data.wiki_id;
            else (docs[0].trace.act.data.wiki_id != -1)
                wiki_id = docs[0].trace.act.data.wiki_id;
        }

        return this.getDiffsByWiki(ipfs_hashes);
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
            diffs[i] = { error: `Wiki ${old_hash} could not be found`, statusCode: 404 };
                continue;
            }
            else if (!new_wiki) { 
                diffs[i] = { error: `Wiki ${new_hash} could not be found`, statusCode: 404 };
                continue;
            }

            const diff_wiki = HtmlDiff.execute(old_wiki, new_wiki);
            const diff_words = diff_wiki.split(' ').length;
            const old_hash_words = old_wiki.split(' ').length;

            // Why am I multiplying by 3? Because I feel like it and the numbers come out better. 
            // The algo is shitty anyway. I might as well insert an unjustified constant in there.
            // If you have a problem with it go make your own algo
            const diff_percent = (((diff_words - old_hash_words) / diff_words) * 3).toFixed(2);

            const doc = { old_hash, new_hash, diff_percent, diff_wiki };
            docs.push(doc);
            diffs[i] = doc;
        }

        var cache_docs = docs.filter(doc => !doc.error);
        if (cache_docs.length > 0)
            await this.mongo.connection().diffs.insertMany(cache_docs);

        return diffs;
    }
}
