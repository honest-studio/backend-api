import { ArticleJson, AMPParseCollection } from './article-dto';
import { Citation, Infobox, Media, Section } from './article-dto';
import { CheckForLinksOrCitationsAMP } from '../utils/article-utils';
import { getYouTubeID, renderParagraph, renderImage } from './article-converter';
import { LanguagePack } from './wiki.service';
var striptags = require('striptags');

export class AmpRenderPartial {
    public artJSON: ArticleJson;
    public allLightBoxes: string[] = [];
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
                <meta property="og:title" content="${this.artJSON.page_title}"/>
                <meta name="twitter:title" content="${this.artJSON.page_title} | Wiki & Bio |">` :
            this.artJSON.metadata.page_type == 'Product' ?
                `<title>${this.artJSON.page_title} | Wiki & Review | Everipedia</title>
                <meta property="og:title" content="${this.artJSON.page_title}"/>
                <meta name="twitter:title" content="${this.artJSON.page_title} | Wiki & Review |">` :
            this.artJSON.metadata.page_type == 'Organization' ?
                `<title>${this.artJSON.page_title} | Wiki & Review | Everipedia</title>
                <meta property="og:title" content="${this.artJSON.page_title}"/>
                <meta name="twitter:title" content="${this.artJSON.page_title} | Wiki & Review |">` :
            this.artJSON.metadata.page_type ?
                `<title>${this.artJSON.page_title} | Wiki | Everipedia</title>
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

    

