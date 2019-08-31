import { rp } from 'request-promise';
import { getTitle } from './functions/getTitle';
import { getPageBody } from './functions/getPageBody';
import { getInfoBox } from './functions/getInfobox_html';
import { getMetaData } from './functions/getMetaData';
import { getMainPhoto } from './functions/getMainPhoto';
import { ArticleJson } from '../../src/types/article';
import { calcIPFSHash } from '../../src/utils/article-utils/article-tools';

const newImport = async (lang_code: string, slug: string) => { 
	let page_title = await getTitle(lang_code, slug);
	let metadata = await getMetaData(lang_code, slug);
	const url = `https://${lang_code}.wikipedia.org/wiki/${slug}`;
	let articlejson: ArticleJson = rp(url)
	.then(body => {
		//note that page_body and citations are computed together to account for internal citations 
		const pagebody = getPageBody(body, url); 
		return {
			page_title: page_title, 
			main_photo: [getMainPhoto(body)],
			infobox_html: getInfoBox(body) as any,
			page_body: pagebody.sections,
			infoboxes: [],
			citations: pagebody.citations,
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

const main = async (page) => {
	let articlejson = await newImport(page); //wait for promise to resolve 
}

module.exports = main; 
