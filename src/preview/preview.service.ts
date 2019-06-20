import { Injectable, NotFoundException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as SqlString from 'sqlstring';
import { CacheService } from '../cache';
import { HistogramMetric, InjectHistogramMetric, IpfsService } from '../common';
import { MysqlService } from '../feature-modules/database';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { WikiIdentity } from '../utils/article-utils/article-types';
import { WikiService } from '../wiki';
const pid = `PID-${process.pid}`;
/**
 * Get the delta in ms between a bigint, and now
 * @param bi BigInt
 */
const getDeltaMs = (bi: bigint): number => {
    return Number((process.hrtime.bigint() - bi) / BigInt(10e5));
};

@Injectable()
export class PreviewService {
    constructor(
        private wikiService: WikiService,
        private mysql: MysqlService,
        private ipfs: IpfsService,
        private cacheService: CacheService,
        // preview by hash:
        @InjectHistogramMetric('get_prev_by_hash_pre_sql') private readonly getPrevByHashPreSqlHisto: HistogramMetric,
        @InjectHistogramMetric('get_prev_by_hash_sql_only')
        private readonly getPrevByHashSqlOnlyHisto: HistogramMetric,
        @InjectHistogramMetric('get_prev_by_hash_post_sql') private readonly getPrevByHashPostSqlHisto: HistogramMetric,
        @InjectHistogramMetric('get_prev_by_hash_total_req')
        private readonly getPrevByHashTotalReqHisto: HistogramMetric,
        // preview by slug:
        @InjectHistogramMetric('get_prev_by_slug_pre_sql') private readonly getPrevBySlugPreSqlHisto: HistogramMetric,
        @InjectHistogramMetric('get_prev_by_slug_sql_only')
        private readonly getPrevBySlugSqlOnlyHisto: HistogramMetric,
        @InjectHistogramMetric('get_prev_by_slug_post_sql') private readonly getPrevBySlugPostSqlHisto: HistogramMetric,
        @InjectHistogramMetric('get_prev_by_slug_total_req')
        private readonly getPrevBySlugTotalReqHisto: HistogramMetric
    ) {}

    async getPreviewsByHash(ipfs_hashes: Array<string>): Promise<any> {
        if (ipfs_hashes.length == 0) return [];

        const previews = [];
        for (const i in ipfs_hashes) {
            previews.push({ ipfs_hash: ipfs_hashes[i] });
        }
        const article_info: Array<any> = await this.mysql.TryQuery(
            `
            SELECT 
                art.page_title, 
                art.slug,
                art.photo_url AS main_photo, 
                art.photo_thumb_url AS thumbnail,
                art.page_lang AS lang_code,
                art.ipfs_hash_current AS ipfs_hash, 
                art.blurb_snippet AS text_preview, 
                art.pageviews, 
                art.page_note,
                art.is_adult_content, 
                art.creation_timestamp,
                art.lastmod_timestamp
            FROM enterlink_articletable AS art 
            JOIN enterlink_hashcache AS cache
            ON cache.articletable_id=art.id
            WHERE cache.ipfs_hash IN (?)`,
            [ipfs_hashes]
        );

        article_info.forEach((a) => {
            const i = previews.findIndex((p) => p.ipfs_hash === a.ipfs_hash);
            previews[i] = a;
        });

        // clean up text previews
        previews.forEach((preview) => {
            preview.page_title = sanitizeTextPreview(preview.page_title);
            if (!preview.text_preview) return; // continue
            preview.text_preview = sanitizeTextPreview(preview.text_preview);
        });

        // try and fill in missing previews with pinned wikis
        for (const i in previews) {
            const preview = previews[i];
            if (preview.page_title) continue;
            const ipfs_hash = preview.ipfs_hash;

            try {
                const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
                const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
                const wiki = buffer.toString('utf8');

                const $ = cheerio.load(wiki);

                const page_title = $('h1.page-title')
                    .text()
                    .trim();
                const thumbnail = $('.main-photo').attr('data-thumbnail');
                const main_photo = $('.main-photo').attr('src');
                const text_preview: string = sanitizeTextPreview($('.blurb-wrap').text().substring(0, 200));
                previews[i] = { ipfs_hash, page_title, thumbnail, main_photo, text_preview };
            } catch (e) {
                // try and pin the file so future requests can use it
                this.cacheService.cacheWiki(ipfs_hash);
            }
        }

        // Replace default thumbnail with null
        for (let preview of previews) {
            if (preview.thumbnail == "https://everipedia-fast-cache.s3.amazonaws.com/images/no-image-slide-big.png")
                preview.thumbnail = null;
        }

        // error messages for missing wikis
        previews.filter((p) => !p.page_title).forEach((p) => (p.error = `Wiki ${p.ipfs_hash} could not be found`));

        return previews;
    }

    async getPreviewsBySlug(wiki_identities: WikiIdentity[]): Promise<any> {
        if (wiki_identities.length == 0) return [];

        // strip lang_ prefix in lang_code if it exists
        wiki_identities.forEach((w) => {
            if (w.lang_code.includes('lang_')) w.lang_code = w.lang_code.substring(5);
        });

        // const substitutions = wiki_identities
        //     .map((w) => [w.lang_code, w.slug])
        //     .reduce((flat, piece) => flat.concat(piece), []);

        const or_clauses = [];
        const whereClause1 = wiki_identities.map((w) => { 
            let cleanedSlug = this.mysql.cleanSlugForMysql(w.slug);
            return SqlString.format(
                '(art.page_lang = ? AND art.slug = ?)',
                [w.lang_code, cleanedSlug]
            );
        }).join(' OR ');
        const whereClause2 = wiki_identities.map((w) => { 
            let cleanedSlug = this.mysql.cleanSlugForMysql(w.slug);
            return SqlString.format(
                '(art.page_lang = ? AND art.slug_alt = ?)',
                [w.lang_code, cleanedSlug]
            );
        }).join(' OR ');
        
        const query1 = `
            SELECT 
                art.page_title, 
                art.slug,
                art.photo_url AS main_photo, 
                art.photo_thumb_url AS thumbnail,
                art.page_lang AS lang_code,
                art.ipfs_hash_current AS ipfs_hash, 
                art.blurb_snippet AS text_preview, 
                art.pageviews, 
                art.page_note,
                art.is_adult_content, 
                art.creation_timestamp,
                art.lastmod_timestamp
            FROM enterlink_articletable AS art 
            WHERE ${whereClause1}`;
        const query2 = `
            SELECT 
                art.page_title, 
                art.slug,
                art.photo_url AS main_photo, 
                art.photo_thumb_url AS thumbnail,
                art.page_lang AS lang_code,
                art.ipfs_hash_current AS ipfs_hash, 
                art.blurb_snippet AS text_preview, 
                art.pageviews, 
                art.page_note,
                art.is_adult_content, 
                art.creation_timestamp,
                art.lastmod_timestamp
            FROM enterlink_articletable AS art 
            WHERE ${whereClause2}`;
        const query = `${query1} UNION ALL ${query2}`;

        // const previews: Array<any> = await this.mysql.TryQuery(query, substitutions);
        const previews: Array<any> = await this.mysql.TryQuery(query);

        if (previews.length == 0) throw new NotFoundException({ error: `Could not find wikis` });

        // clean up text previews
        for (let preview of previews) {
            preview.page_title = sanitizeTextPreview(preview.page_title);
            if (preview.text_preview) {
                preview.text_preview = sanitizeTextPreview(preview.text_preview);
            }
        }

        // Replace default thumbnail with null
        for (let preview of previews) {
            if (preview.thumbnail == "https://everipedia-fast-cache.s3.amazonaws.com/images/no-image-slide-big.png")
                preview.thumbnail = null;
        }

        return previews;
    }
}
