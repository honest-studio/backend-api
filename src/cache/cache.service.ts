import { Injectable } from '@nestjs/common';
import { IpfsService } from '../common';
import { MysqlService } from '../feature-modules/database';

@Injectable()
export class CacheService {
    constructor(private ipfs: IpfsService, private mysql: MysqlService) {}

    async cacheWiki(ipfs_hash: string): Promise<Boolean> {
        // check if the wiki is already cached
        try {
            await this.ipfs.client().pin.ls(ipfs_hash);
            return false;
        } catch (e) {
            // Hash was not found. Continue onward.
        }

        const rows: Array<any> = await new Promise((resolve, reject) => {
            this.mysql
                .pool()
                .query(`SELECT * FROM enterlink_hashcache WHERE ipfs_hash=?`, [ipfs_hash], function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                });
        });

        // if it doesn't exist in MySQL, attempt to query it from IPFS
        if (rows.length == 0) {
            return this.ipfs
                .client()
                .pin.add(ipfs_hash, { timeout: '20s' })
                .then(() => console.log(`CACHE: Cached ${ipfs_hash} to local IPFS node from IPFS network`))
                .catch((e) => console.log(`CACHE: Failed to cache ${ipfs_hash} from IPFS network`));
        }

        // add MySQL content to IPFS
        const wiki = rows[0].html_blob;
        return this.ipfs
            .client()
            .add(Buffer.from(wiki, 'utf8'))
            .then((res) => {
                if (ipfs_hash == res[0].hash) console.log(`CACHE: Cached ${ipfs_hash} to local IPFS node from MySQL`);
                else
                    console.log(
                        `CACHE: WARNING: MySQL entry for ${ipfs_hash} does not match generated hash of ${res[0].hash}`
                    );
            });
    }
}
