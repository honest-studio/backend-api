import { ArticleJson } from './article-dto';
import { AmpRenderPartial } from './amp-render-partial';
import { LanguagePack } from '../../wiki/wiki.service';
const fs = require('fs');
const crypto = require('crypto');

export const renderAMP = (inputJSON: ArticleJson): string => {
    // TODO: REMEMBER TO PRE-SELECT STRINGS LIKE inputJSON.page_title AND USE VARIBLES BELOW, FOR SPEED REASONS
    const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
    let arp = new AmpRenderPartial(inputJSON);
    let BLURB_SNIPPET_PLAINTEXT = '',
        OVERRIDE_MAIN_THUMB = null;
    let CURRENT_IPFS_HASH = '';
    const theHTML = `
    <!DOCTYPE html>
    <html amp lang="${inputJSON.metadata.page_lang}">
        <head>
            ${arp.renderHead(BLURB_SNIPPET_PLAINTEXT, RANDOMSTRING)}
        </head>
        <body>
            ${arp.renderNavBar()}
            <main id="mainEntityId" itemscope itemtype="http://schema.org/Article" itemid="https://everipedia.org/wiki/lang_${
                inputJSON.metadata.page_lang
            }/${inputJSON.metadata.url_slug}" class="schema">
                ${arp.renderMainPhoto(OVERRIDE_MAIN_THUMB, RANDOMSTRING)}
                ${arp.renderNameContainer()}
                ${arp.renderFirstParagraph()}
                ${arp.renderInfoboxes()}
                ${arp.renderPageBody()}
                ${arp.renderMediaGallery()}
                ${arp.renderCitations()}
                ${arp.renderSeeAlso()}
                <div class="page-times">
                    <div>Created: <span id="page_create_time">${inputJSON.metadata.creation_timestamp}</span></div>
                    <div>Last Modified: <span id="page_last_modified_time">${
                        inputJSON.metadata.last_modified
                    }</span></div>
                    <div>IPFS: <span id="page_last_modified_time">${inputJSON.metadata.ipfs_hash}</span></div>
                </div>
            </main>
            <footer class="footer everi_footer">
                ${arp.renderFooter()}
            </footer>
            <amp-sidebar id='sidebar' layout="nodisplay" side="left">
                <ul class="heading-collection">
                    ${arp.renderTableOfContents()}
                </ul>
            </amp-sidebar>
            <amp-lightbox id="usermenu-lightbox" layout="nodisplay">
                ${arp.renderUserMenu()}
            </amp-lightbox> 
            <amp-lightbox id="search-lightbox" layout="nodisplay">
                ${arp.renderSearchLightbox()}
            </amp-lightbox>
            <amp-lightbox id="share-lightbox" layout="nodisplay">
                ${arp.renderShareLightbox()}
            </amp-lightbox>
            <amp-lightbox id="language-lightbox" layout="nodisplay">
                ${arp.renderLanguageLightboxes()}
            </amp-lightbox>
            ${arp.renderLightboxes()}
            ${arp.renderAnalyticsBlock()}
        </body>
    </html>
   `;

    return theHTML;
};
