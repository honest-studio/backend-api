import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { URL } from 'url';
import { IpfsService } from '../common';
import { MysqlService, MongoDbService, } from '../feature-modules/database';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CacheService } from '../cache';
import {
    ArticleJson,
    SeeAlso,
    Sentence,
    WikiExtraInfo,
    LanguagePack,
    renderAMP,
    renderSchema,
    calculateSeeAlsos,
    oldHTMLtoJSON
} from '../utils/article-utils';
import { updateElasticsearch } from '../utils/elasticsearch-tools';
import { MediaUploadService, PhotoExtraData } from '../media-upload';
import * as SqlString from 'sqlstring';
import cheerio from 'cheerio';

@Injectable()
export class WikiService {
    constructor(
        private ipfs: IpfsService,
        private mysql: MysqlService,
        private mongo: MongoDbService,
        private cacheService: CacheService,
        private mediaUploadService: MediaUploadService,
        private elasticSearch: ElasticsearchService,
    ) {}

    async getWikiBySlug(lang_code: string, slug: string, use_cache: boolean = true): Promise<ArticleJson> {
        const mysql_slug = this.mysql.cleanSlugForMysql(slug);
        let ipfs_hash_rows: any[] = await this.mysql.TryQuery(
            `
            SELECT COALESCE(art_redir.ipfs_hash_current, art.ipfs_hash_current) AS ipfs_hash
            FROM enterlink_articletable AS art
            LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL)
            WHERE ((art.slug = ? OR art.slug_alt = ?) OR (art.slug = ? OR art.slug_alt = ?)) AND art.page_lang = ?`,
            [slug, mysql_slug, mysql_slug, slug, lang_code]
        );
        if (ipfs_hash_rows.length == 0) throw new NotFoundException(`Wiki /${lang_code}/${slug} could not be found`);

        // Try and grab cached json wiki
        const ipfs_hash = ipfs_hash_rows[0].ipfs_hash;
        if (use_cache) {
            const cache_wiki = await this.mongo.connection().json_wikis.findOne({
                ipfs_hash: ipfs_hash
            });
            if (cache_wiki) return cache_wiki;
        }

        // get wiki from MySQL if there is no cached item
        let wiki_rows: Array<any> = await this.mysql.TryQuery(
            `
            SELECT html_blob
            FROM enterlink_hashcache
            WHERE ipfs_hash=?;`,
            [ipfs_hash]
        );
        let wiki: ArticleJson;
        try {
            // check if wiki is already in JSON format
            wiki = JSON.parse(wiki_rows[0].html_blob);
        } catch {
            wiki = oldHTMLtoJSON(wiki_rows[0].html_blob);
            wiki.ipfs_hash = ipfs_hash;

            // some wikis don't have page langs set
            if (!wiki.metadata.find((w) => w.key == 'page_lang'))
                wiki.metadata.push({ key: 'page_lang', value: lang_code });
        }


        // cache wiki - upsert so that use_cache=false updates the cache
        this.mongo
            .connection()
            .json_wikis.replaceOne({ ipfs_hash: wiki.ipfs_hash }, wiki, { upsert: true })
            .catch(console.log);

        return wiki;
    }

    async getAMPBySlug(lang_code: string, slug: string, use_cache: boolean = true): Promise<string> {
        let ampWiki: ArticleJson = await this.getWikiBySlug(lang_code, slug);
        let photoExtraData: PhotoExtraData = await this.mediaUploadService.getImageData(ampWiki.main_photo[0].url);
        ampWiki.main_photo[0].width = photoExtraData.width;
        ampWiki.main_photo[0].height = photoExtraData.height;
        ampWiki.main_photo[0].mime = photoExtraData.mime;
        const wikiExtraInfo = await this.getWikiExtras(lang_code, slug);
        return renderAMP(ampWiki, wikiExtraInfo);
    }

    async getSchemaBySlug(lang_code: string, slug: string): Promise<string> {
        const wiki = await this.getWikiBySlug(lang_code, slug);
        const schema = renderSchema(wiki, 'html');
        return schema;
    }

