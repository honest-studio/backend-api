import { Injectable } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { IpfsService } from '../common';
import { MysqlService } from '../feature-modules/database';

@Injectable()
export class WikiService {
    constructor(private ipfs: IpfsService, private mysql: MysqlService) {}

    async getWiki(ipfs_hash: string): Promise<any> {
        try {
            const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
            const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
            return buffer.toString('utf8');
        } catch (e) {
            setTimeout(() => this.ipfs.client().pin.add(ipfs_hash), 1);
            return new Promise((resolve, reject) => {
                this.mysql
                    .pool()
                    .query(`SELECT * FROM enterlink_hashcache where ipfs_hash="${ipfs_hash}"`, function(err, rows) {
                        if (err) reject(err);
                        else if (rows.length == 0) reject({ error: "Wiki could not be found"});
                        else resolve(rows[0].html_blob);
                    });
            });
        }
    }
}
