import CleanCSS from 'clean-css';
import { PageCategory, PageCategoryCollection, PreviewResult } from '../../types/api';
import { styleNugget } from './homepage-amp-style';
import { PreviewService } from '../../preview';

export class HomepageAMPRenderPartial {
    public cleanedVars = {
        page_title: "",
        domain_prefix: "",
        img_full: "",
        img_thumb: "",
        trackingIDToUse: ""
    }

    constructor(
        private lang_code: string,
        private domain_prefix: string,
        private ga_id: string
    ) {
        this.cleanedVars.page_title = "Wiki Encyclopedia of Everything - Everipedia";
        this.cleanedVars.domain_prefix = domain_prefix;
        this.cleanedVars.img_full = 'https://epcdn-vz.azureedge.net/static/images/logo_new_full_1201x833.jpg';
        this.cleanedVars.img_thumb = 'https://epcdn-vz.azureedge.net/static/images/logo_new_thumb_250x173.jpg';
        this.cleanedVars.trackingIDToUse = ga_id;
    }

    renderHead = (BLURB_SNIPPET_PLAINTEXT: string, RANDOMSTRING: string): string => {
        let compressedCSS = new CleanCSS({}).minify(styleNugget).styles;

        return `
            <meta charset="utf-8" />
            <meta name="theme-color" content="#FFFFFF" />
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
            <link href="https://fonts.googleapis.com/css?family=Libre+Baskerville:400,400i,700&display=swap&subset=latin-ext" rel="stylesheet">
            <script async src="https://cdn.ampproject.org/v0.js"></script>
            <script async custom-element="amp-bind" src="https://cdn.ampproject.org/v0/amp-bind-0.1.js"></script>
            <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
            <style amp-boilerplate>
                body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
            </style>
            <noscript>
                <style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style>
            </noscript>
            <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
            <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
            <script async custom-element="amp-iframe" src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>
            <script async custom-element="amp-sidebar" src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"></script>
            <script async custom-element="amp-lightbox" src="https://cdn.ampproject.org/v0/amp-lightbox-0.1.js"></script>
            <script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
            <script async custom-element="amp-carousel" src="https://cdn.ampproject.org/v0/amp-carousel-0.2.js"></script>
            <script async custom-element="amp-selector" src="https://cdn.ampproject.org/v0/amp-selector-0.1.js"></script>
            <meta property="og:type" content="article"/>
            <meta name="twitter:card" content="summary" />
            <title>${this.cleanedVars.page_title} - Everipedia</title>
            <meta property="og:title" content="${this.cleanedVars.page_title} - Everipedia"/>
            <meta name="twitter:title" content="${this.cleanedVars.page_title} - Everipedia" />
            <meta name="description" content="${BLURB_SNIPPET_PLAINTEXT}"/>
            <meta property="article:tag" content="${this.cleanedVars.page_title} - Everipedia" />
            ${this.cleanedVars.img_full ? `<meta property="og:image" content="${this.cleanedVars.img_full}?nocache=${RANDOMSTRING}" />` : ""}
            ${this.cleanedVars.img_thumb ? `<meta property="og:image" content="${this.cleanedVars.img_thumb}?nocache=${RANDOMSTRING}" />` : ""}
            <meta property="og:description" content="${BLURB_SNIPPET_PLAINTEXT}"/>
            <meta name="og:url" content="https://${this.cleanedVars.domain_prefix}everipedia.org">
            ${this.cleanedVars.img_full ? `<meta property="twitter:image" content="${this.cleanedVars.img_full}?nocache=${RANDOMSTRING}" />` : ""}
            ${this.cleanedVars.img_thumb ? `<meta property="twitter:image" content="${this.cleanedVars.img_thumb}?nocache=${RANDOMSTRING}" />` : ""}
            <meta name="twitter:description" content="${BLURB_SNIPPET_PLAINTEXT}" />
            <meta name="twitter:url" content="https://${this.cleanedVars.domain_prefix}everipedia.org">
            <meta property="fb:app_id" content="1617004011913755" />
            <meta property="fb:pages" content="328643504006398"/>
            <meta property="article:author" content="https://www.facebook.com/everipedia" />
            <link rel="canonical" href="https://${this.cleanedVars.domain_prefix}everipedia.org" />
            <style amp-custom>${compressedCSS}</style>
        `;
    };

    renderHeaderBar = (): string => {
        return `
            <nav class="amp-header-bar">
                <ul>
                    <li class="amp-header-logo">
                        <a rel='nofollow' href="https://${this.cleanedVars.domain_prefix}everipedia.org">
                            <amp-img width='230' height='30' layout='fixed' src='https://epcdn-vz.azureedge.net/static/images/EVP-beta-logo-white.svg' alt='Everipedia Logo' ></amp-img>
                        </a>
                    </li>
                    <li class="amp-header-menu">
                        <button on='tap:usermenu-lightbox'>
                        <span class="bull-menu">
                            <amp-img height="25" width="7" layout="fixed" alt="Bullet" src="https://epcdn-vz.azureedge.net/static/images/bull-menu-white.png" ></amp-img>
                        </span>
                        </button>
                    </li>
                    <li class="amp-header-search">
                        <button on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/search', target=_blank)" tabindex='0' role="link" data-description="Search">
                        <amp-img height="28" width="28" layout="fixed" alt="Search" src="https://epcdn-vz.azureedge.net/static/images/search_white.svg" ></amp-img>
                        </button>
                    </li>
                </ul>
            </nav>
        `;
    };

