import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as axios from 'axios';
import * as BooleanTools from 'boolean';
import * as fetch from 'node-fetch';
import { clearIntervalAsync, setIntervalAsync } from 'set-interval-async/dynamic';
import * as SqlString from 'sqlstring';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService, IpfsService } from '../common';
import { RedisService, MongoDbService, MysqlService } from '../feature-modules/database';
import { MediaUploadService, PhotoExtraData } from '../media-upload';
import { ProposalService } from '../proposal';
import { ArticleJson, Sentence, Citation, Media } from '../types/article';
import { LanguagePack, SeeAlso, WikiExtraInfo } from '../types/article-helpers';
import { calculateSeeAlsos, infoboxDtoPatcher, mergeMediaIntoCitations, oldHTMLtoJSON, flushPrerenders, addAMPInfo, renderAMP, renderSchema, convertMediaToCitation, getFirstAvailableCitationIndex } from '../utils/article-utils';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { mergeWikis } from '../utils/article-utils/article-merger';
import { updateElasticsearch } from '../utils/elasticsearch-tools';
const util = require('util');
var colors = require('colors');

export interface MergeInputPack {
    source: {
        slug: string,
        lang: string,
        override_articlejson?: ArticleJson
    },
    target: {
        slug: string,
        lang: string
    }
}

@Injectable()
export class WikiService {
    private updateWikiIntervals;

    constructor(
        private ipfs: IpfsService,
        private mysql: MysqlService,
        private mongo: MongoDbService,
        private redis: RedisService,
        private mediaUploadService: MediaUploadService,
        @Inject(forwardRef(() => ProposalService)) private proposalService: ProposalService,
        private elasticSearch: ElasticsearchService,
        private config: ConfigService
    ) {
        this.updateWikiIntervals = {};
    }

    async getMergedWiki(inputPack: MergeInputPack): Promise<ArticleJson>{
        let sourceWiki: ArticleJson;

        // Get the source wiki, which might be present in the input pack
        if (inputPack.source.override_articlejson){
            sourceWiki = inputPack.source.override_articlejson;
        } else sourceWiki = await this.getWikiBySlug(inputPack.source.lang, inputPack.source.slug, false);

        // Get the target ArticleJson, or handle the case where the page is removed
        let targetWiki = await this.getWikiBySlug(inputPack.target.lang, inputPack.target.slug, false, true);

        // Get the merged result
        let mergedResult = await mergeWikis(sourceWiki, targetWiki);
        // console.log(util.inspect(mergedResult, {showHidden: false, depth: null, chalk: true}));
        // fs.writeFileSync(path.join(__dirname, 'test.json'), JSON.stringify(mergedResult, null, 2));
        // console.log(mergedResult);
        // return null;
        return mergedResult;
    }

