import { ArticleJson } from './article-dto';
import { styleNugget } from './amp-style'
import { AmpRenderPartial } from './amp-render-partial'

export const renderAMP = (inputJSON: ArticleJson): string => {
    // TODO: REMEMBER TO PRE-SELECT STRINGS LIKE inputJSON.page_title AND USE VARIBLES BELOW, FOR SPEED REASONS 
    const RANDOMSTRING = Math.random().toString(36).substring(7);
    let ampPartialRenderer = new AmpRenderPartial(inputJSON);
    let AMP_PHOTO_HEIGHT = '', AMP_PHOTO_WIDTH = '', BLURB_SNIPPET_PLAINTEXT = '', OVERRIDE_MAIN_THUMB = null;
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
            </main>
        </body>
    </html>
   `;
   return theHTML;
}