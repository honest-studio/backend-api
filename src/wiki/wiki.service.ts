import { Injectable, NotFoundException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { IpfsService } from '../common';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { CacheService } from '../cache';

@Injectable()
export class WikiService {
    constructor(
        private ipfs: IpfsService,
        private mysql: MysqlService,
        private mongo: MongoDbService,
        private cacheService: CacheService
    ) {}

    async getWikiByHash(ipfs_hash: string): Promise<any> {
        const wikis = await this.getWikisByHash([ipfs_hash]);
        if (wikis[0].error) throw new NotFoundException('Wiki could not be found');
        return wikis[0].wiki;
    }

    async getWikiById(wiki_id: number): Promise<any> {
        const docs = await this.mongo
            .connection()
            .actions.find({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.wiki_id': wiki_id
            })
            .sort({ 'trace.act.data.proposal_id': -1 })
            .limit(1)
            .toArray();

        if (docs.length == 0) throw new NotFoundException(`Wiki ${wiki_id} could not be found`);

        return this.getWikiByHash(docs[0].trace.act.data.ipfs_hash);
    }

    async getWikiByTitle(article_title: string): Promise<any> {
        const rows: Array<any> = await new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                SELECT cache.html_blob 
                FROM enterlink_articletable AS art 
                JOIN enterlink_hashcache AS cache 
                ON art.ipfs_hash_current=cache.ipfs_hash 
                WHERE art.slug=? OR art.slug_alt=?;`,
                [article_title, article_title],
                function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        return rows[0].html_blob;
    }

    async getWikisByHash(ipfs_hashes: Array<string>) {
        const wikis = [];
        for (const i in ipfs_hashes) {
            wikis.push({ ipfs_hash: ipfs_hashes[i] });
        }

        // try to fetch everything locally first
        for (const i in wikis) {
            const ipfs_hash = wikis[i].ipfs_hash;
            try {
                const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
                const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
                wikis[i].wiki = buffer.toString('utf8');
            } catch {
                continue;
            }
        }

        // if there are no uncached wikis, return the result
        const uncached_wikis = wikis.filter(w => !w.wiki).map(w => w.ipfs_hash);
        if (uncached_wikis.length == 0) return wikis;

        // fetch remainder from mysql if they exist
        const rows: Array<any> = await new Promise((resolve, reject) => {
            this.mysql
                .pool()
                .query(`SELECT * FROM enterlink_hashcache WHERE ipfs_hash IN (?)`, [uncached_wikis], function(
                    err,
                    rows
                ) {
                    if (err) reject(err);
                    else resolve(rows);
                });
        });
        rows.forEach((r) => wikis.find(w => w.ipfs_hash == r.ipfs_hash).wiki = r.html_blob);
        
        // mark wikis that couldn't be found
        wikis.filter(w => !w.wiki).forEach(w => w.error = `Wiki ${w.ipfs_hash} could not be found`);
        
        // attempt to cache uncached wikis
        uncached_wikis.forEach((hash) => this.cacheService.cacheWiki(hash));

        return wikis;
    }

    async submitWiki(html_body: string): Promise<any> {
        const submission = await this.ipfs.client().add(Buffer.from(html_body, 'utf8'));
        const ipfs_hash = submission[0].hash;
        const insertion  = await new Promise((resolve, reject) => {
            this.mysql.pool().query(`
                INSERT INTO enterlink_hashcache (ipfs_hash, html_blob, timestamp) 
                VALUES (?, ?, NOW())
                `, [ ipfs_hash, html_body ], function (err, res) {
                    if (err && err.message.includes("ER_DUP_ENTRY"))
                        resolve("Duplicate entry. Continuing");
                    else if (err) reject(err);
                    else resolve(res);
                });
        });
        return { ipfs_hash };
    }
}
