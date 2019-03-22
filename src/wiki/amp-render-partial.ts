import { ArticleJson } from './article-dto';
import { Citation, Infobox, Media, Section } from './article-dto';

export class AmpRenderPartial {
    public artJSON: ArticleJson;
    constructor(inputJSN) {
        this.artJSON = inputJSN;
    }


    // ${ this.artJSON.metadata.page_type == 'Person' ?
    //     `AAAA` : 
    // this.artJSON.metadata.page_type == 'Product' ?
    //     `BBBB` : 
    // this.artJSON.metadata.page_type == 'Organization' ?
    //     `CCCC` : 
    // true ? 
    //     `DDDD` : ``
    // }

    renderHead = (BLURB_SNIPPET_PLAINTEXT: string, RANDOMSTRING: string): string => {
        return `
            <meta charset="utf-8">
            <meta name="theme-color" content="#FFFFFF">
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
            <link href="https://fonts.googleapis.com/css?family=Poppins:400,400i,600&amp;subset=latin-ext" rel="stylesheet">
            <script async src="https://cdn.ampproject.org/v0.js"></script>
            ${ this.artJSON.amp_info.load_youtube_js ? 
                '<script async custom-element="amp-youtube" src="https://cdn.ampproject.org/v0/amp-youtube-0.1.js"></script>' : ''
            }
            <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
            <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
            <script async custom-element="amp-iframe" src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>
            ${ this.artJSON.amp_info.load_audio_js ?
                '<script async custom-element="amp-audio" src="https://cdn.ampproject.org/v0/amp-audio-0.1.js"></script>' : ''
            }
            <script async custom-element="amp-sidebar" src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"></script>
            <script async custom-element="amp-lightbox" src="https://cdn.ampproject.org/v0/amp-lightbox-0.1.js"></script>
            <script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
            ${ this.artJSON.amp_info.load_video_js ?
                '<script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>' : ''
            }
            <meta property="og:type" content="article"/>
            <meta name="twitter:card" content="summary">
            ${ !this.artJSON.metadata.is_indexed ?
                '<meta name="googlebot" content="noindex, nofollow, noarchive">' : ''
            }
            ${ this.artJSON.metadata.page_type == 'Person' ?
                `<title>${this.artJSON.page_title} | Wiki & Bio | Everipedia</title>
                <meta name="description" content="${this.artJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}">
                <meta name="keywords" content="${this.artJSON.page_title}, ${this.artJSON.page_title} wiki, ${this.artJSON.page_title} bio, ${this.artJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${this.artJSON.page_title} news, who is ${this.artJSON.page_title}, where is ${this.artJSON.page_title}" >
                <meta name="news_keywords" content="${this.artJSON.page_title}, ${this.artJSON.page_title} wiki, ${this.artJSON.page_title} bio, ${this.artJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${this.artJSON.page_title}"/>
                <meta name="twitter:title" content="${this.artJSON.page_title} | Wiki & Bio |">` :
            this.artJSON.metadata.page_type == 'Product' ?
                `<title>${this.artJSON.page_title} | Wiki & Review | Everipedia</title>
                <meta name="description" content="${this.artJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}">
                <meta name="keywords" content="${this.artJSON.page_title}, ${this.artJSON.page_title} wiki, ${this.artJSON.page_title} encyclopedia')>, ${this.artJSON.page_title} review">
                <meta itemprop="keywords" content="${this.artJSON.page_title} news, what is ${this.artJSON.page_title}" >
                <meta name="news_keywords" content="${this.artJSON.page_title}, ${this.artJSON.page_title} wiki, ${this.artJSON.page_title} encyclopedia')>, ${this.artJSON.page_title} review">
                <meta property="og:title" content="${this.artJSON.page_title}"/>
                <meta name="twitter:title" content="${this.artJSON.page_title} | Wiki & Review |">` :
            this.artJSON.metadata.page_type == 'Organization' ?
                `<title>${this.artJSON.page_title} | Wiki & Review | Everipedia</title>
                <meta name="description" content="${this.artJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}">
                <meta name="keywords" content="${this.artJSON.page_title}, ${this.artJSON.page_title} wiki, ${this.artJSON.page_title} history')>, ${this.artJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${this.artJSON.page_title} news, what is ${this.artJSON.page_title}, where is ${this.artJSON.page_title}" >
                <meta name="news_keywords" content="${this.artJSON.page_title}, ${this.artJSON.page_title} wiki, ${this.artJSON.page_title} history, ${this.artJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${this.artJSON.page_title}"/>
                <meta name="twitter:title" content="${this.artJSON.page_title} | Wiki & Review |">` :
            this.artJSON.metadata.page_type ?
                `<title>${this.artJSON.page_title} | Wiki | Everipedia</title>
                <meta name="description" content="${this.artJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}">
                <meta name="keywords" content="${this.artJSON.page_title}, ${this.artJSON.page_title} wiki, ${this.artJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${this.artJSON.page_title} news, what is ${this.artJSON.page_title}" >
                <meta name="news_keywords" content="${this.artJSON.page_title}, ${this.artJSON.page_title} wiki, ${this.artJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${this.artJSON.page_title}"/>
                <meta name="twitter:title" content="${this.artJSON.page_title} | Wiki |">` : ''
            }

            <meta property="article:tag" content="${this.artJSON.page_title}">
            <meta property="article:published_time" content="${this.artJSON.metadata.creation_timestamp }" />
            <meta property="article:modified_time" content="${this.artJSON.metadata.last_modified }" />
            <meta property="og:image" content="${this.artJSON.main_photo.url}?nocache=${RANDOMSTRING}" />
            <meta property="og:image" content="${this.artJSON.main_photo.thumb}" />
            <meta property="og:description" content="${BLURB_SNIPPET_PLAINTEXT}"/>
            <meta name="og:url" content="https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}">

            <meta name="twitter:image" content="${this.artJSON.main_photo.url}?nocache=${RANDOMSTRING}">
            <meta name="twitter:image" content="${this.artJSON.main_photo.thumb}">
            <meta name="twitter:description" content="${BLURB_SNIPPET_PLAINTEXT}">
            <meta name="twitter:url" content="https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}">
            
            <meta property="fb:app_id" content="1617004011913755" />
            <meta property="fb:pages" content="328643504006398"/>
            <meta property="article:author" content="https://www.facebook.com/everipedia">


            <link rel="canonical" href="https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}" />
            ${"// NEED TO PUT THE HREFLANGS HERE"}
        
            <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
            <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
        `;
    }

