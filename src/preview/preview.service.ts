import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as SqlString from 'sqlstring';
import { HistogramMetric, InjectHistogramMetric, IpfsService } from '../common';
import { MysqlService, RedisService } from '../feature-modules/database';
import { WikiIdentity } from '../types/article-helpers';
import { linkCategorizer } from '../utils/article-utils/article-converter';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { WikiService } from '../wiki';
import { PreviewResult } from '../types/api';
import { ArticleJson } from '../types/article';
import { BrowserInfo } from 'detect-browser';
import { oldHTMLtoJSON, PhotoToUse, IsWebPCompatibleBrowser } from '../utils/article-utils';
const chalk = require('chalk');
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
        private mysql: MysqlService,
        private redis: RedisService,
        @Inject(forwardRef(() => WikiService)) private wikiService: WikiService,
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

    async getPreviewsByHash(ipfs_hashes: Array<string>): Promise<PreviewResult[]> {
        if (ipfs_hashes.length == 0) return [];

        const previews: PreviewResult[] = [];
        // for (const i in ipfs_hashes) {
        //     previews.push({ ipfs_hash: ipfs_hashes[i] });
        // }
        const article_info: Array<PreviewResult> = await this.mysql.TryQuery(
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
                art.page_type,
                art.is_adult_content, 
                art.creation_timestamp,
                art.lastmod_timestamp,
                art.is_removed,
                art.webp_large,
                art.webp_medium,
                art.webp_small,
                art.is_indexed
            FROM enterlink_articletable AS art 
            INNER JOIN enterlink_hashcache AS cache
            ON cache.articletable_id=art.id
            WHERE cache.ipfs_hash IN (?)
            AND art.is_removed = 0
            `,
            [ipfs_hashes]
        );

        // article_info.forEach((a) => {
        //     let localRow = a;
        //     const i = previews.findIndex((p) => p.ipfs_hash === localRow.ipfs_hash);

        //     // Pull out the WebP main photo and thumb, if present
        //     // Get the article JSON
        //     let wiki: ArticleJson;
        //     try {
        //         wiki = JSON.parse(a.html_blob);
        //     } catch (e) {
        //         // SKIPPING for speed concerns
        //         // wiki = oldHTMLtoJSON(preview.html_blob);
        //     }

        //     let main_photo = wiki && wiki.main_photo && wiki.main_photo.length && wiki.main_photo[0];

        //     let photoToUse: string = "", thumbToUse: string = "";
        //     if (
        //         main_photo &&
        //         main_photo.media_props &&
        //         main_photo.media_props.webp_medium &&
        //         main_photo.media_props.webp_medium.indexOf('no-image-') == -1
        //     ) {
        //         photoToUse = main_photo.media_props.webp_medium;
        //         thumbToUse = main_photo.media_props.webp_thumb;
        //     } else if (main_photo && main_photo.url) {
        //         photoToUse = main_photo.url;
        //         thumbToUse = main_photo.thumb;
        //     } else {
        //         photoToUse = a.main_photo;
        //         thumbToUse = a.thumbnail;
        //     }

        //     localRow.main_photo = photoToUse;
        //     localRow.thumbnail = thumbToUse;

        //     previews[i] = localRow;
        // });

        // clean up text previews
        let previewsToUse = previews.map((preview) => {
            // Clean up the page title
            preview.page_title = sanitizeTextPreview(preview.page_title);

            // Clean up the text preview
            if (!preview.text_preview) return; // continue
            preview.text_preview = sanitizeTextPreview(preview.text_preview);

            // Replace default thumbnail with null
            if (preview.thumbnail == "https://everipedia-fast-cache.s3.amazonaws.com/images/no-image-slide-big.png")
            preview.thumbnail = null;

            // Get the main photo category
            preview.main_photo_category = linkCategorizer(preview.main_photo);

            return preview;
        });


        // error messages for missing wikis
        // previewsToUse.filter((p) => !p.page_title).forEach((p) => (p.error = `Wiki ${p.ipfs_hash} could not be found`));

        return previewsToUse;
    }

    async getPreviewsBySlug(wiki_identities: WikiIdentity[], user_agent: BrowserInfo['name']): Promise<PreviewResult[]> {
        if (!wiki_identities || wiki_identities.length == 0) return [];
        let previews: Array<PreviewResult> = [];
        // check Redis for fast cache
        const useWebP = IsWebPCompatibleBrowser(user_agent);
        const pipeline = this.redis.connection().pipeline();
        for (let id of wiki_identities) {
            let cleanedSlug = this.mysql.cleanSlugForMysql(id.slug);
            let memkey = `preview:lang_${id.lang_code}:${cleanedSlug}`;
            if (useWebP) memkey = memkey + ":webp";
            memkey = memkey.toLowerCase();

            let memkey2 = `preview:lang_${id.lang_code}:${id.slug}`;
            if (useWebP) memkey2 = memkey2 + ":webp";
            memkey2 = memkey2.toLowerCase();

            pipeline.get(memkey);
            pipeline.get(memkey2);
        }
        const values = await pipeline.exec();
        const uncached_previews = [];
        for (let i=0; i < wiki_identities.length; i++) {
            if (values[i*2][1]) previews.push(JSON.parse(values[i*2][1]));
            else if (values[i*2 + 1][1]) previews.push(JSON.parse(values[i*2 + 1][1]));
            else uncached_previews.push(wiki_identities[i]);
        }

        // Part of the 'Title Not Available' bug
        if (uncached_previews.length == 0) return previews;
        
        // Strip lang_ prefix in lang_code if it exists
        uncached_previews.forEach((w) => {
            if (w.lang_code.includes('lang_')) w.lang_code = w.lang_code.substring(5);
        });

        const whereClause1 = uncached_previews.map((w) => { 
            let cleanedSlug = this.mysql.cleanSlugForMysql(w.slug);
            return SqlString.format(
                '(art.page_lang = ? AND art.slug = ?)',
                [w.lang_code, cleanedSlug]
            );
        }).join(' OR ');
        const whereClause2 = uncached_previews.map((w) => { 
            let cleanedSlug = this.mysql.cleanSlugForMysql(w.slug);
            return SqlString.format(
                '(art.page_lang = ? AND art.slug_alt = ?)',
                [w.lang_code, cleanedSlug]
            );
        }).join(' OR ');

        const query1 = `
            SELECT 
                COALESCE (art_redir.page_title, art.page_title) AS page_title,
                COALESCE (art_redir.slug, art.slug) AS slug,
                COALESCE (art_redir.photo_url, art.photo_url) AS main_photo,
                COALESCE (art_redir.photo_thumb_url, art.photo_thumb_url) AS thumbnail,
                COALESCE (art_redir.page_lang, art.page_lang) AS lang_code,
                COALESCE (art_redir.ipfs_hash_current, art.ipfs_hash_current) AS ipfs_hash,
                COALESCE (art_redir.blurb_snippet, art.blurb_snippet) AS text_preview,
                COALESCE (art_redir.pageviews, art.pageviews) AS pageviews,
                COALESCE (art_redir.page_note, art.page_note) AS page_note,
                COALESCE (art_redir.page_type, art.page_type) AS page_type,
                COALESCE (art_redir.is_adult_content, art.is_adult_content) AS is_adult_content,
                COALESCE (art_redir.creation_timestamp, art.creation_timestamp) AS creation_timestamp,
                COALESCE (art_redir.lastmod_timestamp, art.lastmod_timestamp) AS lastmod_timestamp,
                COALESCE (art_redir.webp_large, art.webp_large) AS webp_large,
                COALESCE (art_redir.webp_medium, art.webp_medium) AS webp_medium,
                COALESCE (art_redir.webp_small, art.webp_small) AS webp_small,
                COALESCE (art_redir.is_indexed, art.is_indexed) AS is_indexed
            FROM enterlink_articletable AS art 
            LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL) 
            WHERE 
                ${whereClause1}`;
        const query2 = `
            SELECT 
                COALESCE (art_redir.page_title, art.page_title) AS page_title,
                COALESCE (art_redir.slug, art.slug) AS slug,
                COALESCE (art_redir.photo_url, art.photo_url) AS main_photo,
                COALESCE (art_redir.photo_thumb_url, art.photo_thumb_url) AS thumbnail,
                COALESCE (art_redir.page_lang, art.page_lang) AS lang_code,
                COALESCE (art_redir.ipfs_hash_current, art.ipfs_hash_current) AS ipfs_hash,
                COALESCE (art_redir.blurb_snippet, art.blurb_snippet) AS text_preview,
                COALESCE (art_redir.pageviews, art.pageviews) AS pageviews,
                COALESCE (art_redir.page_note, art.page_note) AS page_note,
                COALESCE (art_redir.page_type, art.page_type) AS page_type,
                COALESCE (art_redir.is_adult_content, art.is_adult_content) AS is_adult_content,
                COALESCE (art_redir.creation_timestamp, art.creation_timestamp) AS creation_timestamp,
                COALESCE (art_redir.lastmod_timestamp, art.lastmod_timestamp) AS lastmod_timestamp,
                COALESCE (art_redir.webp_large, art.webp_large) AS webp_large,
                COALESCE (art_redir.webp_medium, art.webp_medium) AS webp_medium,
                COALESCE (art_redir.webp_small, art.webp_small) AS webp_small,
                COALESCE (art_redir.is_indexed, art.is_indexed) AS is_indexed
            FROM enterlink_articletable AS art 
            LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL) 
            WHERE 
                ${whereClause2}`;
        const query = `${query1} UNION ${query2}`;

        let mysql_previews: Array<PreviewResult> = await this.mysql.TryQuery(query);
        let found_slugs = mysql_previews.map(prev => prev.slug);

        // Identify orphan hashes
        let orphan_hashes = uncached_previews.map(ucp => {
            if(!(found_slugs.includes(ucp.slug))) return ucp.ipfs_hash;
        })

        // Sync the orphan hashes if they are present
        if (orphan_hashes.length){

            // Get the html_blobs
            let orphan_hash_caches: Array<any> = await this.mysql.TryQuery(
                `
                    SELECT ipfs_hash, html_blob
                    FROM enterlink_hashcache 
                    WHERE 
                        articletable_id IS NULL
                        AND ipfs_hash IN (?)
                    ORDER BY timestamp DESC
                `,
                [orphan_hashes]
            );

            for (let j = 0; j < orphan_hash_caches.length; j++){
                try{
                    let wiki = JSON.parse(orphan_hash_caches[j].html_blob);
                    await this.wikiService.updateWiki(wiki, orphan_hash_caches[j].ipfs_hash, true);
                }
                catch(e){
                    console.log(chalk.red(`Orphan hash sync failed for: ${orphan_hash_caches[j].ipfs_hash}`));
                }
            }

            // Re-run the main query now that things are synced
            console.log(chalk.red("RE-RUNNING"))
            mysql_previews = await this.mysql.TryQuery(query);

        }

        mysql_previews = mysql_previews && mysql_previews.map(preview => {
            // Clean up text previews
            preview.page_title = sanitizeTextPreview(preview.page_title);
            if (preview.text_preview) {
                preview.text_preview = sanitizeTextPreview(preview.text_preview);
            }

            // Get the main photo category
            preview.main_photo_category = linkCategorizer(preview.main_photo);

            return preview;
        });

        // Save for fast cache
        const pipeline2 = this.redis.connection().pipeline();
        for (let preview of mysql_previews) {
            let memkey = `preview:lang_${preview.lang_code}:${preview.slug}`;
            if (useWebP) memkey = memkey + ":webp";
            memkey = memkey.toLowerCase();
            pipeline2.set(memkey , JSON.stringify(preview));
        }
        await pipeline2.exec();

        previews.push(...mysql_previews);
        if (previews.length == 0) {
            return [];
            // throw new NotFoundException({ error: `Could not find wikis` })
        };

        return previews;
    }
}
