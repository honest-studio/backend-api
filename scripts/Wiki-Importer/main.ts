import { rp } from 'request-promise';
import { getTitle } from './functions/getTitle';
import { getPageBodyPack } from './functions/getPageBody';
import { getInfoBox } from './functions/getInfobox_html';
import { getMetaData } from './functions/getMetaData';
import { getMainPhoto } from './functions/getMainPhoto';
import { ArticleJson } from '../../src/types/article';
import { calcIPFSHash } from '../../src/utils/article-utils/article-tools';

export const newImport = async (lang_code: string, slug: string) => { 
	let page_title = await getTitle(lang_code, slug);
	let metadata = await getMetaData(lang_code, slug);
	const url = `https://${lang_code}.wikipedia.org/wiki/${slug}`;
	let articlejson: ArticleJson = rp(url)
	.then(body => {
		//note that page_body and citations are computed together to account for internal citations 
		const page_body_pack = getPageBodyPack(body, url); 
		return {
			page_title: page_title, 
			main_photo: [getMainPhoto(body)],
			infobox_html: getInfoBox(body) as any,
			page_body: page_body_pack.sections,
			infoboxes: [],
			citations: page_body_pack.citations,
			media_gallery: [],
			metadata: metadata,
			amp_info: { 
				load_youtube_js: false,
				load_audio_js: false,
				load_video_js: false,
				lightboxes: []
			},
			ipfs_hash: 'QmQCeAYSbKut79Uvw2wPHzBnsVpuLCjpbE5sm7nBXwJerR' // Set the dummy hash first
		} as ArticleJson
	})

	// Calculate what the IPFS hash would be
    articlejson.ipfs_hash = calcIPFSHash(JSON.stringify(articlejson));

	return articlejson; //return promise 
}

const main = async (lang_code: string, slug: string) => {
	let articlejson = await newImport(lang_code, slug); //wait for promise to resolve 
}

module.exports = main; 