    renderNavBar = (): string => {
        return `
            <nav class="amp-header-bar">
                <ul>
                    <li class="amp-header-toc">
                        <button on='tap:sidebar.toggle'>
                            <amp-img height="24" width="30" layout="fixed" alt="{% trans 'Table of contents and facts for this wiki' %}" src="https://epcdn-vz.azureedge.net/static/images/bull-icon.png" ></amp-img>
                        </button>
                    </li>
                    <li class="amp-header-logo">
                        <a rel='nofollow' href="https://everipedia.org">
                            <amp-img width='45' height='36' layout='fixed' src='https://epcdn-vz.azureedge.net/static/images/Everipedia_Logo.svg' alt='Everipedia Logo' ></amp-img>
                        </a>
                    </li>
                    <li class="amp-header-menu">
                        <button on='tap:guestmenu-lightbox'>
                        <span class="bull-menu">
                            <amp-img height="25" width="7" layout="fixed" alt="{% trans 'Bullet' %}" src="https://epcdn-vz.azureedge.net/static/images/bull-menu.png" ></amp-img>
                        </span>
                        </button>
                    </li>
                    <li class="amp-header-search">
                        <button on="tap:search-lightbox" data-description="Search Bar"><span class="svgIcon svgIcon--search svgIcon--25px u-textColorNormal u-baseColor--iconLight"><svg class="svgIcon-use" width="30" height="30" viewBox="0 0 25 25"><path d="M20.067 18.933l-4.157-4.157a6 6 0 1 0-.884.884l4.157 4.157a.624.624 0 1 0 .884-.884zM6.5 11c0-2.62 2.13-4.75 4.75-4.75S16 8.38 16 11s-2.13 4.75-4.75 4.75S6.5 13.62 6.5 11z"></path></svg></span></button>
                    </li>
                </ul>
            </nav>
        `
    }

