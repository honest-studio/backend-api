//http request package of choice
import { rp } from 'request-promise';

//functions 
import { getTitle } from './functions/getTitle';
import { getPageBody } from './functions/getPageBody';
import { getInfoBox } from './functions/getInfobox_html';
import { getMetaData } from './functions/getMetaData';
import { getMainPhoto } from './functions/getMainPhoto';

//variable to build request endpoint 
const wikipedia = 'https://en.wikipedia.org/wiki/';

const newImport = async (page) => { 
	let page_title = await getTitle(page); //getTitle returns a promise -- await that promise 
	let metadata = await getMetaData(page);
	const url = `${wikipedia}${page}`;
	let articlejson = rp(url)
	.then(body => {
		//note that page_body and citations are computed together to account for internal citations 
		const pagebody = getPageBody(body, url); 
		return {
			page_title: page_title, 
			main_photo: getMainPhoto(body),
			infobox_html: getInfoBox(body),
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
			}
		}
	})
	return articlejson; //return promise 
}

const main = async (page) => {
	let articlejson = await newImport(page); //wait for promise to resolve 
}

module.exports = main; 
