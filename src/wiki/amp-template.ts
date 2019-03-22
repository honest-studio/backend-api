import { ArticleJson } from './article-dto';
import { styleNugget } from './amp-style'
import { AmpRenderPartial } from './amp-render-partial'

export const renderAMP = (inputJSON: ArticleJson): string => {
    // TODO: REMEMBER TO PRE-SELECT STRINGS LIKE inputJSON.page_title AND USE VARIBLES BELOW, FOR SPEED REASONS 
    const RANDOMSTRING = Math.random().toString(36).substring(7);
    let ampPartialRenderer = new AmpRenderPartial(inputJSON);
    let AMP_PHOTO_HEIGHT = '', AMP_PHOTO_WIDTH = '', BLURB_SNIPPET_PLAINTEXT = '', OVERRIDE_MAIN_THUMB = null;
    let CURRENT_IPFS_HASH = '';
    const theHTML = `
    <!DOCTYPE html>
    <html amp lang="${inputJSON.metadata.page_lang}">
        <head>
            ${ampPartialRenderer.renderHead(BLURB_SNIPPET_PLAINTEXT, RANDOMSTRING)}
            ${styleNugget}
        </head>
        <body>
            ${ampPartialRenderer.renderNavBar()}
            <main id="mainEntityId" itemscope itemtype="http://schema.org/Article" itemid="https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}" class="schema">
                ${ampPartialRenderer.renderMainMeta(AMP_PHOTO_HEIGHT, AMP_PHOTO_WIDTH, OVERRIDE_MAIN_THUMB, RANDOMSTRING)}
                ${ampPartialRenderer.renderMainPhoto(AMP_PHOTO_HEIGHT, AMP_PHOTO_WIDTH, OVERRIDE_MAIN_THUMB, RANDOMSTRING)}
                ${ampPartialRenderer.renderNameContainer()}
                ${ampPartialRenderer.renderPageBody()}
                ${ampPartialRenderer.renderCitations()}
                ${ampPartialRenderer.renderSeeAlso()}
                <div class="page-times">
                    <div>Created: <span id="page_create_time">${inputJSON.metadata.creation_timestamp}</span></div>
                    <div>Last Modified: <span id="page_last_modified_time">${inputJSON.metadata.last_modified}</span></div>
                    <div>IPFS: <span id="page_last_modified_time">${CURRENT_IPFS_HASH}</span></div>
                </div>
            </main>
            <footer class="footer everi_footer">
                ${ampPartialRenderer.renderFooter()}
            </footer>
            <amp-sidebar id='sidebar' layout="nodisplay" side="left">
                ${ampPartialRenderer.renderTableOfContents()}
            </amp-sidebar>
            <amp-lightbox id="guestmenu-lightbox" layout="nodisplay">
                ${ampPartialRenderer.renderUserMenu()}
            </amp-lightbox> 
            <amp-lightbox id="search-lightbox" layout="nodisplay">
                ${ampPartialRenderer.renderSearch()}
            </amp-lightbox> 


        </body>
    </html>
   `;
   return theHTML;
}