    async getWikiBySlug(lang_code: string, slug: string, cache: boolean = false, ignoreRemovalStatus: boolean = false, increment_views: boolean = true): Promise<ArticleJson> {
        let mysql_slug = this.mysql.cleanSlugForMysql(slug);
        console.log("mysql slug: ", mysql_slug)
        let decodedSlug = decodeURIComponent(mysql_slug);

        // Get current IPFS hash
        const pipeline = this.redis.connection().pipeline();
        pipeline.get(`wiki:lang_${lang_code}:${slug}:last_proposed_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${mysql_slug}:last_proposed_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${decodedSlug}:last_proposed_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${slug}:last_accepted_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${mysql_slug}:last_accepted_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${decodedSlug}:last_accepted_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${mysql_slug}:db_hash`);
        const values = await pipeline.exec();
        let current_hash;
        for (let value of values) {
            if (value[1]) current_hash = value[1];
        }

        // Try and get cached wiki
        if (current_hash) {
            const cache_wiki = await this.redis.connection().get(`wiki:${current_hash}`);
            if (cache_wiki) return JSON.parse(cache_wiki);
        }

        let ipfs_hash_rows: any[] = await this.mysql.TryQuery(
            `
            SELECT 
                COALESCE(art_redir.ipfs_hash_current, art.ipfs_hash_current) AS ipfs_hash, 
                art.is_indexed as is_idx, 
                art_redir.is_indexed as is_idx_redir,
                COALESCE(art_redir.is_removed, art.is_removed) AS is_removed,
                COALESCE(art_redir.lastmod_timestamp, art.lastmod_timestamp) AS lastmod_timestamp,
                CONCAT('lang_', art_redir.page_lang, '/', art_redir.slug) AS redirect_wikilangslug
            FROM enterlink_articletable AS art
            LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL)
            WHERE 
                ((art.slug = ? OR art.slug_alt = ?) OR (art.slug = ? OR art.slug_alt = ?)) 
                AND (art.page_lang = ? OR art_redir.page_lang = ?)
            `,
            [mysql_slug, mysql_slug, decodedSlug, decodedSlug, lang_code, lang_code]
        );
        let db_hash;
        let overrideIsIndexed;
        let db_timestamp;
        let main_redirect_wikilangslug;
        if (ipfs_hash_rows.length > 0) {
            if (ignoreRemovalStatus) { /* Do nothing */ }
            else if (ipfs_hash_rows[0].is_removed) throw new HttpException(`Wiki ${lang_code}/${slug} is marked as removed`, HttpStatus.GONE);
            db_hash = ipfs_hash_rows[0].ipfs_hash;
            main_redirect_wikilangslug = ipfs_hash_rows[0].redirect_wikilangslug;
            // Account for the boolean flipping issue being in old articles
            overrideIsIndexed = BooleanTools.default(ipfs_hash_rows[0].is_idx || ipfs_hash_rows[0].is_idx_redir || 0);
            db_timestamp = new Date(ipfs_hash_rows[0].lastmod_timestamp + "Z"); // The Z indicates that the time is already in UTC
        };

        if (db_hash) this.redis.connection().set(`wiki:lang_${lang_code}:${mysql_slug}:db_hash`, db_hash);
        let ipfs_hash = db_hash;
        if (current_hash && current_hash != ipfs_hash)
            ipfs_hash = current_hash;

        if (!ipfs_hash) throw new NotFoundException(`Wiki /lang_${lang_code}/${slug} could not be found`);

        // No cache available. Pull and construct it
        // get wiki from MySQL
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
            wiki.metadata = wiki.metadata.map((obj) => {
                if (obj.key == 'is_indexed') return { key: 'is_indexed', value: overrideIsIndexed }
                else return obj;
            });
            
            wiki = infoboxDtoPatcher(mergeMediaIntoCitations(wiki));
            // some wikis don't have page langs set
            if (!wiki.metadata.find((w) => w.key == 'page_lang')) wiki.metadata.push({ key: 'page_lang', value: lang_code });
        } catch {
            // if the wiki is not in JSON format, generate the JSON from the html_blob and return it
            wiki = infoboxDtoPatcher(mergeMediaIntoCitations(oldHTMLtoJSON(wiki_rows[0].html_blob)));
            wiki.metadata = wiki.metadata.map((obj) => {
                if (obj.key == 'is_indexed') return { key: 'is_indexed', value: overrideIsIndexed }
                else return obj;
            });
            wiki.ipfs_hash = ipfs_hash;

            // some wikis don't have page langs set
            if (!wiki.metadata.find((w) => w.key == 'page_lang')) wiki.metadata.push({ key: 'page_lang', value: lang_code });
        }


        const lastmod_timestamp = wiki.metadata.find(w => w.key == 'lastmod_timestamp') 
                                    ? wiki.metadata.find(w => w.key == 'lastmod_timestamp').value 
                                    : '1919-12-31 00:00:00';
        const mobile_cache_timestamp = wiki.metadata.find(w => w.key == 'mobile_cache_timestamp') 
                                    ? wiki.metadata.find(w => w.key == 'mobile_cache_timestamp').value
                                    : '1919-12-31 00:00:00';

        // If the page has been modified since the last prerender, recache it
        if (!mobile_cache_timestamp || (mobile_cache_timestamp && mobile_cache_timestamp <= lastmod_timestamp)){
            // console.log("Refreshing prerender")
            const prerenderToken = this.config.get('PRERENDER_TOKEN');
            flushPrerenders(lang_code, slug, prerenderToken);

            // Update the cache timestamp too in the pageview increment query to save overhead
            this.incrementPageviewCount(lang_code, mysql_slug, false, true);
        }
        else this.incrementPageviewCount(lang_code, mysql_slug);

        // Add redirect information, if present
        wiki.redirect_wikilangslug = main_redirect_wikilangslug;

