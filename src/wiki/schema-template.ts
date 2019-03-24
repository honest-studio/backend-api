import { ArticleJson } from './article-dto';
import { CheckForLinksOrCitationsAMP } from '../utils/article-utils';
import { youtubeIdExists } from './article-converter';
import { LanguagePack } from './wiki.service';
var striptags = require('striptags');

export const renderSchema = (inputJSON: ArticleJson): any => {
    const RANDOMSTRING = Math.random().toString(36).substring(7);
    const BLURB_SNIPPET_PLAINTEXT = '', OVERRIDE_MAIN_THUMB = false, AMP_PHOTO_HEIGHT = '', AMP_PHOTO_WIDTH = '';
    const currentIPFS = 'Qmaskdjaslkdjslakjdlkdsad'
    let schemaJSON = { 
        "@context": `http://schema.org`, 
        "@type": [`Article`, inputJSON.metadata.sub_page_type ? inputJSON.metadata.sub_page_type : inputJSON.metadata.page_type],
        "mainEntityOfPage": `https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}`,
        "url": `https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}`,
        "articleSection": `News, Trending`,
        "author": {
            "@type": "Organization",
            "name": "The Everipedia Community",
        },
        "publisher": {
            "@type": "Organization",
            "name": "Everipedia",
            "legalName": "Everipedia International",
            "sameAs": ["https://twitter.com/everipedia", "https://www.facebook.com/everipedia/"],
            "logo": {
                "@type": "ImageObject",
                "url": "https://epcdn-vz.azureedge.net/static/images/logo_600x60.png",
                "width": "600",
                "height": "60"
            }
        },
        "copyrightHolder": `Everipedia`,
        "datePublished": `${inputJSON.metadata.creation_timestamp}`,
        "dateModified": `${inputJSON.metadata.last_modified}`
    };
    switch (inputJSON.metadata.page_type){
        case 'Person':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} bio, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, who is ${inputJSON.page_title}, where is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s biography and wiki on Everipedia`;
            break;
        case 'Product':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} review, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
            break;
        case 'Organization':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}, where is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
            break;
        default:
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki on Everipedia`;
    }
    schemaJSON["image"] = [];
    if (inputJSON.main_photo.url){
        schemaJSON["image"].push({
            "@type": "ImageObject",
            "url": `${ OVERRIDE_MAIN_THUMB ? 
                        `${OVERRIDE_MAIN_THUMB}?nocache=${RANDOMSTRING}` : 
                    inputJSON.main_photo.url ? `${inputJSON.main_photo.url}?nocache=${RANDOMSTRING}` : ``
                    }`,
            "name": inputJSON.page_title,
            "caption": inputJSON.page_title,
            "uploadDate": inputJSON.metadata.last_modified,
            "height": AMP_PHOTO_HEIGHT,
            "width": AMP_PHOTO_WIDTH,
        })
    }
    else {
        schemaJSON["image"].push({
            "@type": "ImageObject",
            "url": "https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png",
            "name": inputJSON.page_title,
            "caption": inputJSON.page_title,
            "uploadDate": inputJSON.metadata.last_modified,
            "height": 1274,
            "width": 1201,
        });
    }
    inputJSON.media_gallery.forEach((media, index) => {
        let sanitizedCaption = media.caption.map((value, index) => {
            let result = CheckForLinksOrCitationsAMP(value.text, inputJSON.citations, this.currentIPFS);
            return result.text;
        }).join("");
        let sanitizedCaptionPlaintext = striptags(sanitizedCaption);
        switch (media.type){
            case 'PICTURE':
                schemaJSON["image"].push({
                    "@type": "ImageObject",
                    "url": media.url,
                    "name": `${inputJSON.page_title} Image #${index}`,
                    "caption": sanitizedCaptionPlaintext,
                    "uploadDate": media.timestamp,
                    "height": 300,
                    "width": 300,
                });
                break;
            case 'GIF':
                schemaJSON["image"].push({
                    "@type": "ImageObject",
                    "url": media.url,
                    "name": `${inputJSON.page_title} GIF Image #${index}`,
                    "caption": sanitizedCaptionPlaintext,
                    "uploadDate": media.timestamp,
                    "height": 300,
                    "width": 300,
                });
                break;
            case 'YOUTUBE':
                schemaJSON["image"].push({
                    "@type": "ImageObject",
                    "url": media.url,
                    "name": `${inputJSON.page_title} YouTube Video #${index}`,
                    "thumbnailUrl": `https://i.ytimg.com/vi/${youtubeIdExists(media.url)}/default.jpg`,
                    "caption": sanitizedCaptionPlaintext,
                    "uploadDate": media.timestamp,
                    "height": 300,
                    "width": 300,
                });
                break;
            case 'NORMAL_VIDEO':
                schemaJSON["image"].push({
                    "@type": "ImageObject",
                    "url": media.url,
                    "name": `${inputJSON.page_title} Video #${index}`,
                    "thumbnailUrl": `${media.url}?nocache=${RANDOMSTRING}`,
                    "caption": sanitizedCaptionPlaintext,
                    "uploadDate": media.timestamp,
                    "height": 1274,
                    "width": 1201,
                });
                break;
            default:  
        }
    })
    inputJSON.infoboxes.forEach((infobox, index) => {
        let valuesBlock = [];
        infobox.values.forEach((value, index) => {
            let result = CheckForLinksOrCitationsAMP(value.text, inputJSON.citations, this.currentIPFS);
            valuesBlock.push(striptags(result.text));
        });

        if (infobox.addlSchematype){
                schemaJSON[infobox.schema] = { "@type": infobox.addlSchematype };
                if (infobox.addlSchemaItemProp) {
                    schemaJSON[infobox.schema][infobox.addlSchemaItemProp] = valuesBlock;
                }
                else {
                    schemaJSON[infobox.schema]["name"] = valuesBlock;
                }
        }
        else {
            schemaJSON[infobox.schema] = "";
        }
    })
    return `<script type="application/ld+json">${JSON.stringify(schemaJSON)}</script>`;
}
