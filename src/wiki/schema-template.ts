import { ArticleJson } from './article-dto';

export const renderSchema = (inputJSON: ArticleJson): any => {
    const RANDOMSTRING = Math.random().toString(36).substring(7);
    const BLURB_SNIPPET_PLAINTEXT = '', OVERRIDE_MAIN_THUMB = false, AMP_PHOTO_HEIGHT = '', AMP_PHOTO_WIDTH = '';
    let schemaJSON = { 
        "@context": `http://schema.org`, 
        "@type": [`Article`, inputJSON.metadata.sub_page_type ? inputJSON.metadata.sub_page_type : inputJSON.metadata.page_type],
        "mainEntityOfPage": `https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}`,
        "url": `https://everipedia.org/wiki/lang_${inputJSON.metadata.page_lang}/${inputJSON.metadata.url_slug}`,
        "articleSection": `News, Trending`,
        "author": {
            "@type": "Organization",
            "name": "The Everipedia Community",
        },
        "publisher": {
            "@type": "Organization",
            "name": "Everipedia",
            "legalName": "Everipedia International",
            "sameAs": ["https://twitter.com/everipedia", "https://www.facebook.com/everipedia/"],
            "logo": {
                "@type": "ImageObject",
                "url": "https://epcdn-vz.azureedge.net/static/images/logo_600x60.png",
                "width": "600",
                "height": "60"
            }
        },
        "copyrightHolder": `Everipedia`,
        "datePublished": `${inputJSON.metadata.creation_timestamp}`,
        "dateModified": `${inputJSON.metadata.last_modified}`
    };
    switch (inputJSON.metadata.page_type){
        case 'Person':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} bio, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, who is ${inputJSON.page_title}, where is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s biography and wiki on Everipedia`;
            break;
        case 'Product':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} review, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
            break;
        case 'Organization':
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}, where is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
            break;
        default:
            schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
            schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
            schemaJSON["headline"] = `${inputJSON.page_title}'s wiki on Everipedia`;
    }
    schemaJSON["image"] = [];
    if (inputJSON.main_photo.url){
        schemaJSON["image"].push({
            "@type": "ImageObject",
            "url": `${ OVERRIDE_MAIN_THUMB ? 
                        `${OVERRIDE_MAIN_THUMB}?nocache=${RANDOMSTRING}` : 
                    inputJSON.main_photo.url ? `${inputJSON.main_photo.url}?nocache=${RANDOMSTRING}` : ``
                    }`,
            "name": inputJSON.page_title,
            "caption": inputJSON.page_title,
            "uploadDate": inputJSON.metadata.last_modified,
            "height": AMP_PHOTO_HEIGHT,
            "width": AMP_PHOTO_WIDTH,
        })
    }
    else {
        schemaJSON["image"].push({
            "@type": "ImageObject",
            "url": "https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png",
            "name": inputJSON.page_title,
            "caption": inputJSON.page_title,
            "uploadDate": inputJSON.metadata.last_modified,
            "height": 1274,
            "width": 1201,
        });
    }
    inputJSON.media_gallery.forEach((media, index) => {
        switch (media.type){
            case 'PICTURE':
                schemaJSON["image"].push({
                    "@type": "ImageObject",
                    "url": media.url,
                    "name": `${this.artJSON.page_title} Image #${index}`,
                    "caption": inputJSON.page_title,
                    "uploadDate": inputJSON.metadata.last_modified,
                    "height": 1274,
                    "width": 1201,
                });


//     ${ media.type == "PICTURE" ?
//     `<abbr itemprop="image" itemscope itemtype="http://schema.org/ImageObject">
//         <meta itemprop="url" content="${media.url}">
//         <meta itemprop="name" content="${this.artJSON.page_title} Image #${index}">
//         <meta itemprop="caption" content="${sanitizedCaptionPlaintext}">
//         <meta itemprop="uploadDate" content="${media.timestamp}">
//         <meta itemprop="height" content="300">
//         <meta itemprop="width" content="300">
//     </abbr>` : 







                break;
            case 'GIF':
                schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
                schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} review, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
                schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
                break;
            case 'YOUTUBE':
                schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
                schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}, where is ${inputJSON.page_title}`;
                schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
                break;
            case 'NORMAL_VIDEO':
                schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
                schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} history, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}, where is ${inputJSON.page_title}`;
                schemaJSON["headline"] = `${inputJSON.page_title}'s wiki & review on Everipedia`;
                break;
            default:
                schemaJSON["description"] = `${inputJSON.page_title}'s wiki: ${BLURB_SNIPPET_PLAINTEXT}`;
                schemaJSON["keywords"] = `${inputJSON.page_title}, ${inputJSON.page_title} wiki, ${inputJSON.page_title} encyclopedia, ${inputJSON.page_title} news, what is ${inputJSON.page_title}`;
                schemaJSON["headline"] = `${inputJSON.page_title}'s wiki on Everipedia`;
        }





// media.type == "GIF" ?
//     `<abbr itemprop="image" itemscope itemtype="http://schema.org/ImageObject">
//         <meta itemprop="url" content="${media.url}">
//         <meta itemprop="name" content="${this.artJSON.page_title} GIF Image #${index}">
//         <meta itemprop="caption" content="${sanitizedCaptionPlaintext}">
//         <meta itemprop="uploadDate" content="${media.timestamp}">
//         <meta itemprop="height" content="300">
//         <meta itemprop="width" content="300">
//     </abbr>` : 
// media.type == "YOUTUBE" ?
//     `<abbr itemprop="video" itemscope itemtype="http://schema.org/VideoObject">
//         <meta itemprop="url" content="${media.url}">
//         <meta itemprop="name" content="${this.artJSON.page_title} YouTube Video #${index}">
//         <meta itemprop="description" content="${sanitizedCaptionPlaintext}">
//         <meta itemprop="thumbnailUrl" content="https://i.ytimg.com/vi/YOUTUBE_ID_HERE/default.jpg">
//         <meta itemprop="uploadDate" content="${media.timestamp}">
//         <meta itemprop="height" content="300">
//         <meta itemprop="width" content="300">
//     </abbr>` :  
// media.type == "NORMAL_VIDEO" ?
//     `<abbr itemprop="video" itemscope itemtype="http://schema.org/VideoObject">
//         <meta itemprop="url" content="${media.url}">
//         <meta itemprop="name" content="${this.artJSON.page_title} Video #${index}">
//         <meta itemprop="description" content="${sanitizedCaptionPlaintext}">
//         <meta itemprop="thumbnailUrl" content="${media.url}?nocache=${RANDOMSTRING}">
//         <meta itemprop="uploadDate" content="${media.timestamp}">
//         <meta itemprop="height" content="300">
//         <meta itemprop="width" content="300">
//     </abbr>` : 
// true ? 
//     `` : ``
// }




        schemaJSON["image"].push({
            "@type": "ImageObject",
            "url": "https://epcdn-vz.azureedge.net/static/images/no-image-slide-big.png",
            "name": inputJSON.page_title,
            "caption": inputJSON.page_title,
            "uploadDate": inputJSON.metadata.last_modified,
            "height": 1274,
            "width": 1201,
        });
    })
    


















    console.log(schemaJSON);
    return `<script type="application/ld+json">${JSON.stringify(schemaJSON)}</script>`;
}
