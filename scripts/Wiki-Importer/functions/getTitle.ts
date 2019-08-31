import rp from 'request-promise';

//Commonly used variables
const format = 'format=json';
const wikiMedia = 'https://en.wikipedia.org/w/api.php?' //Default wikiMedia format

//make call to wikipedia API
export const getTitle = async (input_slug: string) => {
	const format = 'format=json';
	const wikiMedia = 'https://en.wikipedia.org/w/api.php?' //Default wikiMedia format
	const action = 'action=parse';
	const prop = 'prop=displaytitle';
	let pageToUse = 'page=' + input_slug;
	const url = wikiMedia + action + '&' + prop + '&' + format + '&' + pageToUse;
	let title = rp(url)
					.then(body => JSON.parse(body).parse.displaytitle);
	return [{type: 'sentence', index: 0, text: title}];
}


