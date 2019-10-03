import rp from 'request-promise';
import { MysqlService } from '../../../src/feature-modules/database';
import { calcIPFSHash } from '../../../src/utils/article-utils/article-tools';
import { WIKI_SYNC_RECENTCHANGES_FILTER_REGEX } from './wiki-constants';
import { ELASTICSEARCH_INDEX_NAME, ELASTICSEARCH_DOCUMENT_TYPE } from '../../../src/utils/elasticsearch-tools/elasticsearch-tools';
import * as elasticsearch from 'elasticsearch';
const chalk = require('chalk');

export interface RedirPack {
    title: string,
    slug: string
}

// Make redirects for a given wiki
export const createRedirects = async (
    page_title: string, 
    lang_code: string, 
    theMysql: MysqlService, 
    theElasticsearch: elasticsearch.Client,
    canonical_slug: string, 
    canonical_id: string
): Promise<any> => {
    // Prepare call to the Wikipedia API
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=redirects&pageids=6678`

    // Make call to Wikipedia API
	const format = 'format=json';
	const wikiMedia = `https://${lang_code}.wikipedia.org/w/api.php?` //Default wikiMedia format
	const action = 'action=query';
    const generator = 'generator=redirects';
    const titles = 'titles=' + encodeURIComponent(page_title);

    // Construct the URL to hit the Redirect API endpoint
    const url = `${wikiMedia}${action}&${generator}&${format}&${titles}&prop=info&inprop=url`;

    // Hit the API
	let redirect_results = await rp(url)
					.then(body => {
						let result = JSON.parse(body);
                        return result 
                                && result.query 
                                && result.query.pages
					})
					.catch((err) => {
						console.log(err);
						return null;
                    });

    if (!redirect_results) return null;

    // Get all the redirect objects
    const keys = Object.keys(redirect_results);
    let redir_packs: RedirPack[] = [];

    // Parse out info from the redirect objects
    keys.forEach(key => {
        let the_redirect = redirect_results[key];
        let the_redir_slug = the_redirect.canonicalurl && the_redirect.canonicalurl.replace(`https://${lang_code}.wikipedia.org/wiki/`, '');
        let the_redir_title = the_redirect.title;
        if (the_redir_slug.search(WIKI_SYNC_RECENTCHANGES_FILTER_REGEX) < 0){
            redir_packs.push({ title: the_redir_title, slug: the_redir_slug});
        }
    });

    // Loop through each redirect and add it to enterlink_articletable
    // Also add it to Elasticsearch
    // NO NEED TO ADD TO enterlink_hashcache
    for (let index = 0; index < redir_packs.length; index++) {
        let rdr_pack = redir_packs[index];
        const page_title = rdr_pack.title;
        const slug = rdr_pack.slug;
        const cleanedSlug = theMysql.cleanSlugForMysql(slug);
        let alternateSlug = cleanedSlug;

        // If the two slugs are the same, encode the alternateSlug
        if (cleanedSlug === slug) alternateSlug = encodeURIComponent(alternateSlug);

        // If the two slugs are still the same, decode the alternateSlug
        if (cleanedSlug === alternateSlug) alternateSlug = decodeURIComponent(alternateSlug);

        let text_preview = "";

        const photo_url = null;
        const photo_thumb_url = null;
        const webp_large = null;
        const webp_medium = null;
        const webp_small =  null;
        const page_type = 'Thing';
        const is_adult_content = 0;
        const page_lang = 'en';
        const page_note = '|EN_WIKI_IMPORT|';
        const redirect_page_id = canonical_id;

        // Dummy hash for now
        const ipfs_hash = calcIPFSHash(`${page_title}${slug}${page_lang}`);
        const ipfs_hash_parent = 'REDIRECT';
        let article_insertion;
        try {
            article_insertion = await theMysql.TryQuery(
                `
                INSERT INTO enterlink_articletable 
                    (   ipfs_hash_current, 
                        ipfs_hash_parent, 
                        slug, 
                        slug_alt, 
                        page_title, 
                        blurb_snippet, 
                        photo_url, 
                        photo_thumb_url, 
                        page_type, 
                        creation_timestamp, 
                        lastmod_timestamp, 
                        is_adult_content, 
                        page_lang, 
                        is_new_page, 
                        pageviews, 
                        is_removed, 
                        is_indexed, 
                        bing_index_override, 
                        has_pending_edits, 
                        webp_large, 
                        webp_medium, 
                        webp_small, 
                        page_note,
                        redirect_page_id
                    )
                VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, ? )
                `,
                [
                    ipfs_hash,
                    ipfs_hash_parent,
                    cleanedSlug,
                    alternateSlug,
                    page_title,
                    text_preview,
                    photo_url,
                    photo_thumb_url,
                    page_type,
                    is_adult_content,
                    page_lang,
                    webp_large,
                    webp_medium,
                    webp_small,
                    page_note,
                    redirect_page_id
                ]
            )
        } catch (e) {
            if (e.message.includes("ER_DUP_ENTRY")){
                console.log(chalk.yellow(`WARNING: Duplicate redirect ${slug} -> ${canonical_slug} in enterlink_articletable.`));
            }
            else throw e;
        }

        let inserted_id = article_insertion && (article_insertion as any).insertId;

        if (inserted_id){
            // Update Elasticsearch
            // Prepare the JSON request
            process.stdout.write(chalk.yellow(`Updating Elasticsearch for redirect |${page_title}| (${slug})...`));
            let jsonRequest = {
                "id": inserted_id,
                "page_title": page_title,
                "canonical_id": canonical_id,    
                "lang": lang_code
            }

            const response = await theElasticsearch.index({
                index: `${ELASTICSEARCH_INDEX_NAME}`,
                type: ELASTICSEARCH_DOCUMENT_TYPE,
                id: inserted_id,
                body: jsonRequest
            })
            process.stdout.write(chalk.yellow(` DONE\n`));
        }
    }

}