    renderMainMeta = (AMP_PHOTO_HEIGHT: string, AMP_PHOTO_WIDTH: string, OVERRIDE_MAIN_THUMB: string | null, RANDOMSTRING: string): string => {
        return `
            ${ this.artJSON.metadata.page_type == 'Person' ?
                `<meta itemprop="keywords" content="${this.artJSON.page_title} wiki, ${this.artJSON.page_title} bio" >` :
            this.artJSON.metadata.page_type == 'Product' ?
                `<meta itemprop="keywords" content="${this.artJSON.page_title} wiki, ${this.artJSON.page_title} review">` :
            this.artJSON.metadata.page_type == 'Organization' ?
                `<meta itemprop="keywords" content="${this.artJSON.page_title} wiki, ${this.artJSON.page_title} review">` :
            this.artJSON.metadata.page_type ?
                `<meta itemprop="keywords" content="${this.artJSON.page_title} wiki, ${this.artJSON.page_title} history, ${this.artJSON.page_title} review">` : ``
            }

            <meta itemprop="mainEntityOfPage" content="https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}"/>
            <meta itemprop="url" content="https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}">
            ${ this.artJSON.metadata.page_type == 'Person' ?
                `<meta itemprop="headline" content="${this.artJSON.page_title}'s biography and wiki on Everipedia">` :
            this.artJSON.metadata.page_type == 'Product' ?
                `<meta itemprop="headline" content="${this.artJSON.page_title}'s wiki & review on Everipedia">` :
            this.artJSON.metadata.page_type == 'Organization' ?
                `<meta itemprop="headline" content="${this.artJSON.page_title}'s wiki & review on Everipedia">` :
            this.artJSON.metadata.page_type ?
                `<meta itemprop="headline" content="${this.artJSON.page_title}'s wiki on Everipedia">` : ``
            }
            
            <meta itemprop="articleSection" content="News, Trending">
            <meta itemprop="author" content="Everipedia">
            <meta itemprop="copyrightHolder" content="Everipedia">

            ${ this.artJSON.main_photo.url ?
                `<abbr itemprop="image" itemscope itemtype="http://schema.org/ImageObject">
                    ${ OVERRIDE_MAIN_THUMB ? 
                        `<meta itemprop="url" content="${OVERRIDE_MAIN_THUMB}?nocache=${RANDOMSTRING}">` : 
                    this.artJSON.main_photo.url ? 
                        `<meta itemprop="url" content="${this.artJSON.main_photo.url}?nocache=${RANDOMSTRING}">` : ``
                    }
                    <meta itemprop="name" content="${this.artJSON.page_title}">
                    <meta itemprop="caption" content="${this.artJSON.page_title}">
                    <meta itemprop="uploadDate" content="${this.artJSON.metadata.last_modified}">
                    <meta itemprop="height" content="${AMP_PHOTO_HEIGHT}">
                    <meta itemprop="width" content="${AMP_PHOTO_WIDTH}">
                </abbr>` :
            true ?
                `<abbr itemprop="image" itemscope itemtype="http://schema.org/ImageObject">
                    <meta itemprop="url" content="https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png">
                    <meta itemprop="name" content="${this.artJSON.page_title}">
                    <meta itemprop="caption" content="${this.artJSON.page_title}">
                    <meta itemprop="uploadDate" content="${this.artJSON.metadata.last_modified}">
                    <meta itemprop="height" content="1274">
                    <meta itemprop="width" content="1201">
                </abbr>` : ``
            }

            <abbr itemprop="publisher" itemid="https://everipedia.org/" itemscope itemtype="https://schema.org/Organization">
                <meta itemprop="name" content="Everipedia">
                <meta itemprop="legalName" content="Everipedia International">
                <meta itemprop="sameAs" content="https://twitter.com/everipedia">
                <meta itemprop="sameAs" content="https://www.facebook.com/everipedia/">
                <abbr itemprop="logo" itemscope itemtype="https://schema.org/ImageObject">
                    <meta itemprop="url" content="https://epcdn-vz.azureedge.net/static/images/logo_600x60.png">
                    <meta itemprop="width" content="600">
                    <meta itemprop="height" content="60">
                </abbr >
            </abbr >
            <meta itemprop="datePublished" content="${this.artJSON.metadata.creation_timestamp}"/>
            <meta itemprop="dateModified" content="${this.artJSON.metadata.last_modified}"/>
        `
    }