        // cache wiki
        this.redis.connection().set(`wiki:${ipfs_hash}`, JSON.stringify(wiki));

        return wiki;
    }

    async getAMPBySlug(lang_code: string, slug: string, cache: boolean = false): Promise<string> {
        let ampWiki: ArticleJson = await this.getWikiBySlug(lang_code, slug, BooleanTools.default(cache));
        let photoExtraData: PhotoExtraData = await this.mediaUploadService.getImageData(ampWiki.main_photo[0].url);
        ampWiki.main_photo[0].width = photoExtraData.width;
        ampWiki.main_photo[0].height = photoExtraData.height;
        ampWiki.main_photo[0].mime = photoExtraData.mime;
        const wikiExtraInfo = await this.getWikiExtras(lang_code, slug);

        return renderAMP(ampWiki, wikiExtraInfo);
    }

    async getSchemaBySlug(lang_code: string, slug: string): Promise<string> {
        const wiki = await this.getWikiBySlug(lang_code, slug, false, false, false);
        const schema = renderSchema(wiki, 'html');
        return schema;
    }

    async getWikisByHash(ipfs_hashes: string[]): Promise<ArticleJson[]> {
        let json_wikis = [];




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

        // KEDAR: 
            // This is a useless action. nothing is ever found in IPFS
            // We need a better way to fetch wikis from IPFS
            // Sync them from IPFS straight to our DB so we don't have to keep going back to the network
        //// try to fetch wikis from local IPFS node
        //const uncached_json_hashes = ipfs_hashes.filter((hash) => !json_wikis.find((json) => json.ipfs_hash == hash));
        //for (const i in uncached_json_hashes) {
        //    const ipfs_hash = uncached_json_hashes[i];
        //    try {
        //        const pinned = await this.ipfs.client().pin.ls(ipfs_hash);
        //        const buffer: Buffer = await this.ipfs.client().cat(ipfs_hash);
        //        const wiki = buffer.toString('utf8');
        //        const json_wiki = oldHTMLtoJSON(wiki);
        //        json_wiki.ipfs_hash = ipfs_hash;
        //        json_wikis.push(json_wiki);
        //    } catch (e) {
        //        continue;
        //    }
        //}

        const uncached_hashes = ipfs_hashes.filter(hash => !json_wikis.find(json => json.ipfs_hash == hash));

        if (uncached_hashes.length > 0) {
            // fetch remainder from mysql if they exist
            const rows: Array<any> = await this.mysql.TryQuery(
                `SELECT * FROM enterlink_hashcache WHERE ipfs_hash IN (?)`,
                [uncached_hashes]
            );

            rows.forEach((r) => {
                let json_wiki;
                try {
                    json_wiki = JSON.parse(r.html_blob);
                } catch (e) {
                    json_wiki = oldHTMLtoJSON(r.html_blob);
                    json_wiki.ipfs_hash = r.ipfs_hash;
                }
                json_wikis.push(json_wiki);
            });

            // cache uncached json wikis
            const uncached_wikis = uncached_hashes
                .map((hash) => json_wikis.find((json) => json.ipfs_hash == hash))
                .filter((json) => json); // filter out non-existent wikis

            uncached_wikis.forEach((json) => delete json._id);
            if (uncached_wikis.length > 0) {
                this.mongo
                    .connection()
                    .json_wikis.insertMany(uncached_wikis, { ordered: false })
                    .catch((e) => console.log('Failed to cache some wikis', e));
            }

            // mark wikis that couldn't be found
            for (let hash of ipfs_hashes) {
                const json = json_wikis.find((json) => json.ipfs_hash == hash);
                if (!json) json_wikis.push({ ipfs_hash: hash, error: `Wiki ${hash} could not be found` });
            }
        }

        json_wikis = json_wikis.map((innerWiki) => {
            return infoboxDtoPatcher(mergeMediaIntoCitations(innerWiki));
        })

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
            throw new NotFoundException(`Group for wiki /lang_${lang_code}/${slug} could not be found`);
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
            preview.page_title = sanitizeTextPreview(preview.page_title);
            if (preview.text_preview) {
                preview.text_preview = sanitizeTextPreview(preview.text_preview);
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

        // Pin it so it can be accessed on the network
        try {
            await this.ipfs.client().pin.add(ipfs_hash);
        } catch (err) {
            if (err.code == 'ECONNREFUSED') {
                console.log(`WARNING: IPFS could not be accessed. Is it running?`);
                throw new InternalServerErrorException(`Server error: The IPFS file could not be pinned`);
            } else throw err;
        }

        // Save submission immediately so we don't lose data
        const slug = wiki.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;
        if (slug.indexOf('/') > -1) throw new BadRequestException('slug cannot contain a /');
        const cleanedSlug = this.mysql.cleanSlugForMysql(slug);
        let page_lang = wiki.metadata.find((m) => m.key == 'page_lang');
        page_lang = page_lang ? page_lang.value : 'en';
        let wikiCopy: ArticleJson = addAMPInfo(wiki);
        wikiCopy.ipfs_hash = ipfs_hash;
        let stringifiedWikiCopy = JSON.stringify(wikiCopy);
        try {
            const json_insertion = await this.mysql.TryQuery(
                `
                INSERT INTO enterlink_hashcache (articletable_id, ipfs_hash, html_blob, timestamp) 
                VALUES (
                    (SELECT id FROM enterlink_articletable where slug = ? AND page_lang = ?), 
                    ?, ?, NOW())
                `,
                [cleanedSlug, page_lang, ipfs_hash, stringifiedWikiCopy]
            );
        } catch (e) {
            if (e.message.includes("ER_DUP_ENTRY")){
                console.log(colors.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
            }
            else throw e;
        }

        // Pin to Eternum
        const pin_data = {
                hash: ipfs_hash,
                name: `lang_${page_lang}/${slug}`
        };
        fetch(`https://www.eternum.io/api/pin/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token: ${this.config.get("ETERNUM_API_KEY")}`,
            },
            body: JSON.stringify(pin_data)
        });

        // Cache to Redis
        this.redis.connection().set(`wiki:${ipfs_hash}`, JSON.stringify(wiki));

        // RETURN THE IPFS HASH HERE, BUT BEFORE DOING SO, START A THREAD TO LOOK FOR THE PROPOSAL ON CHAIN
        // ONCE THE PROPOSAL IS DETECTED ON CHAIN, UPDATE MYSQL
        let INTERVAL_MSEC = 2000;
        this.updateWikiIntervals[ipfs_hash] = setIntervalAsync(
            async () => this.updateWiki(wiki, ipfs_hash),
            INTERVAL_MSEC
        )
        setTimeout(() => clearIntervalAsync(this.updateWikiIntervals[ipfs_hash]), INTERVAL_MSEC * 30);

        return { ipfs_hash };
    }

    async submitWikiViaBot(wiki: ArticleJson, token: string, bypassIPFS: boolean = true): Promise<any> {
        try{
            // Jank
            if (token != this.config.get('BOT_TOKEN_1')) {
                console.log(colors.red.bold("AUTHORIZATION DENIED"));
                return false;
            }

            let ipfs_hash;
            if (!bypassIPFS){
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
                ipfs_hash = submission[0].hash;
            }
            else ipfs_hash = wiki.ipfs_hash;

            await this.processWikiUpdate(wiki, ipfs_hash);

            // Save submission immediately so we don't lose data
            const slug = wiki.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;
            if (slug.indexOf('/') > -1) throw new BadRequestException('slug cannot contain a /');
            const cleanedSlug = this.mysql.cleanSlugForMysql(slug);
            const page_lang = wiki.metadata.find((m) => m.key == 'page_lang').value;
            let wikiCopy: ArticleJson = addAMPInfo(wiki);
            wikiCopy.ipfs_hash = ipfs_hash;

            let stringifiedWikiCopy = JSON.stringify(wikiCopy);
            try {
                const json_insertion = await this.mysql.TryQuery(
                    `
                    INSERT INTO enterlink_hashcache (articletable_id, ipfs_hash, html_blob, timestamp) 
                    VALUES (
                        (SELECT id FROM enterlink_articletable where slug = ? AND page_lang = ?), 
                        ?, ?, NOW())
                    `,
                    [cleanedSlug, page_lang, ipfs_hash, stringifiedWikiCopy]
                );
            } catch (e) {
                if (e.message.includes("ER_DUP_ENTRY")){
                    console.log(colors.yellow('WARNING: Duplicate submission. IPFS hash already exists'));
                }
                else throw e;
            }

            return { status: 'Success' };
        }
        catch (e){
            return { status: e };
        }
    }

    async processWikiUpdate(wiki: ArticleJson, ipfs_hash: string, mergeTx?: any): Promise<any>{
        const page_title = wiki.page_title[0].text;
        const slug = wiki.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;
        const cleanedSlug = this.mysql.cleanSlugForMysql(slug);

        let text_preview;
        try {
            const first_para = wiki.page_body[0].paragraphs[0];
            text_preview = (first_para.items[0] as Sentence).text;
            if (first_para.items.length > 1)
                text_preview += (first_para.items[1] as Sentence).text;
        } catch (e) {
            text_preview = "";
        }
        const photo_url = wiki.main_photo[0].url;
        const photo_thumb_url = wiki.main_photo[0].thumb;
        const page_type = wiki.metadata.find((m) => m.key == 'page_type').value;
        const is_adult_content = wiki.metadata.find((m) => m.key == 'is_adult_content').value;
        const is_indexed = wiki.metadata.find(w => w.key == 'is_indexed').value;
        let page_lang = wiki.metadata.find((m) => m.key == 'page_lang') ? wiki.metadata.find((m) => m.key == 'page_lang').value : 'en';
        const is_removed = wiki.metadata.find((m) => m.key == 'is_removed').value;

        const article_insertion = await this.mysql.TryQuery(
            `
            INSERT INTO enterlink_articletable 
                (ipfs_hash_current, slug, slug_alt, page_title, blurb_snippet, photo_url, photo_thumb_url, page_type, creation_timestamp, lastmod_timestamp, is_adult_content, page_lang, is_new_page, pageviews, is_removed, is_indexed, bing_index_override, has_pending_edits)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, 1, 0, 0, 1, 0, 0)
            ON DUPLICATE KEY UPDATE 
                ipfs_hash_parent=ipfs_hash_current, lastmod_timestamp=NOW(), is_new_page=0, ipfs_hash_current=?, 
                page_title=?, blurb_snippet=?, photo_url=?, photo_thumb_url=?, page_type=?, is_adult_content=?, is_indexed=?, 
                is_removed=?, desktop_cache_timestamp=NULL, mobile_cache_timestamp=NULL
            `,
            [
                ipfs_hash,
                cleanedSlug,
                cleanedSlug,
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
                is_adult_content,
                is_indexed,
                is_removed
            ]
        )

        // Get the prerender token
        const prerenderToken = this.config.get('PRERENDER_TOKEN');

        // Get the article object
        let articleResultPacket: Array<any> = await this.mysql.TryQuery(
            `
            SELECT 
                id,
                page_title
            FROM enterlink_articletable AS art 
            WHERE 
                page_lang = ? 
                AND (slug = ? OR slug_alt = ?)
                AND art.is_removed = 0
            `,
            [page_lang, cleanedSlug, cleanedSlug]
        );



        if (articleResultPacket.length > 0) {
            // Handle the merge redirect, if present
            if(mergeTx){
                // Get the merged article
                let quickSplit = mergeTx.trace.act.data.comment.split("|")[1].split("/");
                let merged_slug = quickSplit.slice(1).join("");
                let merged_lang = quickSplit[0].replace("lang_", "");
                let mergedArticleResult: Array<any> = await this.mysql.TryQuery(
                    `
                    SELECT 
                        id,
                        page_title
                    FROM enterlink_articletable AS art 
                    WHERE 
                        page_lang = ? 
                        AND (slug = ? OR slug_alt = ?)
                        AND art.is_removed = 0
                    `,
                    [merged_lang, merged_slug, merged_slug]
                );

                console.log(colors.blue(`cleanedSlug: ${cleanedSlug}`));
                console.log(colors.blue(`merged_slug: ${merged_slug}`));

                if (mergedArticleResult.length > 0) {
                    console.log(colors.blue(`articleResultPacket[0].id: ${articleResultPacket[0].id}`));
                    console.log(colors.blue(`mergedArticleResult[0].id: ${mergedArticleResult[0].id}`));
                    await this.mysql.TryQuery(
                        `
                        UPDATE enterlink_articletable 
                            SET is_removed = 0, 
                                is_indexed = 0, 
                                bing_index_override = 0,
                                lastmod_timestamp = NOW(),
                                redirect_page_id = ?
                            WHERE id = ?
                        `,
                        [articleResultPacket[0].id, mergedArticleResult[0].id]
                    );

                    // Update Elasticsearch for the merged article to point it to the canonical article
                    await updateElasticsearch(
                        mergedArticleResult[0].id, // merged article id
                        mergedArticleResult[0].page_title, 
                        merged_lang,
                        'MERGE_REDIRECT' , 
                        this.elasticSearch,
                        articleResultPacket[0].id, // canonical id
                    ).then(() => {
                        console.log(colors.green(`Elasticsearch for lang_${merged_lang}/${merged_slug} updated`));
                    }).catch(e => {
                        console.log(colors.red(`Elasticsearch for lang_${merged_lang}/${merged_slug} failed:`), colors.red(e));
                    })

                    // Flush prerender for the merged article
                    flushPrerenders(merged_lang, merged_slug, prerenderToken);
                    
                }

            }

            // Update Elasticsearch for the main article
            await updateElasticsearch(
                articleResultPacket[0].id, 
                articleResultPacket[0].page_title, 
                page_lang,
                'PAGE_UPDATED_OR_CREATED' , 
                this.elasticSearch
            ).then(() => {
                console.log(colors.green(`Elasticsearch for lang_${page_lang}/${slug} updated`));
            }).catch(e => {
                console.log(colors.red(`Elasticsearch for lang_${page_lang}/${slug} failed:`), colors.red(e));
            })

            // Flush prerender for the main article
            flushPrerenders(page_lang, slug, prerenderToken);

            // Set the DB hash in Redis
            // Delete previews
            // TODO: Update previews
            const pipeline = this.redis.connection().pipeline();
            const lowerslug = slug.toLowerCase();
            pipeline.set(`wiki:lang_${page_lang}:${slug}:db_hash`, ipfs_hash);
            pipeline.del(`preview:lang_${page_lang}:${slug}:webp`);
            pipeline.del(`preview:lang_${page_lang}:${slug}`);
            pipeline.del(`preview:lang_${page_lang}:${cleanedSlug}:webp`);
            pipeline.del(`preview:lang_${page_lang}:${cleanedSlug}`);
            pipeline.exec();

            console.log(colors.green('========================================'));
            console.log(colors.green(`MySQL and ElasticSearch updated. Terminating loop...`));
            console.log(colors.green('========================================'));

        }

        return;
    }

    async updateWiki(wiki: ArticleJson, ipfs_hash: string) {
        console.log(colors.yellow(`Checking on ${ipfs_hash} to hit the mainnet`));
        const twoMinutesAgo = (Date.now() / 1000 | 0) - 60*2;
        const submitted_proposal = await this.mongo
            .connection()
            .actions.findOne({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.ipfs_hash': ipfs_hash,
                'trace.act.data.starttime': { $gt: twoMinutesAgo }
            })
        if (submitted_proposal) {
            // console.log(util.inspect(submitted_proposal, {showHidden: false, depth: null, chalk: true}));
            const trxID = submitted_proposal.trx_id;
            console.log(colors.green(`Transaction found! (${trxID})`));
            clearIntervalAsync(this.updateWikiIntervals[ipfs_hash]);
            // Check for a merge
            if(submitted_proposal.trace.act.data.comment.indexOf("MERGE_FROM|") >= 0 
                && submitted_proposal.trace.act.data.memo.indexOf("Merge") >= 0 
            ) await this.processWikiUpdate(wiki, ipfs_hash, submitted_proposal);
            else await this.processWikiUpdate(wiki, ipfs_hash);
        }
    }

    // increment the pageview counter for a page
    // optionally update the mobile and desktop cache timestamps at the same time
    async incrementPageviewCount(lang_code: string, slug: string, setDesktopCache?: boolean, setMobileCache?: boolean): Promise<boolean> {
        let desktopCacheString = setDesktopCache ? ", desktop_cache_timestamp = NOW()": "";
        let mobileCacheString = setMobileCache ? ", mobile_cache_timestamp = NOW()": "";
        return this.mysql.TryQuery(
            `
            UPDATE enterlink_articletable 
            SET pageviews = pageviews + 1${desktopCacheString}${mobileCacheString} 
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
        const wiki = await this.getWikiBySlug(lang_code, slug, false, false, false);
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

        return { 
            alt_langs, 
            see_also, 
            pageviews, 
            schema, 
            canonical_lang: lang_code, 
            canonical_slug: slug  
        };
    }
}
