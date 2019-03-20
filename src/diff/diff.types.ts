import {
    Citation,
    Media
} from '../wiki/article-dto';

export type DiffType = 'add | delete | none';

export interface CitationDiff extends Citation {
    diff: DiffType;
}

export interface MediaDiff extends Media {
    diff: DiffType;
}

export interface MetadataDiff {
    key: string;
    value: string | Date;
    diff: DiffType
}
