import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as axios from 'axios';
import * as BooleanTools from 'boolean';
import * as fetch from 'node-fetch';
import { clearIntervalAsync, setIntervalAsync } from 'set-interval-async/dynamic';
import * as SqlString from 'sqlstring';
import { URL } from 'url';
import * as fs from 'fs';
const _ = require('lodash');
import * as path from 'path';
import { sha256 } from 'js-sha256';
import { ConfigService, IpfsService } from '../common';
import { RedisService, MongoDbService, MysqlService } from '../feature-modules/database';
import { MediaUploadService, PhotoExtraData } from '../media-upload';
import { ChainService } from '../chain';
import { ArticleJson, Sentence, Citation, Media, ListItem } from '../types/article';
import { MergeResult, MergeProposalParsePack, Boost, BoostsByWikiReturnPack, BoostsByUserReturnPack, Wikistbl2Item, PageIndexedLinkCollection, PageCategory } from '../types/api';
import { PreviewService } from '../preview';
import { LanguagePack, SeeAlsoType, WikiExtraInfo } from '../types/article-helpers';
import { calculateSeeAlsos, infoboxDtoPatcher, mergeMediaIntoCitations, oldHTMLtoJSON, flushPrerenders, addAMPInfo, renderAMP, renderSchema, convertMediaToCitation, getFirstAvailableCitationIndex, getPageSentences } from '../utils/article-utils';
import { sanitizeTextPreview, sha256ToChecksum256EndianSwapper, getBlurbSnippetFromArticleJson } from '../utils/article-utils/article-tools';
import { CAPTURE_REGEXES } from '../utils/article-utils/article-converter';
import { mergeWikis, parseMergeInfoFromProposal } from '../utils/article-utils/article-merger';
import { updateElasticsearch } from '../utils/elasticsearch-tools';
const util = require('util');
var colors = require('colors');
import FormData from 'form-data';
import crypto from 'crypto';
import multihash from 'multihashes';

const MAX_SLUG_SIZE = 256;
const MAX_LANG_CODE_SIZE = 7;

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

export interface UserServiceOptions {
    limit: number;
    offset: number;
}

@Injectable()
export class WikiService {
    private updateWikiIntervals;

    constructor(
        private ipfs: IpfsService,
        private mysql: MysqlService,
        private mongo: MongoDbService,
        private redis: RedisService,
        @Inject(forwardRef(() => PreviewService)) private previewService: PreviewService,
        private mediaUploadService: MediaUploadService,
        private elasticSearch: ElasticsearchService,
        private config: ConfigService,
        private chain: ChainService
    ) {
        this.updateWikiIntervals = {};
        this.redis.subscriber().on("message", async (channel, message) => {
            // console.log(channel, message);
            if (channel == "action:logpropres"){
                // Extract some info from the message
                let parsedMessage = JSON.parse(message);
                const theProposalID = parsedMessage.trace.act.data.proposal_id;
                const approved = parsedMessage.trace.act.data.approved;
                if(!approved){
                    // Get the proposal details
                    const propInfo = JSON.parse(await this.redis.connection().get(`proposal:${theProposalID}:info`));
                    // Check for a merge
                    const theComment = propInfo.trace.act.data.comment;
                    const theMemo = propInfo.trace.act.data.memo;
                    if(
                        (theComment && theComment.indexOf("MERGE_FROM|") >= 0) 
                        && (theMemo && theMemo.indexOf("Merge") >= 0)
                    ){
                        await this.unmergeProposal(propInfo);
                    } 
                }
                return;
            }

        });
    };

    async getPageIndexedLinkCollection(passedJSON: ArticleJson, lang_to_use: string): Promise<PageIndexedLinkCollection> {
        let working_collection: PageIndexedLinkCollection = [];
        let page_sentences = getPageSentences(passedJSON);
        let found_slugs: string[] = [];
        page_sentences.forEach(sentence => {
            let text = sentence.text;
            let result;
    
            // Find the links and create
            while ((result = CAPTURE_REGEXES.link_match.exec(text)) !== null) {
                if (!found_slugs.includes(result[2])){
                    found_slugs.push(result[2]);
                }
            }
        });


        // We only care about indexed links
        // On the frontend, all links will be converted to spans by default, except indexed ones
        if(found_slugs.length){
            let page_link_rows: any[] = await this.mysql.TryQuery(
                `
                SELECT DISTINCT
                    art.slug AS slug,
                    art.slug_alt AS slug_alt,
                    art_redir.slug AS redir_slug,
                    art_redir.slug_alt AS redir_slug_alt,
                    COALESCE(art_redir.slug, art.slug) AS slug,
                    COALESCE(art_redir.slug_alt, art.slug_alt) AS slug_alt,
                    COALESCE(art_redir.is_indexed, art.is_indexed) AS is_indexed,
                    COALESCE(art_redir.is_removed, art.is_removed) AS is_removed,
                    COALESCE(art_redir.page_note, art.page_note) AS page_note
                FROM enterlink_articletable AS art
                LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL)
                WHERE 
                    (art.slug IN (?) OR art.slug_alt IN (?))
                    AND (art.page_lang = ? OR art_redir.page_lang = ?)
                    AND art.is_removed = 0
                    AND art.is_indexed = 1
                `,
                [found_slugs, found_slugs, lang_to_use, lang_to_use]
            );
    
            page_link_rows.forEach(result_row => {
                // All in all 4 slug variants
                working_collection.push(`lang_${lang_to_use}/${result_row.slug}`);
                working_collection.push(`lang_${lang_to_use}/${result_row.slug_alt}`);
                working_collection.push(`lang_${lang_to_use}/${result_row.redir_slug}`);
                working_collection.push(`lang_${lang_to_use}/${result_row.redir_slug_alt}`);
    
            })
    
            // Remove the nulls
            working_collection = working_collection.filter(s => s && s != `lang_${lang_to_use}/null`);
    
            // Remove dupes
            working_collection = Array.from(new Set(working_collection))
    
            return working_collection;
        }
        else return null;
    }