    renderMainPhoto = (AMP_PHOTO_HEIGHT: string, AMP_PHOTO_WIDTH: string, OVERRIDE_MAIN_THUMB: string | null, RANDOMSTRING: string): string => {
        let ampSanitizedPhotoComment = "NEED TO HAVE SENTENCE-CONCATTED, AMP SANITIZED CAPTION HERE";
        return `
            ${ this.artJSON.metadata.page_type == 'Person' ?
                `<abbr itemprop="homeLocation" itemscope itemtype="http://schema.org/Place" >
                    <meta itemprop="name" content="Earth" />
                </abbr>` : ``
            }
            ${ this.artJSON.main_photo.url ?
                `<abbr itemprop="image" itemscope itemtype="http://schema.org/ImageObject">
                    ${ OVERRIDE_MAIN_THUMB ? 
                        `<meta itemprop="url" content="${OVERRIDE_MAIN_THUMB}?nocache=${RANDOMSTRING}">` : 
                    this.artJSON.main_photo.url ? 
                        `<meta itemprop="url" content="${this.artJSON.main_photo.url}?nocache=${RANDOMSTRING}">` : ``
                    }
                    <meta itemprop="name" content="${this.artJSON.page_title}">
                    <meta itemprop="caption" content="${this.artJSON.page_title}">
                    <meta itemprop="uploadDate" content="${this.artJSON.metadata.last_modified}">
                    <meta itemprop="height" content="${AMP_PHOTO_HEIGHT}">
                    <meta itemprop="width" content="${AMP_PHOTO_WIDTH}">
                </abbr>` : 
            true ? 
                `<abbr itemprop="image" itemscope itemtype="http://schema.org/ImageObject">
                    <meta itemprop="url" content="https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png">
                    <meta itemprop="name" content="${this.artJSON.page_title}">
                    <meta itemprop="caption" content="${this.artJSON.page_title}">
                    <meta itemprop="uploadDate" content="${this.artJSON.metadata.last_modified}">
                    <meta itemprop="height" content="1274">
                    <meta itemprop="width" content="1201">
                </abbr>` : ``
            }
            ${ this.artJSON.main_photo.url ?
                `<figure class="blurb-photo-container" id="toc-top">
                ${ this.artJSON.main_photo.attribution_url ? 
                    `<a class="blurb-photo-anchor" href="${this.artJSON.main_photo.attribution_url}" rel="nofollow" target="_blank">` : 
                true ? 
                    `<a class="blurb-photo-anchor" href="${this.artJSON.main_photo.url}?nocache=${RANDOMSTRING}" rel="nofollow" target="_blank">` : ``
                }
                    ${ OVERRIDE_MAIN_THUMB ? 
                        `<amp-anim id="mainphoto" itemprop="image" width='${AMP_PHOTO_WIDTH}' height='${AMP_PHOTO_HEIGHT}' layout='responsive' src="${OVERRIDE_MAIN_THUMB}?nocache=${RANDOMSTRING}" 
                            alt="
                                ${ this.artJSON.metadata.page_type == 'Person' ?
                                    `${this.artJSON.page_title} wiki, ${this.artJSON.page_title} bio` : 
                                this.artJSON.metadata.page_type == 'Product' ?
                                    `${this.artJSON.page_title} wiki, ${this.artJSON.page_title} review` : 
                                this.artJSON.metadata.page_type == 'Organization' ?
                                    `${this.artJSON.page_title} wiki, ${this.artJSON.page_title} review, ${this.artJSON.page_title} history` : 
                                true ? 
                                    `${this.artJSON.page_title} wiki, ${this.artJSON.page_title} history` : ``
                                }
                        ">
                            <amp-img placeholder class="mainphoto-placeholder" width="1274" height="1201" layout='responsive' src="https://epcdn-vz.azureedge.net/static/images/no-image-slide.png"></amp-img>
                        </amp-anim>` : 
                    true ? 
                        `<amp-img id="mainphoto" itemprop="image" width='${AMP_PHOTO_WIDTH}' height='${AMP_PHOTO_HEIGHT}' layout='responsive' src="${this.artJSON.main_photo.url}?nocache=${RANDOMSTRING}" 
                            alt="
                                ${ this.artJSON.metadata.page_type == 'Person' ?
                                    `${this.artJSON.page_title} wiki, ${this.artJSON.page_title} bio` : 
                                this.artJSON.metadata.page_type == 'Product' ?
                                    `${this.artJSON.page_title} wiki, ${this.artJSON.page_title} review` : 
                                this.artJSON.metadata.page_type == 'Organization' ?
                                    `${this.artJSON.page_title} wiki, ${this.artJSON.page_title} review, ${this.artJSON.page_title} history` : 
                                true ? 
                                    `${this.artJSON.page_title} wiki, ${this.artJSON.page_title} history` : ``
                                }
                        ">
                            <amp-img placeholder width="250" height="250" layout='responsive' src="${this.artJSON.main_photo.thumb}?nocache=${RANDOMSTRING}"></amp-img>
                        </amp-img>` : ``
                    }
                    </a>
                </figure>` : 
            true ? 
                `<div class="noavatar-filler"></div>` : ``
            }

            ${ this.artJSON.main_photo.caption ?
                `<figcaption class="mainphoto-caption">${ampSanitizedPhotoComment}</figcaption>` : ``
            }
        `;
    }

