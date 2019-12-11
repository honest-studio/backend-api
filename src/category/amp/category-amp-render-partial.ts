import CleanCSS from 'clean-css';
import { PageCategory, PageCategoryCollection, PreviewResult } from '../../types/api';
import { getLangPrefix } from '../../sitemap/sitemap.service';
import { styleNugget } from './category-amp-style';

export class CategoryAMPRenderPartial {
    public cleanedVars = {
        page_title: "",
        url_slug: "",
        domain_prefix: "",
        page_lang: "",
        page_type: "",
        img_full: "",
        img_thumb: ""
    }

    constructor(private category_collection: PageCategoryCollection) {
        let { category, previews } = category_collection;
        this.cleanedVars.page_title = category && category.title.replace(/["“”‘’]/gm, "\'");

        let page_lang = category && category.lang;
        page_lang = page_lang && page_lang != '' ? page_lang : 'en';
        const url_slug = category && category.slug;
        const page_type = category && category.schema_for;

        this.cleanedVars.domain_prefix = getLangPrefix(page_lang);
        this.cleanedVars.page_lang = page_lang;
        this.cleanedVars.url_slug = url_slug;
        this.cleanedVars.page_type = page_type;
        this.cleanedVars.img_full = (category.img_full || category.img_full == 'null') ? category.img_full : null;
        this.cleanedVars.img_thumb = (category.img_thumb  || category.img_thumb == 'null') ? category.img_thumb : null;
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
            <meta name="og:url" content="https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}">
            ${this.cleanedVars.img_full ? `<meta property="twitter:image" content="${this.cleanedVars.img_full}?nocache=${RANDOMSTRING}" />` : ""}
            ${this.cleanedVars.img_thumb ? `<meta property="twitter:image" content="${this.cleanedVars.img_thumb}?nocache=${RANDOMSTRING}" />` : ""}
            <meta name="twitter:description" content="${BLURB_SNIPPET_PLAINTEXT}" />
            <meta name="twitter:url" content="https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}">
            <meta property="fb:app_id" content="1617004011913755" />
            <meta property="fb:pages" content="328643504006398"/>
            <meta property="article:author" content="https://www.facebook.com/everipedia" />
            <link rel="canonical" href="https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}" />
            <style amp-custom>${compressedCSS}</style>
        `;
    };

    renderHeaderBar = (): string => {
        return `
            <nav class="amp-header-bar">
                <ul>
                    <li class="amp-header-toc">
                        <button on='tap:share-lightbox'>
                            <amp-img height="24" width="30" layout="fixed" alt="Table of contents and facts for this wiki" src="https://epcdn-vz.azureedge.net/static/images/bull-icon.png" ></amp-img>
                        </button>
                    </li>
                    <li class="amp-header-logo">
                        <a rel='nofollow' href="https://${this.cleanedVars.domain_prefix}everipedia.org">
                            <amp-img width='230' height='30' layout='fixed' src='https://epcdn-vz.azureedge.net/static/images/EVP-beta-logo-black.svg' alt='Everipedia Logo' ></amp-img>
                        </a>
                    </li>
                    <li class="amp-header-menu">
                        <button on='tap:usermenu-lightbox'>
                        <span class="bull-menu">
                            <amp-img height="25" width="7" layout="fixed" alt="Bullet" src="https://epcdn-vz.azureedge.net/static/images/bull-menu.png" ></amp-img>
                        </span>
                        </button>
                    </li>
                    <li class="amp-header-search">
                        <button on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/search', target=_blank)" tabindex='0' role="link" data-description="Search">
                        <amp-img height="28" width="28" layout="fixed" alt="Search" src="https://epcdn-vz.azureedge.net/static/images/search_black.svg" ></amp-img>
                        </button>
                    </li>
                </ul>
            </nav>
        `;
    };

    renderOneCategory = (preview: PreviewResult): string => {
        let test_wikilangslug = `lang_${preview.lang_code}/${preview.slug}`;
        let is_indexed = preview.is_indexed;
        let sanitized_sa_page_title = preview.page_title.replace(/["“”‘’]/gmiu, "\'");

        // Don't use anchor tags for non-indexed pages 
        let title_tag_to_use = is_indexed ? 
        `<a class="cat-title"  href="https://${this.cleanedVars.domain_prefix}everipedia.org/wiki/lang_${preview.lang_code}/${preview.slug}" target="_blank">${preview.page_title}</a>`
        : `<div class="cat-title" >${preview.page_title}</div>`

        return `
            <div class='cat-ancr-wrp' on="tap:AMP.navigateTo(url='https://${this.cleanedVars.domain_prefix}everipedia.org/wiki/${test_wikilangslug}', target=_blank)" tabindex='0' role="link">
                <amp-img layout="fixed" height="40px" width="40px" src="${preview.main_photo ? preview.main_photo : preview.thumbnail}" alt="${sanitized_sa_page_title} wiki">
                    <amp-img placeholder layout="fixed" height="40px" width="40px" src="https://epcdn-vz.azureedge.net/static/images/white_dot.png" alt="Placeholder for ${
                        sanitized_sa_page_title
                    }"></amp-img>
                </amp-img>
                <div class="cat-contentwrap">
                    ${title_tag_to_use}
                    <div class="cat-blurb">${preview.text_preview.replace(/["“”‘’]/gmiu, "\'")}</div>
                </div>
            </div>
        `;
    };


    renderCategories = (): string => {
        let category_previews: PreviewResult[] = this.category_collection.previews;
        if (category_previews.length == 0) return ``;
        let categoryComboString = category_previews
            .map((prev, index) => {
                return this.renderOneCategory(prev);
            })
            .join('');
        return `
            <div class="category-container">
                <div class="cat-hdr">
                    ${this.category_collection.category.title}
                </div>
                <ul class="category-list">
                    ${categoryComboString}
                </ul>
            </div>
        `;
    };

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

    renderShareLightbox = (): string => {
        return `  
            <span class="lb-button cls-shr-lgbx"><button  on='tap:share-lightbox.close'></button></span>
            <nav class="lightbox" tabindex="0" role="widget">
                <div class="share-ct">
                    <div class="share-ct-inner">
                        <h2>Share this page</h2>
                        <div class="social-share-block-wrap">
                            <div class="social-share-block">
                                <a class="email social-share-btn" rel='nofollow' href="mailto:email@email.com?&body=https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}"></a>
                                <a class="facebook social-share-btn" rel='nofollow' href="https://www.facebook.com/sharer/sharer.php?u=https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}"></a>
                                <a class="twitter social-share-btn" rel='nofollow' href="http://twitter.com/share?text=https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}"></a>
                                <a class="reddit social-share-btn" rel='nofollow' href="https://reddit.com/submit?url=https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}"></a>
                            </div>
                        </div>
                    </div>
                    <div class="share-pad"></div>
                    <div class="share-ct-link">
                        <h4>DIRECT LINK</h4>
                        <a href="https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}">https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}</a>
                    </div>       
                </div>
            </nav>
        `;
    };

    renderAnalyticsBlock = (): string => {
        return `
            <amp-analytics type="googleanalytics" id="analytics1">
                <script type="application/json">
                {
                    "vars": {
                    "account": "UA-57561457-3"
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
                    },{
                        "@type": "ListItem",
                        "position": 2,
                        "name": "${this.cleanedVars.page_title}",
                        "item": "https://${this.cleanedVars.domain_prefix}everipedia.org/category/lang_${this.cleanedVars.page_lang}/${this.cleanedVars.url_slug}"
                    }]
                }
            </script>
        `;
    }
}
