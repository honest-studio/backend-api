import { Injectable } from '@nestjs/common';
import { MongoDbService, MysqlService } from '../feature-modules/database';
import { IpfsService } from '../common';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';
import { WikiService } from '../wiki/wiki.service';
import HtmlDiff from 'htmldiff-js';
import * as cheerio from 'cheerio';

@Injectable()
export class RecentActivityService {
    constructor(private mongo: MongoDbService, private mysql: MysqlService, private ipfs: IpfsService) {}

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
            // get as many previews as possible from MySQL
            const joined_hashes = proposals
                .map((p) => p.data.trace.act.data.proposed_article_hash)
                .map((h) => `"${h}"`) // wrap each hash in quotes
                .join(',');
            const article_info: Array<any> = await new Promise((resolve, reject) => {
                this.mysql.pool().query(
                    `
                    SELECT art.page_title, art.photo_url, art.photo_thumb_url, art.page_lang, 
                        cache.ipfs_hash, art.blurb_snippet AS text_preview
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
            proposals.forEach((p,i) => {
                const preview = previews[p.data.trace.act.data.proposed_article_hash];
                if (!preview)
                    return; // continue foreach loop

                const $ = cheerio.load(preview.text_preview);
                preview.text_preview = $.text()
                    .replace(/\s+/g, ' ')
                    .trim()
                proposals[i].preview = preview;
            });

            // try and fill in missing previews with pinned wikis
            for (const i in proposals) {
                const hash = proposals[i].data.trace.act.data.proposed_article_hash;
                if (previews[hash]) continue;

                try {
                    const pinned = await this.ipfs.client().pin.ls(hash);
                    const buffer: Buffer = await this.ipfs.client().cat(hash);
                    const wiki = buffer.toString('utf8');

                    const $ = cheerio.load(wiki);

                    const title = $('h1.page-title')
                        .text()
                        .trim();
                    const thumbnail = $('.main-photo').attr('data-thumbnail');
                    const mainimage = $('.main-photo').attr('src');
                    const text_preview: string = $('.blurb-wrap')
                        .text()
                        .substring(0, 200)
                        .replace(/\s+/g, ' ')
                        .trim();

                    proposals[i].preview = { title, thumbnail, mainimage, text_preview };
                } catch (e) {
                    // try and pin the file so future requests can use it
                    setTimeout(() => this.ipfs.client().pin.add(hash, { timeout: '20s' }), 1);
                }
            }
        }

        if (query.diff_percent) {
            const wikis = {};
            const hashes = [];
            for (const i in proposals) {
                const new_hash = proposals[i].data.trace.act.data.proposed_article_hash;
                const old_hash = proposals[i].data.trace.act.data.old_article_hash;
                hashes.push(new_hash, old_hash);
            }

            // grab as many wikis as possible from MySQL
            const wikis_in_db: Array<any> = await new Promise((resolve, reject) => {
                const joined_hashes = hashes
                    .map((h) => `"${h}"`) // wrap each hash in quotes
                    .join(',');
                this.mysql.pool().query(
                    `
                    SELECT cache.ipfs_hash, cache.html_blob
                    FROM enterlink_hashcache AS cache
                    WHERE cache.ipfs_hash IN (${joined_hashes})`,
                    function(err, rows) {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });
            wikis_in_db.forEach((w) => (wikis[w.ipfs_hash] = w.html_blob));

            // see how many more wikis we can grab from the local IPFS node
            for (const i in hashes) {
                const hash = hashes[i];
                if (wikis[hash]) continue;
                try {
                    const pinned = await this.ipfs.client().pin.ls(hash);
                    const buffer: Buffer = await this.ipfs.client().cat(hash);
                    wikis[hash] = buffer.toString('utf8');
                } catch (e) {
                    // fetch wiki from IPFS in background for later use
                    setTimeout(() => this.ipfs.client().pin.add(hash, { timeout: '20s' }), 1);
                    continue;
                }
            }

            for (const i in proposals) {
                const new_hash = proposals[i].data.trace.act.data.proposed_article_hash;
                const old_hash = proposals[i].data.trace.act.data.old_article_hash;

                const new_wiki = wikis[new_hash];
                const old_wiki = wikis[old_hash];
                if (!new_wiki || !old_wiki) continue;

                // check for cached version
                const diff_doc = await this.mongo.connection().diffs.findOne({ old_hash, new_hash });
                if (diff_doc)
                    proposals[i].diff_percent = diff_doc.diff_percent;
                else {
                    try {
                        const diff_wiki = HtmlDiff.execute(old_wiki, new_wiki);
                        const diff_words = diff_wiki.split(' ').length;
                        const old_hash_words = old_wiki.split(' ').length;
                        const diff_percent = (((diff_words - old_hash_words) / diff_words) * 100).toFixed(2);
                        await this.mongo.connection().diffs.insertOne({ old_hash, new_hash, diff_percent, diff_wiki })
                        proposals[i].diff_percent = diff_percent;
                    } 
                    catch { 
                        console.log(`Could not diff ${old_wiki} and ${new_wiki}`); 
                    }
                }
            }
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
