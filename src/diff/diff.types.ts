import { Citation, Media, Infobox, Sentence, ListItem, ParagraphItem, Table, Paragraph, TableRow, TableSection } from '../wiki/article-dto';

export type DiffType = 'add | delete | none';

export interface SectionDiff {
    paragraphs: ParagraphDiff[];
    images: MediaDiff[];
}

export interface ParagraphDiff extends Paragraph {
    items: ParagraphItemDiff[];
}

export type ParagraphItemDiff = (SentenceDiff | ListItemDiff | TableDiff)

export interface SentenceDiff extends Sentence {
    diff: DiffType;
}

export interface ListItemDiff extends ListItem {
    diff: DiffType;
}

export interface TableDiff extends Table {
    thead?: TableSectionDiff;
    tbody: TableSectionDiff;
    tfoot: TableSectionDiff;
}

export interface TableSectionDiff extends TableSection {
    rows: TableRowDiff[];
}

export interface TableRowDiff extends TableRow {
    diff: DiffType;
}

export interface CitationDiff extends Citation {
    diff: DiffType;
}

export interface InfoboxDiff extends Infobox {
    diff: DiffType;
}

export interface MediaDiff extends Media {
    diff: DiffType;
}

export interface MetadataDiff {
    key: string;
    value: string | Date;
    diff: DiffType;
}

export interface ArticleJsonDiff {
    page_title: any;
    main_photo: MediaDiff[];
    page_body: SectionDiff[];
    metadata: MetadataDiff[];
    infoboxes: InfoboxDiff[];
    citations: CitationDiff[];
    media_gallery: MediaDiff[];
    infobox_html: string;
    diff_metadata: {
        old_hash: string;
        new_hash: string;
        proposal_id?: number;
        diff_percent?: number;
    };
}
