export const parseInternalCitation = (el, $, internalCitations, cite_id_override?: number) => {
	if (internalCitations == undefined) {
		return ''
	}
	let $el = $(el);
	let text = $el.text();
	let href = $el.attr('href');
	// Clean text e.g., [133] -> 133 
	let cite_id = '', url_to_show = "";
	if (cite_id_override !== undefined || cite_id_override >= 0){
		cite_id = cite_id_override.toString();
		url_to_show = href;
	}
	else{
		let i = 0;
		while (i < text.length) {
			if (text[i] !== '[' && text[i] !== ']' ) {
				cite_id += text.charAt(i);
			}
			i++;
		}
		if (internalCitations[cite_id] == '') {  
			return '' //if citation was not properly captured in getCitations() do not return the given internal citation
		}
		else {
			url_to_show = internalCitations[cite_id];
		}
	}

	// console.log(` [[CITE|${cite_id}|${url_to_show}]] `)

	return ` [[CITE|${cite_id}|${url_to_show}]] `;
}
