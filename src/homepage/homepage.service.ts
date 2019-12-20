import { Injectable, Res, Inject, forwardRef } from '@nestjs/common';
import { MysqlService, ButterCMSService } from '../feature-modules/database';
import { PageCategory, PageCategoryCollection, PreviewResult } from '../types/api';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { PreviewService } from '../preview';
import { HomepageAMPRenderPartial } from './amp/homepage-amp-render-partial';
import { GetLangAndSlug } from '../utils/article-utils/article-tools';
import { getLangPrefix } from '../sitemap/sitemap.service';
import { ConfigService } from '../common';
import * as SqlString from 'sqlstring';
const crypto = require('crypto');

@Injectable()
export class HomepageService {
    constructor(
        private mysql: MysqlService,
        private butter: ButterCMSService,
        private config: ConfigService,
        @Inject(forwardRef(() => PreviewService)) private previewService: PreviewService,
    ) {}
    
    async getAMPHomepage(@Res() res, lang_code: string): Promise<any> {
        let _butter = this.butter.getButter();

        const [blog, content] = await Promise.all([
            _butter.post.list({ page: 1, page_size: 21, locale: lang_code }).then(result => result.data.data),
            _butter.content.retrieve(['popular', 'in_the_news', 'featured_content', 'excluded_list', 'in_the_press'], { locale: lang_code }).then(result => result.data.data)
          ]);

        // Extract the data
        let { excluded_list, popular, in_the_news, featured_content, in_the_press } = content;

        // Get the excluded items
        let excludedList = excluded_list && excluded_list.map(item => item.wikilangslug && item.wikilangslug.toLowerCase());

        // Filter the featured items
        let featuredItems = featured_content && featured_content.map(item => {
            const { lang_code, slug } = GetLangAndSlug(item.wikilangslug, true);

            // Do nothing for empty rows and also remove excluded wikilangslugs
            if (!item.wikilangslug || item.wikilangslug == '') return null;
            else if (excludedList.indexOf(item.wikilangslug.toLowerCase()) >= 0) return null;
            else return { lang_code, slug };

        })
        .filter(f => f)
        .slice(0, 5);

        // Get the featured image previews.
        let theFeaturedPreviews = await this.previewService.getPreviewsBySlug(featuredItems, 'safari');

        const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
        let domain_prefix = getLangPrefix(lang_code);

        // Get the Google Analytics tracking ID
        let trackingIDToUse;
        switch (domain_prefix) {
            case 'en':
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_EN');
                break;
            case 'es':
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_ES');
                break;
            case 'ko':
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_KO');
                break;
            case 'zh':
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_ZH');
                break;
            default:
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_EN');
                break;
        }

        // Get the function template
        let arp = new HomepageAMPRenderPartial(
            lang_code, 
            domain_prefix, 
            trackingIDToUse
        );

        // Description
        let BLURB_SNIPPET_PLAINTEXT = "The Wiki Encyclopedia for Everything, Everyone, Everywhere. Everipedia offers a space for you to dive into anything you find interesting, connect with people who share your interests, and contribute your own perspective.";

        const theHTML = `
            <!DOCTYPE html>
            <html amp lang="${lang_code}">
                <head>
                    ${arp.renderHead(BLURB_SNIPPET_PLAINTEXT, RANDOMSTRING)}
                </head>
                <body>
                    ${arp.renderHeaderBar()}
                    <main id="mainEntityId">
                        ${arp.renderFeaturedCarousel(theFeaturedPreviews)}
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
