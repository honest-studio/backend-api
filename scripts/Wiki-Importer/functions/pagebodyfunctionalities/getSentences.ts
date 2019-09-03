//old sentenceParser 
//new sentenceParser is called textParser
import { Sentence } from '../../../../src/types/article';

export const getSentencesNew = (element, $): Sentence[] => {
	let $el = $(element);
	if ($el.html() == null) { // Edge case for naiveGetTable
		return
	}
	const chars = $el.html(); // Character array of paragraph

	return null;
}



export const getSentences = (element, $): Sentence[] => {
	let $el = $(element);
	if ($el.html() == null) { // Edge case for naiveGetTable
		return
	}
	const chars = $el.html().split(''); // Character array of paragraph

	let start = 0; // Starting index of sentence
	let end = 0; // Ending index of sentence
	let Abrevflag = false; // Abrevflag to keep track of abreviations that might end sentences early
	// Note that sentence can't end inside of a tag 
	let flagOne = false;
	let flagTwo = false;
	let sentenceIndex = 0;
	let sentences: Sentence[] = [];
	let i = 0; // Integer to keep track of array position
	
	// Populate sentences array 
	while (i < chars.length) {
		if (i == (chars.length - 2) && chars[chars.length - 1] !== 
			'.' && chars[chars.length - 1] !== 
			'?' && chars[chars.length - 1] !== 
			'!' ) 
		{ // This if statement if to account for li sentences that don't always end with proper punctuation
			end = i + 1;
			sentences[sentenceIndex] = chars.slice(start, end).join("");
			sentenceIndex++; 
			start = end; 
		}
		let x = chars[i]; // Store current character
		// Check to see if we are currently in a tag 
		if (x == '<' || x == '>') {
			flagOne = !flagOne;
		}
		if ( x == '(' || x == ')') {
			flagTwo = !flagTwo;
		}

		if ((x == '.' || x == '?' || x == '!') && !flagOne && !flagTwo) { // Period is reached and flag is off (i.e., end of the sentence is reached )
			if (x !== '.') { //? or ! don't have to consider abbreviations 
				end = i + 1;
				sentences[sentenceIndex] = chars.slice(start, end).join("");
				sentenceIndex++; 
				start = end; 
			}
			else { // Make sure its not an abbreviation 
				let a = (i - 1);
				while(chars[a] !== ' ') {
					// Break if the abbreviations starts the sentence (e.g., U.S.) 
					// because you won't find a space
					if (chars[a] == undefined) {
						break;
					}
					if (chars[a] == '>' || chars[a] == '<'){
						Abrevflag = !Abrevflag;
					}
					if (chars[a - 1] == ' ' && !Abrevflag){
						if (chars[a] == chars[a].toLowerCase()){//i.e., not an abbrehviation
							end = i + 1;
							sentences[sentenceIndex] = chars.slice(start, end).join("");
							sentenceIndex++; 
							start = end; 
						}
					}
					a--;
				}
			}
		}
		i++; // Increment loop
	}

	// Now format each sentence in ArticleJson
	// Sentences are the same, simply replace anchor tags with [[ LINK|${lang_code}|${slug}|${text} ]]

	const output = sentences && sentences.map((sentence, index) => {
		let text = '';
		let lang = 'lang_en'; // for now 
		let isLinkText = false; 
		let j = 0;
		let theSentenceText = sentence && sentence.text;
		while (theSentenceText && j < theSentenceText.length) {
			let char = theSentenceText.charAt(j);
			// Check for anchor tags to create wiki links 
			if (char == '<') {
				if(theSentenceText.charAt(j + 1) == 'a' && theSentenceText.charAt(j + 9) !== '#') { // Anchor tag is reached 
					let slug = '';
					let linkText = '';
					let wikiLink = '';
					j += 15;					// a href="/wiki/*slug*"
					while (theSentenceText.charAt(j) !== '"' ) {
						if (j+2 > theSentenceText.length) {
							break;
						}
						slug += theSentenceText.charAt(j);
						j++;
					}
					while(theSentenceText.charAt(j) !== '>') { // Increment to position past tag
						if (j+2 > theSentenceText.length) {
							break;
						}
						j++;
					}
					j++;

					while(theSentenceText.charAt(j) !== '<') {
						if (j+2 > theSentenceText.length) {
							break;
						}
						linkText += theSentenceText.charAt(j);
						j++;
					}
					while (theSentenceText.charAt(j) !== '>') {
						if (j+2 > theSentenceText.length) {
							break;
						}
						j++;
					}
					j++;

					wikiLink = '[[LINK|lang_en|' + slug + '|' + linkText + ']]';
					text += wikiLink;
				}
				else {
					while (theSentenceText.charAt(j) !== '>') { // Increment to position past tag
						if (j+2 > theSentenceText.length) {
							break;
						}
						j++;
					}
					j++

				}
			} else { // Regular text 
				// [2]
				if (theSentenceText.charAt(j) == '[' && theSentenceText.charAt(j+2) == ']') {
					j +=3;
				}
				else if (theSentenceText.charAt(j) == '[' && theSentenceText.charAt(j+3) == ']') {
					j +=4;
				}
				else if (theSentenceText.charAt(j) == '[' && theSentenceText.charAt(j+4) == ']') {
					j +=5;
				}
				else {
					text += char;
					j++;
				}
			}
		}
		return {
			type: 'sentence',
			index: index,
			text: text
		}
	})
	return output;
}
