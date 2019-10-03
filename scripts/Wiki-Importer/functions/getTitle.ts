import rp from 'request-promise';
import { Sentence } from '../../../src/types/article';
const chalk = require('chalk');

export interface TitlePack {
	title: Sentence[] | string,
	raw_title: string,
	pageid: number
}

// Make call to Wikipedia API
export const getTitle = async (lang_code: string, slug: string): Promise<TitlePack> => {
	process.stdout.write(chalk.bold.green(`Getting the title ✍️ ...`));
	const format = 'format=json';
	const wikiMedia = `https://${lang_code}.wikipedia.org/w/api.php?` //Default wikiMedia format
	const action = 'action=parse';
	const prop = 'prop=displaytitle';
	let pageToUse = 'page=' + slug;

	const url = `${wikiMedia}${action}&${prop}&${format}&${pageToUse}`;
	let title_response = await rp(url)
					.then(body => {
						let result = JSON.parse(body);
						return result && result.parse;
					})
					.catch((err) => {
						console.log(err);
						return "TITLE_REQUEST_FAILED";
					});

	if (title_response && title_response != "TITLE_REQUEST_FAILED"){
		process.stdout.write(chalk.bold.green(` DONE\n`));
		return {
			title: [{ type: 'sentence', index: 0, text: title_response.displaytitle.replace(/<[^>]+>/gimu, '') }],
			raw_title: title_response.displaytitle,
			pageid: title_response.pageid
		};
	}
	else if (title_response == "TITLE_REQUEST_FAILED") return { title: "TITLE_REQUEST_FAILED", raw_title: null, pageid: null };
	else return null;
}


