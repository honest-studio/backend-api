import { request } from 'request';
import { encodeUrl } from 'encodeurl'; 
import { getTimeStamp } from './pagebodyfunctionalities/getTimeStamp';
import { Metadata } from '../../../src/types/article';

export const doRequest = (MediaWiki): Promise<any> => {
 	return new Promise(function (resolve, reject) {
    	request(MediaWiki, function (error, res, body) {
      	if (!error && res.statusCode == 200) {
      	  resolve(JSON.parse(body));
     	 } else {
       	 reject(error);
      }
    });
  });
}

let metaData: Metadata[] = 
[ 
	{
		key: "page_type",
		value: 'Thing'
	},
	{
		key: "is_removed",
		value: false
	},
	{
		key: "is_adult_content",
		value: false
	},
	{
		key: "sub_page_type",
		value: null
	},
	{
		key:"is_wikipedia_import",
		value: true
	},
	{
		key:"is_indexed",
		value: false
	},
	{
		key:"bing_index_override",
		value: true
	},
	{
		key:"is_locked",
		value: false
	}
];

export async function getMetaData(lang_code: string, slug: string): Promise<Metadata[]> {
	// Create and append creation_timestamp
	let creationtime = getTimeStamp();
	metaData.push({key: 'creation_timestamp', value: creationtime});
	metaData.push({key:'last_modified', value: null}); // null because it was just created 

	// Get and append url_slug
	let titles = '&titles=' + slug;
	let MediaWiki = `https://${lang_code}.wikipedia.org/w/api.php?action=query&prop=info&inprop=url&format=json${titles}`;
	let data = await doRequest(MediaWiki);

	// Get the page language
	let page_lang = (Object.values(data.query.pages)[0] as any).pagelanguage;

	// Append page_lang;
	metaData.push({key: 'page_lang', value: page_lang});

	// Compute and append slug and url_slug_alternate
	let url = (Object.values(data.query.pages)[0] as any).fullurl;
	let slugToUse = '';

	// Compute slug from url
	let i = 30;
	while (i < url.length) {
		slugToUse += url.charAt(i);
		i++;
	}

	// Add the slug and the alternate slug to metadata list
	metaData.push({key: 'url_slug', value: slugToUse});
	metaData.push({key: 'url_slug_alternate', value: encodeUrl(slugToUse)});
	return metaData;
}

