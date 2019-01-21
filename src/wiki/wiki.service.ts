import { Injectable, NotFoundException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { IpfsService } from '../common';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { ProposalService } from '../proposal';

@Injectable()
export class WikiService {
    constructor(private ipfs: IpfsService, private mysql: MysqlService, private mongo: MongoDbService) {}

    async getWiki(ipfs_hash: string): Promise<any> {
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
}
