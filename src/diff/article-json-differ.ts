import {
    ArticleJson,
    Metadata,
    Paragraph,
    Section,
    Media,
    Sentence,
    ParagraphItem,
    ListItem,
    Table,
    TableRow,
    TableSection,
    Infobox,
    Citation
} from '../wiki/article-dto';
import {
    ArticleJsonDiff,
    CitationDiff,
    MetadataDiff,
    MediaDiff,
    SectionDiff,
    TableDiff,
    TableRowDiff,
    ParagraphDiff,
    DiffType,
    InfoboxDiff,
    TableSectionDiff
} from './diff-dto';
import * as JsDiff from 'diff';
import * as crypto from 'crypto';

const METADATA_EXCLUDE_FIELDS = ['pageviews'];

export function diffArticleJson(old_wiki: ArticleJson, new_wiki: ArticleJson): ArticleJsonDiff {
    const diff_json = {
        page_title: diffPageTitle(old_wiki.page_title, new_wiki.page_title),
        main_photo: diffMedia([old_wiki.main_photo], [new_wiki.main_photo]),
        page_body: diffPageBody(old_wiki.page_body, new_wiki.page_body),
        infoboxes: diffInfoboxes(old_wiki.infoboxes, new_wiki.infoboxes),
        citations: diffCitations(old_wiki.citations, new_wiki.citations),
        metadata: diffMetadata(old_wiki.metadata, new_wiki.metadata),
        media_gallery: diffMedia(old_wiki.media_gallery, new_wiki.media_gallery),
        infobox_html: new_wiki.infobox_html,
        diff_metadata: {
            old_hash: old_wiki.metadata.ipfs_hash,
            new_hash: new_wiki.metadata.ipfs_hash
        }
    };
    return diff_json;
}

function diffMetadata(old_metadata: Metadata, new_metadata: Metadata): MetadataDiff[] {
    const old_entries = Object.entries(old_metadata);
    const new_entries = Object.entries(old_metadata);
    const old_lines = old_entries.map((arr) => `${arr[0]}:${arr[1]}`).join('\n');
    const new_lines = new_entries.map((arr) => `${arr[0]}:${arr[1]}`).join('\n');
    const diff = JsDiff.diffLines(old_lines, new_lines);

    const metadata_diffs = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of diff) {
        for (let i = 0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = { ...new_entries[new_counter++] };
                clone.diff = 'add';
            } else if (part.removed) {
                clone = { ...old_entries[old_counter++] };
                clone.diff = 'delete';
            } else {
                clone = { ...old_entries[old_counter++] };
                clone.diff = 'none';
            }
            metadata_diffs.push(clone);
        }
    }

    return metadata_diffs;
}

function diffCitations(old_citations: Citation[], new_citations: Citation[]): CitationDiff[] {
    const old_urls = old_citations.map((c) => c.url).join('\n');
    const new_urls = new_citations.map((c) => c.url).join('\n');
    const diff = JsDiff.diffLines(old_urls, new_urls);

    const citation_diffs = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of diff) {
        for (let i = 0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = { ...new_citations[new_counter++] };
                clone.diff = 'add';
            } else if (part.removed) {
                clone = { ...old_citations[old_counter++] };
                clone.diff = 'delete';
            } else {
                clone = { ...old_citations[old_counter++] };
                clone.diff = 'none';
            }
            citation_diffs.push(clone);
        }
    }

    return citation_diffs;
}

function diffPageTitle(old_page_title: string, new_page_title: string) {
    const diffs = [];
    if (old_page_title && old_page_title == new_page_title) diffs.push({ page_title: old_page_title, diff: 'none' });
    else if (!old_page_title) diffs.push({ page_title: new_page_title, diff: 'add' });
    else {
        diffs.push({ page_title: old_page_title, diff: 'delete' });
        diffs.push({ page_title: new_page_title, diff: 'add' });
    }
    return diffs;
}

