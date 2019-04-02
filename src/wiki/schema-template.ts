import { ArticleJson } from './article-dto';
import { CheckForLinksOrCitationsAMP } from '../utils/article-utils';
import { getYouTubeID, renderParagraph } from './article-converter';
import { LanguagePack } from './wiki.service';
const crypto = require("crypto");
var striptags = require('striptags');

export const renderSchema = (inputJSON: ArticleJson): any => {
    const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
    const BLURB_SNIPPET_PLAINTEXT = '', OVERRIDE_MAIN_THUMB = false;
    let schemaJSON = { 
        "@context": `http://schema.org`, 
        "@type": [`Article`],
        "mainEntityOfPage": `https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}`,
        "url": `https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}`,
        "inLanguage": `${inputJSON.metadata.page_lang}`,
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
        "dateModified": `${inputJSON.metadata.last_modified}`,
        "about": {},
        "citation": []
    };
    schemaJSON.about["name"] = inputJSON.page_title;
    switch (inputJSON.metadata.page_type){
        case 'Person':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} bio, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, who is ${inputJSON.page_title}, where is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s biography and wiki on Everipedia`;
            schemaJSON.about['@type'] = 'Person';
            break;
        case 'Product':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} review, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
            schemaJSON.about['@type'] = 'Product';
            break;
        case 'Organization':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}, where is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
            schemaJSON.about['@type'] = 'Organization';
            break;
        default:
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki on Everipedia`;
            schemaJSON.about['@type'] = 'Thing';
    }
    schemaJSON["image"] = [], schemaJSON.about["image"] = [];
    if (inputJSON.main_photo.url){
        let pushObj = {
            "@type": "ImageObject",
            "url": `${ OVERRIDE_MAIN_THUMB ? 
                        `${OVERRIDE_MAIN_THUMB}?nocache=${RANDOMSTRING}` : 
                    inputJSON.main_photo.url ? `${inputJSON.main_photo.url}?nocache=${RANDOMSTRING}` : ``
                    }`,
            "name": inputJSON.page_title,
            "caption": inputJSON.page_title,
            "uploadDate": inputJSON.metadata.last_modified,
            "height": inputJSON.main_photo.height,
            "width": inputJSON.main_photo.width,
        };
        schemaJSON.about["image"].push(pushObj);
        schemaJSON["image"].push(pushObj);
    }
    else {
        let pushObj = {
            "@type": "ImageObject",
            "url": "https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png",
            "name": inputJSON.page_title,
            "caption": inputJSON.page_title,
            "uploadDate": inputJSON.metadata.last_modified,
            "height": 1274,
            "width": 1201,
        }
        schemaJSON.about["image"].push(pushObj);
        schemaJSON["image"].push(pushObj);
    }
    inputJSON.media_gallery.forEach((media, index) => {
        let sanitizedCaption = media.caption.map((value, index) => {
            let result = CheckForLinksOrCitationsAMP(value.text, inputJSON.citations, inputJSON.metadata.ipfs_hash, []);
            return result.text;
        }).join("");
        let sanitizedCaptionPlaintext = striptags(sanitizedCaption);
        switch (media.category){
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
                    "thumbnailUrl": `https://i.ytimg.com/vi/${getYouTubeID(media.url)}/default.jpg`,
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
            let result = CheckForLinksOrCitationsAMP(value.text, inputJSON.citations, inputJSON.metadata.ipfs_hash, []);
            valuesBlock.push(striptags(result.text));
        });

        if (infobox.addlSchematype){
                schemaJSON.about[infobox.schema] = { "@type": infobox.addlSchematype };
                if (infobox.addlSchemaItemProp) {
                    schemaJSON.about[infobox.schema][infobox.addlSchemaItemProp] = valuesBlock;
                }
                else {
                    schemaJSON.about[infobox.schema]["name"] = valuesBlock;
                }
        }
        else {
            schemaJSON.about[infobox.schema] = "";
        }
    })
    inputJSON.citations.forEach((citation, index) => {
         let citationText = citation.description.map((value, index) => {
            let result = CheckForLinksOrCitationsAMP(value.text, inputJSON.citations, inputJSON.metadata.ipfs_hash, []);
            return striptags(result.text);
        }).join("");

        schemaJSON.citation.push({
            "@type": 'CreativeWork',
            "url": citation.url,
            "encodingFormat": citation.mime,
            "datePublished": citation.timestamp,
            "image": citation.thumb,
            "description": citationText
        });
    })
    let pageBodyText = inputJSON.page_body.map((section, indexSection) => {
        return section.paragraphs.map((para, indexPara) => {
            return renderParagraph(para, inputJSON.citations, inputJSON.metadata.ipfs_hash).text;
        }).join();
    }).join();
    schemaJSON["articleBody"] = pageBodyText;
    return `<script type="application/ld+json">${JSON.stringify(schemaJSON)}</script>`;
}