    renderFeaturedCarousel = (theFeaturedPreviews: PreviewResult[]): string => {
        console.log(theFeaturedPreviews)

        let carouselComboString = theFeaturedPreviews && theFeaturedPreviews.map(preview => {
            return `   
                <div class="slide">             
                    <amp-img
                        src="${preview.main_photo}"
                        layout="fill"
                        alt="${preview.page_title}"
                    ></amp-img>
                    <div 
                        class="caption"
                        on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/wiki/lang_${preview.lang_code}/${preview.slug}', target=_blank)" 
                        tabindex='0' 
                        role="link"
                    >
                        ${preview.page_title}
                    </div>
                </div>
            `
        }).join("");

        return `
            <amp-carousel
                id="Featured_Carousel"
                height="350"
                layout="fixed-height"
                type="slides"
            >
                ${carouselComboString}
            </amp-carousel>
        `
    }

    renderTrendingRecentPopularTab = (previews: PreviewResult[]): string => {
        return ``;
    }

    renderTrendingRecentPopularTabList = (
        trendingPreviews: PreviewResult[],
        recentPreviews: PreviewResult[],
        popularPreviews: PreviewResult[]
    ): string => {


        return `
            <amp-selector id="Trend_Rec_Pop" class="tabs-with-flex" role="tablist">
                <div id="tab1"
                    role="tab"
                    aria-controls="tabpanel1"
                    option
                    selected
                >TRENDING</div>
                <div id="tabpanel1"
                    role="tabpanel"
                    aria-labelledby="tab1"
                >${this.renderTrendingRecentPopularTab(trendingPreviews)}aaa</div>
                <div id="tab2"
                    role="tab"
                    aria-controls="tabpanel2"
                    option
                >RECENT</div>
                <div id="tabpanel2"
                    role="tabpanel"
                    aria-labelledby="tab2"
                >${this.renderTrendingRecentPopularTab(recentPreviews)}bbb</div>
                <div id="tab3"
                    role="tab"
                    aria-controls="tabpanel3"
                    option
                >POPULAR</div>
                <div id="tabpanel3"
                    role="tabpanel"
                    aria-labelledby="tab3"
                >${this.renderTrendingRecentPopularTab(popularPreviews)}ccc</div>
            </amp-selector>
        `;
    }

