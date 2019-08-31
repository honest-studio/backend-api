import { getImage } from './pagebodyfunctionalities/getImage';
import { Media } from '../../../src/types/article';

export const getMainPhoto = (html): Media => {

	// No main photo was found. 
	// Return place holder:
	return {
		url: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png',
		thumb:'https://epcdn-vz.azureedge.net/static/images/no-image-slide.png',
		caption: null,
		type: 'main_photo',
		attribution_url: null
	}
}
