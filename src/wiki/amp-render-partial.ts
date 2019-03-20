import { ArticleJson } from './article-dto';
import { Citation, Infobox, Media, Section } from './article-dto';

export class AmpRenderPartial {
    public articleJSON: ArticleJson;
    constructor(inputJSON) {
        this.articleJSON = inputJSON;
    }

    renderPageBody = (): string => {
        let sections: Section[] = this.articleJSON.page_body
        return `PAGE BODY`;
    }

    renderMainPhoto = (): string => {
        let mainphoto: Media = this.articleJSON.main_photo
        return `MAIN PHOTO`;
    }

    renderInfoboxes = (): string => {
        let infoboxes: Infobox[] = this.articleJSON.infoboxes
        return `INFOBOXES`;
    }

    renderMediaGallery = (): string => {
        let media: Media[] = this.articleJSON.media_gallery
        return `MEDIA GALLERY`;
    }

    renderCitations = (): string => {
        let citations: Citation[] = this.articleJSON.citations
        return `CITATIONS`; 
    }    

    renderSchemaJSON = (): string => {
        // Perhaps you should do this while you are looping through the other functions
        return `SCHEMA JSON`;
    }    
}
