import { Injectable } from '@nestjs/common';
import { ConfigService, ElasticSearchConfig } from '../common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { MysqlService } from '../feature-modules/database';
import { ContactUSDto } from './contact-us-dto';

@Injectable()
export class ContactUsService {
    constructor(private client: ElasticsearchService, private mysql: MysqlService) {}

    async submitContactUsForm(inputForm: ContactUSDto): Promise<any> {
        return new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                SELECT cache.html_blob 
                FROM enterlink_articletable AS art 
                JOIN enterlink_hashcache AS cache 
                ON art.ipfs_hash_current=cache.ipfs_hash 
                WHERE art.slug=? OR art.slug_alt=?
                AND art.page_lang=?;`,
                ["aaa", "bbb", "ccc"],
                function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}
