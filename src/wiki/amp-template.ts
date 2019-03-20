import { ArticleJson } from './article-dto';
import { styleNugget } from './amp-style'
import { AmpRenderPartial } from './amp-render-partial'

export const renderAMP = (inputJSON: ArticleJson): string => {
    // TODO: REMEMBER TO PRE-SELECT STRINGS LIKE inputJSON.page_title AND USE VARIBLES BELOW, FOR SPEED REASONS 
    const RANDOMSTRING = Math.random().toString(36).substring(7);
    let ampPartialRenderer = new AmpRenderPartial(inputJSON);
    const theHTML = `
    <!DOCTYPE html>
    <html amp lang="${inputJSON.metadata.page_lang}">
        <head>
            <meta charset="utf-8">
            <meta name="theme-color" content="#FFFFFF">
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
            <link href="https://fonts.googleapis.com/css?family=Poppins:400,400i,600&amp;subset=latin-ext" rel="stylesheet">
            <script async src="https://cdn.ampproject.org/v0.js"></script>
            ${ inputJSON.amp_info.load_youtube_js ? 
                '<script async custom-element="amp-youtube" src="https://cdn.ampproject.org/v0/amp-youtube-0.1.js"></script>' : ''
            }
            <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
            <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
            <script async custom-element="amp-iframe" src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>
            ${ inputJSON.amp_info.load_audio_js ?
                '<script async custom-element="amp-audio" src="https://cdn.ampproject.org/v0/amp-audio-0.1.js"></script>' : ''
            }
            <script async custom-element="amp-sidebar" src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"></script>
            <script async custom-element="amp-lightbox" src="https://cdn.ampproject.org/v0/amp-lightbox-0.1.js"></script>
            <script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
            ${ inputJSON.amp_info.load_video_js ?
                '<script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>' : ''
            }
            <meta property="og:type" content="article"/>
            <meta name="twitter:card" content="summary">
            ${ !inputJSON.metadata.is_indexed ?
                '<meta name="googlebot" content="noindex, nofollow, noarchive">' : ''
            }
            ${ inputJSON.metadata.page_type == 'Person' ?
                `<title>${inputJSON.page_title} | Wiki & Bio | Everipedia</title>
                <meta name="description" content="${inputJSON.page_title}'s wiki: NEED_BLURB_SNIPPET_HERE ">
                <meta name="keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} bio, ${inputJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${inputJSON.page_title} news, who is ${inputJSON.page_title}, where is ${inputJSON.page_title}" >
                <meta name="news_keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} bio, ${inputJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${inputJSON.page_title}"/>
                <meta name="twitter:title" content="${inputJSON.page_title} | Wiki & Bio |">` :
            inputJSON.metadata.page_type == 'Product' ?
                `<title>${inputJSON.page_title} | Wiki & Review | Everipedia</title>
                <meta name="description" content="${inputJSON.page_title}'s wiki: NEED_BLURB_SNIPPET_HERE ">
                <meta name="keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia')>, ${inputJSON.page_title} review">
                <meta itemprop="keywords" content="${inputJSON.page_title} news, what is ${inputJSON.page_title}" >
                <meta name="news_keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia')>, ${inputJSON.page_title} review">
                <meta property="og:title" content="${inputJSON.page_title}"/>
                <meta name="twitter:title" content="${inputJSON.page_title} | Wiki & Review |">` :
            inputJSON.metadata.page_type == 'Organization' ?
                `<title>${inputJSON.page_title} | Wiki & Review | Everipedia</title>
                <meta name="description" content="${inputJSON.page_title}'s wiki: NEED_BLURB_SNIPPET_HERE ">
                <meta name="keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history')>, ${inputJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${inputJSON.page_title} news, what is ${inputJSON.page_title}, where is ${inputJSON.page_title}" >
                <meta name="news_keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history, ${inputJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${inputJSON.page_title}"/>
                <meta name="twitter:title" content="${inputJSON.page_title} | Wiki & Review |">` :
            inputJSON.metadata.page_type ?
                `<title>${inputJSON.page_title} | Wiki | Everipedia</title>
                <meta name="description" content="${inputJSON.page_title}'s wiki: NEED_BLURB_SNIPPET_HERE ">
                <meta name="keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${inputJSON.page_title} news, what is ${inputJSON.page_title}" >
                <meta name="news_keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${inputJSON.page_title}"/>
                <meta name="twitter:title" content="${inputJSON.page_title} | Wiki |">` : ''
            }

            <meta property="article:tag" content="${inputJSON.page_title}">
            <meta property="article:published_time" content="${inputJSON.metadata.creation_timestamp }" />
            <meta property="article:modified_time" content="${inputJSON.metadata.last_modified }" />
            <meta property="og:image" content="${inputJSON.main_photo.url}?nocache=${RANDOMSTRING}" />
            <meta property="og:image" content="${inputJSON.main_photo.thumb}" />
            <meta property="og:description" content="NEED BLURB SNIPPET HERE"/>
            <meta name="og:url" content="https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}">

            <meta name="twitter:image" content="${inputJSON.main_photo.url}?nocache=${RANDOMSTRING}">
            <meta name="twitter:image" content="${inputJSON.main_photo.thumb}">
            <meta name="twitter:description" content="NEED BLURB SNIPPET HERE">
            <meta name="twitter:url" content="https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}">
            
            <meta property="fb:app_id" content="1617004011913755" />
            <meta property="fb:pages" content="328643504006398"/>
            <meta property="article:author" content="https://www.facebook.com/everipedia">


            <link rel="canonical" href="https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}" />
            ${"// NEED TO PUT THE HREFLANGS HERE"}
        
            <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
            <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
            ${styleNugget}
        </head>
        <body>
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
            ${ampPartialRenderer.renderMainPhoto()}
        </body>
    </html>
   `;
   return theHTML;
}