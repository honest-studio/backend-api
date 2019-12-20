import { Injectable, Res, Inject, forwardRef } from '@nestjs/common';
import { MysqlService, ButterCMSService } from '../feature-modules/database';
import { PreviewResult } from '../types/api';
import { WikiIdentity } from '../types/article-helpers';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { PreviewService } from '../preview';
import { RecentActivityService } from '../recent-activity';
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
        @Inject(forwardRef(() => RecentActivityService)) private recentActivityService: RecentActivityService,
    ) {}
    
    async getAMPHomepage(@Res() res, lang_code: string): Promise<any> {
        let _butter = this.butter.getButter();

        const [blog, content, trending] = await Promise.all([
            _butter.post.list({ page: 1, page_size: 21, locale: lang_code }).then(result => result.data.data),
            _butter.content.retrieve(['popular', 'in_the_news', 'featured_content', 'excluded_list', 'in_the_press'], { locale: lang_code }).then(result => result.data.data),
            this.recentActivityService.getTrendingWikis(lang_code)
        ]);

        // Extract the data
        let { excluded_list, popular, in_the_news, featured_content, in_the_press } = content;

        // Get the excluded items
        let excludedList = excluded_list && excluded_list.map(item => item.wikilangslug && item.wikilangslug.toLowerCase());

        // Filter the featured items
        let featuredItems: WikiIdentity[] = featured_content && featured_content.map(item => {
            const { lang_code, slug } = GetLangAndSlug(item.wikilangslug, true);

            // Do nothing for empty wikilangslugs and also remove excluded wikilangslugs
            if (!item.wikilangslug || item.wikilangslug == '') return null;
            else if (excludedList.indexOf(item.wikilangslug.toLowerCase()) >= 0) return null;
            else return { lang_code, slug };

        })
        .filter(f => f)
        .slice(0, 5);

        // Filter the trending items
        let trendingItems: WikiIdentity[] = trending && trending.map(item => {
            const { lang_code, slug } = item;

            // Do nothing for empty slugs and also remove excluded wikilangslugs
            if (!item.slug || item.slug == '') return null;
            else return { lang_code, slug };

        })
        .filter(f => f)
        .slice(0, 4);

        // Get the previews
        // Inefficient: you could pass all the WikiIdentity[]'s at once and loop through the results to assign to the source arrays
        const [featuredPreviews, trendingPreviews] = await Promise.all([
            this.previewService.getPreviewsBySlug(featuredItems, 'safari'),
            this.previewService.getPreviewsBySlug(trendingItems, 'safari'),
        ]);

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
                        ${arp.renderFeaturedCarousel(featuredPreviews)}
                        ${arp.renderTrendingRecentPopularTabList(trendingPreviews, [], [])}
                        ${arp.renderBreadcrumb()}
                    </main>
                    <footer class="ftr everi_footer">
                        ${arp.renderFooter()}
                    </footer>
                    <amp-lightbox id="usermenu-lightbox" layout="nodisplay">
                        ${arp.renderUserMenu()}
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