    async getWikisByHash(ipfs_hashes: string[]): Promise<ArticleJson[]> {
        const json_wikis = [];

        // try to directly fetch cached json wikis
        const cached_json_wikis = await this.mongo
            .connection()
            .json_wikis.find({
                ipfs_hash: { $in: ipfs_hashes }
            })
            .toArray();
        for (let json_wiki of cached_json_wikis) {
            const index = ipfs_hashes.findIndex((hash) => hash == json_wiki.ipfs_hash);
            json_wikis.push(json_wiki);
        }

        // try to fetch wikis from local IPFS node
        const uncached_json_hashes = ipfs_hashes.filter((hash) => !json_wikis.find((json) => json.ipfs_hash == hash));
        for (const i in uncached_json_hashes) {
            const ipfs_hash = uncached_json_hashes[i];
            try {
                const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
                const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
                const wiki = buffer.toString('utf8');
                const json_wiki = oldHTMLtoJSON(wiki);
                json_wiki.ipfs_hash = ipfs_hash;
                json_wikis.push(json_wiki);
            } catch (e) {
                continue;
            }
        }

        const uncached_html_hashes = ipfs_hashes.filter((hash) => !json_wikis.find((json) => json.ipfs_hash == hash));
        if (uncached_html_hashes.length > 0) {
            // fetch remainder from mysql if they exist
            const rows: Array<any> = await this.mysql.TryQuery(
                `SELECT * FROM enterlink_hashcache WHERE ipfs_hash IN (?)`,
                [uncached_html_hashes]
            );

            rows.forEach((r) => {
                const json_wiki = oldHTMLtoJSON(r.html_blob);
                json_wiki.ipfs_hash = r.ipfs_hash;
                json_wikis.push(json_wiki);
            });

            // cache uncached json wikis
            const uncached_json_wikis = uncached_json_hashes
                .map((hash) => json_wikis.find((json) => json.ipfs_hash == hash))
                .filter((json) => json); // filter out non-existent wikis

            uncached_json_wikis.forEach((json) => delete json._id);
            if (uncached_json_wikis.length > 0) {
                this.mongo
                    .connection()
                    .json_wikis.insertMany(uncached_json_wikis, { ordered: false })
                    .catch((e) => console.log('Failed to cache some wikis', e));
            }

            // attempt to cache uncached IPFS hashes
            uncached_html_hashes.forEach((hash) => this.cacheService.cacheWiki(hash));

            // mark wikis that couldn't be found
            for (let hash of ipfs_hashes) {
                const json = json_wikis.find((json) => json.ipfs_hash == hash);
                if (!json) json_wikis.push({ ipfs_hash: hash, error: `Wiki ${hash} could not be found` });
            }
        }

        return json_wikis;
    }

    async getWikiGroups(lang_code: string, slug: string): Promise<LanguagePack[]> {
        const lang_packs: LanguagePack[] = await this.mysql.TryQuery(
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
            [slug, slug, lang_code]
        );

        if (lang_packs.length == 0)
            throw new NotFoundException(`Group for wiki /${lang_code}/${slug} could not be found`);
        return lang_packs;
    }

