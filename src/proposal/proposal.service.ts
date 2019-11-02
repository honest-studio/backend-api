import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiffService } from '../diff';
import { EosAction, MongoDbService, MysqlService, RedisService, ProposalResult, Propose, Vote } from '../feature-modules/database';
import { PreviewService } from '../preview';
import { WikiService } from '../wiki';
const util = require('util');
import { BrowserInfo } from 'detect-browser';
const dateFormat = require('dateformat');
const chalk = require('chalk');

export type Proposal = {
    proposal_id: number;
    info: EosAction<Propose>;
    result: EosAction<ProposalResult>;
    votes: Array<EosAction<Vote>>;
    preview?: any;
    diff?: any;
};

export type ProposalOptions = {
    preview: boolean;
    cache: boolean;
    diff: 'full' | 'metadata' | 'none';
    user_agent: string;
};

export interface OrphanHashPack {
    [ipfs_hash: string]: {
        html_blob: string;
        proposal_id: number;
    }
}

export const SYNC_DAYS_MAX_LOOKBACK = 14;

@Injectable()
export class ProposalService {
    constructor(
        private mongo: MongoDbService,
        private mysql: MysqlService,
        @Inject(forwardRef(() => PreviewService)) private previewService: PreviewService,
        private redis: RedisService,
        @Inject(forwardRef(() => DiffService)) private diffService: DiffService,
        @Inject(forwardRef(() => WikiService)) private wikiService: WikiService,
    ) {}

    async getProposals(proposal_ids: Array<number>, options: ProposalOptions): Promise<Array<Proposal>> {
        const proposals: Array<any> = proposal_ids.map((proposal_id) => {
            return { proposal_id };
        });

        const pipeline = this.redis.connection().pipeline();
        proposal_ids.forEach(proposal_id => pipeline.get(`proposal:${proposal_id}:info`));
        proposal_ids.forEach(proposal_id => pipeline.smembers(`proposal:${proposal_id}:votes`));
        proposal_ids.forEach(proposal_id => pipeline.get(`proposal:${proposal_id}:result`));
        const values = await pipeline.exec();

        // TODO
        // Fetch the boost information and add it here, alongside the votes

        const len = proposal_ids.length;
        for (let i=0; i < len; i++) {
            const proposal_id = proposal_ids[i];
            proposals[i].info = JSON.parse(values[i][1]);
            if (!proposals[i].info)
                proposals[i].info = { error: `Proposal ${proposal_id} could not be found` };
            try {
                proposals[i].votes = values[i + len][1].map(v => JSON.parse(v));

                // Unique votes only
                const vote_filter = {};
                proposals[i].votes.filter(vote => {
                    if (vote_filter[vote.trx_id]) return false;
                    else {
                        vote_filter[vote.trx_id] = 1;
                        return true;
                    }
                })
            } catch {
                proposals[i].votes = [];
            }
            proposals[i].result = JSON.parse(values[i + 2*len][1]);
            if (!proposals[i].result)
                proposals[i].result = { error: `Proposal ${proposal_id} has not finalized` };
        }

        if (options.preview) {
            const packs = proposals
                .filter((p) => !p.info.error)
                .map((p) => ({ lang_code: p.info.trace.act.data.lang_code, slug: p.info.trace.act.data.slug }));
            let previews;
            try {
                previews = await this.previewService.getPreviewsBySlug(packs, options.user_agent as any);
            } catch (e) {
                if (e.message.error == "Could not find wikis") previews = [];
                else throw e;
            }

            previews.forEach((preview) => {
                proposals.forEach(p => {
                    if (!p.info.error && this.mysql.cleanSlugForMysql(p.info.trace.act.data.slug) === preview.slug)
                        p.preview = preview;
                })
            });

            // mark unfound previews
            proposals.forEach(p => {
                if (p.info.error)
                    p.preview = { error: `Non-existent proposal` };
                else if (!p.preview) 
                    p.preview = { error: `Could not find preview for ${p.info.trace.act.data.lang_code}/${p.info.trace.act.data.slug}` };
            });
        }

        if (options.diff != 'none') {
            const metadata_only = (options.diff == "metadata");
            const diffs = await this.diffService.getDiffsByProposal(proposal_ids, metadata_only, options.cache );
            diffs.forEach(diff => {
                const diff_proposal_id = diff.metadata.find(m => m.key == 'proposal_id').value;
                const proposal = proposals.find((p) => p.proposal_id == diff_proposal_id);
                proposal.diff = diff;
            });
        }
        
        // proposals.map(prop => {
        //     console.log(util.inspect(prop.votes, {showHidden: false, depth: null, chalk: true}));
        // })

        // console.log(util.inspect(proposals, {showHidden: false, depth: null, chalk: true}));

        return proposals;
    }

    async syncOrphanHashes(): Promise<Array<any>> {
        let timestamp_lower_bound =  new Date(new Date().setDate(new Date().getDate()-30));
        timestamp_lower_bound = dateFormat(timestamp_lower_bound, "yyyy-mm-dd hh:mm:ss");

        // Get the article object
        let orphan_hash_caches: Array<any> = await this.mysql.TryQuery(
            `
                SELECT ipfs_hash, html_blob
                FROM enterlink_hashcache 
                WHERE 
                    articletable_id IS NULL
                    AND timestamp >= ?
                ORDER BY timestamp DESC
            `,
            [timestamp_lower_bound]
        );

        if (orphan_hash_caches.length == 0) {
            console.log(chalk.red(`NO ORPHAN HASHES FOUND . Continuing...`));
            return;
        }

        let find_query;
        let sort_direction;
        const now = (Date.now() / 1000) | 0;

        find_query = {
            'trace.act.account': 'eparticlectr',
            'trace.act.name': 'logpropinfo'
        };

        let orphan_hash_pack: OrphanHashPack = {};
        
        orphan_hash_caches.forEach(ohc => {
            orphan_hash_pack[ohc.ipfs_hash] = {
                html_blob: ohc.html_blob,
                proposal_id: null
            }
        });

        let orphan_hashes = Object.keys(orphan_hash_pack);

        find_query['trace.act.data.ipfs_hash'] = { $in: orphan_hashes };

        const proposal_id_docs = await this.mongo
            .connection()
            .actions.find(find_query)
            .sort({ 'trace.act.data.starttime': 1 })
            .toArray();

        // Get the proposal ids
        proposal_id_docs.forEach(doc => {
            orphan_hash_pack[doc.trace.act.data.ipfs_hash].proposal_id = doc.trace.act.data.proposal_id
        })

        // Finalize the Wikis
        for (let i = 0; i < orphan_hashes.length; i++) {
            let the_hash = orphan_hashes[i];
            console.log(`Trying hash: ${the_hash}`)
            let the_pack = orphan_hash_pack[the_hash];
            try{
                let wiki = JSON.parse(the_pack.html_blob);
                await this.wikiService.updateWiki(wiki, the_hash, true);
            }
            catch(e){

            }
            

        }
                
        // const proposal_options = {
        //     preview: query.preview,
        //     diff: query.diff,
        //     user_agent: query.user_agent,
        //     cache: query.cache
        // };

        // return this.proposalService.getProposals(proposal_ids, proposal_options);
        return null;
    }
}
