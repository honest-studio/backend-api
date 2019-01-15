import { Injectable } from '@nestjs/common';
import { MongoDbService, MysqlService } from '../feature-modules/database';
import { IpfsService } from '../common';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';

@Injectable()
export class RecentActivityService {
    constructor(private mongo: MongoDbService, private mysql: MysqlService) {}

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
            const joined_hashes = proposals
                .map((p) => p.data.trace.act.data.proposed_article_hash)
                .map((h) => `"${h}"`) // wrap each hash in quotes
                .join(',');
            const article_info: Array<any> = await new Promise((resolve, reject) => {
                this.mysql.pool().query(
                    `
                    SELECT art.page_title, art.photo_url, art.photo_thumb_url, art.page_lang, cache.ipfs_hash
                    FROM enterlink_articletable AS art 
                    JOIN enterlink_hashcache AS cache
                    ON cache.articletable_id=art.id
                    WHERE cache.ipfs_hash IN (${joined_hashes})`,
                    function(err, rows) {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });
            const previews = {};
            article_info.map((a) => (previews[a.ipfs_hash] = a));
            proposals.forEach((p) => (p.preview = previews[p.data.trace.act.data.proposed_article_hash]));
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
