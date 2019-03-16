import { ArticleJson, Paragraph, Section, Media, Sentence, ParagraphItem, ListItem, Table, Infobox } from '../wiki/article-dto';
import * as JsDiff from 'diff';
import * as crypto from 'crypto';

export async function ArticleJsonDiff (old_wiki: ArticleJson, new_wiki: ArticleJson) {
    const diff_json = {
        page_title: diffPageTitle(old_wiki.page_title, new_wiki.page_title),
        main_photo: diffMedia(old_wiki.main_photo, new_wiki.main_photo),
        page_body: diffPageBody(old_wiki.page_body, new_wiki.page_body),
        infoboxes: diffInfoboxes(old_wiki.infoboxes, new_wiki.infoboxes)
    }
    console.log(diff_json);
    return diff_json;
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

function diffMedia (old_media: Media, new_media: Media) {
    const diffs = [];
    if (old_media.url == new_media.url &&
        sentencesAreEqual(old_media.caption, new_media.caption)) {
        diffs.push(old_media);
        diffs[0].diff = 'none';
    }
    else {
        diffs.push(old_media);
        diffs[0].diff = 'delete';
        diffs.push(new_media);
        diffs[1].diff = 'add';
    }
    return diffs;
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
        console.log(part);
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

function sentencesAreEqual(group1: Sentence[], group2: Sentence[]) {
    return hashSentences(group1) == hashSentences(group2);
}
