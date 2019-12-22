import { Injectable, Res, Inject, forwardRef } from '@nestjs/common';
import { MysqlService, ButterCMSService } from '../feature-modules/database';
import { PreviewResult } from '../types/api';
import { WikiIdentity } from '../types/article-helpers';
import { sanitizeTextPreview } from '../utils/article-utils/article-tools';
import { PreviewService } from '../preview';
import { CategoryService } from '../category';
import { UserService } from '../user';
import { RecentActivityService } from '../recent-activity';
import { StatService } from '../stat';
import { HomepageAMPRenderPartial } from './amp/homepage-amp-render-partial';
import { GetLangAndSlug } from '../utils/article-utils/article-tools';
import { getLangPrefix } from '../sitemap/sitemap.service';
import { ConfigService } from '../common';
import * as SqlString from 'sqlstring';
import featuredArray from './amp/featuredArray';
const crypto = require('crypto');
const util = require('util');
const shuffle = require('shuffle-array');

export interface SiteStats {
    timestamp: string,
    total_article_count: [{ num_articles: number }],
    total_pageviews: [ { pageviews: number } ],
    total_editors: number,
    total_iq_rewards: string,
    original_pages: number,
    total_edits: number,
    block_num: number
}

export interface UserProfile {
    about_me: string,
    display_name: string,
    img: string,
    languages: any[],
    location: {
        city: string,
        country: string,
        state: string
    },
    platforms: any,
    user: string

}
export interface LeaderboardStat {
    user: string,
    cumulative_iq_rewards: number,
    edits: number,
    votes: number
}

export interface LeaderboardPack {
    iq: {
        today: LeaderboardStat[],
        this_week: LeaderboardStat[],
        this_month: LeaderboardStat[],
        all_time: LeaderboardStat[],
    },
    votes: {
        today: LeaderboardStat[],
        this_week: LeaderboardStat[],
        this_month: LeaderboardStat[],
        all_time: LeaderboardStat[],
    },
    edits: {
        today: LeaderboardStat[],
        this_week: LeaderboardStat[],
        this_month: LeaderboardStat[],
        all_time: LeaderboardStat[],
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
        @Inject(forwardRef(() => UserService)) private userService: UserService,
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
            this.statService.editorLeaderboard({ period: 'today', lang: lang_code, cache: true, sortby: 'iq', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'this-week', lang: lang_code, cache: true, sortby: 'iq', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'this-month', lang: lang_code, cache: true, sortby: 'iq', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'all-time', lang: lang_code, cache: true, sortby: 'iq', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'today', lang: lang_code, cache: true, sortby: 'edits', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'this-week', lang: lang_code, cache: true, sortby: 'edits', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'this-month', lang: lang_code, cache: true, sortby: 'edits', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'all-time', lang: lang_code, cache: true, sortby: 'edits', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'today', lang: lang_code, cache: true, sortby: 'votes', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'this-week', lang: lang_code, cache: true, sortby: 'votes', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'this-month', lang: lang_code, cache: true, sortby: 'votes', limit: 8 }),
            this.statService.editorLeaderboard({ period: 'all-time', lang: lang_code, cache: true, sortby: 'votes', limit: 8 }),
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

        // Get all the user profile info
        let userProfileAccountnameArray = [];

        // IQ
        today_iq && today_iq.forEach(stat => userProfileAccountnameArray.push(stat.user));
        week_iq && week_iq.forEach(stat => userProfileAccountnameArray.push(stat.user));
        month_iq && month_iq.forEach(stat => userProfileAccountnameArray.push(stat.user));
        all_time_iq && all_time_iq.forEach(stat => userProfileAccountnameArray.push(stat.user));

        // Edits
        today_edits && today_edits.forEach(stat => userProfileAccountnameArray.push(stat.user));
        week_edits && week_edits.forEach(stat => userProfileAccountnameArray.push(stat.user));
        month_edits && month_edits.forEach(stat => userProfileAccountnameArray.push(stat.user));
        all_time_edits && all_time_edits.forEach(stat => userProfileAccountnameArray.push(stat.user));

        // Votes
        today_votes && today_votes.forEach(stat => userProfileAccountnameArray.push(stat.user));
        week_votes && week_votes.forEach(stat => userProfileAccountnameArray.push(stat.user));
        month_votes && month_votes.forEach(stat => userProfileAccountnameArray.push(stat.user));
        all_time_votes && all_time_votes.forEach(stat => userProfileAccountnameArray.push(stat.user));
        
        // Remove duplicates
        userProfileAccountnameArray = [...new Set(userProfileAccountnameArray)];

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

        // Manual override for English featured articles
        if (lang_code == 'en'){
            featuredItems = shuffle(featuredArray).slice(0, 8);
        };

        // Get the previews
        // Inefficient: you could pass all the WikiIdentity[]'s at once and loop through the results to assign to the source arrays
        const [featuredPreviews, trendingPreviews, popularPreviews, inTheNewPreviews, homepageCategories, userProfileMegaObj] = await Promise.all([
            this.previewService.getPreviewsBySlug(featuredItems, 'safari'),
            this.previewService.getPreviewsBySlug(trendingItems, 'safari'),
            this.previewService.getPreviewsBySlug(popularItems, 'safari'),
            this.previewService.getPreviewsBySlug(inTheNewsItems, 'safari'),
            this.categoryService.getHomepageCategories(lang_code),
            this.userService.getProfiles(userProfileAccountnameArray)
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

        // Fill in the template
        const theHTML = `
            <!DOCTYPE html>
            <html amp lang="${lang_code}">
                <head>
                    ${arp.renderHead(RANDOMSTRING)}
                </head>
                <body>
                    ${arp.renderHeaderBar()}
                    <main id="mainEntityId">
                        ${arp.renderFeaturedCarousel(featuredPreviews)}
                        ${arp.renderTrendingRecentPopularTabList(trendingPreviews, recentPreviews, popularPreviews)}
                        ${arp.renderIntro()}
                        ${arp.renderInTheNewsTabList(inTheNewPreviews)}
                        ${arp.renderLeaderboard(leaderboardPack, userProfileMegaObj)}
                        ${arp.renderStartContributing()}
                        ${arp.renderCategories(homepageCategories)}
                        ${arp.renderStatsBox(site_usage)}
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
