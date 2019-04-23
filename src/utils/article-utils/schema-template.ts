import { ArticleJson, Citation, Paragraph, Media, Sentence, ListItem, Table, TableRow, TableCell } from './article-dto';
import { AMPParseCollection, LanguagePack } from './article-types';
import { getYouTubeID } from './article-converter';
import { CheckForLinksOrCitationsAMP, ConstructAMPImage } from '.';
import * as crypto from 'crypto';
import * as striptags from 'striptags';
import * as urlSlug from 'url-slug';
import * as tag from 'html-tag';

export const renderSchema = (inputJSON: ArticleJson): any => {
    const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
    const BLURB_SNIPPET_PLAINTEXT = '',
        OVERRIDE_MAIN_THUMB = false;

    // Metadata values
    const last_modified = inputJSON.metadata.find(w => w.key == 'last_modified').value;
    const creation_timestamp = inputJSON.metadata.find(w => w.key == 'creation_timestamp').value;
    const page_lang = inputJSON.metadata.find(w => w.key == 'page_lang').value;
    const url_slug = inputJSON.metadata.find(w => w.key == 'url_slug').value;
    const page_type = inputJSON.metadata.find(w => w.key == 'page_type').value;

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
    schemaJSON.about['name'] = inputJSON.page_title;
    switch (page_type) {
        case 'Person':
            schemaJSON['description'] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON['keywords'] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${
                inputJSON.page_title
            } bio, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, who is ${
                inputJSON.page_title
            }, where is ${inputJSON.page_title}`;
            schemaJSON['headline'] = `${inputJSON.page_title}'s biography and wiki on Everipedia`;
            schemaJSON.about['@type'] = 'Person';
            break;
        case 'Product':
            schemaJSON['description'] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON['keywords'] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${
                inputJSON.page_title
            } encyclopedia, ${inputJSON.page_title} review, ${inputJSON.page_title} news, what is ${
                inputJSON.page_title
            }`;
            schemaJSON['headline'] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
            schemaJSON.about['@type'] = 'Product';
            break;
        case 'Organization':
            schemaJSON['description'] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON['keywords'] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${
                inputJSON.page_title
            } history, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${
                inputJSON.page_title
            }, where is ${inputJSON.page_title}`;
            schemaJSON['headline'] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
            schemaJSON.about['@type'] = 'Organization';
            break;
        default:
            schemaJSON['description'] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON['keywords'] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${
                inputJSON.page_title
            } encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
            schemaJSON['headline'] = `${inputJSON.page_title}'s wiki on Everipedia`;
            schemaJSON.about['@type'] = 'Thing';
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
            name: inputJSON.page_title,
            caption: inputJSON.page_title,
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
            name: inputJSON.page_title,
            caption: inputJSON.page_title,
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
                    []
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
                    name: `${inputJSON.page_title} Image #${index}`,
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
                    name: `${inputJSON.page_title} GIF Image #${index}`,
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
                    name: `${inputJSON.page_title} YouTube Video #${index}`,
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
                    name: `${inputJSON.page_title} Video #${index}`,
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
            let result = CheckForLinksOrCitationsAMP(value.text, inputJSON.citations, inputJSON.ipfs_hash, []);
            valuesBlock.push((striptags as any)(result.text));
        });

        if (infobox.addlSchematype) {
            schemaJSON.about[infobox.schema] = { '@type': infobox.addlSchematype };
            if (infobox.addlSchemaItemProp) {
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
                    []
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
                    return renderParagraph(para, inputJSON.citations, inputJSON.ipfs_hash).text;
                })
                .join();
        })
        .join();
    schemaJSON['articleBody'] = pageBodyText;
    return `<script type="application/ld+json">${JSON.stringify(schemaJSON)}</script>`;
};

