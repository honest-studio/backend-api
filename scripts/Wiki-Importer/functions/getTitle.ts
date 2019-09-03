import rp from 'request-promise';
import { Sentence } from '../../../src/types/article';

// Make call to Wikipedia API
export const getTitle = async (lang_code: string, slug: string): Promise<Sentence[]> => {
	const format = 'format=json';
	const wikiMedia = `https://${lang_code}.wikipedia.org/w/api.php?` //Default wikiMedia format
	const action = 'action=parse';
	const prop = 'prop=displaytitle';
	let pageToUse = 'page=' + slug;

	const url = `${wikiMedia}${action}&${prop}&${format}&${pageToUse}`;
	let title = await rp(url)
					.then(body => JSON.parse(body).parse.displaytitle);
	return [{ type: 'sentence', index: 0, text: title }];
}


