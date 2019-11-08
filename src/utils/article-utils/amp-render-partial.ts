import CleanCSS from 'clean-css';
import cheerio from 'cheerio';
import striptags from 'striptags';
import urlSlug from 'url-slug';
import { CheckForLinksOrCitationsAMP, getYouTubeID, renderAMPImage, renderAMPParagraph } from '.';
import { ArticleJson, Citation, Infobox, Media, Paragraph, Section, Sentence } from '../../types/article';
import { PageCategory } from '../../types/api';
import { AMPParseCollection, LanguagePack, SeeAlsoType, WikiExtraInfo } from '../../types/article-helpers';
import { NON_AMP_BAD_TAGS } from '../article-utils/article-converter';
import { sanitizeTextPreview } from '../article-utils/article-tools';
import { AMP_REGEXES_PRE } from '../article-utils/article-tools-constants';
import { styleNugget } from './amp-style';
const parseDomain = require('parse-domain');
import { isWebUri } from 'valid-url';
import moment from 'moment';
import * as MimeTypes from 'mime-types';

export class AmpRenderPartial {
    public allLightBoxes: string[] = [];
    public sanitizedVariables = {
        page_title: ""
    }

    constructor(private artJSON: ArticleJson, private wikiExtras: WikiExtraInfo) {
        this.sanitizedVariables.page_title = artJSON.page_title[0].text.replace(/["“”‘’]/gm, "\'")
    }

    renderHead = (BLURB_SNIPPET_PLAINTEXT: string, RANDOMSTRING: string): string => {
        let compressedCSS = new CleanCSS({}).minify(styleNugget).styles;
        // let comboHreflangs =
        //     this.wikiExtras.alt_langs.length > 0
        //         ? this.wikiExtras.alt_langs
        //               .map((langPack, index) => {
        //                   return `<link rel="alternate" href="https://everipedia.org/wiki/lang_${langPack.lang}/${
        //                       langPack.slug
        //                   }" hreflang="${langPack.lang}" />`;
        //               })
        //               .join('')
        //         : '';

        // Metadata values
        const last_modified = this.artJSON.metadata.find(w => w.key == 'last_modified') ? this.artJSON.metadata.find(w => w.key == 'last_modified').value : '';
        const creation_timestamp = this.artJSON.metadata.find(w => w.key == 'creation_timestamp') ? this.artJSON.metadata.find(w => w.key == 'creation_timestamp').value : '';
        let page_lang = this.artJSON.metadata.find(w => w.key == 'page_lang').value;
        page_lang = page_lang && page_lang != '' ? page_lang : 'en';
        const url_slug = this.artJSON.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;
        const page_type = this.artJSON.metadata.find(w => w.key == 'page_type').value;
        const is_indexed = (this.artJSON.metadata.find(w => w.key == 'is_indexed').value); // UNTIL THE is_indexed issue in MySQL is fixed

        let extra_keywords = '';
        if (this.artJSON && this.artJSON.infoboxes && this.artJSON.infoboxes.map)
            this.artJSON.infoboxes.map((item) => {
                if (
                    item.key === 'Occupation' &&
                    item.values[0] &&
                    item.values[0].sentences &&
                    item.values[0].sentences[0]
                ) {
                    let { text } = item.values[0].sentences[0];

                    const sanitizedText = sanitizeTextPreview(text);

                    // Check for ultra-long occupations and do nothing if they are present
                    // Otherwise the title would look very jank
                    if(sanitizedText && sanitizedText.length <= 30) extra_keywords = ` - ${sanitizedText}`;
                }
            });

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
            ${
                this.artJSON.amp_info.load_youtube_js
                    ? '<script async custom-element="amp-youtube" src="https://cdn.ampproject.org/v0/amp-youtube-0.1.js"></script>'
                    : ''
            }
            <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
            <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
            <script async custom-element="amp-iframe" src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>
            ${
                this.artJSON.amp_info.load_audio_js
                    ? '<script async custom-element="amp-audio" src="https://cdn.ampproject.org/v0/amp-audio-0.1.js"></script>'
                    : ''
            }
            <script async custom-element="amp-sidebar" src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"></script>
            <script async custom-element="amp-lightbox" src="https://cdn.ampproject.org/v0/amp-lightbox-0.1.js"></script>
            <script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
            ${
                this.artJSON.amp_info.load_video_js
                    ? '<script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>'
                    : ''
            }
            <meta property="og:type" content="article"/>
            <meta name="twitter:card" content="summary" />
            ${is_indexed ? '' : '<meta name="googlebot" content="noindex, noarchive" />'}
            ${
                page_type == 'Person'
                    ? `<title>${this.sanitizedVariables.page_title} Wiki & Bio${extra_keywords}</title>
                <meta property="og:title" content="${this.sanitizedVariables.page_title}"/>
                <meta name="twitter:title" content="${this.sanitizedVariables.page_title} Wiki & Bio${extra_keywords}" />`
                    : page_type == 'Product'
                    ? `<title>${this.sanitizedVariables.page_title} Wiki & Review${extra_keywords}</title>
                <meta property="og:title" content="${this.sanitizedVariables.page_title}"/>
                <meta name="twitter:title" content="${this.sanitizedVariables.page_title} Wiki & Review${extra_keywords}" />`
                    : page_type == 'Organization'
                    ? `<title>${this.sanitizedVariables.page_title} Wiki & Review${extra_keywords}</title>
                <meta property="og:title" content="${this.sanitizedVariables.page_title}"/>
                <meta name="twitter:title" content="${this.sanitizedVariables.page_title} Wiki & Review${extra_keywords}" />`
                    : page_type
                    ? `<title>${this.sanitizedVariables.page_title} Wiki${extra_keywords}</title>
                <meta property="og:title" content="${this.sanitizedVariables.page_title}"/>
                <meta name="twitter:title" content="${this.sanitizedVariables.page_title} Wiki${extra_keywords}" />`
                    : ''
            }
            <meta name="description" content="${BLURB_SNIPPET_PLAINTEXT}"/>
            <meta property="article:tag" content="${this.sanitizedVariables.page_title}" />
            <meta property="article:published_time" content="${creation_timestamp}" />
            <meta property="article:modified_time" content="${last_modified}" />
            <meta property="og:image" content="${this.artJSON.main_photo[0].url}?nocache=${RANDOMSTRING}" />
            <meta property="og:image" content="${this.artJSON.main_photo[0].thumb}" />
            <meta property="og:description" content="${BLURB_SNIPPET_PLAINTEXT}"/>
            <meta name="og:url" content="https://everipedia.org/wiki/lang_${page_lang}/${
            url_slug
        }">
            <meta name="twitter:image" content="${this.artJSON.main_photo[0].url}?nocache=${RANDOMSTRING}" />
            <meta name="twitter:image" content="${this.artJSON.main_photo[0].thumb}" />
            <meta name="twitter:description" content="${BLURB_SNIPPET_PLAINTEXT}" />
            <meta name="twitter:url" content="https://everipedia.org/wiki/lang_${page_lang}/${
            url_slug
        }">
            <meta property="fb:app_id" content="1617004011913755" />
            <meta property="fb:pages" content="328643504006398"/>
            <meta property="article:author" content="https://www.facebook.com/everipedia" />
            <link rel="canonical" href="https://everipedia.org/wiki/lang_${page_lang}/${
            url_slug
        }" />
            <style amp-custom>${compressedCSS}</style>
        `;
    };

    renderNavBar = (): string => {
        let page_lang = this.artJSON.metadata.find(w => w.key == 'page_lang').value;
        page_lang = page_lang && page_lang != '' ? page_lang : 'en';
        const url_slug = this.artJSON.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;
        
        return `
            <div class="amp-nav-bar">
                <div class="nav-container" >
                    <div class="nav-read nav-item">
                        <a rel='nofollow' href="https://everipedia.org/wiki/lang_${page_lang}/${url_slug}?from_amp=read">
                            <amp-img width='25' height='25' layout='fixed' src='https://epcdn-vz.azureedge.net/static/images/article_icon_view_white.svg' alt='Vote' ></amp-img>
                            <span class='nav-text'>Read</span>
                        </a>
                    </div>
                    <div class="nav-edit nav-item">
                        <a rel='nofollow' href="https://everipedia.org/wiki/lang_${page_lang}/${url_slug}?from_amp=edit">
                            <amp-img width='25' height='25' layout='fixed' src='https://epcdn-vz.azureedge.net/static/images/article_icon_edit_white.svg' alt='Edit' ></amp-img>
                            <span class='nav-text'>Edit</span>
                        </a>
                    </div>
                    <div class="nav-view-history nav-item">
                        <a rel='nofollow' href="https://everipedia.org/wiki/lang_${page_lang}/${url_slug}?from_amp=vote">
                            <amp-img width='25' height='25' layout='fixed' src='https://epcdn-vz.azureedge.net/static/images/article_icon_vote_white.svg' alt='View' ></amp-img>
                            <span class='nav-text'>View History</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    };

    renderWelcomeBanner = (): string => {
        return `
            <div id="Welcome_Banner" class="wel-bnr">
                <span class="wel-msg">
                    Welcome! Everipedia uses the IQ cryptocurrency token for editing, voting, and article / wiki creation. 
                    <span class="wel-lrnmr" on="tap:AMP.navigateTo(url='https://everipedia.org/faq/what-is-iq')" role="link" tabindex="0">
                        Learn more
                    </span>
                </span>
                <span class="wel-bnr-close" role='button' on="tap:Welcome_Banner.hide" tabindex="0">Close</span>
            </div>
        `;
    };

    renderHeaderBar = (): string => {
        return `
            <nav class="amp-header-bar">
                <ul>
                    <li class="amp-header-toc">
                        <button on='tap:sidebar.toggle'>
                            <amp-img height="24" width="30" layout="fixed" alt="Table of contents and facts for this wiki" src="https://epcdn-vz.azureedge.net/static/images/bull-icon.png" ></amp-img>
                        </button>
                    </li>
                    <li class="amp-header-logo">
                        <a rel='nofollow' href="https://everipedia.org">
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
                        <button on="tap:search-lightbox" data-description="Search Bar">
                        <amp-img height="28" width="28" layout="fixed" alt="Search" src="https://epcdn-vz.azureedge.net/static/images/search_black.svg" ></amp-img>
                        </button>
                    </li>
                </ul>
            </nav>
        `;
    };

    renderMainPhoto = (OVERRIDE_MAIN_THUMB: string | null, RANDOMSTRING: string): string => {
        // Metadata values
        const page_type = this.artJSON.metadata.find(w => w.key == 'page_type').value;

        let ampSanitizedPhotoComment = this.artJSON.main_photo[0].caption && this.artJSON.main_photo[0].caption
            .map((value, index) => {
                let result = CheckForLinksOrCitationsAMP(
                    value.text,
                    this.artJSON.citations,
                    this.artJSON.ipfs_hash,
                    [],
                    false
                );
                this.allLightBoxes.push(...result.lightboxes);
                return result.text;
            })
            .join('');

        return `
            ${
                this.artJSON.main_photo[0].url
                    ? `<figure class="blurb-photo-container" id="toc-top">
                ${
                    this.artJSON.main_photo[0].attribution_url
                        ? `<a class="blurb-photo-anchor" href="${
                              this.artJSON.main_photo[0].attribution_url
                          }" rel="nofollow" target="_blank">`
                        : true
                        ? `<a class="blurb-photo-anchor" href="${
                              this.artJSON.main_photo[0].url
                          }?nocache=${RANDOMSTRING}" rel="nofollow" target="_blank">`
                        : ``
                }
                    ${
                        OVERRIDE_MAIN_THUMB
                            ? `<amp-anim id="mainphoto" itemprop="image" width='${
                                  this.artJSON.main_photo[0].width || '300px'
                              }' height='${
                                  this.artJSON.main_photo[0].height || '300px'
                              }' layout='responsive' src="${OVERRIDE_MAIN_THUMB}?nocache=${RANDOMSTRING}" 
                            alt="
                                ${
                                    page_type == 'Person'
                                        ? `${this.sanitizedVariables.page_title} wiki, ${this.sanitizedVariables.page_title} bio`
                                        : page_type == 'Product'
                                        ? `${this.sanitizedVariables.page_title} wiki, ${this.sanitizedVariables.page_title} review`
                                        : page_type == 'Organization'
                                        ? `${this.sanitizedVariables.page_title} wiki, ${this.sanitizedVariables.page_title} review, ${
                                              this.sanitizedVariables.page_title
                                          } history`
                                        : true
                                        ? `${this.sanitizedVariables.page_title} wiki, ${this.sanitizedVariables.page_title} history`
                                        : ``
                                }
                        ">
                            <amp-img placeholder class="mainphoto-placeholder" width="1274" height="1201" layout='responsive' src="https://epcdn-vz.azureedge.net/static/images/no-image-slide.png"></amp-img>
                        </amp-anim>`
                            : true
                            ? `<amp-img id="mainphoto" itemprop="image" width='${
                                  this.artJSON.main_photo[0].width || '300px'
                              }' height='${this.artJSON.main_photo[0].height || '300px'}' layout='responsive' src="${
                                  this.artJSON.main_photo[0].url
                              }?nocache=${RANDOMSTRING}" 
                            alt="
                                ${
                                    page_type == 'Person'
                                        ? `${this.sanitizedVariables.page_title} wiki, ${this.sanitizedVariables.page_title} bio`
                                        : page_type == 'Product'
                                        ? `${this.sanitizedVariables.page_title} wiki, ${this.sanitizedVariables.page_title} review`
                                        : page_type == 'Organization'
                                        ? `${this.sanitizedVariables.page_title} wiki, ${this.sanitizedVariables.page_title} review, ${
                                              this.sanitizedVariables.page_title
                                          } history`
                                        : true
                                        ? `${this.sanitizedVariables.page_title} wiki, ${this.sanitizedVariables.page_title} history`
                                        : ``
                                }
                        ">
                            <amp-img placeholder width="250" height="250" layout='responsive' src="${
                                this.artJSON.main_photo[0].thumb
                            }?nocache=${RANDOMSTRING}"></amp-img>
                        </amp-img>`
                            : ``
                    }
                    </a>
                </figure>`
                    : true
                    ? `<div class="noavatar-filler"></div>`
                    : ``
            }

            ${
                this.artJSON.main_photo[0].caption
                    ? `<figcaption class="mainphoto-caption">${ampSanitizedPhotoComment}</figcaption>`
                    : ``
            }
        `;
    };

    renderNameContainer = (): string => {
        // Metadata values
        const page_type = this.artJSON.metadata.find(w => w.key == 'page_type').value;
        const page_title = this.sanitizedVariables.page_title;

        return `
            <div class="name-container">
                <h1>
                    <span>${page_title}</span>
                </h1>
                <div id="title-buttonset">
                    <div class="tlbx-ct-wrapper">
                        <div class="tlbx-ct">
                            <ul>
                                <li>
                                    <button on="tap:share-lightbox" aria-label="Share" class="icon">
                                        <amp-img width='36' height='36' layout='fixed' src='https://epcdn-vz.azureedge.net/static/images/share.svg' alt='Share' ></amp-img>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    renderFirstParagraph = (): string => {
        let firstSection: Section = this.artJSON.page_body[0];
        let imageBlock = firstSection && firstSection.images && firstSection.images
            .map((image, imageIndex) => {
                let result: AMPParseCollection = renderAMPImage(
                    image,
                    this.artJSON.citations,
                    this.artJSON.ipfs_hash
                );
                this.allLightBoxes.push(...result.lightboxes);
                return result.text;
            })
            .join('');
        let paraBlock = firstSection && firstSection.paragraphs && firstSection.paragraphs
            .map((para, index) => {
                let result: AMPParseCollection = renderAMPParagraph(
                    para,
                    this.artJSON.citations,
                    this.artJSON.ipfs_hash,
                    false
                );
                this.allLightBoxes.push(...result.lightboxes);
                return result.text;
            })
            .join('');
        return `
            <div class="ent-ct" id="first-paragraph" itemprop="description">
                <div class="ent-ct-inner-wrap">
                    ${imageBlock}${paraBlock}
                </div>
            </div>
        `;
    };

    renderPageBody = (): string => {
        let otherSections: Section[] = this.artJSON.page_body.slice(1);
        let comboSections = otherSections
            .map((section, sectionIndex) => {
                let imageBlock = section.images
                    .map((image, imageIndex) => {
                        let result: AMPParseCollection = renderAMPImage(
                            image,
                            this.artJSON.citations,
                            this.artJSON.ipfs_hash
                        );
                        this.allLightBoxes.push(...result.lightboxes);
                        return result.text;
                    })
                    .join('');
                let paraBlock = section.paragraphs
                    .map((paragraph, paraIndex) => {
                        let result: AMPParseCollection = renderAMPParagraph(
                            paragraph,
                            this.artJSON.citations,
                            this.artJSON.ipfs_hash,
                            false
                        );
                        this.allLightBoxes.push(...result.lightboxes);
                        return result.text;
                    })
                    .join('');
                return `${imageBlock}${paraBlock}`;
            })
            .join('');

        return `
            <div class="ent-ct">
                <div class="ent-ct-inner-wrap">
                    ${comboSections}
                </div>
            </div>
        `;
    };

    renderOneInfobox = (infobox: Infobox, index: number): string => {
        return `
            <li>
                <div class="info-qt">
                    <h3>${infobox.key && infobox.key.toUpperCase()}</h3>
                </div>
                ${infobox.values
                    .map((value, index) => {
                        let comboText = ''
                        value.sentences.forEach(sent => {
                            let parsePack = CheckForLinksOrCitationsAMP(
                                sent.text,
                                this.artJSON.citations,
                                this.artJSON.ipfs_hash,
                                [],
                                false
                            )
                            comboText += (parsePack.text ? parsePack.text + " " : " ");
                            this.allLightBoxes.push(...parsePack.lightboxes);
                        })
                        

                        let $ = cheerio.load(`<div id='bogus_div' >${comboText}</div>`);
                        

                        // Remove bad tags
                        $('style, section').remove();
                        const badTagSelectors = ['.thumbcaption .magnify', '.blurbimage-caption .magnify', '.blurb-wrap .thumbinner'];
                        badTagSelectors.forEach((selector) => $(selector).remove());

                        // Remove more bad tags
                        $(NON_AMP_BAD_TAGS.join(", ")).remove();

                        // Remove the style attribute
                        $("[style]").removeAttr('style');

                        // Hack to prevent useless html and head tags
                        comboText = $('#bogus_div').html();

                        // RegEx cleanup
                        AMP_REGEXES_PRE.forEach(function(element) {
                            comboText = comboText.replace(element, '');
                        });
                        
                        // return result.text;
                        return `
                        <div class="info-an${index > 0 ? ' multiple' : ''}">
                            ${comboText}
                        </div>
                    `;
                    })
                    .join('')}
            </li>
        `;
    };

    renderInfoboxes = (): string => {
        // Metadata values
        const page_type = this.artJSON.metadata.find(w => w.key == 'page_type').value;

        let infoboxes: Infobox[] = this.artJSON.infoboxes;
        if (
            !(
                (infoboxes && infoboxes.length > 0) ||
                (this.artJSON.infobox_html && this.artJSON.infobox_html.tbody.rows.length > 0)
            )
        ) {
            return ``;
        }
        let blobBoxResult;
        if (this.artJSON.infobox_html && this.artJSON.infobox_html.tbody.rows.length > 0) {
            // NEED TO CALL blobBoxPreSanitize() OR SIMILAR ? Wikipedia imports should not be indexed anyways...
            let infoboxHTMLParagraph: Paragraph = {
                index: 0,
                items: [this.artJSON.infobox_html],
                tag_type: 'table',
                attrs: this.artJSON.infobox_html.attrs
            }

            blobBoxResult = renderAMPParagraph(
                infoboxHTMLParagraph,
                this.artJSON.citations,
                this.artJSON.ipfs_hash,
                false
            );
            this.allLightBoxes.push(...blobBoxResult.lightboxes);
        }
        let infoboxComboString = infoboxes
            .map((value, index) => {
                return this.renderOneInfobox(value, index);
            })
            .join('');
        return `
            <span id='infoboxHeader'></span>
            <section id="infobox_section" class="infobox-main-wrap">
                <h2 class="qf-header qf-infobox">
                </h2>
                <div class='amp-wrap'>
                    ${
                        this.artJSON.infobox_html && this.artJSON.infobox_html.tbody.rows.length != 0
                            ? `<div id="blbx_ct" class='infbx-ct'>
                            ${blobBoxResult.text}
                        </div>`
                            : ``
                    }
                    <div class="infbx-ct">
                    ${
                        infoboxes.length != 0
                            ? `<ul class="list-unstyled list-spaced list-plural infobox">
                            ${infoboxComboString}
                        </ul>`
                            : ``
                    }
                    </div>
                <div>
            </section>
        `;
    };

    renderOneMedia = (media: Citation, index: number): string => {
        // Don't render invalid URLs
        if (media.url && !isWebUri(media.url)) return "";

        // const RANDOMSTRING = Math.random()
        //     .toString(36)
        //     .substring(7);
        let sanitizedCaption = media.description
            .map((value, index) => {
                let result = CheckForLinksOrCitationsAMP(
                    value.text,
                    this.artJSON.citations,
                    this.artJSON.ipfs_hash,
                    [],
                    false
                );
                this.allLightBoxes.push(...result.lightboxes);
                return result.text;
            })
            .join('');
        let sanitizedCaptionPlaintext = striptags(sanitizedCaption);
        // console.log(sanitizedCaptionPlaintext)
        return `
            ${
                media.category == 'PICTURE'
                    ? `<div class="tile-ct">
                    <div class="">
                        <span>
                            <span rel='nofollow' class="photo-gallery-anchor" on="tap:AMP.navigateTo(url='${media.url}', target=_blank)" tabindex='0' role="link" data-target="${
                          media.url
                      }" title="${sanitizedCaptionPlaintext}">
                                <amp-img width=150 height=150 layout="responsive" src="${media.url}" data-image="${
                          media.url
                      }" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                                    <amp-img placeholder width=150 height=150 src="${
                                        media.thumb
                                    }" layout="fill"></amp-img>
                                </amp-img>
                            </span>
                        </span>
                    </div>
                    ${ sanitizedCaption != '' ? 
                        `<div class="tile-desc">
                            ${
                                media.attribution && media.attribution != 'None'
                                    ? `<a class="grid-attribution" rel="nofollow" target="_blank" href="${
                                        media.attribution
                                    }">
                                    <i class="fa fa-info-circle"></i>
                                </a>`
                                    : ``
                            }
                            ${sanitizedCaptionPlaintext}
                        </div>` : ''
                    }
                </div>`
                    : media.category == 'GIF'
                    ? `<div class="tile-ct">
                    <div class="">
                        <span>
                            <span rel='nofollow' class="photo-gallery-anchor" on="tap:AMP.navigateTo(url='${media.url}', target=_blank)" tabindex='0' role="link" data-target="${
                          media.url
                      }" title="${sanitizedCaptionPlaintext}">
                                <amp-anim width=150 height=150 layout="responsive" src="${media.url}" data-image="${
                          media.url
                      }" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                                <amp-img placeholder width=150 height=150 src="${media.thumb}" layout="fill"></amp-img>
                                </amp-anim>
                            </span>
                        </span>
                    </div>
                    <div class="tile-desc">
                        ${
                            media.attribution && media.attribution != 'None'
                                ? `<a class="grid-attribution" rel="nofollow" target="_blank" href="${
                                      media.attribution
                                  }">
                                <i class="fa fa-info-circle"></i>
                            </a>`
                                : ``
                        }
                        ${sanitizedCaptionPlaintext}
                    </div>
                </div>`
                    : media.category == 'YOUTUBE'
                    ? `<div class="tile-ct">
                    <a rel='nofollow' target="_blank" href="${media.url}" title="Link to video">
                    <span>
                        <amp-youtube
                            data-videoid="${getYouTubeID(media.url)}"
                            layout="responsive"
                            width=150
                            height=150>
                        </amp-youtube>
                    </span>
                    <div class="tile-desc">
                        ${
                            media.attribution && media.attribution != 'None'
                                ? `<a class="grid-attribution" rel="nofollow" target="_blank" href="${
                                      media.attribution
                                  }">
                                <i class="fa fa-info-circle"></i>
                            </a>`
                                : ``
                        }
                        ${sanitizedCaptionPlaintext}
                    </div>
                    </a>
                </div>`
                    : media.category == 'NORMAL_VIDEO' && media.url && media.url.search("https://") == 0
                    ? `<div class="tile-ct">
                    <a rel='nofollow' target="_blank" href="${media.url}" title='Link to video'>
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
                        ${
                            media.attribution && media.attribution != 'None'
                                ? `<a class="grid-attribution" rel="nofollow" target="_blank" href="${
                                      media.attribution
                                  }">
                                <i class="fa fa-info-circle"></i>
                            </a>`
                                : ``
                        }
                        ${sanitizedCaptionPlaintext}
                    </div>
                    </a>
                </div>`
                    : media.category == 'AUDIO'
                    ? `<div class="tile-ct">
                    <a rel='nofollow' target="_blank" href="${media.url}" title="Link to recording">
                    <span>
                        <amp-img width=150 height=150 layout="responsive" src="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" data-image="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" data-description="${sanitizedCaptionPlaintext}" alt="${sanitizedCaptionPlaintext}" data-width="640" data-height="640">
                            <amp-img placeholder width=150 height=150 src="https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png" layout="fill"></amp-img>
                        </amp-img>
                    </span>
                    <div class="tile-desc">
                        ${
                            media.attribution && media.attribution != 'None'
                                ? `<a class="grid-attribution" rel="nofollow" target="_blank" href="${
                                      media.attribution
                                  }">
                                <i class="fa fa-info-circle"></i>
                            </a>`
                                : ``
                        }
                        ${sanitizedCaptionPlaintext}
                    </div>
                    </a>
                </div>`
                    : true
                    ? ``
                    : ``
            }

            
        `;
    };

    renderMediaGallery = (): string => {
        let media: Citation[] = this.artJSON.citations.filter(ctn => ctn.media_props);
        if (media.length == 0) return ``;
        let mediaComboString = media
            .map((value, index) => {
                return this.renderOneMedia(value, index);
            })
            .join('');
        return `
            <div class="media-gallery-container">
                <h2 class="media-gallery-header" id="mediaGallery">MEDIA</h2>
                <div class="photo-gallery">
                    ${mediaComboString}
                </div>
            </div>
        `;
    };

    renderOneCategory = (category: PageCategory): string => {
        return `
            <li>
                <a href="https://${category.lang == 'en' ? '' : category.lang + '.'}everipedia.org/category/lang_${category.lang}/${category.slug}" >
                    ${category.title}
                </a>
            </li>
            
        `;
    };


    renderCategories = (): string => {
        let categories: PageCategory[] = this.wikiExtras && this.wikiExtras.page_categories;
        if (categories.length == 0) return ``;
        let categoryComboString = categories
            .map((cat, index) => {
                return this.renderOneCategory(cat);
            })
            .join('');
        return `
            <div class="category-container">
                <h2 class="category-header" id="categoryList">CATEGORIES</h2>
                <ul class="category-list">
                    ${categoryComboString}
                </ul>
            </div>
        `;
    };

    renderOneCitation = (citation: Citation, index: number): string => {
        // Don't render invalid URLs
        if (citation.url && !isWebUri(citation.url)) return "";

        let sanitizedDescription = citation.description
            .map((value, index) => {
                let result = CheckForLinksOrCitationsAMP(
                    value.text,
                    this.artJSON.citations,
                    this.artJSON.ipfs_hash,
                    [],
                    false
                );
                this.allLightBoxes.push(...result.lightboxes);
                return result.text;
            })
            .join('');
        
        let theThumbSrc = null;

        if (
            citation.thumb &&
            citation.thumb != 'None' &&
            citation.thumb != '' &&
            citation.thumb.indexOf('no-image-slide') == -1
        ) {
            theThumbSrc = citation.thumb;
        }
        else if (
            citation.url &&
            citation.url != 'None' &&
            citation.url != '' &&
            citation.url.indexOf('no-image-slide') == -1 &&
            citation.media_props
        ) {
            theThumbSrc = citation.url;
        }
        else {
            theThumbSrc = null;
            // if (useWebP) theThumbSrc = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide-thumb.webp';
            // else theThumbSrc = 'https://epcdn-vz.azureedge.net/static/images/no-image-slide.png';
        }
        let hasFileMime = citation.mime && citation.mime != 'None' && citation.mime != 'youtube';
        let parsedDomain = parseDomain(citation.url);
        let theSubdomain = parsedDomain && parsedDomain.subdomain ? parsedDomain.subdomain + "." : ""; 
        let theDomain = parsedDomain && parsedDomain.domain ? parsedDomain.domain : ""; 
        let theTLD = parsedDomain && parsedDomain.tld ? "." + parsedDomain.tld : "";  
        let domainToShow = (citation.mime == 'None' || citation.mime === undefined || citation.mime == null) ? `${theSubdomain}${theDomain}${theTLD}` : null;
        let sanitizedDescriptionPlaintext = striptags(sanitizedDescription);

        return `                        
            <li>
                <span class='citation-anchor' on="tap:AMP.navigateTo(url='${citation.url}', target=_blank)" tabindex='0' role="link">
                    <div class="link-id">[${citation.citation_id}]</div>
                    ${
                        theThumbSrc != null && theThumbSrc != 'None' && theThumbSrc != ''  
                            ? `<div class='avatar-wrap' title="Preview Thumbnail">
                                    <amp-img alt='Thumbnail' class="link-image" width=40 height=40 layout="fixed" src="${theThumbSrc}" >
                                        <amp-img placeholder width=40 height=40 src="https://epcdn-vz.azureedge.net/static/images/link-2.png" layout="fill"></amp-img>
                                    </amp-img>
                                </div>`
                            : ``
                    }
                    <div class="link-box-details">
                        ${domainToShow ? `<span class='citation-domain'>${domainToShow}</span>` : ``}
                        ${hasFileMime ? `<span class='citation-mime'>${MimeTypes.extension(citation.mime).toString().toUpperCase()}</span>` : ``}
                        <div id="linksetid${citation.url}" class="link-comment">${sanitizedDescriptionPlaintext}</div>
                        <div class="link-date">
                            ${moment(new Date(citation.timestamp)).locale('en').format('lll')}
                        </div>
                    </div>
                </span>
            </li>
        `;
        // return `
        //     <li>
        //         <a class='citation-anchor' href="${citation.url}">
        //             <div class="link-box-details">
        //                 ${domainToShow ? `<span class='citation-domain'>${domainToShow}</span>` : ``}
        //                 ${hasFileMime ? `<span class='citation-mime'>${MimeTypes.extension(citation.mime).toString().toUpperCase()}</span>` : ``}
        //                 <div id="linksetid${citation.url}" class="link-comment">${sanitizedDescription}</div>

        //             </div>
        //             <div class="link-date">
        //             <a href="${citation.url}" rel="nofollow">${moment(new Date(citation.timestamp)).locale('en').format('lll')}</a>
        //         </div>
        //         </a>
        //     </li>
        // `;
    };

    renderCitations = (): string => {
        // const page_type = this.artJSON.metadata.find(w => w.key == 'page_type').value;

        let citations: Citation[] = this.artJSON.citations;
        if (citations.length == 0) return ``;
        let citationComboString = citations
            .map((value, index) => {
                return this.renderOneCitation(value, index);
            })
            .join('');

        // return `
        //     <span id="referenceList" class="toc-span-fix"></span>
        //     <amp-accordion class='link-list-accordion'>
        //     <section expanded>
        //         <h2 class="acc-header">References</h2>
        //         <div class="l-lst-header" id="link_list_container">
        //             <div class="ll-wrapper">
        //                 <ul class="l-lst">
        //                     ${citationComboString}
        //                 </ul>
        //             </div>
        //         </div>
        //     </section>
        //     </amp-accordion>
        // `;
        return `
        <span id="referenceList" class="toc-span-fix"></span>
        <div class='link-list-main-wrap'>
        <h2 class="acc-header">References</h2>
        <div class="l-lst-header" id="link_list_container">
            <div class="ll-wrapper">
                <ul class="l-lst">
                    ${citationComboString}
                </ul>
            </div>
        </div>
        </div>
    `;
    };

    renderOneSeeAlso = (seealso: SeeAlsoType, link_collection: string[], passed_index: number): string => {
        let is_indexed = false;;
        let test_wikilangslug = `lang_${seealso.lang_code}/${seealso.slug}`;
		if(link_collection.length){
			if (link_collection.includes(test_wikilangslug)) is_indexed = true;
        }

        // Don't use anchor tags for non-indexed pages 
        let title_tag_to_use = is_indexed ? 
        `<a class="sa-title"  href="https://everipedia.org/wiki/${test_wikilangslug}" target="_blank">${seealso.page_title}</a>`
        : `<div class="sa-title" >${seealso.page_title}</div>`

        return `
            <div class='sa-ancr-wrp' on="tap:AMP.navigateTo(url='https://everipedia.org/wiki/${test_wikilangslug}', target=_blank)" tabindex='0' role="link">
                <amp-img layout="fixed-height" height=80 src="${seealso.main_photo ? seealso.main_photo : seealso.thumbnail}" alt="${seealso.page_title} wiki">
                    <amp-img placeholder layout="fixed-height" height=80 src="https://epcdn-vz.azureedge.net/static/images/white_dot.png" alt="Placeholder for ${
                        seealso.page_title
                    }"></amp-img>
                </amp-img>
                <div class="sa-contentwrap">
                    ${title_tag_to_use}
                    <div class="sa-blurb">${seealso.text_preview}</div>
                </div>
            </div>
        `;
    };

    renderSeeAlso = (): string => {
        let the_see_alsos = this.wikiExtras && this.wikiExtras.see_also;
        let the_link_collection = this.wikiExtras && this.wikiExtras.link_collection;
        if (the_see_alsos.length){
            let seeAlsoComboString = the_see_alsos
            .map((value, index) => {
                return this.renderOneSeeAlso(value, the_link_collection, index);
            })
            .join('');
            return `
                <span id="seeAlsoPanel" class="toc-span-fix"></span>
                <amp-accordion id="seeAlsoPanelContainer" >
                <section expanded>
                    <h2 class="acc-header" >See Also</h2>
                    <div>
                        <div class="disclaimer">Other wiki pages related to ${this.sanitizedVariables.page_title}.</div>
                        ${seeAlsoComboString}
                    </div>
                </section>
                </amp-accordion>
            `;
        }
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
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://everipedia.org/about', target=_blank)" tabindex='0' role="link" >About</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://everipedia.org/faq', target=_blank)" tabindex='0' role="link">FAQ</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://everipedia.org/contact', target=_blank)" tabindex='0' role="link" >Contact</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://www.reddit.com/r/Everipedia/', target=_blank)" tabindex='0' role="link" >Forum</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://everipedia.org/wiki/everipedia-terms', target=_blank)" tabindex='0' role="link" >Terms</span>
                    <span class='footer-span-link' on="tap:AMP.navigateTo(url='https://everipedia.org/iq-info', target=_blank)" tabindex='0' role="link" >Get IQ</span>
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

    renderTableOfContents = (): string => {
        const page_type = this.artJSON.metadata.find(w => w.key == 'page_type').value;

        let comboString: string = `
            <li class='toc-header-description' data-blurb-id="top_header">
                <a rel="nofollow" class='toc-header-description' href="#toc-top">
                    <div class="fixed-items-description">${this.sanitizedVariables.page_title}</div>
                </a>
            </li>
        `;
        if (this.artJSON.infoboxes.length > 0) {
            comboString += `
                <li class='toc-header-infobox' data-blurb-id="infobox_section">
                    <a rel="nofollow" class='toc-header-infobox' href="#infoboxHeader">
                        <div class="fixed-items-description">
                            ${
                                page_type == 'Person'
                                    ? `Quick Biography`
                                    : true
                                    ? `Quick Facts For This Wiki`
                                    : ``
                            }
                        </div>
                    </a>
                </li>
            `;
        }
        comboString += this.artJSON.page_body
            .map((section, sectionIndex) => {
                return section.paragraphs
                    .map((para, paraIndex) => {
                        if (
                            para.tag_type === 'h2' ||
                            para.tag_type === 'h3' ||
                            para.tag_type === 'h4' ||
                            para.tag_type === 'h5' ||
                            para.tag_type === 'h6'
                        ) {
                            const text = para.items && para.items[0] && (para.items[0] as Sentence).text;
                            if (!text) return '';
                            return `
                        <li class='toc-header-${para.tag_type}' data-blurb-id="${urlSlug(text).slice(0, 15)}">
                            <a rel="nofollow" class='toc-header-${para.tag_type}' href="#${urlSlug(text).slice(0, 15)}">
                                <div class="fixed-items-description">${text}</div>
                            </a>
                        </li>
                    `;
                        } else {
                            return ``;
                        }
                    })
                    .join('');
            })
            .join('');
        if (this.artJSON.media_gallery.length > 0) {
            comboString += `
                <li class='toc-header-gallery' data-blurb-id="Gallery_Pseudo_ID">
                    <a rel="nofollow" class='toc-header-gallery' href="#mediaGallerySpan">
                        <div class="fixed-items-description">Images & Videos</div>
                    </a>
                </li>
            `;
        }
        comboString += `
            <li class='toc-header-references' data-blurb-id="Reference_Links">
                <a rel="nofollow" class='toc-header-references' href="#link_list_container">
                    <div class="fixed-items-description">References</div>
                </a>
            </li>
        `;
        // comboString += `
        //     <li class="toc-header-seealso" data-blurb-id="seeAlsoPanelContainer">
        //         <a rel="nofollow" class="toc-header-seealso" href="#seeAlsoPanel">
        //             <div class="fixed-items-description">See Also</div>
        //         </a>
        //     </li>
        // `;
        return comboString;
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
                    </ul>
                </div>
            </div>
        `;
    };

    renderSearchLightbox = (): string => {
        return `  
        <div class="lightbox" tabindex="0" role="search">
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
                <div class="search-toggle-space-bottom" on='tap:search-lightbox.close' tabindex="0" role="button">
                </div>
            </div>
	    </div>
        `;
    };

    renderShareLightbox = (): string => {
        // Metadata values
        let page_lang = this.artJSON.metadata.find(w => w.key == 'page_lang').value;
        page_lang = page_lang && page_lang != '' ? page_lang : 'en';
        const url_slug = this.artJSON.metadata.filter(w => w.key == 'url_slug' || w.key == 'url_slug_alternate')[0].value;
        const page_type = this.artJSON.metadata.find(w => w.key == 'page_type').value;

        return `  
            <span class="lb-button cls-shr-lgbx"><button  on='tap:share-lightbox.close'></button></span>
            <nav class="lightbox" tabindex="0" role="widget">
                <div class="share-ct">
                    <div class="share-ct-inner">
                        <h2>Share this page</h2>
                        <div class="social-share-block-wrap">
                            <div class="social-share-block">
                                <a class="email social-share-btn" rel='nofollow' href="mailto:email@email.com?&body=https://everipedia.org/wiki/lang_${
                                    page_lang
                                }/${url_slug}"></a>
                                <a class="facebook social-share-btn" rel='nofollow' href="https://www.facebook.com/sharer/sharer.php?u=https://everipedia.org/wiki/lang_${
                                    page_lang
                                }/${url_slug}"></a>
                                <a class="twitter social-share-btn" rel='nofollow' href="http://twitter.com/share?text=https://everipedia.org/wiki/lang_${
                                    page_lang
                                }/${url_slug}"></a>
                                <a class="reddit social-share-btn" rel='nofollow' href="https://reddit.com/submit?url=https://everipedia.org/wiki/lang_${
                                    page_lang
                                }/${url_slug}"></a>
                            </div>
                        </div>
                    </div>
                    <div class="share-pad"></div>
                    <div class="share-ct-link">
                        <h4>DIRECT LINK</h4>
                        <a href="https://everipedia.org/wiki/lang_${page_lang}/${
            url_slug
        }">https://everipedia.org/wiki/lang_${page_lang}/${url_slug}</a>
                    </div>
                    <div class="share-pad"></div>
                    <div class="share-hshtgs">
                        <div class="suggested-tags">Suggested Hashtags</div>
                        <div class="social-share-block-wrap">
                            <ul class="tag-list">
                                ${
                                    page_type == 'Person'
                                        ? `<li>${this.sanitizedVariables.page_title} wiki</li>
                                    <li>${this.sanitizedVariables.page_title} bio</li>
                                    <li>${this.sanitizedVariables.page_title} net worth</li>
                                    <li>${this.sanitizedVariables.page_title} age</li>
                                    <li>${this.sanitizedVariables.page_title} married</li>`
                                        : page_type == 'Product'
                                        ? `<li>${this.sanitizedVariables.page_title} wiki</li>
                                    <li>${this.sanitizedVariables.page_title} review</li>
                                    <li>${this.sanitizedVariables.page_title} history</li>
                                    <li>${this.sanitizedVariables.page_title} sales</li>
                                    <li>${this.sanitizedVariables.page_title} facts</li>`
                                        : page_type == 'Organization'
                                        ? `<li>${this.sanitizedVariables.page_title} wiki</li>
                                    <li>${this.sanitizedVariables.page_title} review</li>
                                    <li>${this.sanitizedVariables.page_title} history</li>
                                    <li>${this.sanitizedVariables.page_title} founders</li>
                                    <li>${this.sanitizedVariables.page_title} facts</li>`
                                        : true
                                        ? `<li>${this.sanitizedVariables.page_title} wiki</li>
                                    <li>${this.sanitizedVariables.page_title} review</li>
                                    <li>${this.sanitizedVariables.page_title} history</li>
                                    <li>${this.sanitizedVariables.page_title} encyclopedia</li>
                                    <li>${this.sanitizedVariables.page_title} facts</li>`
                                        : ``
                                }
                            </ul>
                        </div>
                    </div>
                    <div class="share-pad"></div>        
                </div>
            </nav>
        `;
    };

    renderOneLanguage = (langPack: LanguagePack): string => {
        let sanitizedTitle = langPack.article_title.replace(/["“”‘’]/gm, "\'");
        return `
            <li class="lang-li">
                <a rel="nofollow" href="/wiki/lang_${langPack.lang}/${langPack.slug}">
                    <amp-img class="mini-lang-flag" height="35" width="35" layout="fixed" alt="${
                        sanitizedTitle
                    }" src="https://epcdn-vz.azureedge.net/static/images/flags/png/48/languages/${
            langPack.lang
        }.png"></amp-img>
                    <span class="mini-lang-title">${sanitizedTitle}</span>
                </a>
            </li>
        `;
    };

    renderLanguageLightboxes = (): string => {
        let langPacks: LanguagePack[] = this.wikiExtras.alt_langs;
        if (langPacks.length == 0) return ``;
        let languageComboString = langPacks
            .map((value, index) => {
                return this.renderOneLanguage(value);
            })
            .join('');

        return `
            <span class="lb-button cls-lang-lgbx"><button  on='tap:language-lightbox.close'></button></span>
            <nav class="lightbox" tabindex="0" role="widget">
                <div class="lang-ct">
                    <h2>Alternate Languages</h2>
                    <ul class="lang-ul">
                        ${languageComboString}
                    </ul>
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
                        "title": "${this.sanitizedVariables.page_title}"
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

    renderLightboxes = (): string => {
        return this.allLightBoxes.join('');
    };

    renderSchemaHTML = (): string => {
        let schema_to_show = this.wikiExtras && this.wikiExtras.schema;
        return schema_to_show ? `
            <script type="application/ld+json">
                ${JSON.stringify(this.wikiExtras && this.wikiExtras.schema)}
            </script>
        ` : '';
    };
}