    async getPageCategories(passedJSON: ArticleJson, lang_to_use: string): Promise<PageCategory[]> {
        // Get the categories
        let the_category_ids = passedJSON.categories ? passedJSON.categories : [];

        // Return empty array if there are no categories
        if(the_category_ids.length == 0) return [];

        interface PageCategory {
            id: number,
            lang: string,
            slug: string,
            title: string,
            description: string,
            img_full: string,
            img_full_webp: string,
            img_thumb: string,
            img_thumb_webp: string
        }

        // We only care about indexed links
        // On the frontend, all links will be converted to spans by default, except indexed ones
        let category_rows: any[] = await this.mysql.TryQuery(
            `
            SELECT DISTINCT
                cat.id AS id,
                cat.lang AS lang,
                cat.slug AS slug,
                cat.title AS title,
                cat.description AS description,
                cat.img_full AS img_full,
                cat.img_full_webp AS img_full_webp,
                cat.img_thumb AS img_thumb,
                cat.img_thumb_webp AS img_thumb_webp
            FROM enterlink_pagecategory AS cat
            WHERE cat.id IN (?)
            `,
            [the_category_ids]
        );
        return category_rows;
    }


    async unmergeProposal(rejected_merge_proposal: any){
        let parsedMergeInfo: MergeProposalParsePack = parseMergeInfoFromProposal(rejected_merge_proposal);
        const prerenderToken = this.config.get('PRERENDER_TOKEN');
        // console.log(util.inspect(parsedMergeInfo, {showHidden: false, depth: null, chalk: true}));

        // Update the source of the merge
        await this.mysql.TryQuery(
            `
            UPDATE enterlink_articletable 
            SET redirect_page_id = NULL,
                lastmod_timestamp = NOW()
            WHERE ((slug = ? OR slug_alt = ?) AND (page_lang = ?));
            `,
            [parsedMergeInfo.source.slug, parsedMergeInfo.source.slug, parsedMergeInfo.source.lang]
        );
        // console.log(colors.blue.bold(`Unmerged source [lang_${parsedMergeInfo.source.lang}/${parsedMergeInfo.source.slug}]`));
        flushPrerenders(parsedMergeInfo.source.lang, parsedMergeInfo.source.slug, prerenderToken);

        // Update the target of the merge
        await this.mysql.TryQuery(
            `
            UPDATE enterlink_articletable
            SET ipfs_hash_current = ?,
                ipfs_hash_parent = ?,
                lastmod_timestamp = NOW()
            WHERE ((slug = ? OR slug_alt = ?) AND (page_lang = ?));
            `,
            [parsedMergeInfo.target.ipfs_hash, parsedMergeInfo.final_hash, parsedMergeInfo.target.slug, parsedMergeInfo.target.slug, parsedMergeInfo.target.lang]
        );
        console.log(colors.blue.bold(`Unmerged source [lang_${parsedMergeInfo.target.lang}/${parsedMergeInfo.target.slug}]`));
        flushPrerenders(parsedMergeInfo.target.lang, parsedMergeInfo.target.slug, prerenderToken);
    }

    async getMergedWiki(inputPack: MergeInputPack): Promise<MergeResult> {
        let sourceWiki: ArticleJson;

        // Get the source wiki, which might be present in the input pack
        if (inputPack.source.override_articlejson){
            sourceWiki = inputPack.source.override_articlejson;
        } else sourceWiki = await this.getWikiBySlug(inputPack.source.lang, inputPack.source.slug, false, null, null, false);

        // Get the target ArticleJson, or handle the case where the page is removed
        let targetWiki = await this.getWikiBySlug(inputPack.target.lang, inputPack.target.slug, false, true, null, false);

        // Get the merged result
        let mergedResult = await mergeWikis(sourceWiki, targetWiki);
        // console.log(util.inspect(mergedResult, {showHidden: false, depth: null, chalk: true}));
        // fs.writeFileSync(path.join(__dirname, 'test.json'), JSON.stringify(mergedResult, null, 2));
        // console.log(mergedResult);
        // return null;

        return mergedResult;
    }

