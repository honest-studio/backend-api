const rp = require('request-promise');

//Commonly used variables
const format = 'format=json';
const wikiMedia = 'https://en.wikipedia.org/w/api.php?' //Default wikiMedia format

//make call to wikipedia API
const getTitle = async (page) => {
	const format = 'format=json';
	const wikiMedia = 'https://en.wikipedia.org/w/api.php?' //Default wikiMedia format
	const action = 'action=parse';
	const prop = 'prop=displaytitle';
	var page = 'page=' + page;
	const url = wikiMedia + action + '&' + prop + '&' + format + '&' + page;
	let title = await rp(url)
					.then(body => JSON.parse(body).parse.displaytitle);
	return [{ index: 0, text: title, type: "sentence" }];
}


module.exports = getTitle;

