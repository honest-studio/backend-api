import { Injectable, Res, Inject, forwardRef } from '@nestjs/common';
import { MysqlService, ButterCMSService } from '../feature-modules/database';
import { PreviewResult } from '../types/api';
import { WikiIdentity } from '../types/article-helpers';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { PreviewService } from '../preview';
import { CategoryService } from '../category';
import { RecentActivityService } from '../recent-activity';
import { StatService } from '../stat';
import { HomepageAMPRenderPartial } from './amp/homepage-amp-render-partial';
import { GetLangAndSlug } from '../utils/article-utils/article-tools';
import { getLangPrefix } from '../sitemap/sitemap.service';
import { ConfigService } from '../common';
import * as SqlString from 'sqlstring';
const crypto = require('crypto');
const util = require('util');

export interface LeaderboardPack {
    iq: {
        today: any,
        this_week: any,
        this_month: any,
        all_time: any,
    },
    votes: {
        today: any,
        this_week: any,
        this_month: any,
        all_time: any,
    },
    edits: {
        today: any,
        this_week: any,
        this_month: any,
        all_time: any,
    },
}

@Injectable()
export class HomepageService {
    constructor(
        private mysql: MysqlService,
        private butter: ButterCMSService,
        private config: ConfigService,
        @Inject(forwardRef(() => PreviewService)) private previewService: PreviewService,
        @Inject(forwardRef(() => RecentActivityService)) private recentActivityService: RecentActivityService,
        @Inject(forwardRef(() => CategoryService)) private categoryService: CategoryService,
        @Inject(forwardRef(() => StatService)) private statService: StatService,
    ) {}
    
