import { ArticleJson, Metadata, Paragraph, Section, Media, Sentence, ParagraphItem, ListItem, Table, Infobox, Citation } from '../wiki/article-dto';
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
        metadata: diffMetadata(old_wiki.metadata, new_wiki.metadata)
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

function diffPageBody (old_page_body: Section[], new_page_body: Section[]) {
    const old_paragraphs = old_page_body.map(section => section.paragraphs)
        .reduce((acc, item) => acc.concat(item), []); // flatten
    const new_paragraphs = new_page_body.map(section => section.paragraphs)
        .reduce((acc, item) => acc.concat(item), []); // flatten

    const old_items = old_paragraphs.map(para => para.items)
        .reduce((acc, item) => acc.concat(item), []); // flatten
    const new_items = new_paragraphs.map(para => para.items)
        .reduce((acc, item) => acc.concat(item), []); // flatten
    
    return {};

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
