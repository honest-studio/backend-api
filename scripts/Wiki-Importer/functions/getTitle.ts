import rp from 'request-promise';
import { Sentence } from '../../../src/types/article';
const chalk = require('chalk');

// Make call to Wikipedia API
export const getTitle = async (lang_code: string, slug: string): Promise<Sentence[]> => {
	process.stdout.write(chalk.bold.green(`Getting the title ✍️ ...`));
	const format = 'format=json';
	const wikiMedia = `https://${lang_code}.wikipedia.org/w/api.php?` //Default wikiMedia format
	const action = 'action=parse';
	const prop = 'prop=displaytitle';
	let pageToUse = 'page=' + slug;

	const url = `${wikiMedia}${action}&${prop}&${format}&${pageToUse}`;
	let title = await rp(url)
					.then(body => {
						let result = JSON.parse(body);
						return result && result.parse && result.parse.displaytitle;
					});

	if (title){
		process.stdout.write(chalk.bold.green(` DONE\n`));
		return [{ type: 'sentence', index: 0, text: title.replace(/<[^>]+>/gimu, '') }];
	}
	else return null;
}


