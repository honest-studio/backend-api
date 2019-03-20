import { ArticleJson } from './article-dto';
import { Citation, Infobox, Media, Section } from './article-dto';

export class AmpRenderPartial {
    public artJSON: ArticleJson;
    constructor(inputJSN) {
        this.artJSON = inputJSN;
    }

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
        let citations: Citation[] = this.artJSON.citations
        return `CITATIONS`; 
    }    

    renderSchemaJSON = (): string => {
        // Perhaps you should do this while you are looping through the other functions
        return `SCHEMA JSON`;
    }    
}
