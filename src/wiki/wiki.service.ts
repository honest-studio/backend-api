import { Injectable, NotFoundException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { IpfsService } from '../common';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';
import { CacheService } from '../cache';

@Injectable()
export class WikiService {
    constructor(private ipfs: IpfsService, private mysql: MysqlService, private mongo: MongoDbService, private cacheService: CacheService) {}

    async getWikiByHash(ipfs_hash: string): Promise<any> {
        const wikis = await this.getWikisByHash([ ipfs_hash ]);
        if (!wikis[ipfs_hash])
            throw new NotFoundException('Wiki could not be found');
        return wikis[ipfs_hash];
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
        // try to fetch everything locally first
        const wikis = {};
        for (const i in ipfs_hashes) {
            const ipfs_hash = ipfs_hashes[i];
            try {
                const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
                const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
                wikis[ipfs_hash] = buffer.toString('utf8');
            } catch {
                wikis[ipfs_hash] = null;
            }
        }

        // fetch remainder from mysql if they exist
        const uncached_wikis = Object.keys(wikis)
            .filter((hash) => wikis[hash] === null)
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
        rows.forEach((r) => (wikis[r.ipfs_hash] = r.html_blob));

        // attempt to cache uncached wikis
        uncached_wikis.forEach(hash => this.cacheService.cacheWiki(hash));

        return wikis;
    }
}