    renderFooter = (): string => {
        return `
            <div class="footer-wrapper">
                <div class='footer-img-wrap'>
                    <amp-img class='footer-logo-img' width=200 height=34 alt="Everipedia Logo" src="https://epcdn-vz.azureedge.net/static/images/EVP-logo-footer.svg">
                    </amp-img>
                </div>
                <amp-anim class='gif-pixel-fix' width=1 height=1 alt="GIF Pixel" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
                    <amp-img placeholder width=1 height=1 alt="Placeholder White Dot" src="https://epcdn-vz.azureedge.net/static/images/white_dot.png">
                    </amp-img>
                </amp-anim>
                <div class="footer-links">
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/about', target=_blank)" tabindex='0' role="link" >About</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/faq', target=_blank)" tabindex='0' role="link">FAQ</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/contact', target=_blank)" tabindex='0' role="link" >Contact</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://www.reddit.com/r/Everipedia/', target=_blank)" tabindex='0' role="link" >Forum</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/wiki/everipedia-terms', target=_blank)" tabindex='0' role="link" >Terms</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/iq-info', target=_blank)" tabindex='0' role="link" >Get IQ</span>
                </div>
                <div class="copyright">
                <amp-img class='cc-img' width="15" height="15" layout='fixed' alt="Creative Commons" src="https://epcdn-vz.azureedge.net/static/images/cc.png"></amp-img>&nbsp;<span>2019 Everipedia International</span>
                    <amp-img class='cayman-flag-footer' width="21" height="20" layout='fixed' alt="Cayman Flag" src="https://epcdn-vz.azureedge.net/static/images/flags/cayman_flag.svg"></amp-img>
                    <span class="disclaimer">By using this website, you agree to the <span class='footer-span-terms-of-use' on="tap:AMP.navigateTo(url='https://everipedia.org/wiki/everipedia-terms', target=_blank)" tabindex='0' role="link" >Terms of Use</span>. Everipedia® is a trademark of Everipedia International.</span>
                </div>
            </div>
            <div class="footer-social">
                <span class='social-logo' on="tap:AMP.navigateTo(url='http://facebook.com/everipedia', target=_blank)" tabindex='0' role="link" title="Everipedia on Facebook">
                    <amp-img height="26" width="26" layout="fixed" alt="Facebook" src="https://epcdn-vz.azureedge.net/static/images/facebook.png"></amp-img>
                </span>
                <span class='social-logo' on="tap:AMP.navigateTo(url='http://twitter.com/everipedia', target=_blank)" tabindex='0' role="link" title="Everipedia on Twitter">
                    <amp-img height="26" width="26" layout="fixed" alt="Twitter" src="https://epcdn-vz.azureedge.net/static/images/twitter.png"></amp-img>
                </span>
                    <span class='social-logo' on="tap:AMP.navigateTo(url='https://www.reddit.com/r/Everipedia/', target=_blank)" tabindex='0' role="link" title="Everipedia on Reddit">
                    <amp-img height="26" width="26" layout="fixed" alt="Reddit" src="https://epcdn-vz.azureedge.net/static/images/reddit.png"></amp-img>
                </span>
                <span class='social-logo' on="tap:AMP.navigateTo(url='https://t.me/everipedia', target=_blank)" tabindex='0' role="link" title="Everipedia on Telegram">
                    <amp-img height="26" width="26" layout="fixed" alt="Telegram" src="https://epcdn-vz.azureedge.net/static/images/telegram.png"></amp-img>
                </span>
                <span class='social-logo' on="tap:AMP.navigateTo(url='https://blockfolio.com/coin/IQ', target=_blank)" tabindex='0' role="link" title="IQ token on Blockfolio">
                    <amp-img height="26" width="26" layout="fixed" alt="Blockfolio" src="https://epcdn-vz.azureedge.net/static/images/blockfolio.svg"></amp-img>
                </span>
            </div>
            <div class="eos-powered-line">
                <span class="pwr-join-txt">Powered by</span>
                <a class="eos-link" href="https://eos.io/">
                    <amp-img class="eos-footer-img" height="26" width="26" layout="fixed" alt="EOS.IO" src="https://epcdn-vz.azureedge.net/static/images/eos-logo.png" ></amp-img>
                    <span id="powered-by-eos">EOS.IO</span>
                </a>
                <span class="pwr-join-txt">API by</span>
                <a class="liberty-link" href="https://eos.io/">
                    <amp-img class="liberty-footer-img" height="40" width="50" layout="fixed" alt="LibertyBlock" src="https://epcdn-vz.azureedge.net/static/images/libertyblock.png" ></amp-img>
                    <span id="api-by-libertyblock">LibertyBlock</span>
                </a>
                <span class="pwr-join-txt">and</span>
                <a class="scatter-link" href="https://get-scatter.com/">
                    <amp-img class="scatter-footer-img" height="35" width="23" layout="fixed" alt="Scatter" src="https://epcdn-vz.azureedge.net/static/images/scatter.png" ></amp-img>
                    <span id="api-by-scatter">Scatter</span>
                </a>
            </div>
        `;
    };

    renderUserMenu = (): string => {
        return `
            <div class="lightbox" tabindex="0" role="menubar">
                <div class="usermenu-toggle-space" on='tap:usermenu-lightbox.close' tabindex="0" role="menubar">
                </div>
                <div class="usr-mnu">
                    <div class="usr-mnu-hdr">
                            <div class="loggedin-default">Menu</div>
                    </div>
                    <ul>
                        <li>
                            <a rel="nofollow" href="/faq/login-methods?from_amp=login">
                                <span class="icon"><i class="fa fa-key"></i></span>
                                <div class="fixed-items-description">Log In / Register</div>
                            </a>
                        </li>
                        <li>
                            <a rel="nofollow" href="/about">
                                <span class="icon"><i class="fa fa-globe"></i></span>
                                <div class="fixed-items-description">About Everipedia</div>
                            </a>
                        </li>
                        <li>
                            <a rel="nofollow" href="/activity">
                                <span class="icon"><i class="fa fa-bolt"></i></span>
                                <div class="fixed-items-description">Recent Activity</div>
                            </a>
                        </li>
                        <li>
                            <a rel="nofollow" href="/faq">
                                <span class="icon"><i class="fa fa-question"></i></span>
                                <div class="fixed-items-description">Help</div>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    };

    renderAnalyticsBlock = (): string => {
        return `
            <amp-analytics type="googleanalytics" id="analytics1">
                <script type="application/json">
                {
                    "vars": {
                    "account": ${this.cleanedVars.trackingIDToUse}
                    },
                    "triggers": {
                    "trackPageview": {
                        "on": "visible",
                        "request": "pageview",
                        "vars": {
                        "title": "${this.cleanedVars.page_title}"
                        }
                    }
                    }
                }
                </script>
            </amp-analytics>
            <amp-analytics type="quantcast">
                <script type="application/json">
                {
                    "vars": {
                    "pcode": "p-zX_L0rFEaESwg",
                    "labels": ["AMPProject","AMP" ]
                    }
                }
                </script>
            </amp-analytics>
        `;
    };

    renderBreadcrumb = (): string => {
        return `
            <script type="application/ld+json">
                {
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [{
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Everipedia",
                        "item": "https://${this.cleanedVars.domain_prefix}everipedia.org"
                    }]
                }
            </script>
        `;
    }
}