function diffMedia(old_media: Media[], new_media: Media[]): MediaDiff[] {
    const old_lines = old_media
        .map((c) => {
            if (c.caption) return `${c.url}:${hashSentences(c.caption)}`;
            else return `${c.url}`;
        })
        .join('\n');
    const new_lines = new_media
        .map((c) => {
            if (c.caption) return `${c.url}:${hashSentences(c.caption)}`;
            else return `${c.url}`;
        })
        .join('\n');
    const diff = JsDiff.diffLines(old_lines, new_lines);

    const media_diffs = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of diff) {
        for (let i = 0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = { ...new_media[new_counter++] };
                clone.diff = 'add';
            } else if (part.removed) {
                clone = { ...old_media[old_counter++] };
                clone.diff = 'delete';
            } else {
                clone = { ...old_media[old_counter++] };
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

const SECTION_SEPARATOR = '\n---sb---sb---\n';
const SECTION_TEXT_IMAGE_SEPARATOR = '\ntititititititi\n';
const PARAGRAPH_SEPARATOR = '\npppppppppppp\n';
const PARAGRAPH_ITEM_SEPARATOR = '\npip---pip\n';
const IMAGE_SEPARATOR = '\niiiiiiiiiii\n';
const LIST_ITEM_PREFIX = 'lilili^^^ ';
const SENTENCE_PREFIX = 'ssssss^^^ ';
const TABLE_PREFIX = 'tabtab^^^ ';
const TABLE_ROW_SEPARATOR = '\n';
const TABLE_SECTION_SEPARATOR = '\n~~~~~~~~~~~~~\n';
const TABLE_CELL_SEPARATOR = '|';
const IMAGE_URL_CAPTION_SEPARATOR = '|';
const DIFF_ADD_MARKER = ' d+++d';
const DIFF_DELETE_MARKER = ' d---d';
const DIFF_NONE_MARKER = ' d===d';

function diffPageBody(old_page_body: Section[], new_page_body: Section[]): SectionDiff[] {
    const old_lines = old_page_body.map(sectionToLines).join(SECTION_SEPARATOR);
    const new_lines = new_page_body.map(sectionToLines).join(SECTION_SEPARATOR);

    const diff_json = JsDiff.diffLines(old_lines, new_lines);

    // mark diffs and combine text
    let diff_text = '';
    for (let part of diff_json) {
        let DIFF_MARKER;
        if (part.added) DIFF_MARKER = DIFF_ADD_MARKER;
        else if (part.removed) DIFF_MARKER = DIFF_DELETE_MARKER;
        else DIFF_MARKER = DIFF_NONE_MARKER;

        let full_line_separators = [
            SECTION_SEPARATOR,
            SECTION_TEXT_IMAGE_SEPARATOR,
            PARAGRAPH_SEPARATOR,
            TABLE_SECTION_SEPARATOR,
            IMAGE_SEPARATOR,
            TABLE_PREFIX,
            PARAGRAPH_ITEM_SEPARATOR,
            '' // empty lines shouldn't be diffed either
        ].map((sep) => sep.replace(/\n/g, ''));

        diff_text += part.value
            .split('\n')
            .map((text) => {
                if (full_line_separators.includes(text)) return text;
                else return text + DIFF_MARKER;
            })
            .join('\n');
    }

    return diffToSections(diff_text);
}

function diffToSections(diff_text): SectionDiff[] {
    const sections = [];

    const section_texts = diff_text.split(SECTION_SEPARATOR);

    for (let section_text of section_texts) {
        const paragraphs = section_text
            .split(SECTION_TEXT_IMAGE_SEPARATOR)[0]
            .split(PARAGRAPH_SEPARATOR)
            .filter((text) => text.trim()) // no blank lines
            .map(linesToParagraph);

        const images = section_text
            .split(SECTION_TEXT_IMAGE_SEPARATOR)[1]
            .split(IMAGE_SEPARATOR)
            .filter((line) => line.trim()) // no blank lines
            .map(lineToImage);

        sections.push({ paragraphs, images });
    }

    return sections;
}

function linesToParagraph(lines: string): ParagraphDiff {
    const items = lines
        .split(PARAGRAPH_ITEM_SEPARATOR)
        .filter((lines) => lines.trim()) // no blank items
        .map((lines, index) => {
            const prefix = lines.substring(0, 10);
            if (prefix == SENTENCE_PREFIX)
                return {
                    index,
                    type: 'sentence',
                    text: lines.substring(10).slice(0, -6),
                    diff: getLineDiffType(lines)
                };
            else if (prefix == LIST_ITEM_PREFIX)
                return {
                    index,
                    type: 'list_item',
                    tag_type: 'li',
                    sentences: [
                        {
                            index: 0,
                            type: 'sentence',
                            text: lines.substring(10).slice(0, -6),
                            diff: getLineDiffType(lines)
                        }
                    ],
                    diff: getLineDiffType(lines)
                };
            else if (prefix == TABLE_PREFIX)
                return linesToTable(lines);
            else 
                throw new Error(`Unrecognized ParagraphItem prefix: ${prefix}`);
        });

    return { index: 0, items, tag_type: 'p', attrs: {} };
}

function linesToTable(lines: string): TableDiff {
    lines = lines.substring(10);
    const table_sections = lines.split(TABLE_SECTION_SEPARATOR);
    const thead = linesToTableSection(table_sections[0]);
    const tbody = linesToTableSection(table_sections[1]);
    const tfoot = linesToTableSection(table_sections[2]);
    const caption = table_sections[3];

    return { type: 'table', thead, tbody, tfoot, caption };
}

function linesToTableSection(lines: string): TableSectionDiff {
    const rows = lines.split(TABLE_ROW_SEPARATOR).map(lineToTableRow);

    return { rows, attrs: {} };
}

function lineToTableRow(line: string): TableRowDiff {
    const difftype = getLineDiffType(line);
    line = line.slice(0, -6);
    const cells = line.split(TABLE_CELL_SEPARATOR).map((text, index) => ({
        content: [
            {
                index: 0,
                type: 'sentence',
                text: text
            }
        ],
        index,
        attrs: {},
        tag_type: 'td'
    }));

    return { index: 0, attrs: {}, cells, diff: difftype };
}

function lineToImage(line: string): MediaDiff {
    const url = line.split(IMAGE_URL_CAPTION_SEPARATOR)[0];
    const caption = [
        {
            index: 0,
            type: 'sentence',
            text: line.split(IMAGE_URL_CAPTION_SEPARATOR)[1].slice(0, -6)
        }
    ];
    return {
        url,
        caption,
        type: 'section_image',
        diff: getLineDiffType(line)
    };
}

function getLineDiffType(line: string): DiffType {
    const last_six_chars = line.slice(-6);

    let difftype;
    if (last_six_chars == DIFF_ADD_MARKER) difftype = 'add';
    else if (last_six_chars == DIFF_DELETE_MARKER) difftype = 'remove';
    else if (last_six_chars == DIFF_NONE_MARKER) difftype = 'none';

    return difftype;
}

function sectionToLines(section: Section): string {
    const section_text = section.paragraphs.map(paragraphToLines).join(PARAGRAPH_SEPARATOR);
    const section_image_lines = section.images.map(sectionImageToLine).join(IMAGE_SEPARATOR);
    return section_text + SECTION_TEXT_IMAGE_SEPARATOR + section_image_lines;
}

function sectionImageToLine(image: Media): string {
    return image.url + IMAGE_URL_CAPTION_SEPARATOR + image.caption.map((s) => s.text).join(' ');
}

function paragraphToLines(paragraph: Paragraph): string {
    const lines = paragraph.items
        .map((item) => {
            if (item.type == 'sentence') {
                const sentence = item as Sentence;
                return SENTENCE_PREFIX + sentence.text;
            } else if (item.type == 'list_item') {
                const list_item = item as ListItem;
                return LIST_ITEM_PREFIX + list_item.sentences.map((s) => s.text).join(' ');
            } else if (item.type == 'wikitable') {
                const table = item as Table;
                return tableToLines(table);
            } else throw new Error('Unsupported ParagraphItem type');
        })
        .join(PARAGRAPH_ITEM_SEPARATOR);

    return lines;
}

function tableToLines(table: Table): string {
    const thead_lines = table.thead.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const tbody_lines = table.tbody.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const tfoot_lines = table.tfoot.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const caption_line = table.caption;

    return TABLE_PREFIX + thead_lines + TABLE_SECTION_SEPARATOR + tbody_lines + TABLE_SECTION_SEPARATOR + tfoot_lines;
    TABLE_SECTION_SEPARATOR + caption_line;
}

function tableRowToLine(row: TableRow): string {
    return row.cells.map((cell) => cell.content.map((sentence) => sentence.text).join(' ')).join(TABLE_CELL_SEPARATOR);
}

function diffInfoboxes(old_infoboxes: Infobox[], new_infoboxes: Infobox[]): InfoboxDiff[] {
    const hash = crypto.createHash('sha256');
    const old_hashes = old_infoboxes.map(hashInfobox).join('\n');
    const new_hashes = new_infoboxes.map(hashInfobox).join('\n');
    const hash_diff = JsDiff.diffLines(old_hashes, new_hashes);

    const infoboxes_diff = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of hash_diff) {
        for (let i = 0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = JSON.parse(JSON.stringify(new_infoboxes[new_counter++]));
                clone.diff = 'add';
            } else if (part.removed) {
                clone = JSON.parse(JSON.stringify(old_infoboxes[old_counter++]));
                clone.diff = 'delete';
            } else {
                clone = JSON.parse(JSON.stringify(old_infoboxes[old_counter++]));
                clone.diff = 'none';
            }
            infoboxes_diff.push(clone);
        }
    }

    return infoboxes_diff;
}

function hashInfobox(infobox: Infobox): string {
    const hash = crypto.createHash('sha256');
    hash.update(infobox.key);
    hash.update(Buffer.from(hashSentences(infobox.values), 'hex'));
    return hash.digest('hex');
}

function hashSentences(sentences: Sentence[]): string {
    const hash = crypto.createHash('sha256');
    for (let sentence of sentences) {
        hash.update(sentence.text);
    }

    return hash.digest('hex');
}
