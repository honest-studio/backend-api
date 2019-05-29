import { ArticleJson } from './article-dto';
import { getYouTubeID } from './article-converter';
import { renderAMPParagraph } from './article-tools';
import { CheckForLinksOrCitationsAMP, ConstructAMPImage } from '.';
import crypto from 'crypto';
import striptags from 'striptags';


export const renderSchema = (inputJSON: ArticleJson, returnType: 'html' | 'JSON'): any => {
    const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
    const BLURB_SNIPPET_PLAINTEXT = '',
        OVERRIDE_MAIN_THUMB = false;

    // Metadata values
    const last_modified = inputJSON.metadata.find(w => w.key == 'last_modified') ? inputJSON.metadata.find(w => w.key == 'last_modified').value : '';
    const creation_timestamp = inputJSON.metadata.find(w => w.key == 'creation_timestamp') ? inputJSON.metadata.find(w => w.key == 'creation_timestamp').value : '';
    const page_lang = inputJSON.metadata.find(w => w.key == 'page_lang').value;
    const url_slug = inputJSON.metadata.find(w => w.key == 'url_slug').value;
    const page_type = inputJSON.metadata.find(w => w.key == 'page_type').value;
    const page_title = inputJSON.page_title[0].text;

    let schemaJSON = {
        '@context': `http://schema.org`,
        '@type': [`Article`],
        mainEntityOfPage: `https://everipedia.org/wiki/lang_${page_lang}/${
            url_slug
        }`,
        url: `https://everipedia.org/wiki/lang_${page_lang}/${url_slug}`,
        inLanguage: `${page_lang}`,
        author: {
            '@type': 'Organization',
            name: 'The Everipedia Community'
        },
        publisher: {
            '@type': 'Organization',
            name: 'Everipedia',
            legalName: 'Everipedia International',
            sameAs: ['https://twitter.com/everipedia', 'https://www.facebook.com/everipedia/'],
            logo: {
                '@type': 'ImageObject',
                url: 'https://epcdn-vz.azureedge.net/static/images/logo_600x60.png',
                width: '600',
                height: '60'
            }
        },
        copyrightHolder: `Everipedia`,
        datePublished: `${creation_timestamp}`,
        dateModified: `${last_modified}`,
        about: {},
        citation: []
    };
    schemaJSON.about['name'] = page_title;
    schemaJSON.about['@type'] = page_type;
    
    switch (page_type) {
        case 'Person':
            schemaJSON['description'] = `${page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON['keywords'] = `${page_title}, ${page_title} wiki, ${
                page_title
            } bio, ${page_title} encyclopedia, ${page_title} news, who is ${
                page_title
            }, where is ${page_title}`;
            schemaJSON['headline'] = `${page_title}'s biography and wiki on Everipedia`;
            
            break;
        case 'Product':
            schemaJSON['description'] = `${page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON['keywords'] = `${page_title}, ${page_title} wiki, ${
                page_title
            } encyclopedia, ${page_title} review, ${page_title} news, what is ${
                page_title
            }`;
            schemaJSON['headline'] = `${page_title}'s wiki & review on Everipedia`;
            break;
        case 'Organization':
            schemaJSON['description'] = `${page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON['keywords'] = `${page_title}, ${page_title} wiki, ${
                page_title
            } history, ${page_title} encyclopedia, ${page_title} news, what is ${
                page_title
            }, where is ${page_title}`;
            schemaJSON['headline'] = `${page_title}'s wiki & review on Everipedia`;
            break;
        default:
            schemaJSON['description'] = `${page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON['keywords'] = `${page_title}, ${page_title} wiki, ${
                page_title
            } encyclopedia, ${page_title} news, what is ${page_title}`;
            schemaJSON['headline'] = `${page_title}'s wiki on Everipedia`;
    }
    (schemaJSON['image'] = []), (schemaJSON.about['image'] = []);
    if (inputJSON.main_photo[0].url) {
        let pushObj = {
            '@type': 'ImageObject',
            url: `${
                OVERRIDE_MAIN_THUMB
                    ? `${OVERRIDE_MAIN_THUMB}?nocache=${RANDOMSTRING}`
                    : inputJSON.main_photo[0].url
                    ? `${inputJSON.main_photo[0].url}?nocache=${RANDOMSTRING}`
                    : ``
            }`,
            name: page_title,
            caption: page_title,
            uploadDate: last_modified,
            height: inputJSON.main_photo[0].height,
            width: inputJSON.main_photo[0].width
        };
        schemaJSON.about['image'].push(pushObj);
        schemaJSON['image'].push(pushObj);
    } else {
        let pushObj = {
            '@type': 'ImageObject',
            url: 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png',
            name: page_title,
            caption: page_title,
            uploadDate: last_modified,
            height: 1274,
            width: 1201
        };
        schemaJSON.about['image'].push(pushObj);
        schemaJSON['image'].push(pushObj);
    }
    inputJSON.media_gallery.forEach((media, index) => {
        let sanitizedCaption = media.caption
            .map((value, index) => {
                let result = CheckForLinksOrCitationsAMP(
                    value.text,
                    inputJSON.citations,
                    inputJSON.ipfs_hash,
                    [],
                    true
                );
                return result.text;
            })
            .join('');
        let sanitizedCaptionPlaintext = (striptags as any)(sanitizedCaption);
        switch (media.category) {
            case 'PICTURE':
                schemaJSON['image'].push({
                    '@type': 'ImageObject',
                    url: media.url,
                    name: `${page_title} Image #${index}`,
                    caption: sanitizedCaptionPlaintext,
                    uploadDate: media.timestamp,
                    height: 300,
                    width: 300
                });
                break;
            case 'GIF':
                schemaJSON['image'].push({
                    '@type': 'ImageObject',
                    url: media.url,
                    name: `${page_title} GIF Image #${index}`,
                    caption: sanitizedCaptionPlaintext,
                    uploadDate: media.timestamp,
                    height: 300,
                    width: 300
                });
                break;
            case 'YOUTUBE':
                schemaJSON['image'].push({
                    '@type': 'ImageObject',
                    url: media.url,
                    name: `${page_title} YouTube Video #${index}`,
                    thumbnailUrl: `https://i.ytimg.com/vi/${getYouTubeID(media.url)}/default.jpg`,
                    caption: sanitizedCaptionPlaintext,
                    uploadDate: media.timestamp,
                    height: 300,
                    width: 300
                });
                break;
            case 'NORMAL_VIDEO':
                schemaJSON['image'].push({
                    '@type': 'ImageObject',
                    url: media.url,
                    name: `${page_title} Video #${index}`,
                    thumbnailUrl: `${media.url}?nocache=${RANDOMSTRING}`,
                    caption: sanitizedCaptionPlaintext,
                    uploadDate: media.timestamp,
                    height: 1274,
                    width: 1201
                });
                break;
            default:
        }
    });
    inputJSON.infoboxes.forEach((infobox, index) => {
        let valuesBlock = [];
        infobox.values.forEach((value, index) => {
            let result = CheckForLinksOrCitationsAMP(value.text, inputJSON.citations, inputJSON.ipfs_hash, [], true);
            valuesBlock.push((striptags as any)(result.text));
        });

        if (infobox.addlSchematype && infobox.addlSchemaItemProp != 'None') {
            schemaJSON.about[infobox.schema] = { '@type': infobox.addlSchematype };
            if (infobox.addlSchemaItemProp == 'NOTHING') {
                schemaJSON.about[infobox.schema] = valuesBlock;
            }
            else if (infobox.addlSchemaItemProp) {
                schemaJSON.about[infobox.schema][infobox.addlSchemaItemProp] = valuesBlock;
            } else {
                schemaJSON.about[infobox.schema]['name'] = valuesBlock;
            }
        } else {
            schemaJSON.about[infobox.schema] = '';
        }
    });
    inputJSON.citations.forEach((citation, index) => {
        let citationText = citation.description
            .map((value, index) => {
                let result = CheckForLinksOrCitationsAMP(
                    value.text,
                    inputJSON.citations,
                    inputJSON.ipfs_hash,
                    [],
                    true
                );
                return (striptags as any)(result.text);
            })
            .join('');

        schemaJSON.citation.push({
            '@type': 'CreativeWork',
            url: citation.url,
            encodingFormat: citation.mime,
            datePublished: citation.timestamp,
            image: citation.thumb,
            description: citationText
        });
    });
    let pageBodyText = inputJSON.page_body
        .map((section, indexSection) => {
            return section.paragraphs
                .map((para, indexPara) => {
                    return (striptags as any)(renderAMPParagraph(para, inputJSON.citations, inputJSON.ipfs_hash, true).text);
                })
                .join('');
        })
        .join('');
    schemaJSON['articleBody'] = pageBodyText.replace(/\s+/igum, ' ').trim();
    switch (returnType) {
        case 'JSON':
            return schemaJSON;
        case 'html':
            return `<script type="application/ld+json">${JSON.stringify(schemaJSON)}</script>`;
    }
    
};
