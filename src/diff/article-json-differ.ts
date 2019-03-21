import { ArticleJson, Metadata, Paragraph, Section, Media, Sentence, ParagraphItem, ListItem, Table, TableRow, Infobox, Citation } from '../wiki/article-dto';
import { CitationDiff, MetadataDiff, MediaDiff } from './diff.types';
import * as JsDiff from 'diff';
import * as crypto from 'crypto';

const METADATA_EXCLUDE_FIELDS = ["pageviews"];

export async function ArticleJsonDiff (old_wiki: ArticleJson, new_wiki: ArticleJson) {
    const diff_json = {
        page_title: diffPageTitle(old_wiki.page_title, new_wiki.page_title),
        main_photo: diffMedia([old_wiki.main_photo], [new_wiki.main_photo]),
        page_body: diffPageBody(old_wiki.page_body, new_wiki.page_body),
        infoboxes: diffInfoboxes(old_wiki.infoboxes, new_wiki.infoboxes),
        citations: diffCitations(old_wiki.citations, new_wiki.citations),
        metadata: diffMetadata(old_wiki.metadata, new_wiki.metadata),
        media_gallery: diffMedia(old_wiki.media_gallery, new_wiki.media_gallery),
        infobox_html: new_wiki.infobox_html
    }
    return diff_json;
}

function diffMetadata(old_metadata: Metadata, new_metadata: Metadata): MetadataDiff[] {
    const old_entries = Object.entries(old_metadata);
    const new_entries = Object.entries(old_metadata);
    const old_lines = old_entries.map(arr => `${arr[0]}:${arr[1]}`).join('\n');
    const new_lines = new_entries.map(arr => `${arr[0]}:${arr[1]}`).join('\n');
    const diff = JsDiff.diffLines(old_lines, new_lines);

    const metadata_diffs = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of diff) {
        for (let i=0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = { ...new_entries[new_counter++] }
                clone.diff = 'add';
            }
            else if (part.removed) {
                clone = { ...old_entries[old_counter++] }
                clone.diff = 'delete';
            }
            else {
                clone = { ...old_entries[old_counter++] }
                clone.diff = 'none';
            }
            metadata_diffs.push(clone);
        }
    }

    return metadata_diffs;
}

function diffCitations(old_citations: Citation[], new_citations: Citation[]): CitationDiff[] {
    const old_urls = old_citations.map(c => c.url).join('\n');
    const new_urls = new_citations.map(c => c.url).join('\n');
    const diff = JsDiff.diffLines(old_urls, new_urls);

    const citation_diffs = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of diff) {
        for (let i=0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = { ...new_citations[new_counter++] }
                clone.diff = 'add';
            }
            else if (part.removed) {
                clone = { ...old_citations[old_counter++] }
                clone.diff = 'delete';
            }
            else {
                clone = { ...old_citations[old_counter++] }
                clone.diff = 'none';
            }
            citation_diffs.push(clone);
        }
    }

    return citation_diffs;

}

function diffPageTitle (old_page_title: string, new_page_title: string) {
    const diffs = [];
    if (old_page_title && old_page_title == new_page_title)
        diffs.push({ page_title: old_page_title, diff: 'none' });
    else if (!old_page_title)
        diffs.push({ page_title: new_page_title, diff: 'add' });
    else {
        diffs.push({ page_title: old_page_title, diff: 'delete' });
        diffs.push({ page_title: new_page_title, diff: 'add' });
    }
    return diffs;
}

function diffMedia (old_media: Media[], new_media: Media[]): MediaDiff[] {
    const old_lines = old_media.map( c => {
        if (c.caption) return `${c.url}:${hashSentences(c.caption)}`;
        else return `${c.url}`;
    }).join('\n');
    const new_lines = new_media.map( c => {
        if (c.caption) return `${c.url}:${hashSentences(c.caption)}`;
        else return `${c.url}`;
    }).join('\n');
    const diff = JsDiff.diffLines(old_lines, new_lines);

    const media_diffs = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of diff) {
        for (let i=0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = { ...new_media[new_counter++] }
                clone.diff = 'add';
            }
            else if (part.removed) {
                clone = { ...old_media[old_counter++] }
                clone.diff = 'delete';
            }
            else {
                clone = { ...old_media[old_counter++] }
                clone.diff = 'none';
            }
            media_diffs.push(clone);
        }
    }
    return media_diffs;
}

// Page Body diffs:
// Break the page body down into a pseudo-markdown format
//
// 3 line breaks indicate a section break
// ------------- on its own line separates a section's text from its images
// 2 line breaks indicate a paragraph break
// 1 sentence per line
//
// Tables are diffed one row at a time
//
// ============= 
// Text in between lines of equal signs indicate a table.
// ~~~~~~~~~~~~~
// Tilde lines split thead | tbody | tfoot | and caption
// One line per row.
// Pipes|indicate|splits|between|cells
// ~~~~~~~~~~~~~
// this is a tfoot | it will often be blank
// ~~~~~~~~~~~~~
// The last line of a table is the caption.
// ============= 

const SECTION_SEPARATOR = '\n-----------n\n------------\n';
const SECTION_TEXT_IMAGE_SEPARATOR = '\ntititititititi\n';
const PARAGRAPH_SEPARATOR = '\npppppppppppp\n';
const PARAGRAPH_ITEM_SEPARATOR = '\npipipi\n';
const IMAGE_SEPARATOR = '\niiiiiiiiiii\n';
const LIST_ITEM_PREFIX = 'lilili^^^ ';
const SENTENCE_PREFIX =  'ssssss^^^ ';
const TABLE_PREFIX =     'tabtab^^^\n';
const TABLE_ROW_SEPARATOR = '\n';
const TABLE_SECTION_SEPARATOR = '\n~~~~~~~~~~~~~\n';
const TABLE_CELL_SEPARATOR = '|';
const IMAGE_URL_CAPTION_SEPARATOR = '|';

