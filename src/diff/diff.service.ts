import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoDbService, RedisService } from '../feature-modules/database';
import { ArticleJson } from '../types/article';
import { diffArticleJson } from '../utils/article-utils/article-differ';
import { WikiService } from '../wiki';

@Injectable()
export class DiffService {
    constructor(private wikiService: WikiService, private mongo: MongoDbService, private redis: RedisService) {}

    async getDiffsByProposal(proposal_ids: Array<number>, metadata_only: boolean = false, cache: boolean = true): Promise<Array<ArticleJson>> {

        // Redis cache get
        const diffs = [];
        const uncached_proposals = [];

        if (cache) {
            const pipeline = this.redis.connection().pipeline();
            for (let proposal_id of proposal_ids) {
                if (metadata_only)
                    pipeline.get(`proposal:${proposal_id}:diff:metadata`);
                else
                    pipeline.get(`proposal:${proposal_id}:diff`);
            }
            const values = await pipeline.exec();

            for (let i in values) {
                if (values[i][1])
                    diffs.push(JSON.parse(values[i][1]));
                else
                    uncached_proposals.push(proposal_ids[i]);
            }
        }
        else {
            uncached_proposals.push(...proposal_ids);
        }
        if (uncached_proposals.length == 0) return diffs;

        // get proposal info 
        const pipeline2 = this.redis.connection().pipeline();
        for (let proposal_id of uncached_proposals) {
            pipeline2.get(`proposal:${proposal_id}:info`);
        }
        const values2 = await pipeline2.exec();
        const infos = values2
            .filter(v => v[1])
            .map(v => JSON.parse(v[1]));
        const proposal_hashes: any = infos.map(info => ({ 
            proposal_id: info.trace.act.data.proposal_id,
            new_hash: info.trace.act.data.ipfs_hash
        }));
        
        // get previous proposals
        const pipeline3 = this.redis.connection().pipeline();
        for (let info of infos) {
            const proposal_id = info.trace.act.data.proposal_id;
            const lang_code = info.trace.act.data.lang_code;
            const slug = info.trace.act.data.slug;
            pipeline3.zrevrangebyscore(`wiki:lang_${lang_code}:${slug}:proposals`, proposal_id, 0, "LIMIT", "0", "2");
        }
        const values3 = await pipeline3.exec();

        // get extended info
        const pipeline4 = this.redis.connection().pipeline();
        for (let value of values3) {
            pipeline4.get(`proposal:${Number(value[1][0])}:info`);
            if (value[1][1])
                pipeline4.get(`proposal:${Number(value[1][1])}:info`);
        }
        const values4 = await pipeline4.exec();
        const extended_infos = values4
            .filter(v => v[1])
            .map(v => JSON.parse(v[1]));

        // add old_hash to proposal_hashes
        for (let obj of proposal_hashes) {
            try {
                const parent_proposal_id = values3.find(v => v[1][0] == obj.proposal_id)[1][1];
                const parent_info = extended_infos.find(info => info.trace.act.data.proposal_id == parent_proposal_id);
                obj.old_hash = parent_info.trace.act.data.ipfs_hash;
            }
            catch {
                obj.old_hash = "Qmc5m94Gu7z62RC8waSKkZUrCCBJPyHbkpmGzEePxy2oXJ";
            }
        }

        // filter out unique ipfs hashes
        const ipfs_hashes = extended_infos
            .map(info => info.trace.act.data.ipfs_hash)
            .filter((v, i, a) => a.indexOf(v) === i); // unique values only

        const wikis = await this.wikiService.getWikisByHash(ipfs_hashes);

        const pipeline5 = this.redis.connection().pipeline();
        proposal_hashes.forEach((prop) => {
            let old_wiki: any = wikis.find((w) => w.ipfs_hash == prop.old_hash);
            let new_wiki = wikis.find((w) => w.ipfs_hash == prop.new_hash);
            if (!old_wiki) old_wiki = {};
            try {
                const diff_wiki = diffArticleJson(old_wiki, new_wiki);
                diff_wiki.metadata.push({ key: 'proposal_id', value: prop.proposal_id });

                // cache result
                pipeline5.set(`proposal:${prop.proposal_id}:diff`, JSON.stringify(diff_wiki));
                pipeline5.set(`proposal:${prop.proposal_id}:diff:metadata`, JSON.stringify({ metadata: diff_wiki.metadata }));

                if (metadata_only)
                    diffs.push({ metadata: diff_wiki.metadata });
                else
                    diffs.push(diff_wiki);
            } catch (e) {
                console.error(e);
                diffs.push({ 
                    error: "Error while diffing proposal " + prop.proposal_id,
                    metadata: [{ key: "proposal_id", value: prop.proposal_id }]
                })
            }
        });
        pipeline5.exec();

        return diffs;
    }
}
