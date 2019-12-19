import { Injectable, Res } from '@nestjs/common';
import { MysqlService } from '../feature-modules/database';
import { PageCategory, PageCategoryCollection, PreviewResult } from '../types/api';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { HomepageAMPRenderPartial } from './amp/homepage-amp-render-partial';
import * as SqlString from 'sqlstring';
const crypto = require('crypto');

@Injectable()
export class HomepageService {
    constructor(private mysql: MysqlService) {}
    
    async getAMPCategoryPage(@Res() res, lang_code: string, slug: string): Promise<any> {
        let category_collection = await this.getPagesByCategoryLangSlug(
            lang_code, 
            slug, 
            { limit: 40, offset: 0, show_adult_content: false }
        );
        let category_html_string = '';
        const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
        let arp = new HomepageAMPRenderPartial(category_collection);
        let the_category = category_collection && category_collection.category;
        let the_previews = category_collection && category_collection.previews;

        let BLURB_SNIPPET_PLAINTEXT = (the_category && the_category.description) ? the_category.description.replace(/["“”‘’]/gmiu, "\'") : "";
        if (BLURB_SNIPPET_PLAINTEXT == '') BLURB_SNIPPET_PLAINTEXT = the_category.title;


        const theHTML = `
            <!DOCTYPE html>
            <html amp lang="${lang_code}">
                <head>
                    ${arp.renderHead(BLURB_SNIPPET_PLAINTEXT, RANDOMSTRING)}
                </head>
                <body>
                    ${arp.renderHeaderBar()}
                    <main id="mainEntityId">
                        ${arp.renderCategories()}
                        ${arp.renderBreadcrumb()}
                    </main>
                    <footer class="ftr everi_footer">
                        ${arp.renderFooter()}
                    </footer>
                    <amp-lightbox id="usermenu-lightbox" layout="nodisplay">
                        ${arp.renderUserMenu()}
                    </amp-lightbox> 
                    <amp-lightbox id="share-lightbox" layout="nodisplay">
                        ${arp.renderShareLightbox()}
                    </amp-lightbox>
                    ${arp.renderAnalyticsBlock()}
                </body>
            </html>
        `

        res
            .header('Content-Type', 'text/html')
            .status(200)
            .send(theHTML);
    }
}
