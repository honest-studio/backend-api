import { Injectable, NotFoundException } from '@nestjs/common';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { IpfsService } from '../common';
import { ProposalService } from '../proposal';
import { WikiService } from '../wiki';
import { CacheService } from '../cache';
import HtmlDiff from 'htmldiff-js';
import * as cheerio from 'cheerio';

@Injectable()
export class PreviewService  {
    constructor(
        private wikiService: WikiService,
        private mysql: MysqlService,
        private ipfs: IpfsService,
        private cacheService: CacheService
    ) {}

    async getWikiPreview(ipfs_hash: string): Promise<any> {
        const previews = await this.getWikiPreviews([ipfs_hash]);
        return previews[ipfs_hash];
    }

    async getWikiPreviews(ipfs_hashes: Array<string>): Promise<any> {
        if (ipfs_hashes.length == 0)
            return {}

        const previews = {};
        console.log(ipfs_hashes);

        const article_info: Array<any> = await new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                SELECT art.page_title AS title, art.photo_url AS mainimage, art.photo_thumb_url AS thumbnail, art.page_lang,
                    cache.ipfs_hash, art.blurb_snippet AS text_preview
                FROM enterlink_articletable AS art 
                JOIN enterlink_hashcache AS cache
                ON cache.articletable_id=art.id
                WHERE cache.ipfs_hash IN (?)`,
                [ipfs_hashes],
                function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        article_info.map((a) => (previews[a.ipfs_hash] = a));

        // clean up text previews
        Object.keys(previews).forEach((hash) => {
            const preview = previews[hash];
            const $ = cheerio.load(preview.text_preview);
            preview.text_preview = $.text()
                .replace(/\s+/g, ' ')
                .trim();
        });

        // try and fill in missing previews with pinned wikis
        for (const i in ipfs_hashes) {
            const hash = ipfs_hashes[i];
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

                previews[hash] = { title, thumbnail, mainimage, text_preview };
            } catch (e) {
                // try and pin the file so future requests can use it
                this.cacheService.cacheWiki(hash);
            }
        }

        return previews;
    }

}