    renderMainPhoto = (AMP_PHOTO_HEIGHT: string, AMP_PHOTO_WIDTH: string, OVERRIDE_MAIN_THUMB: string | null, RANDOMSTRING: string): string => {
        let ampSanitizedPhotoComment = "NEED TO HAVE SENTENCE-CONCATTED, AMP SANITIZED CAPTION HERE";
        return `
            ${ this.artJSON.metadata.page_type == 'Person' ?
                `<abbr itemprop="homeLocation" itemscope itemtype="http://schema.org/Place" >
                    <meta itemprop="name" content="Earth" />
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

    renderFirstParagraph = (): string => {
        let firstSection: Section = this.artJSON.page_body[0];
        let imageBlock = firstSection.images.map((image, imageIndex) => {
            let result: AMPParseCollection = renderImage(image, this.artJSON.citations, this.artJSON.metadata.ipfs_hash);
            this.allLightBoxes.push(...result.lightboxes);
            return result.text;
        }).join("");
        let paraBlock = firstSection.paragraphs.map((value, index) => {
            let result: AMPParseCollection = renderParagraph(value, this.artJSON.citations, this.artJSON.metadata.ipfs_hash);
            this.allLightBoxes.push(...result.lightboxes);
            return result.text;
        }).join("");
        return `
            <div class="entry-content" id="first-paragraph" itemprop="description">
                <div class="entry-content-inner-wrap">
                    ${imageBlock}${paraBlock}
                </div>
            </div>
        `;
    }

    renderPageBody = (): string => {
        let otherSections: Section[] = this.artJSON.page_body.slice(1);
        let comboSections = otherSections.map((section, sectionIndex) => {
            let imageBlock = section.images.map((image, imageIndex) => {
                let result: AMPParseCollection = renderImage(image, this.artJSON.citations, this.artJSON.metadata.ipfs_hash);
                this.allLightBoxes.push(...result.lightboxes);
                return result.text;
            }).join("");
            let paraBlock = section.paragraphs.map((paragraph, paraIndex) => {
                let result: AMPParseCollection = renderParagraph(paragraph, this.artJSON.citations, this.artJSON.metadata.ipfs_hash);
                this.allLightBoxes.push(...result.lightboxes);
                return result.text;
            }).join("");
            return `${imageBlock}${paraBlock}`;
        }).join("");

        return `
            <div class="entry-content">
                <div class="entry-content-inner-wrap">
                    ${comboSections}
                </div>
            </div>
        `;
    }

    renderOneInfobox = (infobox: Infobox, index: number): string => {
        return `
            <li>
                <div class="info-qt">
                    <h3>${infobox.key}</h3>
                </div>
                ${infobox.values.map((value, index) => {
                    let result = CheckForLinksOrCitationsAMP(value.text, this.artJSON.citations, this.artJSON.metadata.ipfs_hash);
                    result.lightboxes.forEach((value, index) => {
                        this.allLightBoxes.push(value);
                    })
                    // return result.text;
                    return `
                        <div class="info-an">
                            ${result.text}
                        </div>
                    `
                }).join("")}
            </li>
        `;
    }

    renderInfoboxes = (): string => {
        let infoboxes: Infobox[] = this.artJSON.infoboxes;
        if  (!((infoboxes && infoboxes.length > 0) || (this.artJSON.infobox_html && this.artJSON.infobox_html.length > 0))){ return ``; }
        let blobboxComboString = this.artJSON.infobox_html;
        let infoboxComboString = infoboxes.map((value, index) => {
            return this.renderOneInfobox(value, index);
        }).join("");
        return `
            <amp-accordion class="infobox-accordion">
                <section id="infobox_section" class="infobox-main-wrap" expanded>
                    <h2 class="qf-header">
                        ${ this.artJSON.metadata.page_type == 'Person' ?
                            `Quick Biography` :
                        true ?
                            `Quick Facts For This Wiki` : ``
                        }
                        <span class="icon"><i class="fa fa-chevron-down"></i></span>
                    </h2>
                    ${ this.artJSON.infobox_html && this.artJSON.infobox_html.length != 0 ? 
                        `<div id="blobBox_container">
                            ${blobboxComboString}
                        </div>` : ``
                    }
                    <div class="infbx-ct">
                    ${ infoboxes.length != 0 ? 
                        `<ul class="list-unstyled list-spaced list-plural infobox">
                            ${infoboxComboString}
                        </ul>` : ``
                    }
                    </div>
                </section>
            </amp-accordion>
        `;
    }

    renderOneMedia = (media: Media, index: number): string => {
        const RANDOMSTRING = Math.random().toString(36).substring(7);
        let sanitizedCaption = media.caption.map((value, index) => {
            let result = CheckForLinksOrCitationsAMP(value.text, this.artJSON.citations, this.artJSON.metadata.ipfs_hash);
            result.lightboxes.forEach((value, index) => {
                this.allLightBoxes.push(value);
            })
            return result.text;
        }).join("");
        let sanitizedCaptionPlaintext = striptags(sanitizedCaption);
        
        return `
            ${ media.category == "PICTURE" ?
                `<div class="tile-ct">
                    <div class="">
                        <span>
                            <a rel='nofollow' class="photo-gallery-anchor" href="${media.url}" data-target="${media.url}" title="${sanitizedCaptionPlaintext}">
                                <amp-img width=150 height=150 layout="responsive" src="${media.url}" data-image="${media.url}" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                                    <amp-img placeholder width=150 height=150 src="${media.thumb}" layout="fill"></amp-img>
                                </amp-img>
                            </a>
                        </span>
                    </div>
                    <div class="tile-desc">
                        ${ media.attribution_url && media.attribution_url != "None" ? 
                            `<a class="grid-attribution" rel="nofollow" target="_blank" href="${media.attribution_url}">
                                <i class="fa fa-info-circle"></i>
                            </a>` : ``
                        }
                        ${sanitizedCaption}
                    </div>
                </div>` : 
            media.category == "GIF" ?
                `<div class="tile-ct">
                    <div class="">
                        <span>
                            <a rel='nofollow' class="photo-gallery-anchor" href="${media.url}" data-target="${media.url}" title="${sanitizedCaptionPlaintext}">
                                <amp-anim width=150 height=150 layout="responsive" src="${media.url}" data-image="${media.url}" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                                <amp-img placeholder width=150 height=150 src="${media.thumb}" layout="fill"></amp-img>
                                </amp-anim>
                            </a>
                        </span>
                    </div>
                    <div class="tile-desc">
                        ${ media.attribution_url && media.attribution_url != "None" ? 
                            `<a class="grid-attribution" rel="nofollow" target="_blank" href="${media.attribution_url}">
                                <i class="fa fa-info-circle"></i>
                            </a>` : ``
                        }
                        ${sanitizedCaption}
                    </div>
                </div>` : 
            media.category == "YOUTUBE" ?
                `<div class="tile-ct">
                    <a rel='nofollow' href="${media.url}" title="Link to video">
                    <span>
                        <amp-youtube
                            data-videoid="${getYouTubeID(media.url)}"
                            layout="responsive"
                            width=150
                            height=150>
                        </amp-youtube>
                    </span>
                    <div class="tile-desc">
                        ${ media.attribution_url && media.attribution_url != "None" ? 
                            `<a class="grid-attribution" rel="nofollow" target="_blank" href="${media.attribution_url}">
                                <i class="fa fa-info-circle"></i>
                            </a>` : ``
                        }
                        ${sanitizedCaption}
                    </div>
                    </a>
                </div>` :  
            media.category == "NORMAL_VIDEO" ?
                `<div class="tile-ct">
                    <a rel='nofollow' href="${media.url}" title='Link to video'>
                    <span>
                        <div id="video-${media.url}" class="video-wrapper">
                            <div class="video-overlay"></div>
                            <amp-video
                                width=150
                                height=150
                                layout="responsive"
                                preload="metadata"
                                poster='https://epcdn-vz.azureedge.net/static/images/placeholder-video.png'>
                                    <source src="${media.url}#t=0.1" type="${media.mime}">
                                    Please click to play the video.
                            </amp-video>
                        </div>
                    </span>
                    <div class="tile-desc">
                        ${ media.attribution_url && media.attribution_url != "None" ? 
                            `<a class="grid-attribution" rel="nofollow" target="_blank" href="${media.attribution_url}">
                                <i class="fa fa-info-circle"></i>
                            </a>` : ``
                        }
                        ${sanitizedCaption}
                    </div>
                    </a>
                </div>` : 
            media.category == "AUDIO" ?
                `<div class="tile-ct">
                    <a rel='nofollow' href="${media.url}" title="Link to recording">
                    <span>
                        <amp-img width=150 height=150 layout="responsive" src="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" data-image="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                            <amp-img placeholder width=150 height=150 src="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" layout="fill"></amp-img>
                        </amp-img>
                    </span>
                    <div class="tile-desc">
                        ${ media.attribution_url && media.attribution_url != "None" ? 
                            `<a class="grid-attribution" rel="nofollow" target="_blank" href="${media.attribution_url}">
                                <i class="fa fa-info-circle"></i>
                            </a>` : ``
                        }
                        ${sanitizedCaption}
                    </div>
                    </a>
                </div>` : 
            true ? 
                `` : ``
            }

            
        `;
    }

    renderMediaGallery = (): string => {
        let media: Media[] = this.artJSON.media_gallery
        if(media.length == 0) return ``;
        let mediaComboString = media.map((value, index) => {
            return this.renderOneMedia(value, index);
        }).join("");
        return `
            <span id="gallery" class="toc-span-fix"></span>
            <amp-accordion  class="media-gallery-accordion">
                <section expanded>
                    <h2 class="acc-header" id="mediaGallery">Image & Video Gallery
                        <span class="icon"><i class="fa fa-chevron-down"></i>
                            <amp-anim class='micro-image' height="10" width="10" layout="fixed" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="${this.artJSON.page_title} images, pictures, and videos" />
                        </span>
                    </h2>
                    <div class="pic-video-container">
                        <div class="photo-gallery">
                            ${mediaComboString}
                        </div>
                    </div>
                </section>
            </amp-accordion>
        `;
    }

    renderOneCitation = (citation: Citation, index: number): string => {
        let sanitizedDescription = citation.description.map((value, index) => {
            let result = CheckForLinksOrCitationsAMP(value.text, this.artJSON.citations, this.artJSON.metadata.ipfs_hash);
            result.lightboxes.forEach((value, index) => {
                this.allLightBoxes.push(value);
            })
            return result.text;
        }).join("");

        return `
            <li>
                ${ citation.thumb && citation.thumb != 'None' ?
                    `<a class='avatar-wrap' ${citation.attribution} href="${citation.url}" title="Preview Thumbnail">
                        <amp-img alt='Thumbnail' class="link-image" width=50 height=50 layout="fixed" src="${citation.url}" >
                            <amp-img placeholder width=50 height=50 src="https://epcdn-vz.azureedge.net/static/images/link-2.png" layout="fill"></amp-img>
                        </amp-img>
                    </a>` : ``
                }

                <div class="link-box-right">
                    <div class="link-url">
                        ${ citation.social_type && citation.social_type != 'None' ? 
                            `<span itemprop="sameAs"><a href="${citation.url}" class="link-box-url" ${citation.attribution} target="_blank">${citation.url}</a></span>` : 
                        true ? 
                            `<a href="${citation.url}" class="link-box-url" ${citation.attribution} target="_blank">${citation.url}</a>` : ``
                        }
                    </div>
                    <div id="linksetid${citation.url}" class="link-comment">${sanitizedDescription}</div>
                    <div class="link-box-details">
                        <div class="link-date"><a href="${citation.url}" rel="nofollow">${citation.timestamp}</a></div>
                    </div>
            </li>
        `;
    }

    renderCitations = (): string => {
        let citations: Citation[] = this.artJSON.citations;
        if(citations.length == 0) return ``;
        let citationComboString = citations.map((value, index) => {
            return this.renderOneCitation(value, index);
        }).join("");

        return `
            <span id="referenceList" class="toc-span-fix"></span>
            <amp-accordion class='link-list-accordion'>
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
                            ${citationComboString}
                        </ul>
                    </div>
                </div>
            </section>
            </amp-accordion>
        `;
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

    renderSearchLightbox = (): string => {
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

    renderShareLightbox = (): string => {
        return `  
            <span class="lb-button cls-shr-lgbx"><button  on='tap:share-lightbox.close'></button></span>
            <nav class="lightbox" tabindex="7" role="widget">
                <div class="share-ct">
                    <div class="share-ct-inner">
                        <h2>Share this page</h2>
                        <div class="social-share-block-wrap">
                            <div class="social-share-block">
                                <a class="email social-share-btn" rel='nofollow' href="mailto:email@email.com?&body=https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}"></a>
                                <a class="facebook social-share-btn" rel='nofollow' href="https://www.facebook.com/sharer/sharer.php?u=https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}"></a>
                                <a class="twitter social-share-btn" rel='nofollow' href="http://twitter.com/share?text=https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}"></a>
                                <a class="reddit social-share-btn" rel='nofollow' href="https://reddit.com/submit?url=https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}"></a>
                            </div>
                        </div>
                    </div>
                    <div class="share-pad"></div>
                    <div class="share-ct-link">
                        <h4>DIRECT LINK</h4>
                        <a href="https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}">https://everipedia.org/wiki/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}</a>
                    </div>
                    <div class="share-pad"></div>
                    <div class="share-hshtgs">
                        <div class="suggested-tags">Suggested Hashtags</div>
                        <div class="social-share-block-wrap">
                            <ul class="tag-list">
                                ${ this.artJSON.metadata.page_type == 'Person' ?
                                    `<li>${this.artJSON.page_title} wiki</li>
                                    <li>${this.artJSON.page_title} bio</li>
                                    <li>${this.artJSON.page_title} net worth</li>
                                    <li>${this.artJSON.page_title} age</li>
                                    <li>${this.artJSON.page_title} married</li>` : 
                                this.artJSON.metadata.page_type == 'Product' ?
                                    `<li>${this.artJSON.page_title} wiki</li>
                                    <li>${this.artJSON.page_title} review</li>
                                    <li>${this.artJSON.page_title} history</li>
                                    <li>${this.artJSON.page_title} sales</li>
                                    <li>${this.artJSON.page_title} facts</li>` : 
                                this.artJSON.metadata.page_type == 'Organization' ?
                                    `<li>${this.artJSON.page_title} wiki</li>
                                    <li>${this.artJSON.page_title} review</li>
                                    <li>${this.artJSON.page_title} history</li>
                                    <li>${this.artJSON.page_title} founders</li>
                                    <li>${this.artJSON.page_title} facts</li>` : 
                                true ? 
                                    `<li>${this.artJSON.page_title} wiki</li>
                                    <li>${this.artJSON.page_title} review</li>
                                    <li>${this.artJSON.page_title} history</li>
                                    <li>${this.artJSON.page_title} encyclopedia</li>
                                    <li>${this.artJSON.page_title} facts</li>` : ``
                                }
                            </ul>
                        </div>
                    </div>
                    <div class="share-pad"></div>
                    <div class="share-ct-link qr-code-container">
                        <h4>QR Code</h4>
                        <amp-iframe
                            sandbox="allow-scripts allow-pointer-lock allow-popups allow-top-navigation"
                            layout="fixed"
                            height="225"
                            width="216"
                            frameborder="0"
                            src="https://www.everipedia.org/AJAX-REQUEST/AJAX_QR_Code_Iframe/lang_${this.artJSON.metadata.page_lang}/${this.artJSON.metadata.url_slug}">
                            <div placeholder></div>
                        </amp-iframe>
                    </div>
        
        
                </div>
            </nav>
        `
    }

    renderOneLanguage = (langPack: LanguagePack): string => {
        return `
            <li class="lang-li">
                <a rel="nofollow" href="/wiki/lang_${langPack.lang}/${langPack.slug}">
                    <amp-img class="mini-lang-flag" height="35" width="35" layout="fixed" alt="${langPack.article_title}" src="https://epcdn-vz.azureedge.net/static/images/flags/png/48/languages/${langPack.lang}.png"></amp-img>
                    <span class="mini-lang-title">${langPack.article_title}</span>
                </a>
            </li>
        `
    }

    renderLanguageLightboxes = (langPacks: LanguagePack[]): string => {
        if(langPacks.length == 0) return ``;
        let languageComboString = langPacks.map((value, index) => {
            return this.renderOneLanguage(value);
        }).join("");

        return `
            <span class="lb-button cls-lang-lgbx"><button  on='tap:language-lightbox.close'></button></span>
            <nav class="lightbox" tabindex="7" role="widget">
                <div class="lang-ct">
                    <h2>Alternate Languages</h2>
                    <ul class="lang-ul">
                        ${languageComboString}
                    </ul>
                </div>
            </nav>
        `
    }

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
                        "title": "{{ PAGETITLE }}"
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
    }   

    renderLightboxes = (): string => {
        return this.allLightBoxes.join("");
    }

    renderSchemaJSON = (): string => {
        // Perhaps you should do this while you are looping through the other functions
        return `SCHEMA JSON`;
    }    
}