    async getAMPHomepage(@Res() res, lang_code: string): Promise<any> {
        let _butter = this.butter.getButter();

        const [
            blog, 
            content, 
            trending, recent, 
            site_usage, 
            today_iq, 
            week_iq, 
            month_iq, 
            all_time_iq, 
            today_edits, 
            week_edits, 
            month_edits, 
            all_time_edits, 
            today_votes, 
            week_votes, 
            month_votes, 
            all_time_votes 
        ] = await Promise.all([
            _butter.post.list({ page: 1, page_size: 21, locale: lang_code }).then(result => result.data.data),
            _butter.content.retrieve(['popular', 'in_the_news', 'featured_content', 'excluded_list', 'in_the_press'], { locale: lang_code }).then(result => result.data.data),
            this.recentActivityService.getTrendingWikis(lang_code),
            this.recentActivityService.getProposals({ expiring: false, completed: true, preview: true, user_agent: 'safari', diff: null, limit: 15, offset: 0, langs: lang_code}),
            this.statService.siteUsage(lang_code),
            this.statService.editorLeaderboard({ period: 'today', lang: lang_code, cache: true, sortby: 'iq', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'this-week', lang: lang_code, cache: true, sortby: 'iq', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'this-month', lang: lang_code, cache: true, sortby: 'iq', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'all-time', lang: lang_code, cache: true, sortby: 'iq', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'today', lang: lang_code, cache: true, sortby: 'edits', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'this-week', lang: lang_code, cache: true, sortby: 'edits', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'this-month', lang: lang_code, cache: true, sortby: 'edits', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'all-time', lang: lang_code, cache: true, sortby: 'edits', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'today', lang: lang_code, cache: true, sortby: 'votes', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'this-week', lang: lang_code, cache: true, sortby: 'votes', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'this-month', lang: lang_code, cache: true, sortby: 'votes', limit: 20 }),
            this.statService.editorLeaderboard({ period: 'all-time', lang: lang_code, cache: true, sortby: 'votes', limit: 20 }),
        ]);

        // Assemble the leaderboard info
        let leaderboardPack: LeaderboardPack = {
            iq: {
                today: today_iq,
                this_week: week_iq,
                this_month: month_iq,
                all_time: all_time_iq
            },
            edits: {
                today: today_edits,
                this_week: week_edits,
                this_month: month_edits,
                all_time: all_time_edits
            },
            votes: {
                today: today_votes,
                this_week: week_votes,
                this_month: month_votes,
                all_time: all_time_votes
            }
        };

        console.log(util.inspect(leaderboardPack, {showHidden: false, depth: null, chalk: true}));

        // Extract the data
        let { popular, in_the_news, featured_content, excluded_list, in_the_press } = content;

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

        // Filter the in_the_news items
        let inTheNewsItems: WikiIdentity[] = in_the_news && in_the_news.map(item => {
            const { lang_code, slug } = GetLangAndSlug(item.wikilangslug, true);

            // Do nothing for empty wikilangslugs and also remove excluded wikilangslugs
            if (!item.wikilangslug || item.wikilangslug == '') return null;
            else if (excludedList.indexOf(item.wikilangslug.toLowerCase()) >= 0) return null;
            else return { lang_code, slug };

        })
        .filter(f => f)
        .slice(0, 4);

        // Filter the trending items
        let trendingItems: WikiIdentity[] = trending && trending.map(item => {
            const { lang_code, slug } = item;

            // Do nothing for empty slugs and also remove excluded wikilangslugs
            if (!item.slug || item.slug == '') return null;
            else return { lang_code, slug };

        })
        .filter(f => f)
        .slice(0, 4);

        // Filter the popular items
        let popularItems: WikiIdentity[] = popular && popular.map(item => {
            const { lang_code, slug } = GetLangAndSlug(item.wikilangslug, true);

            // Do nothing for empty wikilangslugs and also remove excluded wikilangslugs
            if (!item.wikilangslug || item.wikilangslug == '') return null;
            else return { lang_code, slug };
        })
        .filter(f => f)
        .slice(0, 4);

        // Filter the recent items
        let seen: string[] = [];
        let recentPreviews: PreviewResult[] = recent && recent.map(item => {
            if (!item.preview) return null;

            if(seen.indexOf(item.preview.slug) == -1){
                seen.push(item.preview.slug);
                return item.preview;
            }
            else return null;
        })
        .filter(f => f)
        .slice(0, 4);

        // Get the previews
        // Inefficient: you could pass all the WikiIdentity[]'s at once and loop through the results to assign to the source arrays
        const [featuredPreviews, trendingPreviews, popularPreviews, inTheNewPreviews, homepageCategories] = await Promise.all([
            this.previewService.getPreviewsBySlug(featuredItems, 'safari'),
            this.previewService.getPreviewsBySlug(trendingItems, 'safari'),
            this.previewService.getPreviewsBySlug(popularItems, 'safari'),
            this.previewService.getPreviewsBySlug(inTheNewsItems, 'safari'),
            this.categoryService.getHomepageCategories(lang_code)
        ]);

        const RANDOMSTRING = crypto.randomBytes(5).toString('hex');
        let domain_prefix = getLangPrefix(lang_code);

        // Get the Google Analytics tracking ID
        let trackingIDToUse, momentLocaleToUse;
        switch (domain_prefix) {
            case 'en':
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_EN');
                momentLocaleToUse = 'en';
                break;
            case 'es':
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_ES');
                momentLocaleToUse = 'es';
                break;
            case 'ko':
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_KO');
                momentLocaleToUse = 'ko';
                break;
            case 'zh':
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_ZH');
                momentLocaleToUse = 'zh-hk';
                break;
            default:
                trackingIDToUse = this.config.get('GOOGLE_ANALYTICS_ID_EN');
                momentLocaleToUse = 'en';
                break;
        }

        // Import the Moment.js locale
        if (momentLocaleToUse != 'en') {
            await import(`moment/locale/${momentLocaleToUse}`);
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
                        ${arp.renderTrendingRecentPopularTabList(trendingPreviews, recentPreviews, popularPreviews)}
                        ${arp.renderIntro()}
                        ${arp.renderInTheNewsTabList(inTheNewPreviews)}
                        ${arp.renderLeaderboardCarousel(leaderboardPack)}
                        ${arp.renderCategories(homepageCategories)}
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
