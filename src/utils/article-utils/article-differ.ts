import * as crypto from 'crypto';
import * as JsDiff from 'diff';
import { ArticleJson, Citation, DescList, DiffType, Infobox, ListItem, Media, Metadata, NestedContentItem, Paragraph, Section, Sentence, Table, TableCaption, TableRow, TableSection } from '../../types/article';

const METADATA_EXCLUDE_FIELDS = ['pageviews'];

export function diffArticleJson(old_wiki: ArticleJson, new_wiki: ArticleJson): ArticleJson {
    const diff_json = {
        page_title: diffPageTitle(old_wiki.page_title, new_wiki.page_title),
        main_photo: diffMedia(old_wiki.main_photo, new_wiki.main_photo),
        page_body: diffPageBody(old_wiki.page_body, new_wiki.page_body),
        infoboxes: diffInfoboxes(old_wiki.infoboxes, new_wiki.infoboxes),
        citations: diffCitations(old_wiki.citations, new_wiki.citations),
        metadata: diffMetadata(old_wiki.metadata, new_wiki.metadata),
        media_gallery: diffMedia(old_wiki.media_gallery, new_wiki.media_gallery),
        infobox_html: new_wiki.infobox_html,
        amp_info: new_wiki.amp_info
    };
    diff_json.metadata.push({ key: 'old_hash', value: old_wiki.ipfs_hash });
    diff_json.metadata.push({ key: 'new_hash', value: new_wiki.ipfs_hash });

    const { diffed_entities, total_entities } = calcDiffStats(diff_json);
    const diff_percent = Number((diffed_entities / total_entities).toFixed(2));
    diff_json.metadata.push({ key: 'diff_changes', value: diffed_entities });
    diff_json.metadata.push({ key: 'diff_percent', value: diff_percent });

    return diff_json;
}

// recursively loop through an object and determine total and diffed number of entities
function calcDiffStats(obj) {
    let diffed_entities = 0;
    let total_entities = 0;
    if (!(obj instanceof Object)) {
        // do nothing
    }
    else if (obj.diff) {
        total_entities += 1;
        if (obj.diff != 'none')
            diffed_entities += 1;
    }
    else {
        for (const key in obj) {
            const stats = calcDiffStats(obj[key])
            diffed_entities += stats.diffed_entities;
            total_entities += stats.total_entities;
        }    
    }

    return { diffed_entities, total_entities }
}

function diffMetadata(old_metadata: Metadata[], new_metadata: Metadata[]): Metadata[] {
    if (!old_metadata) old_metadata = [];
    if (!new_metadata) new_metadata = [];

    const old_lines = old_metadata.map(data => `${data.key}:${data.value}`).join('\n');
    const new_lines = new_metadata.map(data => `${data.key}:${data.value}`).join('\n');
    const diff = JsDiff.diffLines(old_lines, new_lines);

    const metadata_diffs = [];
    let old_counter = 0;
    let new_counter = 0;
    for (let part of diff) {
        for (let i = 0; i < part.count; i++) {
            let clone;
            if (part.added) {
                clone = { ...new_metadata[new_counter++] };
                clone.diff = 'add';
            } else if (part.removed) {
                clone = { ...old_metadata[old_counter++] };
                clone.diff = 'delete';
            } else {
                clone = { ...old_metadata[old_counter++] };
                clone.diff = 'none';
            }
            metadata_diffs.push(clone);
        }
    }

    return metadata_diffs;
}

