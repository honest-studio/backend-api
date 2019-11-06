import { ArticleJson } from '../../types/article';
import { WikiExtraInfo } from '../../types/article-helpers';
import { AmpRenderPartial } from './amp-render-partial';
const fs = require('fs');
const crypto = require('crypto');

export const renderAMP = (inputJSON: ArticleJson, wikiExtras: WikiExtraInfo): string => {
    // TODO: REMEMBER TO PRE-SELECT STRINGS LIKE inputJSON.page_title AND USE VARIBLES BELOW, FOR SPEED REASONS
    const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
    let arp = new AmpRenderPartial(inputJSON, wikiExtras);
    let BLURB_SNIPPET_PLAINTEXT = '',
        OVERRIDE_MAIN_THUMB = null;
    let CURRENT_IPFS_HASH = '';

    // Metadata values
    const last_modified = inputJSON.metadata.find(w => w.key == 'last_modified') ? inputJSON.metadata.find(w => w.key == 'last_modified').value : '';
    const creation_timestamp = inputJSON.metadata.find(w => w.key == 'creation_timestamp') ? inputJSON.metadata.find(w => w.key == 'creation_timestamp').value : "";
    const page_lang = inputJSON.metadata.find(w => w.key == 'page_lang').value;
    const url_slug = inputJSON.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;

    const theHTML = `
    <!DOCTYPE html>
    <html amp lang="${page_lang}">
        <head>
            ${arp.renderHead(BLURB_SNIPPET_PLAINTEXT, RANDOMSTRING)}
        </head>
        <body>
            ${arp.renderHeaderBar()}
            ${arp.renderNavBar()}
            ${arp.renderWelcomeBanner()}
            <amp-sidebar id='sidebar' layout="nodisplay" side="left">
                <ul class="hdr-clct">
                    ${arp.renderTableOfContents()}
                </ul>
            </amp-sidebar>
            <main id="mainEntityId">
                ${arp.renderMainPhoto(OVERRIDE_MAIN_THUMB, RANDOMSTRING)}
                ${arp.renderNameContainer()}
                ${arp.renderFirstParagraph()}
                ${arp.renderInfoboxes()}
                ${arp.renderMediaGallery()}
                ${arp.renderCategories()}
                ${arp.renderPageBody()}
                ${arp.renderSeeAlso()}
                ${arp.renderCitations()}
                <div class="page-times">
                    <div>Created: <span id="page_create_time">${creation_timestamp}</span></div>
                    <div>Last Modified: <span id="page_last_modified_time">${
                        last_modified
                    }</span></div>
                    <div>IPFS: <span id="page_last_modified_time">${inputJSON.ipfs_hash}</span></div>
                </div>
                ${arp.renderSchemaHTML()}
            </main>
            <footer class="ftr everi_footer">
                ${arp.renderFooter()}
            </footer>
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