    renderNameContainer = (): string => {
        return `
            <div class="name-container">
                <h1>
                    <span>${this.artJSON.page_title}</span>
                </h1>
                ${ this.artJSON.metadata.page_type == 'Person' ?
                    `<amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} news, who is ${this.artJSON.page_title}, where is ${this.artJSON.page_title}" ></amp-anim>
                    <amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} real name, how old is ${this.artJSON.page_title}" ></amp-anim>` : 
                this.artJSON.metadata.page_type == 'Product' ?
                    `<amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} news, what is ${this.artJSON.page_title}" ></amp-anim>` : 
                this.artJSON.metadata.page_type == 'Organization' ?
                    `<amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} news, what is ${this.artJSON.page_title}, where is ${this.artJSON.page_title}" ></amp-anim>` : 
                true ? 
                    `<amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} news, what is ${this.artJSON.page_title}" ></amp-anim>` : ``
                }
                <div id="title-buttonset">
                    <div class="tlbx-ct-wrapper">
                        <div class="tlbx-ct">
                            <ul>
                                <li><a rel='nofollow' href="https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}/edit/" class="icon"><i class="fa fa-pencil"></i></a></li>
                                <li><button on="tap:share-lightbox" aria-label="Share" class="icon"><i class="fa fa-share-alt"></i></button></li>
                                <li><a rel='nofollow' href="https://everipedia.org/vote/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}" class="icon"><i class="fa fa-archive"></i></a></li>
                                <li class="language-tile">
                                    <button on="tap:language-lightbox" aria-label="Languages" class="icon">
                                        <amp-img id="flag-button" height="35" width="35" alt="Language flag" layout="fixed" class="page-lang-dropdown-flag" src="https://epcdn-vz.azureedge.net/static/images/flags/png/48/languages/${this.artJSON.metadata.page_lang}.png"></amp-img>
                                        <span class="flag-lang-plain">${this.artJSON.metadata.page_lang.substring(0,2)}</span>
                                    </button>
                                </li>
                                ${ this.artJSON.metadata.pageviews > 50 ?
                                    `<li class="pageviews-tile">
                                        <a rel='nofollow' href="#" class="icon"><i class="fa fa-eye"></i></a>
                                        <span class="views-nr">${this.artJSON.metadata.pageviews.toLocaleString()}</span>
                                    </li>` : ``
                                }
                                ${ this.artJSON.metadata.page_type == 'Person' ?
                                    `<amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} religion, ${this.artJSON.page_title} interview, ${this.artJSON.page_title} life, ${this.artJSON.page_title} website" ></amp-anim>
                                    <amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} wife, ${this.artJSON.page_title} family, ${this.artJSON.page_title} education, ${this.artJSON.page_title} measurements, ${this.artJSON.page_title} email" ></amp-anim>
                                    <amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} phone, ${this.artJSON.page_title} salary, ${this.artJSON.page_title} address, ${this.artJSON.page_title} history, ${this.artJSON.page_title} facts" ></amp-anim>
                                    <amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} wikipedia, ${this.artJSON.page_title} news, who is ${this.artJSON.page_title}, where is ${this.artJSON.page_title}" ></amp-anim>` : 
                                this.artJSON.metadata.page_type == 'Product' ?
                                    `<amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} designer, ${this.artJSON.page_title} sales, ${this.artJSON.page_title} facts" ></amp-anim>
                                    <amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} wikipedia, ${this.artJSON.page_title} news, what is ${this.artJSON.page_title}" ></amp-anim>` : 
                                this.artJSON.metadata.page_type == 'Organization' ?
                                    `<amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} ownership, ${this.artJSON.page_title} email, ${this.artJSON.page_title} address, ${this.artJSON.page_title} phone, ${this.artJSON.page_title} headquarters" ></amp-anim>
                                    <amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} revenue, ${this.artJSON.page_title} employees, ${this.artJSON.page_title} location, ${this.artJSON.page_title} facts" ></amp-anim>
                                    <amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} wikipedia, ${this.artJSON.page_title} news, what is ${this.artJSON.page_title}, where is ${this.artJSON.page_title}" ></amp-anim>` : 
                                true ? 
                                    `<amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} information, ${this.artJSON.page_title} definition, ${this.artJSON.page_title} timeline, ${this.artJSON.page_title} location" ></amp-anim>
                                    <amp-anim height='1' width='1' layout='fixed' class='micro-image-top' src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} wikipedia, ${this.artJSON.page_title} news, what is ${this.artJSON.page_title}" ></amp-anim>` : ``
                                }
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPageBody = (): string => {
        let sections: Section[] = this.artJSON.page_body
        return `PAGE BODY`;
    }

    renderInfoboxes = (): string => {
        let infoboxes: Infobox[] = this.artJSON.infoboxes
        return `INFOBOXES`;
    }

    renderMediaGallery = (): string => {
        let media: Media[] = this.artJSON.media_gallery
        return `MEDIA GALLERY`;
    }

    renderCitations = (): string => {
        let citations: Citation[] = this.artJSON.citations;
        return (citations.length > 0) ? `
            <div id="link_list_container_mobile_wrapper">
                <span id="referenceList" class="toc-span-fix"></span>
                <amp-accordion>
                <section expanded>
                    <h2 class="acc-header">
                        ${ this.artJSON.metadata.page_type == 'Person' ?
                            `Reference Links For This Biography` :
                        true ?
                            `Reference Links For This Wiki` : ``
                        }
                        <span class="icon"><i class="fa fa-chevron-down"></i>
                            <amp-anim class='micro-image' height="10" width="10" layout="fixed" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="Links to historical reviews, career / educational facts, and other encyclopedic information" />
                        </span>
                    </h2>
                    <div class="l-lst-header" id="link_list_container">
                        <div class="ll-wrapper">
                            <div class="disclaimer">All information for ${this.artJSON.page_title}'s wiki comes from the below links. Any source is valid, including Twitter, Facebook, Instagram, and LinkedIn. Pictures, videos, biodata, and files relating to ${this.artJSON.page_title} are also acceptable encyclopedic sources.</div>
                            <ul class="l-lst">
                                LINK LOOP HERE
                            </ul>
                        </div>
                    </div>
                </section>
                </amp-accordion>
            </div>
        ` : ``;
    }    

    renderSeeAlso = (): string => {
        return `SEEALSO`
    }

    renderFooter = (): string => {
        // let seealsos: SeeAlso[] = calculatedSeeAlsos
        return `
            <div class="footer-wrapper">
                <amp-anim class='gif-pixel-fix' width=1 height=1 alt="GIF Pixel" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
                    <amp-img placeholder width=1 height=1 src="https://epcdn-vz.azureedge.net/static/images/white_dot.png">
                    </amp-img>
                </amp-anim>
                <div class="footer-links">
                    <a href="/everipedia/">About</a>
                    <a href="/wiki/everipedia-faq/">FAQ</a>
                    <a href="/contact/">Contact</a>
                    <a rel="nofollow" href="https://www.reddit.com/r/Everipedia/">Forum</a>
                    <a href="/wiki/everipedia-terms/">Terms</a>
                    <a href="/exchange-listings/">Get IQ</a>
                    <a rel="nofollow" href="/investor-relations/">Investors</a>
                </div>
                <div class="footer-separator"></div>
                <div class="copyright">
                <amp-img class='cc-img' width="15" height="15" layout='fixed' alt="Creative Commons" src="https://epcdn-vz.azureedge.net/static/images/cc.png"></amp-img>&nbsp;<span>2019 Everipedia International</span>
                    <amp-img class='cayman-flag-footer' width="21" height="20" layout='fixed' alt="Cayman Flag" src="https://epcdn-vz.azureedge.net/static/images/flags/cayman_flag.svg"></amp-img>
                    <span class="disclaimer">By using this website, you agree to the <a href="/wiki/everipedia-terms/">Terms of Use</a>. Everipedia® is a trademark of Everipedia International.</span>
                </div>
            </div>
            <div class="footer-social">
                <a class='social-logo' href="http://facebook.com/everipedia" title="Everipedia on Facebook">
                    <amp-img height="26" width="26" layout="fixed" alt="Facebook" src="https://epcdn-vz.azureedge.net/static/images/facebook.png"></amp-img>
                </a>
                <a class='social-logo' href="http://twitter.com/everipedia" title="Everipedia on Twitter">
                    <amp-img height="26" width="26" layout="fixed" alt="Twitter" src="https://epcdn-vz.azureedge.net/static/images/twitter.png"></amp-img>
                </a>
                    <a class='social-logo' href="https://www.reddit.com/r/Everipedia/" title="Everipedia on Reddit">
                    <amp-img height="26" width="26" layout="fixed" alt="Reddit" src="https://epcdn-vz.azureedge.net/static/images/reddit.png"></amp-img>
                </a>
                <a class='social-logo' href="https://t.me/everipedia" title="Everipedia on Telegram">
                    <amp-img height="26" width="26" layout="fixed" alt="Telegram" src="https://epcdn-vz.azureedge.net/static/images/telegram.png"></amp-img>
                </a>
                <a class='social-logo' href="https://blockfolio.com/coin/IQ" title="IQ token on Blockfolio">
                    <amp-img height="26" width="26" layout="fixed" alt="Blockfolio" src="https://epcdn-vz.azureedge.net/static/images/blockfolio.svg"></amp-img>
                </a>
            </div>
            <div class="eos-powered-line">
                <span id="powered-by-eos">Powered by <a class="eos-link" href="https://eos.io/">EOS.IO</a></span>
                <a class="eos-link" href="https://eos.io/">
                    <amp-img class="eos-footer-img" height="26" width="26" layout="fixed" src="https://epcdn-vz.azureedge.net/static/images/eos-logo.png" ></amp-img>
                </a>
                <span id="api-by-libertyblock">API by <a class="liberty-link" href="https://libertyblock.io/">LibertyBlock</a></span>
                <a class="liberty-link" href="https://eos.io/">
                    <amp-img class="liberty-footer-img" height="40" width="50" layout="fixed" src="https://epcdn-vz.azureedge.net/static/images/libertyblock.png" ></amp-img>
                </a>
                <span id="api-by-scatter">and <a class="scatter-link" href="https://get-scatter.com/">Scatter</a></span>
                <a class="scatter-link" href="https://get-scatter.com/">
                    <amp-img class="scatter-footer-img" height="35" width="26" layout="fixed" src="https://epcdn-vz.azureedge.net/static/images/scatter.png" ></amp-img>
                </a>
            </div>
        `; 
    }   

    renderTableOfContents = (): string => {
        return `TABLE OF CONTENTS`
    }

    renderUserMenu = (): string => {
        return `
            <div class="lightbox" tabindex="1" role="menubar">
                <div class="usermenu-toggle-space" on='tap:guestmenu-lightbox.close' tabindex="3" role="menubar">
                </div>
                <div class="usermenu-ct">
                    <div class="usermenu-header">
                            <div class="loggedin-default">Menu</div>
                    </div>
                    <ul>
                        <li>
                            <a rel="nofollow" href="/login/">
                                <span class="icon"><i class="fa fa-key"></i></span>
                                <div class="fixed-items-description">Log In / Register</div>
                            </a>
                        </li>
                        <li>
                            <a rel="nofollow" href="/wiki/everipedia-faq/">
                                <span class="icon"><i class="fa fa-question"></i></span>
                                <div class="fixed-items-description">Help</div>
                            </a>
                        </li>

                        <li>
                            <a rel="nofollow" href="https://www.reddit.com/r/Everipedia/">
                                <span class="icon"><i class="fa fa-list"></i></span>
                                <div class="fixed-items-description">Forum</div>
                            </a>
                        </li>
                        <li>
                            <a rel="nofollow" href="/recent-activity/">
                                <span class="icon"><i class="fa fa-bolt"></i></span>
                                <div class="fixed-items-description">Feed</div>
                            </a>
                        </li>
                        <li>
                            <a rel="nofollow" href="/language-selector/">
                                <span class="icon"><i class="fa fa-language"></i></span>
                                <div class="fixed-items-description">Language</div>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        `
    }

    renderSearch = (): string => {
        return `  
        <div class="lightbox" tabindex="3" role="search">
            <div class="search-lb-ct">
                <div class="global-search" id="searchfield_index">
                    <amp-iframe
                        sandbox="allow-scripts allow-pointer-lock allow-popups allow-top-navigation allow-same-origin"
                        layout="flex-item"
                        frameborder="0"
                        src="https://www.everipedia.org/search/iframe/">
                        <div placeholder></div>
                    </amp-iframe>
                </div>
                <div class="search-toggle-space-bottom" on='tap:search-lightbox.close' tabindex="5" role="button">
                </div>
            </div>
	    </div>
        `
    }

    renderSchemaJSON = (): string => {
        // Perhaps you should do this while you are looping through the other functions
        return `SCHEMA JSON`;
    }    
}