    async getSeeAlsos(inputWiki: ArticleJson): Promise<SeeAlso[]> {
        let tempSeeAlsos: SeeAlso[] = calculateSeeAlsos(inputWiki);
        if (tempSeeAlsos.length == 0) return [];

        let seeAlsoWhere = tempSeeAlsos
            .map((value, index) => {
                // performance is slow when ORing slug_alt for some reason, even though it is indexed
                return SqlString.format('(art.slug=? AND art.page_lang=?)', [value.slug, value.lang]);
            })
            .join(' OR ');
        let seeAlsoRows: any[] = await this.mysql.TryQuery(
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
            WHERE ${seeAlsoWhere};`,
            []
        );

        // clean up text previews
        for (let preview of seeAlsoRows) {
            if (preview.text_preview) {
                preview.text_preview = preview.text_preview.replace(/<b>/g, ' ').replace(/<\/b>/g, ' ');
                const $ = cheerio.load(preview.text_preview);
                preview.text_preview = $.root()
                    .text()
                    .replace(/\s+/g, ' ')
                    .trim();
            }
        }

        return seeAlsoRows as SeeAlso[];
    }

    async submitWiki(wiki: ArticleJson): Promise<any> {
        if (wiki.ipfs_hash !== null) throw new BadRequestException('ipfs_hash must be null');

        let blob = JSON.stringify(wiki);
        let submission;
        try {
            submission = await this.ipfs.client().add(Buffer.from(blob, 'utf8'));
        } catch (err) {
            if (err.code == 'ECONNREFUSED') {
                console.log(`WARNING: IPFS could not be accessed. Is it running?`);
                throw new InternalServerErrorException(`Server error: The IPFS node is down`);
            } else throw err;
        }
        const ipfs_hash = submission[0].hash;

        let wikiCopy: ArticleJson = wiki;
        wikiCopy.ipfs_hash = ipfs_hash;
        let stringifiedWikiCopy = JSON.stringify(wikiCopy);
        
        const page_title = wiki.page_title[0].text;
        const slug = wiki.metadata.find((m) => m.key == 'url_slug').value;
        const text_preview = (wiki.page_body[0].paragraphs[0].items[0] as Sentence).text;
        const photo_url = wiki.main_photo[0].url;
        const photo_thumb_url = wiki.main_photo[0].thumb;
        const page_type = wiki.metadata.find((m) => m.key == 'page_type').value;
        const is_adult_content = wiki.metadata.find((m) => m.key == 'is_adult_content').value;
        const page_lang = wiki.metadata.find((m) => m.key == 'page_lang').value;
        const article_insertion = await this.mysql.TryQuery(
            `
            INSERT INTO enterlink_articletable 
                (ipfs_hash_current, slug, slug_alt, page_title, blurb_snippet, photo_url, photo_thumb_url, page_type, creation_timestamp, lastmod_timestamp, is_adult_content, page_lang, is_new_page, pageviews, is_removed, is_removed_from_index, bing_index_override, has_pending_edits)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, 1, 0, 0, 0, 0, 0)
            ON DUPLICATE KEY UPDATE 
                ipfs_hash_parent=ipfs_hash_current, lastmod_timestamp=NOW(), is_new_page=1, ipfs_hash_current=?, 
                page_title=?, blurb_snippet=?, photo_url=?, photo_thumb_url=?, page_type=?, is_adult_content=?
            `,
            [
                ipfs_hash,
                slug,
                slug,
                page_title,
                text_preview,
                photo_url,
                photo_thumb_url,
                page_type,
                is_adult_content,
                page_lang,
                ipfs_hash,
                page_title,
                text_preview,
                photo_url,
                photo_thumb_url,
                page_type,
                is_adult_content
            ]
        )

        // Get the article object
        let articleResultPacket = await this.mysql.TryQuery(
            `
            SELECT 
                id,
                page_title
            FROM enterlink_articletable AS art 
            WHERE page_lang = ? AND slug = ?
            `,
            [page_lang, slug]
        );
        
        // Update Elasticsearch
        updateElasticsearch(
            articleResultPacket[0].id, 
            articleResultPacket[0].page_title, 
            page_lang,
            'PAGE_UPDATED_OR_CREATED' , 
            this.elasticSearch
        )

        try {
            const json_insertion = await this.mysql.TryQuery(
                `
                INSERT INTO enterlink_hashcache (articletable_id, ipfs_hash, html_blob, timestamp) 
                VALUES (?, ?, ?, NOW())
                `,
                [articleResultPacket[0].id, ipfs_hash, stringifiedWikiCopy, page_lang]
            );
        } catch (e) {
            if (e.message.includes("ER_DUP_ENTRY"))
                throw new BadRequestException("Duplicate submission. IPFS hash already exists");
            else throw e;
        }

        return { ipfs_hash };
    }

    async incrementPageviewCount(lang_code: string, slug: string): Promise<boolean> {
        return this.mysql.TryQuery(
            `
            UPDATE enterlink_articletable 
            SET pageviews = pageviews + 1
            WHERE page_lang= ? AND slug = ?
            `,
            [lang_code, slug]
        );
    }

    async getCategories(lang_code: string, slug: string) {
        const wikipedia_categories = await fetch(
            new URL(
                `https://${lang_code.substring(
                    0,
                    2
                )}.wikipedia.org/w/api.php?action=query&format=json&titles=${slug}&prop=categories&format=json`
            )
        )
            .then((response) => response.json())
            .then((json) => json.query.pages)
            .then((pages) => Object.values(pages)[0])
            .then((obj) => obj.categories);

        if (wikipedia_categories) return wikipedia_categories.map((cat) => cat.title.split(':')[1]);
        else return [];
    }

    async getWikiExtras(lang_code: string, slug: string): Promise<WikiExtraInfo> {
        const wiki = await this.getWikiBySlug(lang_code, slug);
        const see_also = await this.getSeeAlsos(wiki);
        const schema = renderSchema(wiki, 'JSON');
        const pageviews_rows: any[] = await this.mysql.TryQuery(
            `
        SELECT 
            COALESCE (art_redir.pageviews, art.pageviews) AS pageviews, 
            COALESCE(art_redir.slug, art.slug) AS slug,
            COALESCE(art_redir.page_lang, art.page_lang) AS lang
        FROM enterlink_articletable AS art
        LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL)
        WHERE art.page_lang = ? AND art.slug = ?;
        `,
            [lang_code, slug]
        );
        let pageviews = 0;
        if (pageviews_rows.length > 0) pageviews = pageviews_rows[0].pageviews;

        let alt_langs;
        try {
            alt_langs = await this.getWikiGroups(lang_code, slug);
        } catch (e) {
            if (e instanceof NotFoundException) alt_langs = [];
            else throw e;
        }

        return { alt_langs, see_also, pageviews, schema };
    }
}
