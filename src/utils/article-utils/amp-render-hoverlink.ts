import { ArticleJson, Citation } from '../../types/article';
import CleanCSS from 'clean-css';
import { compareURLs } from '../article-utils/article-tools'
const fs = require('fs');
const crypto = require('crypto');
import { styleNugget } from './amp-style-hovercard';

export const renderAMPHoverLink = (inputArticle: ArticleJson, targetUrl: string): string => {
    if (!inputArticle) return "NO ARTICLE FOUND";
    let compressedCSS = new CleanCSS({}).minify(styleNugget).styles;

    let theCitation: Citation = inputArticle.citations.find(existingCtn => compareURLs(existingCtn.url, targetUrl));

    if (!theCitation) return "NO CITATION FOUND";

    const CITATION_MIME = theCitation.mime;
    const CITATION_URL = theCitation.url;
    const CITATION_THUMB = theCitation.thumb ? theCitation : "";
    const CITATION_DESCRIPTION = theCitation.description.map(sent => sent.text).join("");
    const CITATION_TIMESTAMP = theCitation.timestamp;

    const renderPicture = () => {
        if (CITATION_MIME != ''){
            let imgString;
            if (CITATION_MIME != null && CITATION_MIME != "None"){
                imgString = `<img class="b-lazy" src="${CITATION_URL}" onerror="this.onerror=null;this.src='https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png'" />`;
            }
            else{
                imgString = `<img class="b-lazy" src="${CITATION_THUMB}" onerror="this.onerror=null;this.src='https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png'" />`
            }
            return `
                <div class="hvrblrb-ajax-picture">
                    <a class="pic-block cls-newlink" href="javascript:;" onclick="newWindow();">
                        ${imgString}
                    </a>
                </div>
            `
        }
        else return "";
    }

    const renderMainBlock = () => {
        let optionalClass = (CITATION_MIME == null || CITATION_MIME == "None") ? "hvrblrb-no-photo" : "";
        return `
            <div class="hvrblrb-ajax-blurb ${optionalClass}">
                <a rel='nofollow' class="name-block cls-newlink" href="#" onclick="newWindow();">
                    ${CITATION_URL}
                    <span class="icon icon-export"></span>
                </a>
                <div class="hvrlnk-cite-container">
                    <div class="hvrlnk-cite-avatar-extras-container">
                        <div class="hvrlnk-cite"><span class="hvrlnk-label">Cited On: </span>${CITATION_TIMESTAMP}</div>
                    </div>
                </div>
                <div class="description-block cls-newlink" onclick="newWindow();">
                    ${CITATION_DESCRIPTION}
                </div>

            </div>
        `
    }

    const theHTML = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>${CITATION_URL}</title>
                <script type='text/javascript'>
                    function newWindow() {
                        top.location.href = "${CITATION_URL}";
                    }
                </script>
                <style>${compressedCSS}</style>
            </head>
            <div id="hoverblurb_AJAX">
                <div class="main-content-block">
                    ${renderPicture()}
                    ${renderMainBlock()}
                </div>
            </div>
        </html>
   `;

    return theHTML;
};
