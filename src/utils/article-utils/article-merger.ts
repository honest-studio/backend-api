import { ArticleJson, Sentence, Citation, Media, Infobox } from '../../types/article';
import { LanguagePack, SeeAlso, WikiExtraInfo } from '../../types/article-helpers';
import { convertMediaToCitation, getFirstAvailableCitationIndex } from '../../utils/article-utils';
var colors = require('colors');

export interface InfoboxComparePack {
    status: 'add-new' | 'merge',
    key: string,
    ibox: Infobox,
    insertIndex: number
}

export async function mergeWikis(sourceWiki: ArticleJson, targetWiki: ArticleJson): Promise<ArticleJson> {
    let resultantWiki = targetWiki;
    let workingSourceWiki = sourceWiki;
    let newCitationsToAdd = [];
    let availableCitationID = getFirstAvailableCitationIndex(targetWiki.citations);

    // ========================================MAIN PHOTO========================================
    // If the target does not have a photo, or the default one, and the source does, replace it
    // If they both have photos, move the source's into the media gallery (converting it first from Media to Citation)
    let sourceWikiPhoto = (workingSourceWiki.main_photo && workingSourceWiki.main_photo[0] && workingSourceWiki.main_photo[0].url) || 'no-image-slide';
    let targetWikiPhoto = (targetWiki.main_photo && targetWiki.main_photo[0] && workingSourceWiki.main_photo[0].url) || 'no-image-slide';
    if (sourceWikiPhoto.indexOf('no-image-slide') == -1 && targetWikiPhoto.indexOf('no-image-slide') == -1){
        // Both have good photos
        // Move the source wiki photo to the gallery of the target
        newCitationsToAdd.push(convertMediaToCitation(workingSourceWiki.main_photo[0], availableCitationID));
        availableCitationID = availableCitationID + 1;

    } else if (sourceWikiPhoto.indexOf('no-image-slide') == -1 && targetWikiPhoto.indexOf('no-image-slide') >= 0){
        // The source has a good photo and the target has the default
        // Set the source wiki photo as the target's main photo
        resultantWiki.main_photo = [workingSourceWiki.main_photo[0]];

    } else if (sourceWikiPhoto.indexOf('no-image-slide') >= 0 && targetWikiPhoto.indexOf('no-image-slide') == -1){
        // The target has a good photo and the source has the default
        // Do nothing

    } else {
        // Both wikis have the default photo
        // Check the media gallery of both and 'promote' an image to be the main one
        let sourcePhotoCtns: Citation[] = [], targetPhotoCtns: Citation[] = [], comboPhotoCtns: Citation[] = [];

        // Collect the photos from the source
        sourcePhotoCtns = workingSourceWiki.citations.filter(ctn => {
            if (!ctn.media_props && (ctn.category == 'PICTURE' || ctn.category == 'GIF')) return ctn;
        })

        // Collect the photos from the target
        targetPhotoCtns = targetWiki.citations.filter(ctn => {
            if (!ctn.media_props && (ctn.category == 'PICTURE' || ctn.category == 'GIF')) return ctn;
        })

        // Combine all of the photos
        comboPhotoCtns = comboPhotoCtns.concat(targetPhotoCtns, sourcePhotoCtns);

        // Promote a media citation to the main photo
        if(comboPhotoCtns.length){
            let promotedCitation = comboPhotoCtns[0];
            resultantWiki.main_photo = [{    
                type: 'main_photo',
                url: promotedCitation.url,
                caption: promotedCitation.description,
                thumb: promotedCitation.thumb,
                timestamp: promotedCitation.timestamp,
                attribution_url: promotedCitation.attribution,
                mime: promotedCitation.mime,
                alt: '',
                height: 1201,
                width: 1201,
                category: promotedCitation.category,
                diff: promotedCitation.diff ? promotedCitation.diff : null,
                media_props: {
                    type: 'main_photo', // section_image, main_photo, inline_image, normal
                    webp_original: promotedCitation.media_props && promotedCitation.media_props.webp_original 
                        ? promotedCitation.media_props.webp_original 
                        : 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-original.webp',
                    webp_medium: promotedCitation.media_props && promotedCitation.media_props.webp_medium 
                        ? promotedCitation.media_props.webp_medium 
                        : 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-medium.webp',
                    webp_thumb: promotedCitation.media_props && promotedCitation.media_props.webp_thumb 
                        ? promotedCitation.media_props.webp_thumb 
                        : 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-thumb.webp'
                },
            }];

            // Remove the media citation from the citations
            // Do it for both since comboPhotoCtns is not tracking where promotedCitation came from
            workingSourceWiki.citations = workingSourceWiki.citations.filter(ctn => ctn.url != promotedCitation.url);
            resultantWiki.citations = resultantWiki.citations.filter(ctn => ctn.url != promotedCitation.url);

            // Update the next available citation
            availableCitationID = getFirstAvailableCitationIndex(targetWiki.citations);
        }
    
    }

    // ========================================WIKIPEDIA INFOBOX========================================
    // Keep the target's Wikipedia infobox if it exists. Otherwise, take it from the source
    if (workingSourceWiki.infobox_html && resultantWiki.infobox_html){ /* Both have good Wikipedia infoboxes. Do nothing. */ } 
    else if (workingSourceWiki.infobox_html && !resultantWiki.infobox_html){
        // The source has a Wikipedia infoboxe and the target does not
        // Set the target's as the source's
        resultantWiki.infobox_html = workingSourceWiki.infobox_html;
    } 
    else if (!workingSourceWiki.infobox_html && resultantWiki.infobox_html){ /* Do nothing */ }
    else { /* Do nothing */ }

    // ============================================INFOBOXES============================================
    // Merge infoboxes if present. Be aware of dupes
    let newInfoboxesToAdd = [], addedKeys: string[] = [];
    let sourceWikiInfoboxes = workingSourceWiki.infoboxes ? workingSourceWiki.infoboxes : [];
    let targetWikiInfoboxes = resultantWiki.infoboxes ? resultantWiki.infoboxes : [];
    if (sourceWikiInfoboxes.length && targetWikiInfoboxes.length){
        // Both have infoboxes
        // Merge the source boxes into the target
        let resultPacks: InfoboxComparePack[] = [];
        sourceWikiInfoboxes.forEach((srcIbox) => {
            let resultPack: InfoboxComparePack = {
                status: 'add-new',
                key: srcIbox.key,
                ibox: srcIbox,
                insertIndex: null
            } 

            // Look for merges
            targetWikiInfoboxes.forEach((tgtIbox, tgtIdx) => {
                if (srcIbox.key == tgtIbox.key){
                    resultPack.status = 'merge';
                    resultPack.insertIndex = tgtIdx;
                }
            })

            // Add the results to the result pack for future processing
            resultPacks.push(resultPack);
        })

        // Handle the new infoboxes and the merges
        resultPacks.forEach(resPack => {
            switch(resPack.status){
                case 'add-new':
                    resultantWiki.infoboxes.push(resPack.ibox);
                    break;
                case 'merge':
                    // Loop through the values and check for duplicates
                    break;
            }

        })

    } else if (sourceWikiInfoboxes.length && !targetWikiInfoboxes.length){
        // The source has infoboxes and the target does not
        // Set the target's infoboxes as the source's
        resultantWiki.infoboxes = sourceWikiInfoboxes;

    } else if (!sourceWikiInfoboxes.length && targetWikiInfoboxes.length){
        // The target has a infoboxes and the source does not
        // Do nothing

    } else {
        // Neither have infoboxes
        // Do nothing
    }


    return null;
}