    async getWikiBySlug(
        lang_code: string, 
        slug: string, 
        cache: boolean = false, 
        ignoreRemovalStatus: boolean = false, 
        increment_views: boolean = true,
        last_resort_search?: boolean
    ): Promise<ArticleJson> {
        let mysql_slug = this.mysql.cleanSlugForMysql(slug, null, last_resort_search == true);
        // console.log("mysql slug: ", mysql_slug)
        let alternateSlug = decodeURIComponent(mysql_slug);

        // If the two slugs are the same, encode the alternateSlug
        if (mysql_slug === alternateSlug) alternateSlug = encodeURIComponent(alternateSlug);

        // If the two slugs are still the same, decode the alternateSlug
        if (mysql_slug === alternateSlug) alternateSlug = decodeURIComponent(alternateSlug);

        // Get current IPFS hash
        const pipeline = this.redis.connection().pipeline();
        pipeline.get(`wiki:lang_${lang_code}:${slug}:last_proposed_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${mysql_slug}:last_proposed_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${alternateSlug}:last_proposed_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${slug}:last_approved_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${mysql_slug}:last_approved_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${alternateSlug}:last_approved_hash`);
        pipeline.get(`wiki:lang_${lang_code}:${mysql_slug}:db_hash`);
        const values = await pipeline.exec();
        let current_hash;
        for (let value of values) {
            if (value[1]) {
                current_hash = value[1];
                break;
            }
        }

        // Checked for removed wiki
        if (current_hash == "removed")
            throw new HttpException(`Wiki ${lang_code}/${slug} is marked as removed`, HttpStatus.GONE);

        // Try and get cached wiki
        if (false && current_hash) {
            const cache_wiki = await this.redis.connection().get(`wiki:${current_hash}`);
            if (cache_wiki) return JSON.parse(cache_wiki);
        }

        // NEED TO TRY A DECODED SLUG HERE TOO??, OR IF THEY ARE EQUAL, HAVE A DIFFERENT???

        let ipfs_hash_rows: any[] = await this.mysql.TryQuery(
            `
            SELECT 
                COALESCE(art_redir.ipfs_hash_current, art.ipfs_hash_current) AS ipfs_hash, 
                art.is_indexed as is_idx, 
                art_redir.is_indexed as is_idx_redir,
                COALESCE(art_redir.is_removed, art.is_removed) AS is_removed,
                COALESCE(art_redir.lastmod_timestamp, art.lastmod_timestamp) AS lastmod_timestamp,
                CONCAT('lang_', art_redir.page_lang, '/', art_redir.slug) AS redirect_wikilangslug,
                COALESCE(art_redir.desktop_cache_timestamp, art.desktop_cache_timestamp) AS desktop_cache_timestamp,
                COALESCE(art_redir.mobile_cache_timestamp, art.mobile_cache_timestamp) AS mobile_cache_timestamp
            FROM enterlink_articletable AS art
            LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL)
            WHERE 
                ((art.slug = ? OR art.slug_alt = ?) OR (art.slug = ? OR art.slug_alt = ?)) 
                AND (art.page_lang = ? OR art_redir.page_lang = ?)
            `,
            [mysql_slug, mysql_slug, alternateSlug, alternateSlug, lang_code, lang_code]
        );
        let db_hash;
        let overrideIsIndexed;
        let db_timestamp;
        let main_redirect_wikilangslug;
        let lastmodToUse = '1975-01-01 00:00:00', desktopCacheToUse = null, mobileCacheToUse = null;
        if (ipfs_hash_rows.length > 0) {
            if (ignoreRemovalStatus) { /* Do nothing */ }
            else if (ipfs_hash_rows[0].is_removed) throw new HttpException(`Wiki ${lang_code}/${slug} is marked as removed`, HttpStatus.GONE);
            db_hash = ipfs_hash_rows[0].ipfs_hash;
            main_redirect_wikilangslug = ipfs_hash_rows[0].redirect_wikilangslug;
            // Account for the boolean flipping issue being in old articles
            overrideIsIndexed = BooleanTools.default(ipfs_hash_rows[0].is_idx || ipfs_hash_rows[0].is_idx_redir || 0);
            db_timestamp = new Date(ipfs_hash_rows[0].lastmod_timestamp + "Z"); // The Z indicates that the time is already in UTC
            lastmodToUse = ipfs_hash_rows[0].lastmod_timestamp;
            desktopCacheToUse = ipfs_hash_rows[0].desktop_cache_timestamp;
            mobileCacheToUse = ipfs_hash_rows[0].mobile_cache_timestamp;
        };

        if (db_hash) this.redis.connection().set(`wiki:lang_${lang_code}:${mysql_slug}:db_hash`, db_hash);
        let ipfs_hash = db_hash;
        if (current_hash && current_hash != ipfs_hash)
            ipfs_hash = current_hash;


        if (!ipfs_hash && last_resort_search){
            throw new NotFoundException(`Wiki /lang_${lang_code}/${slug} could not be found`);
        } 
        else if (!ipfs_hash && !last_resort_search){
            // Try one more time 
            return this.getWikiBySlug(lang_code, slug, cache, ignoreRemovalStatus, increment_views, true)
        }

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

        // If the page has been modified since the last prerender, recache it
        if ((!desktopCacheToUse && !mobileCacheToUse) 
            || (desktopCacheToUse <= lastmodToUse) 
            || (mobileCacheToUse <= lastmodToUse) 
        ){
            // console.log("Refreshing prerender")
            const prerenderToken = this.config.get('PRERENDER_TOKEN');
            flushPrerenders(lang_code, slug, prerenderToken);

            // Update the cache timestamps
            this.mysql.TryQuery(
                `
                UPDATE enterlink_articletable 
                SET desktop_cache_timestamp = NOW(), mobile_cache_timestamp = NOW()
                WHERE 
                    page_lang= ? 
                    AND (slug = ? OR slug_alt = ?) 
                `,
                [lang_code, slug, slug]
            );
        }
        
        // Add redirect information, if present
        wiki.redirect_wikilangslug = main_redirect_wikilangslug;

        // cache wiki
        const pipeline2 = this.redis.connection().pipeline();
        pipeline2.set(`wiki:${ipfs_hash}`, JSON.stringify(wiki));
        pipeline2.expire(`wiki:${ipfs_hash}`, 86400);
        pipeline.exec();

        return wiki;
    }

