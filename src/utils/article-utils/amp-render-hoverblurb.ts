import { PreviewResult } from '../../types/api';
import CleanCSS from 'clean-css';
const fs = require('fs');
const crypto = require('crypto');
import { styleNugget } from './amp-style-hoverblurb';

export const renderAMPHoverBlurb = (inputPreview: PreviewResult): string => {
    let compressedCSS = new CleanCSS({}).minify(styleNugget).styles;

    const ARTICLE_TITLE = inputPreview.page_title;

    const ARTICLE_PHOTO_URL = inputPreview.main_photo ? inputPreview.main_photo 
                            : inputPreview.thumbnail ? inputPreview.thumbnail : "";

    const ARTICLE_SNIPPET = inputPreview.text_preview;

    const renderMainBlock = () => {
        if (ARTICLE_PHOTO_URL != ''){
            return `
                <div class="hvrblrb-ajax-picture">
                    <a class="pic-block" href="javascript:void(0);" onclick="newWindow();">
                        <img id="main_pic" src='${ARTICLE_PHOTO_URL}' onError="this.onerror=null;this.src='${ARTICLE_PHOTO_URL}'" />
                    </a>
                </div>
                <div class="hvrblrb-ajax-blurb">
                    <a class="name-block" href="#" onclick="newWindow();">
                        ${ARTICLE_TITLE}
                    </a>
                    <div class="description-block" onclick="newWindow();">
                        ${ARTICLE_SNIPPET}
                    </div>
                </div>
            `
        }
        else {
            return `
                <div class="hvrblrb-ajax-blurb hvrblrb-no-photo">
                    <a class="name-block" href="#" onclick="newWindow();">
                        ${ARTICLE_TITLE}
                    </a>
                    <div class="description-block" onclick="newWindow();">
                        ${ARTICLE_SNIPPET}
                    </div>
                </div>
            `
        }
    }

    const theHTML = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>${ARTICLE_TITLE}</title>
                <script type='text/javascript'>
                    function newWindow() {
                        top.location.href = "https://everipedia.org/wiki/lang_${inputPreview.lang_code}/${inputPreview.slug}/";
                    }
                </script>
                <style>${compressedCSS}</style>
            </head>
            <div id="hoverblurb_AJAX">
                <div class="main-content-block">
                    ${renderMainBlock()}
                    <a class="goto-btn" href="#" onclick="newWindow();">Go to article</a>
                </div>
            </div>
        </html>
   `;

    return theHTML;
};
