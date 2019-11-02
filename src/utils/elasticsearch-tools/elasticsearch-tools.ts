import { ElasticsearchService } from '@nestjs/elasticsearch';

export const ELASTICSEARCH_INDEX_NAME = 'articletable_main5';
export const ELASTICSEARCH_DOCUMENT_TYPE = 'ep_template_v1';


export type ElasticSearchAction = "PAGE_UPDATED_OR_CREATED" | "PAGE_REMOVED" | "MERGE_REDIRECT";

export const updateElasticsearch = async (
    artID: number, 
    articleTitle: string, 
    articleLang: string,
    action: ElasticSearchAction,
    elSearchSvc: ElasticsearchService,
    canonicalID?: number,
    pageviews?: number
): Promise<any> => {
    let jsonRequest = {
        "id": artID,
        "page_title": articleTitle,
        "canonical_id": canonicalID ? canonicalID : artID,    
        "lang": articleLang
    }

    if (pageviews !== undefined) jsonRequest['pageviews'] = pageviews;

    let paramPack = { 
        index: ELASTICSEARCH_INDEX_NAME, 
        type: ELASTICSEARCH_DOCUMENT_TYPE, 
        id: artID,
        body: jsonRequest
    }
    
    switch (action) {
        case 'PAGE_UPDATED_OR_CREATED':
            return elSearchSvc.index(paramPack as any).toPromise();
        case 'PAGE_REMOVED':
            return elSearchSvc.delete(paramPack as any).toPromise();
        case 'MERGE_REDIRECT':{
            if (paramPack.body.canonical_id != paramPack.body.id) return elSearchSvc.index(paramPack as any).toPromise();
            else {
                console.error("ELASTICSEARCH MERGE_REDIRECT CANNOT HAVE CANONICAL_ID = ID!")
                return null;
            }
        }
            
    }
}