    async getAMPBySlug(lang_code: string, slug: string, cache: boolean = false): Promise<string> {
        let ampWiki: ArticleJson = await this.getWikiBySlug(lang_code, slug, BooleanTools.default(cache), null, null, false);
        let photoExtraData: PhotoExtraData = await this.mediaUploadService.getImageData(ampWiki.main_photo[0].url);
        ampWiki.main_photo[0].width = photoExtraData.width;
        ampWiki.main_photo[0].height = photoExtraData.height;
        ampWiki.main_photo[0].mime = photoExtraData.mime;
        const wikiExtraInfo = await this.getWikiExtras(lang_code, slug);

        return renderAMP(ampWiki, wikiExtraInfo);
    }

    async getSchemaBySlug(lang_code: string, slug: string): Promise<string> {
        const wiki = await this.getWikiBySlug(lang_code, slug, false, false, false, false);
        const schema = renderSchema(wiki, 'html');
        return schema;
    }

    async getBoostsByWikiLangSlug(lang_code: string, slug: string): Promise<Boost[]> {
        let padded_slug = slug;
        let padded_lang_code = lang_code;
        let combined = "";
        while (padded_slug.length < MAX_SLUG_SIZE){
            padded_slug = padded_slug + " ";
        }
        while (padded_lang_code.length < MAX_LANG_CODE_SIZE){
            padded_lang_code = padded_lang_code + " ";
        }
        combined = padded_slug + padded_lang_code;

        // See https://eosio.stackexchange.com/questions/4116/how-to-use-checksum256-secondary-index-to-get-table-rows/4344
        var checksum256ed_wikilangslug = sha256ToChecksum256EndianSwapper(sha256(combined));

        let theBoostsBody = {
            "code": "eparticlectr",
            "table": "booststbl",
            "scope": "eparticlectr",
            "index_position": "tertiary",
            "key_type": "sha256",
            "upper_bound": checksum256ed_wikilangslug,
            "lower_bound": checksum256ed_wikilangslug,
            "json": true
        };

        // Get all of the boosts for the wiki now that you have the wiki_id
        let boostResults = await this.chain.getTableRows(theBoostsBody);
        let theBoosts: Boost[] = boostResults.rows;

        theBoosts = [
            {
                id: 1,
                slug: 'travismoore5036459',
                lang_code: 'en',
                booster: 'eosiochicken',
                amount: 77777,
                timestamp: 1573854499
            },
            {
                id: 2,
                slug: 'travismoore5036459',
                lang_code: 'en',
                booster: 'bbb456bbb456',
                amount: 5000,
                timestamp: 1573854399
            },
            {
                id: 3,
                slug: 'travismoore5036459',
                lang_code: 'en',
                booster: 'ccc789ccc789',
                amount: 250,
                timestamp: 1573852499
            },
            {
                id: 4,
                slug: 'travismoore5036459',
                lang_code: 'en',
                booster: '111111111111',
                amount: 6432,
                timestamp: 1573853499
            },
            {
                id: 5,
                slug: 'travismoore5036459',
                lang_code: 'en',
                booster: '222222222222',
                amount: 100,
                timestamp: 1573812499
            }
        ]

        // Order the boosts by highest amount first
        theBoosts = _.orderBy(theBoosts, ['amount'],['desc']); 

        return theBoosts;
    }

