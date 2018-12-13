/**
 * Basic descriptor for title and page ID
 */
export interface IArticleOptions {
    title: string;
    pageID: number;
}

/**
 * Link to a page
 */
export interface IPageLink {
    page: string;
    text: string;
    type?: string;
    site?: string;
}

export interface Inline {
    data: ISentence;
}

export interface ITemplate {
    /**
     * Name (ID) of template to expand
     */
    template: string;

    /*
    // Sampling of some common template props that have been observed:
    name?: string;
    data: any;
    type: string;
    page: string;
    inline?: Inline;
    author?: string;
    year?: string;
    location?: string;
    pp?: string;
    p?: string;
    redirect?: string;
    links?: any;
    loc?: string;
    id?: string;
    */
}

/**
 * Extends {ITemplate} with a dictionary of impossibly-idiosyncratic props
 */
export type ITemplateWithProps = ITemplate & { [idx: string]: any };

export interface ITextFormat {
    bold: string[];
    italic: string[];
}

export interface ISentence {
    text: string;
    links: IPageLink[];
    fmt?: ITextFormat;
}
export interface IImage {
    file: string;
    text: string;
}
export interface ISectionData {
    title: string;
    depth: number;
    /**
     * Templates are endlessly flexible, and apart from having the 'template' key,
     * are essentially key/value dictionaries until their types are resolved
     */
    templates: ITemplateWithProps[];
    sentences: ISentence[];
    images?: IImage[];
    tables?: any[][];
    lists?: any[][];
}

export interface ISection {
    data: ISectionData;
    depth: number;
}

export interface IInterwiki {}

export interface IArticleData {
    type: string;
    /**
     * Article sections and infoboxes
     */
    sections: ISection[];
    interwiki: IInterwiki;
    categories: string[];
    coordinates: any[];
    citations: any[];
}

/**
 * Root for article JSON as parsed from `wtf_wikipedia`
 */
export interface IArticleJson {
    /**
     * Article title + ID
     */
    options: IArticleOptions;
    /**
     * Article data (as sections)
     */
    data: IArticleData;
}
