// Travis Moore and Kedar Iyer's code to clean attributes to fit front-end requirements
import { convert } from 'react-attr-converter';

// Convert attributes to React format 
export const cleanAttrs = (attributes) => {
    // Prevent error for empty inputs
	if (attributes === undefined || attributes === null) {
		return {}
	}
	const cleanedAttrs = {};
    const keys = Object.keys(attributes);

    // Look for the non-react CSS name and convert it to the React format
    for (const key of keys) {
        if (attributes[key] && attributes[key] != '') {
        	cleanedAttrs[convert(key)] = attributes[key];
        }
    }

    // If a 'style' attribute is present, combine all of the styles into one style string 
    if (cleanedAttrs['style']){
        cleanedAttrs['style'] = parseStyles(cleanedAttrs['style']);
    } 
    return cleanedAttrs;
}

// Used if a 'style' attribute is present
// Combine all of the styles into one style string 
export const parseStyles = (styles) => {
    return styles
    .split(';')
    .filter(style => style.split(':')[0] && style.split(':')[1])
    .map(style => [
        style.split(':')[0].trim().replace(/-./g, c => c.substr(1).toUpperCase()),
        style.split(':').slice(1).join(':').trim()
    ])
    .reduce((styleObj, style) => ({
        ...styleObj,
        [style[0]]: style[1],
    }), {});
}