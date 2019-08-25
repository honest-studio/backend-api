import { ArticleJson, Sentence, Citation, Media, Infobox, InfoboxValue, Section } from '../../types/article';
import { MergeResult, MergeProposalParsePack } from '../../types/api';
import { LanguagePack, SeeAlso, WikiExtraInfo } from '../../types/article-helpers';
import { convertMediaToCitation, getFirstAvailableCitationIndex, getFirstAvailableInfoboxValueIndex, compareURLs, addAMPInfo } from '../../utils/article-utils';
var colors = require('colors');

export interface InfoboxKeyComparePack {
    status: 'add-new' | 'merge',
    key: string,
    ibox: Infobox,
    insertIndex: number
}

export interface InfoboxValueComparePack {
    status: 'add-new' | 'merge',
    key: string,
    ibox: Infobox,
    insertIndex: number
}

export interface CountBeforePack {
    page_body: number,
    citations: number
}

export async function mergeWikis(sourceWiki: ArticleJson, targetWiki: ArticleJson): Promise<MergeResult> {
    let resultantWiki = targetWiki;
    let workingSourceWiki = sourceWiki;
    let availableCitationID = getFirstAvailableCitationIndex(resultantWiki.citations);

    let theCountBeforePack: CountBeforePack = {
        page_body: targetWiki.page_body.length,
        citations: targetWiki.citations.length
    }
    // ========================================MAIN PHOTO========================================
    // If the target does not have a photo, or the default one, and the source does, replace it
    // If they both have photos, move the source's into the media gallery (converting it first from Media to Citation)
    let sourceWikiPhoto = (workingSourceWiki.main_photo && workingSourceWiki.main_photo[0] && workingSourceWiki.main_photo[0].url) || 'no-image-slide';
    let targetWikiPhoto = (targetWiki.main_photo && targetWiki.main_photo[0] && targetWiki.main_photo[0].url) || 'no-image-slide';

    if (sourceWikiPhoto.indexOf('no-image-slide') == -1 && targetWikiPhoto.indexOf('no-image-slide') == -1){
        // Both have good photos
        // Move the source wiki photo to the gallery of the target
        resultantWiki.citations.push(convertMediaToCitation(workingSourceWiki.main_photo[0], availableCitationID, 'normal'));
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
    let sourceWikiInfoboxes = workingSourceWiki.infoboxes ? workingSourceWiki.infoboxes : [];
    let targetWikiInfoboxes = targetWiki.infoboxes ? targetWiki.infoboxes : [];
    if (sourceWikiInfoboxes.length && targetWikiInfoboxes.length){
        // Both have infoboxes
        // Merge the source boxes into the target
        let resultPacks: InfoboxKeyComparePack[] = [];
        sourceWikiInfoboxes.forEach(srcIbox => {
            let resultPack: InfoboxKeyComparePack = {
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
                    // Loop through the values and merge, checking for duplicates along the way
                    let insertionPointIbox = resultantWiki.infoboxes[resPack.insertIndex];
                    let newValues: InfoboxValue[] = [];

                    // Collect all the values already present in the target.
                    let allTargetValueSentences = insertionPointIbox.values.map(tgtVal => {
                        return tgtVal.sentences.join('');
                    })

                    // Compare the source values with the target values
                    let availableIboxValueIdx = getFirstAvailableInfoboxValueIndex(insertionPointIbox.values);
                    resPack.ibox.values.forEach(srcVal => {
                        let joinedSrcSentences = srcVal.sentences.join('');
                        if (allTargetValueSentences.includes(joinedSrcSentences)) { /* Do nothing if there is a dupe */ }
                        else {
                            newValues.push({
                                ...srcVal,
                                index: availableIboxValueIdx
                            })
                            availableIboxValueIdx = availableIboxValueIdx + 1;
                        }
                    })
                    insertionPointIbox.values.push(...newValues);
                    resultantWiki.infoboxes[resPack.insertIndex] = insertionPointIbox;
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


    // ============================================CITATIONS============================================
    // Merge citations. Be aware of duplicate URLs
    let newCitations: Citation[] = [];
    let availableCtnID = getFirstAvailableCitationIndex(resultantWiki.citations);
    workingSourceWiki.citations.forEach(srcCtn => {
        // If the source citation URL is not the same and the target URL, add the source citation
        if(resultantWiki.citations.every(tgtCtn => !compareURLs(srcCtn.url, tgtCtn.url))){
            newCitations.push({
                ...srcCtn,
                citation_id: availableCtnID
            });
            availableCtnID = availableCtnID + 1;
        }
    })
    resultantWiki.citations.push(...newCitations);

    // Make sure the citation merge succeeded
    if (resultantWiki.citations.length <= theCountBeforePack.citations) throw new Error('Something went wrong merging the two citations');

    // ============================================PAGE BODY============================================
    // Add the source's Sections[] to the end of the target's
    const sourceLang = sourceWiki.metadata.filter(w => w.key == 'page_lang')[0].value;
    const sourceSlug = sourceWiki.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;
    const mergeContentNotice: Section = {  
        "paragraphs":[  
           {  
              "index":0,
              "tag_type":"h2",
              "attrs":{  
                 "id":"merged-content-warning"
              },
              "items":[  
                 {  
                    "type":"sentence",
                    "index":0,
                    "text":`====THE CONTENT BELOW WAS MERGED IN FROM [/lang_${sourceLang}/${sourceSlug}]====`
                 }
              ]
           },
        ],
        "images":[]
    }
    resultantWiki.page_body.push(mergeContentNotice);

    resultantWiki.page_body.push(...workingSourceWiki.page_body);

    // Make sure the page_body merge succeeded
    if (resultantWiki.page_body.length <= theCountBeforePack.page_body) throw new Error('Something went wrong merging the two body paragraphs');

    // ============================================METADATA=============================================
    // Adjust the metadata
    resultantWiki.metadata = resultantWiki.metadata.map(meta => {
        switch(meta.key) {
            case 'lastmod_timestamp':
                return {...meta, value: new Date()};
            case 'page_type': {
                // If the target page type is Thing or null, see if the source page has something more specific
                if (meta.value == null || meta.value == 'Thing'){
                    let srcWikiPageType = sourceWiki.metadata.find(srcMeta => srcMeta.key == 'page_type').value;
                    if (srcWikiPageType && srcWikiPageType != 'Thing') return {...meta, value: srcWikiPageType};
                    else return meta;
                }
                else return meta;
            }
            case 'sub_page_type': {
                // If the target sub_page_type is null, see if the source page has something more specific
                if (meta.value == null){
                    let srcWikiPageType = sourceWiki.metadata.find(srcMeta => srcMeta.key == 'sub_page_type').value;
                    if (srcWikiPageType) return {...meta, value: srcWikiPageType};
                    else return meta;
                }
                else return meta;
            }
                
            default:
                return meta
        }
    })

    // ============================================AMP INFO=============================================
    resultantWiki = addAMPInfo(resultantWiki);

    return {
        merged_json: resultantWiki,
        target_original_ipfs_hash: targetWiki.ipfs_hash
    };

    
}

// Parse a merge proposal
export function parseMergeInfoFromProposal(merge_proposal: any): MergeProposalParsePack {
    const theData = merge_proposal.trace.act.data;
    const theComment = theData.comment;
    const theLangCode = theData.lang_code;

    let theCommentSplit = theComment.split("|");

    let parsePack: MergeProposalParsePack = {
        source: {
            slug: theCommentSplit[1].split("/")[1],
            lang: theLangCode,
            ipfs_hash: theCommentSplit[2].split('-->')[0]
        },
        target: {
            slug: theData.slug,
            lang: theLangCode,
            ipfs_hash: theCommentSplit[2].split('-->')[1]
        },
        final_hash: theData.ipfs_hash
    }

    return parsePack;
}