    async getWikisByHash(ipfs_hashes: string[]): Promise<ArticleJson[]> {
        let json_wikis = [];

        const pipeline = this.redis.connection().pipeline();
        for (let hash in ipfs_hashes) {
            pipeline.get(`wiki:${hash}`);
        }
        const values = await pipeline.exec();
        let uncached_hashes = [];
        for (let i in values) {
            if (values[i][1]) json_wikis.push(JSON.parse(values[i][1]));
            else uncached_hashes.push(ipfs_hashes[i]);
        }

        if (uncached_hashes.length > 0) {
            // fetch remainder from mysql if they exist
            const rows: Array<any> = await this.mysql.TryQuery(
                `SELECT * FROM enterlink_hashcache WHERE ipfs_hash IN (?)`,
                [uncached_hashes]
            );

            // Parse and cache wikis
            const pipeline2 = this.redis.connection().pipeline();
            rows.forEach((r) => {
                let json_wiki;
                try {
                    json_wiki = JSON.parse(r.html_blob);
                } catch (e) {
                    json_wiki = oldHTMLtoJSON(r.html_blob);
                    json_wiki.ipfs_hash = r.ipfs_hash;
                }
                json_wikis.push(json_wiki);
                pipeline.set(`wiki:${r.ipfs_hash}`, JSON.stringify(json_wiki));
            });
            pipeline2.exec();

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
            throw new NotFoundException(`Group for wiki /lang_${lang_code}/${slug} could not be found`);
        return lang_packs;
    }

    async getSeeAlsos(inputWiki: ArticleJson, lang_to_use: string): Promise<SeeAlsoType[]> {
        let tempSeeAlsos: SeeAlsoType[] = calculateSeeAlsos(inputWiki);
        if (tempSeeAlsos.length == 0) return [];

        // Collect the slugs
        let seealso_slugs = tempSeeAlsos.map(sa => sa.slug);

        if (seealso_slugs.length){
            let seeAlsoRows: any[] = await this.mysql.TryQuery(
                `
                SELECT 
                    COALESCE(art_redir.page_title, art.page_title) page_title, 
                    COALESCE(art_redir.slug, art.slug) AS slug,
                    COALESCE(art_redir.photo_url, art.photo_url) AS main_photo, 
                    COALESCE(art_redir.photo_thumb_url, art.photo_thumb_url) AS thumbnail, 
                    COALESCE(art_redir.page_lang, art.page_lang) AS lang_code, 
                    COALESCE(art_redir.blurb_snippet, art.blurb_snippet) AS text_preview, 
                    COALESCE(art_redir.is_indexed, art.is_indexed) AS is_indexed, 
                    COALESCE(art_redir.is_removed, art.is_removed) AS is_removed 
                FROM enterlink_articletable AS art 
                LEFT JOIN enterlink_articletable art_redir ON (art_redir.id=art.redirect_page_id AND art.redirect_page_id IS NOT NULL)
                WHERE
                    (art.slug IN (?) OR art.slug_alt IN (?))
                    AND (art.page_lang = ? OR art_redir.page_lang = ?)
                    and (art.is_removed = 0 || art_redir.is_removed = 0)
                ORDER BY (art_redir.is_indexed || art.is_indexed) DESC
                ;`,
                [seealso_slugs, seealso_slugs, lang_to_use, lang_to_use]
            );
    
            // Quick slice
            seeAlsoRows = seeAlsoRows
                        .filter(sa => (sa.slug != "male" && sa.slug != 'female'))
                        .slice(0, 6);
    
            // Clean up text previews
            for (let preview of seeAlsoRows) {
                preview.page_title = sanitizeTextPreview(preview.page_title).replace(/["“”‘’]/gmiu, "\'");
                if (preview.text_preview) {
                    preview.text_preview = sanitizeTextPreview(preview.text_preview).slice(0, 200).replace(/["“”‘’]/gmiu, "\'");
                }
            }
    
            return seeAlsoRows as SeeAlsoType[];
        }
        else return [];
    }

    async submitWiki(wiki: ArticleJson): Promise<any> {
        if (wiki.ipfs_hash !== null) throw new BadRequestException('ipfs_hash must be null');

        // get wiki info
        const slug = wiki.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;
        if (slug.indexOf('/') > -1) throw new BadRequestException('slug cannot contain a /');
        const cleanedSlug = this.mysql.cleanSlugForMysql(slug);

        let page_lang = wiki.metadata.find((m) => m.key == 'page_lang');
        page_lang = page_lang ? page_lang.value : 'en';

        let blob = JSON.stringify(wiki);
        const hash = crypto.createHash('sha256');
        hash.update(blob);
        const hash_buffer = hash.digest();
        const multihash_buffer = multihash.encode(hash_buffer, "sha2-256");
        const ipfs_hash = multihash.toB58String(multihash_buffer);

        // Save submission immediately so we don't lose data
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

        // Cache to Redis
        this.redis.connection().set(`wiki:${ipfs_hash}`, JSON.stringify(wiki));

        // RETURN THE IPFS HASH HERE, BUT BEFORE DOING SO, START A THREAD TO LOOK FOR THE PROPOSAL ON CHAIN
        // ONCE THE PROPOSAL IS DETECTED ON CHAIN, UPDATE MYSQL
        let INTERVAL_MSEC = 15000;
        this.updateWikiIntervals[ipfs_hash] = setIntervalAsync(
            async () => this.updateWiki(wiki, ipfs_hash, false),
            INTERVAL_MSEC
        )
        setTimeout(() => clearIntervalAsync(this.updateWikiIntervals[ipfs_hash]), INTERVAL_MSEC);

        return { ipfs_hash };
    }

    async submitWikiViaBot(wiki: ArticleJson, token: string, bypassIPFS: boolean = true): Promise<any> {
        return null;
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

        let alternateSlug = decodeURIComponent(cleanedSlug);

        // If the two slugs are the same, encode the alternateSlug
        if (cleanedSlug === alternateSlug) alternateSlug = encodeURIComponent(alternateSlug);

        let text_preview = "0;"
        try {
            text_preview = getBlurbSnippetFromArticleJson(wiki);
        } catch (e) {
            text_preview = "";
        }
        
        const photo_url = wiki.main_photo[0].url;
        const photo_thumb_url = wiki.main_photo[0].thumb;
        const media_props = wiki.main_photo[0].media_props || null;
        const webp_large = media_props && media_props.webp_original || null;
        const webp_medium = media_props && media_props.webp_medium || null;
        const webp_small =  media_props && media_props.webp_thumb || null;
        const page_type = wiki.metadata.find((m) => m.key == 'page_type').value;
        const is_adult_content = wiki.metadata.find((m) => m.key == 'is_adult_content').value;
        let is_indexed = wiki.metadata.find(w => w.key == 'is_indexed').value;
        const page_note = wiki.metadata.find(w => w.key == 'page_note') ? wiki.metadata.find(w => w.key == 'page_note').value : null;

        // Always deindex Wikipedia imports, but not the |XX_WIKI_IMPORT_DELETED| pages
        if (is_indexed && page_note && page_note.slice(-13) == '_WIKI_IMPORT|') is_indexed = 0;

        let bing_index_override = !is_indexed;
        let page_lang = wiki.metadata.find((m) => m.key == 'page_lang') ? wiki.metadata.find((m) => m.key == 'page_lang').value : 'en';
        const is_removed = wiki.metadata.find((m) => m.key == 'is_removed').value;

        const article_insertion = await this.mysql.TryQuery(
            `
            INSERT INTO enterlink_articletable 
                (ipfs_hash_current, slug, slug_alt, page_title, blurb_snippet, photo_url, photo_thumb_url, page_type, page_note, creation_timestamp, lastmod_timestamp, is_adult_content, page_lang, is_new_page, pageviews, is_removed, is_indexed, bing_index_override, has_pending_edits, webp_large, webp_medium, webp_small)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, 1, 0, 0, 1, 0, 0, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                ipfs_hash_parent=ipfs_hash_current, lastmod_timestamp=NOW(), is_new_page=0, ipfs_hash_current=?, 
                page_title=?, blurb_snippet=?, photo_url=?, photo_thumb_url=?, page_type=?, page_note=?, is_adult_content=?, is_indexed=?, bing_index_override=?, 
                is_removed=?, desktop_cache_timestamp=NULL, mobile_cache_timestamp=NULL, webp_large=?, webp_medium=?, webp_small=? 
            `,
            [
                ipfs_hash,
                cleanedSlug,
                alternateSlug,
                page_title,
                text_preview,
                photo_url,
                photo_thumb_url,
                page_type,
                page_note,
                is_adult_content,
                page_lang,
                webp_large,
                webp_medium,
                webp_small,
                ipfs_hash,
                page_title,
                text_preview,
                photo_url,
                photo_thumb_url,
                page_type,
                page_note,
                is_adult_content,
                is_indexed,
                bing_index_override,
                is_removed,
                webp_large,
                webp_medium,
                webp_small,
            ]
        );

        // Get the article object
        let articleResultPacket: Array<any> = await this.mysql.TryQuery(
            `
                SELECT 
                    id,
                    page_title,
                    pageviews
                FROM enterlink_articletable AS art 
                WHERE 
                    page_lang = ? 
                    AND (slug = ? OR slug_alt = ?)
                    AND art.is_removed = 0
            `,
            [page_lang, cleanedSlug, cleanedSlug]
        );

        let pageID = articleResultPacket[0].id;

        // Update the pagecategory collection
        // TODO: HANDLE THIS LATER, ONCE CATEGORIES ARE EDITABLE
        if(!wiki.categories) wiki.categories = [];
        let new_categories = wiki.categories;
        let old_categories_row: any[] = await this.mysql.TryQuery(
            `
                SELECT 
                    cat_collect.category_id
                FROM enterlink_pagecategory_collection AS cat_collect
                WHERE
                    cat_collect.articletable_id = ?
            ;`,
            [pageID]
        ) || [];

        // Initialize variables
        let categories_to_add = [], categories_to_delete = [];
        let old_categories = old_categories_row.map(old => old.category_id);

        console.log("New categories: ", util.inspect(new_categories, {showHidden: false, depth: null, chalk: true}));
        console.log("Old categories: ", util.inspect(old_categories, {showHidden: false, depth: null, chalk: true}));

        // See if any categories need to be deleted
        old_categories.forEach(oldcat => {
            // If a category stayed the same, do nothing
            if (new_categories.includes(oldcat)) {}
            // Delete the old category if it isn't in the list of new categories
            else if (!new_categories.includes(oldcat)) categories_to_delete.push(oldcat);
        })

        // See if any categories need to be added
        new_categories.forEach(newcat => {
            if (!old_categories.includes(newcat)) categories_to_add.push(newcat);
        })

        // Add the new categories
        if (categories_to_add.length > 0) {
            let values_string = categories_to_add.map(cat => {
                return `(${cat}, ${pageID})`
            }).join(", ");

            try {
                let pagecategory_collection_insertion = await this.mysql.TryQuery(
                    `
                        INSERT INTO enterlink_pagecategory_collection (category_id, articletable_id) 
                        VALUES ${values_string}
                    `,
                    []
                );
                console.log(colors.green("Added to pagecategory_collection: "));
                console.log(util.inspect(categories_to_add, {showHidden: false, depth: null, chalk: true}));
            } catch (e) {
                if (e.message.includes("ER_DUP_ENTRY")){
                    console.log(colors.yellow('WARNING: Duplicate submission for enterlink_pagecategory_collection. Category collection already exists'));
                }
                else throw e;
            }
        }

        // Delete the old categories
        if (categories_to_delete.length > 0) {
            try {
                let pagecategory_collection_insertion = await this.mysql.TryQuery(
                    `
                        DELETE FROM enterlink_pagecategory_collection
                        WHERE
                            category_id IN (?)
                            AND articletable_id = ?
                    `,
                    [categories_to_delete, pageID]
                );
                console.log(colors.green("Deleted from pagecategory_collection: "));
                console.log(util.inspect(categories_to_delete, {showHidden: false, depth: null, chalk: true}));
            } catch (e) {
                if (e.message.includes("ER_DUP_ENTRY")){
                    console.log(colors.yellow('WARNING: Duplicate submission for enterlink_pagecategory_collection. Category collection already exists'));
                }
                else throw e;
            }
        }
        
        // Get the prerender token
        const prerenderToken = this.config.get('PRERENDER_TOKEN');

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
                        page_title,
                        pageviews
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
                    console.log(colors.blue(`pageID: ${pageID}`));
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
                        [pageID, mergedArticleResult[0].id]
                    );

                    // Update Elasticsearch for the merged article to point it to the canonical article
                    await updateElasticsearch(
                        mergedArticleResult[0].id, // merged article id
                        mergedArticleResult[0].page_title, 
                        merged_lang,
                        'MERGE_REDIRECT' , 
                        this.elasticSearch,
                        pageID, // canonical id
                        mergedArticleResult[0].pageviews, // pageviews
                    ).then(() => {
                        console.log(colors.green(`Elasticsearch for lang_${merged_lang}/${merged_slug} updated`));
                    }).catch(e => {
                        console.log(colors.red(`Elasticsearch for lang_${merged_lang}/${merged_slug} failed:`), colors.red(e));
                    })

                    // Flush prerender for the merged article
                    flushPrerenders(merged_lang, merged_slug, prerenderToken);
                    
                }

            }

            // Make sure the hashcache has the article id
            const hashcache_update = await this.mysql.TryQuery(
                `
                UPDATE enterlink_hashcache
                SET articletable_id=? 
                WHERE 
                    articletable_id is NULL
                    AND ipfs_hash=?
                `,
                [pageID, ipfs_hash]
            );

            // Update Elasticsearch for the main article
            await updateElasticsearch(
                pageID, 
                articleResultPacket[0].page_title, 
                page_lang,
                is_removed ? 'PAGE_REMOVED' : 'PAGE_UPDATED_OR_CREATED',
                this.elasticSearch,
                pageID,
                articleResultPacket[0].pageviews
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
            console.log(colors.green(`MySQL and Elasticsearch updated. Terminating loop...`));
            console.log(colors.green('========================================'));

        }

        return;
    }

    async updateWiki(wiki: ArticleJson, ipfs_hash: string, override_clear_interval: boolean = false) {
        console.log(colors.yellow(`Checking on ${ipfs_hash} to hit the mainnet`));
        // const twoMinutesAgo = (Date.now() / 1000 | 0) - 60*2;
        const submitted_proposal = await this.mongo
            .connection()
            .actions.findOne({
                'trace.act.account': 'eparticlectr',
                'trace.act.name': 'logpropinfo',
                'trace.act.data.ipfs_hash': ipfs_hash
            })
        if (submitted_proposal) {
            // console.log(util.inspect(submitted_proposal, {showHidden: false, depth: null, chalk: true}));
            const trxID = submitted_proposal.trx_id;
            console.log(colors.green(`Transaction found! (${trxID})`));
            if(!override_clear_interval){
                clearIntervalAsync(this.updateWikiIntervals[ipfs_hash]);
            }
            
            // Check for a merge
            const theComment = submitted_proposal.trace.act.data.comment;
            const theMemo = submitted_proposal.trace.act.data.memo;
            // console.log(colors.blue.bold(theComment));
            // console.log(colors.blue.bold(theMemo));
            if(theComment.indexOf("MERGE_FROM|") >= 0 && theMemo.indexOf("Merge") >= 0) {
                await this.processWikiUpdate(wiki, ipfs_hash, submitted_proposal);
            }
            // else if(theComment.indexOf("UNDO_MERGE|") >= 0 && theMemo.indexOf("Undo Merge") >= 0){
            //     await this.unmergeProposal(submitted_proposal);
            // } 
            // else if(theComment.indexOf("UNDO_REMOVAL|") >= 0 && theMemo.indexOf("Undo Removal") >= 0 ) {
            //     await this.processWikiUpdate(wiki, ipfs_hash, submitted_proposal);
            // } 
            else await this.processWikiUpdate(wiki, ipfs_hash);
        }
    }

    // increment the pageview counter for a page
    // optionally update the mobile and desktop cache timestamps at the same time
    async incrementPageviewCount(lang_code: string, slug: string, setDesktopCache?: boolean, setMobileCache?: boolean): Promise<boolean> {
        let mysql_slug = this.mysql.cleanSlugForMysql(slug);
        // console.log("mysql slug: ", mysql_slug)

        let alternateSlug = decodeURIComponent(mysql_slug);

        // If the two slugs are the same, encode the alternateSlug
        if (mysql_slug === alternateSlug) alternateSlug = encodeURIComponent(alternateSlug);

        // Set variables
        let desktopCacheString = setDesktopCache ? ", desktop_cache_timestamp = NOW()": "";
        let mobileCacheString = setMobileCache ? ", mobile_cache_timestamp = NOW()": "";

        // Occasionally update the Elasticsearch index
        if(Math.random() <= .20) {
            // console.log(colors.red("Randomly updating the pageviews"));
            // Get the info for the page first
            const fetched_article_rows: any[] = await this.mysql.TryQuery(
                `
                    SELECT 
                        id,
                        page_title,
                        page_lang,
                        is_removed,
                        pageviews
                    FROM enterlink_articletable art
                    WHERE 
                        ((art.slug = ? OR art.slug_alt = ?) OR (art.slug = ? OR art.slug_alt = ?)) 
                        AND art.page_lang = ?
                `,
                [mysql_slug, mysql_slug, alternateSlug, alternateSlug, lang_code]
            );
            let fetched_article = fetched_article_rows && fetched_article_rows[0];
            if (fetched_article){
                // Update Elasticsearch pageviews for the main article
                await updateElasticsearch(
                    fetched_article.id, 
                    fetched_article.page_title, 
                    fetched_article.page_lang,
                    'PAGE_UPDATED_OR_CREATED',
                    this.elasticSearch,
                    fetched_article.id,
                    fetched_article.pageviews
                ).then(() => {
                    console.log(colors.green(`Elasticsearch for lang_${fetched_article.page_lang}/${slug} updated`));
                }).catch(e => {
                    console.log(colors.red(`Elasticsearch for lang_${fetched_article.page_lang}/${slug} failed:`), colors.red(e));
                })

                // console.log(colors.red("Elasticsearch pageviews updated"));

                // Update the pageviews on MySQL
                return this.mysql.TryQuery(
                    `
                    UPDATE enterlink_articletable art
                    SET art.pageviews = art.pageviews + 1${desktopCacheString}${mobileCacheString} 
                    WHERE 
                        ((art.slug = ? OR art.slug_alt = ?) OR (art.slug = ? OR art.slug_alt = ?)) 
                        AND art.page_lang = ?
                    `,
                    [mysql_slug, mysql_slug, alternateSlug, alternateSlug, lang_code]
                );
            }
            
        }
        else {

            // Update the pageviews
            return this.mysql.TryQuery(
                `
                UPDATE enterlink_articletable art
                SET art.pageviews = art.pageviews + 1${desktopCacheString}${mobileCacheString} 
                WHERE 
                    ((art.slug = ? OR art.slug_alt = ?) OR (art.slug = ? OR art.slug_alt = ?)) 
                    AND art.page_lang = ?
                `,
                [mysql_slug, mysql_slug, alternateSlug, alternateSlug, lang_code]
            );
        }


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
        const wiki = await this.getWikiBySlug(lang_code, slug, false, false, false, false);
        const article_boosts_promise = []; //this.getBoostsByWikiLangSlug(slug, lang_code);
        const see_also_promise = this.getSeeAlsos(wiki, lang_code);
        const schema_promise = renderSchema(wiki, 'JSON');
        const link_collection_promise = this.getPageIndexedLinkCollection(wiki, lang_code);
        const page_categories_promise = this.getPageCategories(wiki, lang_code);
        
        const pageviews_rows_promise: Promise<any> = this.mysql.TryQuery(
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
        const pageviews_promise = pageviews_rows_promise.then(pageviews_rows => {
            let pageviews = 0;
            if (pageviews_rows.length > 0) pageviews = pageviews_rows[0].pageviews;
            return pageviews;
        });

        const alt_langs_promise: Promise<LanguagePack[]> = this.getWikiGroups(lang_code, slug)
            .catch(e => {
                if (e instanceof NotFoundException) return [];
                else throw e;
            });

        return Promise.all([
            alt_langs_promise, 
            see_also_promise, 
            pageviews_promise, 
            schema_promise, 
            link_collection_promise,
            page_categories_promise,
            article_boosts_promise
        ])
        .then(values => {
            const alt_langs: LanguagePack[] = values[0];
            const see_also = values[1];
            const pageviews = values[2];
            const schema = values[3];
            const link_collection = values[4];
            const page_categories = values[5];
            const boosts = values[6];
            return { 
                alt_langs, 
                see_also, 
                pageviews, 
                schema, 
                canonical_lang: lang_code, 
                canonical_slug: slug,
                link_collection,
                page_categories,
                boosts
            };

        });

    }
}