function diffCitations(old_citations: Citation[], new_citations: Citation[]): Citation[] {
    if (!old_citations) old_citations = [];
    if (!new_citations) new_citations = [];

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

function diffPageTitle(old_page_title: Sentence[], new_page_title: Sentence[]) {
    const diffs = [];
    let old_text = "";
    let new_text = "";
    if (old_page_title) old_text = old_page_title[0].text;
    if (new_page_title) new_text = new_page_title[0].text;

    if (old_text && old_text == new_text) {
        diffs.push({
            index: 0, 
            text: old_text, 
            type: 'sentence',
            diff: 'none'
        });
    }
    else if (!old_text) {
        diffs.push({
            index: 0, 
            text: new_text, 
            type: 'sentence',
            diff: 'add'
        });
    }
    else {
        diffs.push({
            index: 0, 
            text: old_text, 
            type: 'sentence',
            diff: 'delete'
        });
        diffs.push({
            index: 0, 
            text: new_text, 
            type: 'sentence',
            diff: 'add'
        });
    }
    return diffs;
}

function diffMedia(old_media: Media[], new_media: Media[]): Media[] {
    if (!old_media) old_media = [];
    if (!new_media) new_media = [];
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
const PARAGRAPH_ITEM_SEPARATOR = '\n';
const IMAGE_SEPARATOR = '\niiiiiiiiiii\n';
const LIST_ITEM_PREFIX = 'lilili^^^ ';
const SENTENCE_PREFIX = 'ssssss^^^ ';
const TABLE_PREFIX = 'tabtab^^^ ';
const TABLE_ROW_SEPARATOR = '\n';
const TABLE_SECTION_SEPARATOR = '\n~~~~~~~~~~~~~\n';
const TABLE_CELL_SEPARATOR = '|';
const IMAGE_URL_CAPTION_SEPARATOR = '|';
const H1_PREFIX = 'h1h1h1^^^ ';
const H2_PREFIX = 'h2h2h2^^^ ';
const H3_PREFIX = 'h3h3h3^^^ ';
const DIFF_ADD_MARKER = ' d+++d';
const DIFF_DELETE_MARKER = ' d---d';
const DIFF_NONE_MARKER = ' d===d';

function diffPageBody(old_page_body: Section[], new_page_body: Section[]): Section[] {
    if (!old_page_body) old_page_body = [];
    if (!new_page_body) new_page_body = [];

    const old_lines = old_page_body.map(sectionToLines).join(SECTION_SEPARATOR);
    const new_lines = new_page_body.map(sectionToLines).join(SECTION_SEPARATOR);
    if (old_lines.length + new_lines.length > 300000)
        throw new Error(`Page body too large to diff`);

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

        diff_text += '\n'; // pad with new lines for safe parsing
        diff_text += part.value
            .split('\n')
            .map((text) => {
                if (full_line_separators.includes(text)) return text;
                else return text + DIFF_MARKER;
            })
            .join('\n');
        diff_text += '\n'; // pad with new lines for safe parsing
    }

    return diffToSections(diff_text);
}

function diffToSections(diff_text): Section[] {
    if (diff_text.trim() == "") return [];
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
            .map(lineToImage)
            .filter(m => m); // exclude bad images

        sections.push({ paragraphs, images });
    }

    return sections;
}

function linesToParagraph(lines: string): Paragraph {
    const prefix = lines.trim().substring(0, 10);
    if (prefix == H1_PREFIX || prefix == H2_PREFIX || prefix == H3_PREFIX) {
        return {
            tag_type: lines.slice(0,2),
            items: [{
                type: 'header',
                tag_type: lines.slice(0,2),
                sentences: [
                    {
                        type: 'sentence',
                        text: lines.substring(10).slice(0, -6),
                        diff: getLineDiffType(lines)
                    }
                ]
            }],
            attrs: {}
        }
    }

    let split_lines;
    if (prefix == TABLE_PREFIX)
        split_lines = [lines];
    else
        split_lines = lines.split(PARAGRAPH_ITEM_SEPARATOR);

    const items = split_lines
        .filter((lines) => lines.trim()) // no blank items
        .map((lines, index) => {
            const prefix = lines.trim().substring(0, 10);
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
            else if (prefix == TABLE_PREFIX) return linesToTable(lines);
            else throw new Error(`Unrecognized ParagraphItem prefix: ${prefix}`);
        });

    return { index: 0, items, tag_type: 'p', attrs: {} };
}

function linesToTable(lines: string): Table {
    lines = lines.substring(10);
    const table_sections = lines.split(TABLE_SECTION_SEPARATOR);
    const thead = linesToTableSection(table_sections[0]);
    const tbody = linesToTableSection(table_sections[1]);
    const tfoot = linesToTableSection(table_sections[2]);
    const caption: TableCaption = {attrs: {}, sentences: []} // table_sections[3];

    return { type: 'body-table', attrs: {}, thead, tbody, tfoot, caption };
}

function linesToTableSection(lines: string): TableSection {
    const rows = lines.split(TABLE_ROW_SEPARATOR).map(lineToTableRow);

    return { rows, attrs: {} };
}

function lineToTableRow(line: string): TableRow {
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

    return { index: 0, attrs: {}, cells: [], tag_type: 'tr', tag_class: 'block', diff: difftype };
    // return { index: 0, attrs: {}, cells, diff: difftype };
}

