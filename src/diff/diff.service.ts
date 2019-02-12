import { Injectable, NotFoundException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';
import { WikiService } from '../wiki';
import { HistoryService } from '../history';
import HtmlDiff from 'htmldiff-js';

@Injectable()
export class DiffService {
    constructor(
        private proposalService: ProposalService,
        private wikiService: WikiService,
        private mongo: MongoDbService,
        private historyService: HistoryService
    ) {}

    async getDiffHistoryWiki(wiki_id: number) {
        const history = await this.historyService.getWikiHistory(wiki_id);
        const proposal_ids = history.map(prop => prop.info.trace.act.data.proposal_id);
        console.log(proposal_ids);
        return this.getDiffsByProposal(proposal_ids);
    }

    async getDiffsByProposal(proposal_ids: Array<number>): Promise<any> {
        const ipfs_hashes = [];

        for (const i in proposal_ids) {
            const proposal_id = proposal_ids[i];
            const proposal = await this.mongo.connection().actions.findOne({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.proposal_id': proposal_id
            });

            if (!proposal)
                throw new NotFoundException(`Proposal ${proposal_id} could not be found`);

            const new_hash = proposal.trace.act.data.ipfs_hash;
            const wiki_id = proposal.trace.act.data.wiki_id;

            let old_hash;
            if (wiki_id == -1) {
                // The proposal doesn't have a parent
                // Qmc5m94Gu7z62RC8waSKkZUrCCBJPyHbkpmGzEePxy2oXJ is an empty file
                old_hash = "Qmc5m94Gu7z62RC8waSKkZUrCCBJPyHbkpmGzEePxy2oXJ";
            }
            else {
                const lastpropres = await this.mongo.connection().actions.find({
                    'trace.act.account': 'eparticlectr',
                    'trace.act.name': 'logpropres',
                    'trace.act.data.wiki_id': wiki_id,
                    'trace.act.data.proposal_id': { $lt: proposal_id }
                })
                .sort({ 'trace.act.data.proposal_id': -1 })
                .limit(1)
                .toArray();

                old_hash = lastpropres[0].trace.act.data.ipfs_hash;    
                if (!old_hash) {
                    const lastpropid = lastpropres[0].trace.act.data.proposal_id;
                    const lastpropinfo = await this.mongo.connection().actions.findOne({
                        'trace.act.account': 'eparticlectr',
                        'trace.act.name': 'logpropinfo',
                        'trace.act.data.proposal_id': lastpropid
                    })
                    old_hash = lastpropinfo.trace.act.data.ipfs_hash;    
                }
            }

            ipfs_hashes.push([ old_hash, new_hash ]);
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
