import { Citation } from '../../wiki/article-dto';

export const CheckForLinksOrCitations = (
	textProcessing: string,
	citations: Citation[],
	returnPlaintext?: boolean,
	tagType?: string
) => {
	if (!textProcessing) return '';

	let text = textProcessing;
	// if (text.indexOf('<div')) text = textProcessing.innerHtml;
	const check = text.indexOf('[[');
	if (check >= 0) {
		const end = text.indexOf(']]') + 2;
		const link: string = text.substring(check, end);
		const linkString: string = 'LINK';
		const citeString: string = 'CITE';
		const isLink = link.indexOf(linkString);
		const isCitation = link.indexOf(citeString);
		let newString: string;
		// Check whether link or citation
		if (isLink >= 0) {
			const linkBegin = isLink + linkString.length + 1;
			const linkEnd = link.lastIndexOf('|');
			const textBegin = linkEnd + 1;
			const linkText = link.substring(textBegin, link.length - 2);

			const linkUrlFull = link.substring(linkBegin, linkEnd);
			const linkBreakIndex = linkUrlFull.indexOf('|');
			const lang_code = linkUrlFull.substring(0, linkBreakIndex);
			const slug = linkUrlFull.substring(linkBreakIndex + 1, linkUrlFull.length);
			const linkCodeAndSlug = '/wiki/' + lang_code + '/' + slug;
			// const pulledLink = links[linkIndex];
			// if (pulledLink) {
			const nextLetter = text.charAt(end);
			if (!returnPlaintext) {
				newString = text.replace(
					link,
					`[${linkText}](${linkCodeAndSlug})${!!nextLetter.match(/[.,:;!?']/) ? '' : ' '}`
				);
			} else {
				newString = text.replace(link, `${linkText}${!!nextLetter.match(/[.,:;!?']/) ? '' : ' '}`);
			}
			// }
		} else if (isCitation >= 0 && citations) {
			const citationIndex: number = parseInt(link.charAt(isCitation + citeString.length + 1));
			const pulledCitation = citations[citationIndex];
			if (pulledCitation) {
				const nextLetter = text.charAt(end);
				if (!returnPlaintext) {
					newString = text.replace(
						link,
						`*[(${citationIndex + 1})](${pulledCitation.url})*${!!nextLetter.match(/[.,:;!?']/) ? '' : ' '}`
					);
				} else {
					newString = text.replace(
						link,
						`*[(${citationIndex})]*${!!nextLetter.match(/[.,:;!?']/) ? '' : ' '}`
					);
				}
			}
		}
		// Recursive
		return CheckForLinksOrCitations(newString, citations, returnPlaintext);
	}
	return text;
};