function lineToImage(line: string): Media {
    if (!line.includes(IMAGE_URL_CAPTION_SEPARATOR))
        return null;
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
    // Mark header paragraphs
    if (paragraph.tag_type.match(/h[1-3]/)) {
        const prefix = paragraph.tag_type.repeat(3) + "^^^ ";
        const text = (paragraph.items[0] as any).text;
        return `${prefix} ${text}`;
    }
    const lines = paragraph.items
        .map((item) => {
            if (item.type == 'sentence') {
                const sentence = item as Sentence;
                return sentenceToLines(sentence);
            } else if (item.type == 'list-item' || item.type == 'list_item') {
                const list_item = item as ListItem;
                return LIST_ITEM_PREFIX + list_item.sentences.map((s) => s.text.trim().replace('\n', ' ')).join(' ');
            } else if (item.type == 'wikitable' || item.type == 'body-table') {
                const table = item as Table;
                return tableToLines(table);
            } else if (item.type == 'dl') {
                const dl = item as DescList;
                return dlToLines(dl);
            } else throw new Error(`Unsupported ParagraphItem type ${item.type}`);
        })
        .join(PARAGRAPH_ITEM_SEPARATOR);

    return lines;
}

function sentenceToLines(sentence: Sentence) {
    let text = sentence.text;

    // remove newlines
    text = text.replace(/\n/g, ' ');

    // replace all spaces within [[special|tags]] 
    text = text.replace(
        /\[\[(LINK|CITE|INLINE_IMAGE)[^\]]*\]\]/g,
        (match) => match.replace(/\s/g, '~~~')
    );

    // replace all spaces within **special tags**
    text = text.replace(
        /\*\*?[^\*]*\*?\*/g,
        (match) => match.replace(/\s/g, '~~~')
    );

    // split into words
    const blocks = text.split(' ');

    // re-include spaces in [[special]] **tags**
    for (let i in blocks) {
        blocks[i] = blocks[i].replace(
            /\[\[(LINK|CITE|INLINE_IMAGE)[^\]]*\]\]/g,
            (match) => match.replace(/~~~/g, ' ')
        );
        blocks[i] = blocks[i].replace(
            /\*\*?[^\*]*\*?\*/g,
            (match) => match.replace(/~~~/g, ' ')
        );
    }

    // Split sentences into words
    return blocks.map(line => SENTENCE_PREFIX + line)
        .join(PARAGRAPH_ITEM_SEPARATOR)
}

function dlToLines(dl: DescList) {
    let lines = "";
    for (let item of dl.items) {
        lines += dlItemToLines(item);
    }
    return lines;
}

function dlItemToLines (item) {
    if (item.content.length == 0) return "";
    if (item.type == 'text') 
        return item.content
            .map(s => SENTENCE_PREFIX + s.text)
            .join(PARAGRAPH_ITEM_SEPARATOR);
    else
        return item.content.map(dlItemToLines).join(PARAGRAPH_ITEM_SEPARATOR);
}

function tableToLines(table: Table): string {
    const thead_lines = table.thead.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const tbody_lines = table.tbody.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const tfoot_lines = table.tfoot.rows.map(tableRowToLine).join(TABLE_ROW_SEPARATOR);
    const caption_line = table.caption;

    return TABLE_PREFIX + thead_lines + TABLE_SECTION_SEPARATOR + tbody_lines + TABLE_SECTION_SEPARATOR + tfoot_lines;
    TABLE_SECTION_SEPARATOR + caption_line;
}

function tableRowContentToText(contents: NestedContentItem[], concattedText: string = ""): string {
    contents.forEach((item, index) => {
        switch (item.type){
            case 'text':
                concattedText = concattedText.concat(...item.content.map((sent) => sent.text).join())
                break;
            case 'tag':
                if (item.content.length) {
                    concattedText = tableRowContentToText(item.content, "");
                }
                break;
        }
    })
    return concattedText;
}

function tableRowToLine(row: TableRow): string {
    return row.cells.map((cell) => tableRowContentToText(cell.content, "")).join(TABLE_CELL_SEPARATOR);
}

function diffInfoboxes(old_infoboxes: Infobox[], new_infoboxes: Infobox[]): Infobox[] {
    const hash = crypto.createHash('sha256');

    if (!old_infoboxes) old_infoboxes = [];
    if (!new_infoboxes) new_infoboxes = [];
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

    // Looks good for now. Leaving this here until confirmed
    //console.warn("KEDAR, please update the next line to reflect the Infobox and InfoboxValue DTO change. ")

    // NEW, and possibly wrong
    let collectedSentences = infobox.values.reduce(function(pV, cV, cI){
        pV.push(...cV.sentences);
        return pV;
    }, []);
    hash.update(Buffer.from(hashSentences(collectedSentences), 'hex'));

    return hash.digest('hex');
}

function hashSentences(sentences: Sentence[]): string {
    const hash = crypto.createHash('sha256');
    for (let sentence of sentences) {
        hash.update(sentence.text);
    }

    return hash.digest('hex');
}
