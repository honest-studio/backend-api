import { Injectable, NotFoundException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { IpfsService } from '../common';
import { MysqlService, MongoDbService } from '../feature-modules/database';
import { CacheService } from '../cache';
import { oldHTMLtoJSON } from './article-converter';
import { getSeeAlsos } from '../utils/article-utils'
import { ArticleJson, SeeAlso, PhotoExtraData } from './article-dto';
import { renderAMP } from './amp-template';
import { renderSchema } from './schema-template';
import { MediaUploadService } from '../media-upload'
const SqlString = require('sqlstring');

export interface LanguagePack {
    lang: string;
    article_title: string;
    slug: string;
}

@Injectable()
export class WikiService {
    constructor(
        private ipfs: IpfsService,
        private mysql: MysqlService,
        private mongo: MongoDbService,
        private cacheService: CacheService
    ) {}

    async getWikiByHash(ipfs_hash: string): Promise<any> {
        const wikis = await this.getWikisByHash([ipfs_hash]);
        return wikis[0];
    }

    async getWikiBySlug(lang_code: string, slug: string, use_cache: boolean = true): Promise<ArticleJson> {
        let rows: Array<any> = await new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                SELECT cache.html_blob, art.pageviews, art.ipfs_hash_current, art.page_note
                FROM enterlink_articletable AS art 
                JOIN enterlink_hashcache AS cache 
                ON art.ipfs_hash_current=cache.ipfs_hash 
                WHERE art.redirect_page_id is NULL 
                AND art.is_removed=0 
                AND (art.slug=? OR art.slug_alt=?) 
                AND art.page_lang=?;`,
                [slug, slug, lang_code],
                function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        if (rows.length == 0) {
            // check for redirect
            rows = await new Promise((resolve, reject) => {
                this.mysql.pool().query(
                    `
                    SELECT cache.html_blob, art.pageviews, art.ipfs_hash_current, art.page_note
                    FROM enterlink_articletable AS art 
                    JOIN enterlink_hashcache AS cache 
                    ON cache.ipfs_hash=art.ipfs_hash_current 
                    WHERE art.id = (
                        SELECT redirect_page_id 
                        FROM enterlink_articletable AS art 
                        WHERE (art.slug=? OR art.slug_alt=?)
                        AND art.page_lang=?
                    );`,
                    [slug, slug, lang_code],
                    function(err, rows) {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });
        }
        if (rows.length == 0) throw new NotFoundException(`Wiki /${lang_code}/${slug} could not be found`);

        // check cache for json wiki
        // else compute the JSON and cache it
        const cache_wiki = await this.mongo.connection().json_wikis.findOne({
            'metadata.ipfs_hash': rows[0].ipfs_hash_current
        });
        let wiki: ArticleJson;
        if (cache_wiki && use_cache){
            wiki = cache_wiki;
        } 
        else {
            wiki = oldHTMLtoJSON(rows[0].html_blob);
            wiki.metadata.pageviews = rows[0].pageviews;
            wiki.metadata.ipfs_hash = rows[0].ipfs_hash_current;
            if (wiki.metadata.is_wikipedia_import) {
                const categories = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${slug}&prop=categories&format=json`
                )
                .then(response => response.json())
                .then(json => json.query.pages)
                .then(pages => Object.values(pages)[0])
                .then(obj => obj.categories)
                .then(cats => cats.map(cat => cat.title.split(':')[1]));

                wiki.categories = categories;
            }
            this.mongo.connection().json_wikis.insertOne(wiki);
        }
        wiki.seealsos = getSeeAlsos(wiki);
        let seeAlsoWhere = wiki.seealsos.map((value, index) => {
            // performance is slow when ORing slug_alt for some reason, even though it is indexed
            return SqlString.format('(art.slug=? AND art.page_lang=?)', [value.slug, value.lang]);
        }).join(" OR ");
        let seeAlsoRows = await new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                SELECT COALESCE(art_redir.slug, art.slug) AS slug, COALESCE(art_redir.page_title, art.page_title) AS title, 
                COALESCE(art_redir.page_lang, art.page_lang) AS lang, COALESCE(art_redir.photo_thumb_url, art.photo_thumb_url) AS thumbnail_url, 
                COALESCE(art_redir.blurb_snippet, art.blurb_snippet) AS snippet
                FROM enterlink_articletable art
                LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL)
                WHERE ${seeAlsoWhere};`,
                [],
                function(err, rows) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    else resolve(rows);
                }
            );
        });
        wiki.seealsos = seeAlsoRows as SeeAlso[];
        wiki.metadata.pageviews = rows[0].pageviews;
        wiki.metadata.page_lang = lang_code;
        return wiki;
    }

    async getAMPBySlug(lang_code: string, slug: string, use_cache: boolean = true): Promise<string> {
        console.log('\x1b[41;1m%s\x1b[0m', "FORCING USE_CACHE TO FALSE. FIX THIS LATER");
        console.log('\x1b[41;1m%s\x1b[0m', "DO NOT FORGET TO PRESERVE ATTRS IN ALL OF YOUR LOOPING FUNCTIONS!!!");
        console.log('\x1b[41;1m%s\x1b[0m', "NEED TO DO A BUNCH OF ERROR CHECKING TOO");
        let langPacks = await this.getWikiGroup(lang_code, slug);
        let ampWiki = await this.getWikiBySlug(lang_code, slug, false);
        let tempService = new MediaUploadService(null);
        let photoExtraData: PhotoExtraData = await tempService.getImageData(ampWiki.main_photo.url);
        ampWiki.main_photo.width = photoExtraData.width;
        ampWiki.main_photo.height = photoExtraData.height;
        ampWiki.main_photo.mime = photoExtraData.mime;
        return renderAMP(ampWiki, langPacks);
    }

    async getSchemaBySlug(lang_code: string, slug: string): Promise<string> {
        return renderSchema(await this.getWikiBySlug(lang_code, slug));
    }

    async getWikisByHash(ipfs_hashes: Array<string>) {
        const json_wikis = [];

        // try to directly fetch cached json wikis
        const cached_json_wikis = await this.mongo
            .connection()
            .json_wikis.find({
                'metadata.ipfs_hash': { $in: ipfs_hashes }
            })
            .toArray();
        for (let json_wiki of cached_json_wikis) {
            const index = ipfs_hashes.findIndex((hash) => hash == json_wiki.metadata.ipfs_hash);
            json_wikis.push(json_wiki);
        }

        // try to fetch wikis from local IPFS node
        const uncached_json_hashes = ipfs_hashes.filter(
            (hash) => !json_wikis.find((json) => json.metadata.ipfs_hash == hash)
        );
        for (const i in uncached_json_hashes) {
            const ipfs_hash = uncached_json_hashes[i];
            try {
                const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
                const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
                const wiki = buffer.toString('utf8');
                const json_wiki = oldHTMLtoJSON(wiki);
                json_wiki.metadata.ipfs_hash = ipfs_hash;
                json_wikis.push(json_wiki);
            } catch {
                continue;
            }
        }

        const uncached_html_hashes = ipfs_hashes.filter(
            (hash) => !json_wikis.find((json) => json.metadata.ipfs_hash == hash)
        );
        if (uncached_html_hashes.length > 0) {
            // fetch remainder from mysql if they exist
            const rows: Array<any> = await new Promise((resolve, reject) => {
                this.mysql
                    .pool()
                    .query(`SELECT * FROM enterlink_hashcache WHERE ipfs_hash IN (?)`, [uncached_html_hashes], function(
                        err,
                        rows
                    ) {
                        if (err) reject(err);
                        else resolve(rows);
                    });
            });
            rows.forEach((r) => {
                const json_wiki = oldHTMLtoJSON(r.html_blob);
                json_wiki.metadata.ipfs_hash = r.ipfs_hash;
                json_wikis.push(json_wiki);
            });

            // cache uncached json wikis
            const uncached_json_wikis = uncached_json_hashes
                .map((hash) => json_wikis.find((json) => json.metadata.ipfs_hash == hash))
                .filter((json) => json); // filter out non-existent wikis
            this.mongo.connection().json_wikis.insertMany(uncached_json_wikis);

            // attempt to cache uncached IPFS hashes
            uncached_html_hashes.forEach((hash) => this.cacheService.cacheWiki(hash));

            // mark wikis that couldn't be found
            for (let hash of ipfs_hashes) {
                const json = json_wikis.find((json) => json.metadata.ipfs_hash == hash);
                if (!json) json_wikis.push({ error: `Wiki ${hash} could not be found` });
            }
        }

        return json_wikis;
    }

    async getWikiGroup(lang_code: string, slug: string): Promise<LanguagePack[]> {
        const lang_packs: LanguagePack[] = await new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                SELECT slug as slug, page_title as article_title, page_lang as lang
                FROM enterlink_articletable
                WHERE article_group_id = (
                    SELECT article_group_id
                    FROM enterlink_articletable
                    WHERE (slug=? OR slug_alt=?)
                    AND page_lang=?
                    AND redirect_page_id is NULL
                    AND is_removed=0
                )
                AND redirect_page_id is NULL
                AND is_removed=0`,
                [slug, slug, lang_code],
                function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        if (lang_packs.length == 0) throw new NotFoundException(`Wiki /${lang_code}/${slug} could not be found`);
        return lang_packs;
    }

    async submitWiki(html_body: string): Promise<any> {
        const submission = await this.ipfs.client().add(Buffer.from(html_body, 'utf8'));
        const ipfs_hash = submission[0].hash;
        const insertion = await new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                INSERT INTO enterlink_hashcache (ipfs_hash, html_blob, timestamp) 
                VALUES (?, ?, NOW())
                `,
                [ipfs_hash, html_body],
                function(err, res) {
                    if (err && err.message.includes('ER_DUP_ENTRY')) resolve('Duplicate entry. Continuing');
                    else if (err) reject(err);
                    else resolve(res);
                }
            );
        });
        return { ipfs_hash };
    }

    async incrementPageviewCount(lang_code: string, slug: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `
                UPDATE enterlink_articletable 
                SET pageviews = pageviews + 1
                WHERE page_lang= ? AND slug = ?
                `,
                [lang_code, slug],
                function(err, res) {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    }
}
