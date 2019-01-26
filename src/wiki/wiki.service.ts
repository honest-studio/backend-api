import { Injectable, NotFoundException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { IpfsService } from '../common';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';

@Injectable()
export class WikiService {
    constructor(private ipfs: IpfsService, private mysql: MysqlService, private mongo: MongoDbService) {}

    async getWikiByHash(ipfs_hash: string): Promise<any> {
        try {
            const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
            const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
            return buffer.toString('utf8');
        } catch (e) {
            setTimeout(() => this.ipfs.client().pin.add(ipfs_hash, { timeout: '20s' }), 1);
            const rows: Array<any> = await new Promise((resolve, reject) => {
                this.mysql
                    .pool()
                    .query(`SELECT * FROM enterlink_hashcache where ipfs_hash="${ipfs_hash}"`, function(err, rows) {
                        if (err) reject(err);
                        else resolve(rows);
                    });
            });
            if (rows.length == 0) throw new NotFoundException('Wiki not found');
            return rows[0].html_blob;
        }
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
        const wikis = {}
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
        const joined_hashes = Object.keys(wikis)
            .filter(hash => wikis[hash] === null)
            .map(hash => `"${hash}"`)
            .join(',');
        const rows: Array<any> = await new Promise((resolve, reject) => {
            this.mysql
                .pool()
                .query(`SELECT * FROM enterlink_hashcache where ipfs_hash IN (?)`, [joined_hashes], function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                });
        });
        rows.forEach(r => wikis[r.ipfs_hash] = r.html_blob);

        return wikis;
    }
}
