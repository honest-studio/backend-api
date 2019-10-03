import rp from 'request-promise';
import { MysqlService } from '../../../src/feature-modules/database';
const chalk = require('chalk');

// Make redirects for a given wiki
export const createRedirects = async (page_title: string, lang_code: string, theMysql: MysqlService): Promise<any> => {
    // Prepare call to the Wikipedia API
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=redirects&pageids=6678`

    // Make call to Wikipedia API
	process.stdout.write(chalk.bold.green(`Getting the title ✍️ ...`));
	const format = 'format=json';
	const wikiMedia = `https://${lang_code}.wikipedia.org/w/api.php?` //Default wikiMedia format
	const action = 'action=query';
    const generator = 'generator=redirects';
    const titles = 'titles=' + encodeURIComponent(page_title);


    const url = `${wikiMedia}${action}&${generator}&${format}&${titles}&prop=info&inprop=url`;
    console.log(url);

    return false;
	// let redirect_results = await rp(url)
	// 				.then(body => {
	// 					let result = JSON.parse(body);
    //                     return result 
    //                             && result.query 
    //                             && result.query.pages
    //                             && result.query.pages[wiki_page_id.toString()];
	// 				})
	// 				.catch((err) => {
	// 					console.log(err);
	// 					return "TITLE_REQUEST_FAILED";
    //                 });
    // console.log(redirect_results)

	// if (title && title != "TITLE_REQUEST_FAILED"){
	// 	process.stdout.write(chalk.bold.green(` DONE\n`));
	// 	return [{ type: 'sentence', index: 0, text: title.replace(/<[^>]+>/gimu, '') }];
	// }
	// else if (title == "TITLE_REQUEST_FAILED") return "TITLE_REQUEST_FAILED";
	// else return null;
}


