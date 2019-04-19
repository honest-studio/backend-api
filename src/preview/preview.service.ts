import { Injectable, NotFoundException } from '@nestjs/common';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { IpfsService } from '../common';
import { ProposalService } from '../proposal';
import { WikiService } from '../wiki';
import { CacheService } from '../cache';
import HtmlDiff from 'htmldiff-js';
import * as cheerio from 'cheerio';
import { WikiIdentity } from '../utils/article-utils/article-types';

@Injectable()
export class PreviewService {
    constructor(
        private wikiService: WikiService,
        private mysql: MysqlService,
        private ipfs: IpfsService,
        private cacheService: CacheService
    ) {}

    async getPreviewsByHash(ipfs_hashes: Array<string>): Promise<any> {
        if (ipfs_hashes.length == 0) return [];

        const previews = [];
        for (const i in ipfs_hashes) {
            previews.push({ ipfs_hash: ipfs_hashes[i] });
        }

        const article_info: Array<any> = await new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                SELECT art.page_title AS title, art.photo_url AS mainimage, art.photo_thumb_url AS thumbnail, art.page_lang,
                    cache.ipfs_hash, art.blurb_snippet AS text_preview, art.pageviews
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
        article_info.forEach((a) => {
            const i = previews.findIndex((p) => p.ipfs_hash === a.ipfs_hash);
            previews[i] = a;
        });

        // clean up text previews
        previews.forEach((preview) => {
            if (!preview.text_preview) return; // continue
            const $ = cheerio.load(preview.text_preview);
            preview.text_preview = $.root()
                .text()
                .replace(/\s+/g, ' ')
                .trim();
        });

        // try and fill in missing previews with pinned wikis
        for (const i in previews) {
            const preview = previews[i];
            if (preview.title) continue;
            const ipfs_hash = preview.ipfs_hash;

            try {
                const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
                const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
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

                previews[i] = { ipfs_hash, title, thumbnail, mainimage, text_preview };
            } catch (e) {
                // try and pin the file so future requests can use it
                this.cacheService.cacheWiki(ipfs_hash);
            }
        }

        // error messages for missing wikis
        previews.filter((p) => !p.title).forEach((p) => (p.error = `Wiki ${p.ipfs_hash} could not be found`));

        return previews;
    }

    async getPreviewsBySlug(wiki_identities: WikiIdentity[]): Promise<any> {
        // strip lang_ prefix in lang_code if it exists
        wiki_identities.forEach(w => {
            if (w.lang_code.includes('lang_')) 
                w.lang_code = w.lang_code.substring(5)
        });

        const substitutions = wiki_identities
            .map(w => [w.lang_code, w.slug])
            .reduce((flat, piece) => flat.concat(piece), []);

        const whereClause = wiki_identities
            .map(w => `(art.page_lang = ? AND art.slug = ?)`)
            .join(' OR ');
        const query = `
            SELECT art.page_title AS title, art.photo_url AS mainimage, art.photo_thumb_url AS thumbnail, art.page_lang,
                art.ipfs_hash_current, art.blurb_snippet AS text_preview, art.pageviews, art.page_note, art.is_adult_content,
                art.creation_timestamp, art.lastmod_timestamp 
            FROM enterlink_articletable AS art 
            WHERE ${whereClause}`;

        const previews: Array<any> = await new Promise((resolve, reject) => {
            this.mysql.pool().query(query, substitutions, function(err, rows) {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        if (previews.length == 0)
            throw new NotFoundException({ error: `Could not find wikis` })

        const preview = previews[0];

        // clean up text previews
        for (let preview of previews) {
            if (preview.text_preview) {
                preview.text_preview = preview.text_preview
                    .replace(/<b>/g, ' ')
                    .replace(/<\/b>/g, ' ');
                const $ = cheerio.load(preview.text_preview);
                preview.text_preview = $.root()
                    .text()
                    .replace(/\s+/g, ' ')
                    .trim();
            }
        }

        return previews;
    }
}