function diffPageBody (old_page_body: Section[], new_page_body: Section[]) {
    // 3 line breaks to indicate a section break
    const old_lines = old_page_body.map(sectionToLines).join(SECTION_SEPARATOR);
    const new_lines = new_page_body.map(sectionToLines).join(SECTION_SEPARATOR);
    const diff = JsDiff.diffLines(old_lines, new_lines);
        
    return diffToSections(diff);
}

function diffToSections(diff): Section[] {
    const sections = [];
    for (let part of diff) {
        let difftype;
        if (part.added) difftype = 'add';
        else if (part.removed) difftype = 'delete';
        else difftype = 'none';   

        const section_texts = part.value.split(SECTION_SEPARATOR);
        let carryover;
        for (let section_text of section_texts) {
            if (!section_text.match(SECTION_TEXT_IMAGE_SEPARATOR)) {
                carryover = section_text;
                continue;
            }

            const paragraphs_text = section_text
                .split(SECTION_TEXT_IMAGE_SEPARATOR)[0];

                
            const paragraphs = paragraphs_text
                .split(PARAGRAPH_SEPARATOR)
                .map(linesToParagraph);

            // mark diff types
            for (let para of paragraphs) {
                for (let item of para.items) {
                    item.diff = difftype;
                }
            }

            const images = section_text
                .split(SECTION_TEXT_IMAGE_SEPARATOR)[1]
                .split(IMAGE_SEPARATOR)
                .map(lineToImage);

            sections.push({ paragraphs, images })
        }
    }

    return sections;
}

function linesToParagraph(lines: string): Paragraph {
    const items = lines.split(PARAGRAPH_ITEM_SEPARATOR);
    return { index: 0, items: [], tag_type: 'p', attrs: {} }
}

function lineToImage(line: string): Media {
    return null;
}

function sectionToLines (section: Section) {
    const section_text = section.paragraphs.map(paragraphToLines).join(PARAGRAPH_SEPARATOR);
    const section_image_lines = section.images.map(sectionImageToLine).join(IMAGE_SEPARATOR);
    return section_text + SECTION_TEXT_IMAGE_SEPARATOR + section_image_lines;
}

function sectionImageToLine (image: Media) {
    return image.url + IMAGE_URL_CAPTION_SEPARATOR + image.caption.map(s => s.text).join(' ');
}

function paragraphToLines (paragraph: Paragraph) {
    const lines = paragraph.items.map(item => {
        if (item.type == 'sentence') {
            const sentence = item as Sentence;
            return SENTENCE_PREFIX + sentence.text;
        }
        else if (item.type == 'list_item') {
            const list_item =  item as ListItem;
            return LIST_ITEM_PREFIX + list_item.sentences.map(s => s.text).join(' ');
        }
        else if (item.type == 'table') {
            const table = item as Table;
            return tableToLines(table);
        }
        else throw new Error("Unsupported ParagraphItem type");
    })
    .join(PARAGRAPH_ITEM_SEPARATOR);

    return lines;
}

function tableToLines (table: Table) {
    const thead_lines = table.thead.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const tbody_lines = table.tbody.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const tfoot_lines = table.tfoot.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const caption_line = table.caption;

    return TABLE_PREFIX + 
        thead_lines +
        TABLE_SECTION_SEPARATOR +
        tbody_lines +
        TABLE_SECTION_SEPARATOR +
        tfoot_lines
        TABLE_SECTION_SEPARATOR +
        caption_line;
}

function tableRowToLine (row: TableRow) {
    return row.cells.map(cell => 
        cell.content
            .map(sentence => sentence.text)
            .join(' ')
    )
    .join(TABLE_CELL_SEPARATOR);
}

function diffInfoboxes (old_infoboxes: Infobox[], new_infoboxes: Infobox[]) {
    const hash = crypto.createHash('sha256');
    const old_hashes = old_infoboxes.map(hashInfobox).join('\n');
    const new_hashes = new_infoboxes.map(hashInfobox).join('\n');
    const hash_diff = JsDiff.diffLines(old_hashes, new_hashes);

    const infoboxes_diff = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of hash_diff) {
        for (let i=0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = JSON.parse(JSON.stringify(new_infoboxes[new_counter++]));
                clone.diff = 'add';
            }
            else if (part.removed) {
                clone = JSON.parse(JSON.stringify(old_infoboxes[old_counter++]));
                clone.diff = 'delete';
            }
            else {
                clone = JSON.parse(JSON.stringify(old_infoboxes[old_counter++]));
                clone.diff = 'none';
            }
            infoboxes_diff.push(clone);
        }
    }

    return infoboxes_diff;

}

function hashInfobox(infobox: Infobox) {
    const hash = crypto.createHash('sha256');
    hash.update(infobox.key);
    hash.update(Buffer.from(hashSentences(infobox.values), 'hex'));
    return hash.digest('hex');
}

function hashSentences(sentences: Sentence[]) {
    const hash = crypto.createHash('sha256');
    for (let sentence of sentences) {
        hash.update(sentence.text);
    }

    return hash.digest('hex');
}
