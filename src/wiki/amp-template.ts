import { ArticleJson } from './article-dto';

export const renderAMP = (inputJSON: ArticleJson): string => {
    const RANDOMSTRING = Math.random().toString(36).substring(7);
    const theHTML = `
    <!DOCTYPE html>
    <html amp lang="${inputJSON.metadata.page_lang}">
        <head>
            <meta charset="utf-8">
            <meta name="theme-color" content="#FFFFFF">
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
            <link href="https://fonts.googleapis.com/css?family=Poppins:400,400i,600&amp;subset=latin-ext" rel="stylesheet">
            <script async src="https://cdn.ampproject.org/v0.js"></script>
            <if(inputJSON.amp_info.load_youtube_js)>
                <script async custom-element="amp-youtube" src="https://cdn.ampproject.org/v0/amp-youtube-0.1.js"></script>
            <endif>
            <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
            <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
            <script async custom-element="amp-iframe" src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>
            <if(inputJSON.amp_info.load_audio_js)>
                <script async custom-element="amp-audio" src="https://cdn.ampproject.org/v0/amp-audio-0.1.js"></script>
            <endif>
            <script async custom-element="amp-sidebar" src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"></script>
            <script async custom-element="amp-lightbox" src="https://cdn.ampproject.org/v0/amp-lightbox-0.1.js"></script>
            <script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
            <if(inputJSON.amp_info.load_video_js)>
                <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>
            <endif>
            <meta property="og:type" content="article"/>
            <meta name="twitter:card" content="summary">
            <if(!inputJSON.metadata.is_indexed)>
                <meta name="googlebot" content="noindex, nofollow, noarchive">
            <endif>
            <if(inputJSON.metadata.page_type == 'Person')>
                <title>${inputJSON.page_title} | Wiki & Bio | Everipedia</title>
                <meta name="description" content="${inputJSON.page_title}'s wiki: NEED_BLURB_SNIPPET_HERE ">
                <meta name="keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} bio, ${inputJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${inputJSON.page_title} news, who is ${inputJSON.page_title}, where is ${inputJSON.page_title}" >
                <meta name="news_keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} bio, ${inputJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${inputJSON.page_title}"/>
                <meta name="twitter:title" content="${inputJSON.page_title} | Wiki & Bio |">
            <elseif(PAGEMETADATA.page_type == 'Product')>
                <title>${inputJSON.page_title} | Wiki & Review | Everipedia</title>
                <meta name="description" content="${inputJSON.page_title}'s wiki: NEED_BLURB_SNIPPET_HERE ">
                <meta name="keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia')>, ${inputJSON.page_title} review">
                <meta itemprop="keywords" content="${inputJSON.page_title} news, what is ${inputJSON.page_title}" >
                <meta name="news_keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia')>, ${inputJSON.page_title} review">
                <meta property="og:title" content="${inputJSON.page_title}"/>
                <meta name="twitter:title" content="${inputJSON.page_title} | Wiki & Review |">
            <elseif(PAGEMETADATA.page_type == 'Organization')>
                <title>${inputJSON.page_title} | Wiki & Review | Everipedia</title>
                <meta name="description" content="${inputJSON.page_title}'s wiki: NEED_BLURB_SNIPPET_HERE ">
                <meta name="keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history')>, ${inputJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${inputJSON.page_title} news, what is ${inputJSON.page_title}, where is ${inputJSON.page_title}" >
                <meta name="news_keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history, ${inputJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${inputJSON.page_title}"/>
                <meta name="twitter:title" content="${inputJSON.page_title} | Wiki & Review |">
            <else>
                <title>${inputJSON.page_title} | Wiki | Everipedia</title>
                <meta name="description" content="${inputJSON.page_title}'s wiki: NEED_BLURB_SNIPPET_HERE ">
                <meta name="keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia')>">
                <meta itemprop="keywords" content="${inputJSON.page_title} news, what is ${inputJSON.page_title}" >
                <meta name="news_keywords" content="${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia')>">
                <meta property="og:title" content="${inputJSON.page_title}"/>
                <meta name="twitter:title" content="${inputJSON.page_title} | Wiki |">
            <endif>

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
        </head>
        <body>

        </body>
    </html>
   `;
   return theHTML;
}