export const renderParagraph = (
    paragraph: Paragraph,
    passedCitations: Citation[],
    passedIPFS: string
): AMPParseCollection => {
    let returnCollection: AMPParseCollection = { text: '', lightboxes: [] };
    const { tag_type, items } = paragraph;
    if (items && items.length > 0) {
    } else return returnCollection;
    if (tag_type === 'h2' || tag_type === 'h3' || tag_type === 'h4' || tag_type === 'h5' || tag_type === 'h6') {
        const text: string = (items[0] as Sentence).text;
        returnCollection.text = `<${tag_type} id=${urlSlug(text).slice(0, 15)}>${text}</${tag_type}>`;
    } else if (tag_type === 'p') {
        let sanitizedText = (items as Sentence[])
            .map((sentenceItem: Sentence, sentenceIndex) => {
                let result = CheckForLinksOrCitationsAMP(sentenceItem.text, passedCitations, passedIPFS, []);
                returnCollection.lightboxes.push(...result.lightboxes);
                return result.text;
            })
            .join('');
        returnCollection.text = tag(tag_type, paragraph.attrs, sanitizedText);
    } else if (tag_type === 'ul') {
        let sanitizedText = (items as ListItem[])
            .map((liItem: ListItem, listIndex) => {
                return liItem.sentences
                    .map((sentenceItem: Sentence, sentenceIndex) => {
                        let result = CheckForLinksOrCitationsAMP(sentenceItem.text, passedCitations, passedIPFS, []);
                        returnCollection.lightboxes.push(...result.lightboxes);
                        return tag(liItem.tag_type, {}, result.text);
                    })
                    .join('');
            })
            .join('');
        returnCollection.text = tag(tag_type, paragraph.attrs, sanitizedText);
    } else if (tag_type === 'table') {
        let sanitizedText = (items as Table[]).map((tableItem: Table, tableIndex) => {
            // Create the thead if present
            let sanitizedHeadRows = tableItem.thead
                ? tableItem.thead.rows
                      .map((row: TableRow, rowIndex) => {
                          let sanitizedCells = row.cells
                              ? row.cells
                                    .map((cell: TableCell, cellIndex) => {
                                        let sanitizedCellContents = cell.content
                                            .map((sentence: Sentence, sentenceIndex) => {
                                                let result = CheckForLinksOrCitationsAMP(
                                                    sentence.text,
                                                    passedCitations,
                                                    passedIPFS,
                                                    []
                                                );
                                                returnCollection.lightboxes.push(...result.lightboxes);
                                                return result.text;
                                            })
                                            .join('');
                                        return tag(cell.tag_type, cell.attrs, sanitizedCellContents);
                                    })
                                    .join('')
                              : '';
                          return tag('tr', row.attrs, sanitizedCells);
                      })
                      .join('')
                : '';
            let sanitizedHead = tableItem.thead ? tag('thead', tableItem.thead.attrs, sanitizedHeadRows) : '';

            // Create the tbody
            let sanitizedBodyRows = tableItem.tbody
                ? tableItem.tbody.rows
                      .map((row: TableRow, rowIndex) => {
                          let sanitizedCells = row.cells
                              ? row.cells
                                    .map((cell: TableCell, cellIndex) => {
                                        let sanitizedCellContents = cell.content
                                            .map((sentence: Sentence, sentenceIndex) => {
                                                let result = CheckForLinksOrCitationsAMP(
                                                    sentence.text,
                                                    passedCitations,
                                                    passedIPFS,
                                                    []
                                                );
                                                returnCollection.lightboxes.push(...result.lightboxes);
                                                return result.text;
                                            })
                                            .join('');
                                        return tag(cell.tag_type, cell.attrs, sanitizedCellContents);
                                    })
                                    .join('')
                              : '';
                          return tag('tr', row.attrs, sanitizedCells);
                      })
                      .join('')
                : '';
            let sanitizedBody = tableItem.tbody ? tag('tbody', tableItem.tbody.attrs, sanitizedBodyRows) : '';

            // Create the tfoot if present
            let sanitizedFootRows = tableItem.tfoot
                ? tableItem.tfoot.rows
                      .map((row: TableRow, rowIndex) => {
                          let sanitizedCells = row.cells
                              ? row.cells
                                    .map((cell: TableCell, cellIndex) => {
                                        let sanitizedCellContents = cell.content
                                            .map((sentence: Sentence, sentenceIndex) => {
                                                let result = CheckForLinksOrCitationsAMP(
                                                    sentence.text,
                                                    passedCitations,
                                                    passedIPFS,
                                                    []
                                                );
                                                returnCollection.lightboxes.push(...result.lightboxes);
                                                return result.text;
                                            })
                                            .join('');
                                        return tag(cell.tag_type, cell.attrs, sanitizedCellContents);
                                    })
                                    .join('')
                              : '';
                          return tag('tr', row.attrs, sanitizedCells);
                      })
                      .join('')
                : '';
            let sanitizedFoot = tableItem.tfoot ? tag('tfoot', tableItem.tfoot.attrs, sanitizedFootRows) : '';

            // Create the caption if present
            let sanitizedCaption = tableItem.caption
                ? [tableItem.caption]
                      .map((caption: string, rowIndex) => {
                          let result = CheckForLinksOrCitationsAMP(caption, passedCitations, passedIPFS, []);
                          returnCollection.lightboxes.push(...result.lightboxes);
                          return `<caption>${result.text}</${caption}>`;
                      })
                      .join('')
                : '';
            return [sanitizedHead, sanitizedBody, sanitizedFoot, sanitizedCaption].join('');
        });
        returnCollection.text = tag('table', paragraph.attrs, sanitizedText.join(''));
    }

    // const sentences: Sentence[] = this.renderSentences(items, tag_type, index);
    // return <Paragraph key={index}>{sentences}</Paragraph>;
    return returnCollection;
};

export const renderImage = (image: Media, passedCitations: Citation[], passedIPFS: string): AMPParseCollection => {
    let returnCollection: AMPParseCollection = { text: '', lightboxes: [] };
    let sanitizedCaption = image.caption
        .map((sentenceItem: Sentence, sentenceIndex) => {
            let result = CheckForLinksOrCitationsAMP(sentenceItem.text, passedCitations, passedIPFS, []);
            returnCollection.lightboxes.push(...result.lightboxes);
            return result.text;
        })
        .join('');
    let sanitizedCaptionPlaintext = (striptags as any)(sanitizedCaption);
    returnCollection.text = ConstructAMPImage(image, sanitizedCaption, sanitizedCaptionPlaintext);
    return returnCollection;
};
