import * as cheerio from 'cheerio';
import { parseInlineImage, cleanAttributes } from '../../../../src/utils/article-utils/article-converter';
import { PRECLEAN_BAD_ELEMENTS, 
    PRECLEAN_UNWRAP_ELEMENTS, 
    ElementCleaningPack, 
    NON_AMP_BAD_TAGS, 
    REPLACE_CLASSES_PREPARSE_UNIVERSAL,
    PRECLEAN_BAD_FILE_REGEXES,
    PRECLEAN_IMG_FIX_REGEXES,
    WHITESPACE_PRESERVATION_REGEX,
    KARTOGRAPHER_PIXEL_WIDTH
} from '../wiki-constants';

const chalk = require('chalk');

export interface CheerioPack {
    cheerio_static: CheerioStatic
}

export const preCleanHTML = (input_html: string): CheerioPack => {
    process.stdout.write(chalk.bold.green(`Cleaning the page 🚽 ...`));
    const $ = cheerio.load(input_html, {decodeEntities: false});
    
    // Remove certain tags that mess with AMP
    $(NON_AMP_BAD_TAGS.join(", ")).remove();

    // Remove style sections
    $('style').remove();

    // Replace certain classes
    REPLACE_CLASSES_PREPARSE_UNIVERSAL.forEach(pack => {
        let selector = `${pack.target_tag}.${pack.target_class}`;
        $(selector).each((idx, $elem) => {
            $($elem).prop('tagName', pack.replacement_tag);
            let tempClass = $($elem).attr('class').replace(pack.target_class, pack.replacement_class);
            $($elem).attr('class', tempClass);
            // console.log(chalk.red(`${selector} replaced with ${pack.replacement_tag}.${pack.replacement_class}`));
        });
    });

    // Remove crappy images that mess up the infobox
    // Also fix the hrefs for some images
    $("img").each((idx, img_elem) => {
        let theSrc = $(img_elem).eq(0)[0].attribs['src'];

        // Remove crappy images that mess up the infobox
        if (theSrc.search(PRECLEAN_BAD_FILE_REGEXES) >= 0) {
            $(img_elem).remove();
            // console.log(chalk.red(`Pictobox found and removed`));
        }

        // Fix the hrefs for some images
        if (theSrc.search(PRECLEAN_IMG_FIX_REGEXES) >= 0) {
            $(img_elem).attr("src", `https://en.wikipedia.org${theSrc}`);
            // console.log(chalk.red(`Image src fixed`));
        }

        // Try find flagicons
        let theParent = $(img_elem).parent();
        if(theParent.eq(0)[0].name == 'a'){
            if (theSrc.search(/Flag_of/gu) >= 0){
                let theClass = $(theParent).eq(0)[0].attribs['class'];
                if (theClass && theClass.search(/flagicon/gu) == -1) $(theParent).attr('class', theClass + " flagicon");
                else if (!theClass) $(theParent).attr('class', "flagicon");
            }
        }

        // Try find medals
        if (theSrc.search(/medal_icon/gu) >= 0){
            let theMedalClass = $(img_elem).eq(0)[0].attribs['class'];
            if (theMedalClass && theMedalClass.search(/medalicon/gu) == -1) $(img_elem).attr('class', theMedalClass + " medalicon");
            else if (!theMedalClass) $(img_elem).attr('class', "medalicon");
        }
    })

    // Remove certain elements
    PRECLEAN_BAD_ELEMENTS.forEach(pack => {
        let parent_selector = pack.parent ? 
                            `${pack.parent.tag ? pack.parent.tag : ""}${pack.parent.id ? '#' + pack.parent.id : ""}${pack.parent.class ? '.' + pack.parent.class : ""} `
                            : "" ;
        let selector = `${parent_selector}${pack.tag ? pack.tag : ""}${pack.id ? '#' + pack.id : ""}${pack.class ? '.' + pack.class : ""}`;
        $(selector).each((idx, $elem) => {
            $($elem).remove();
            // console.log(chalk.red(`${selector} removed...`));
        });
    });
    
    // Unwrap certain elements
    PRECLEAN_UNWRAP_ELEMENTS.forEach(pack => {
        let parent_selector = pack.parent ? 
                            `${pack.parent.tag ? pack.parent.tag : ""}${pack.parent.id ? '#' + pack.parent.id : ""}${pack.parent.class ? '.' + pack.parent.class : ""} `
                            : "" ;
        let selector = `${parent_selector}${pack.tag ? pack.tag : ""}${pack.id ? '#' + pack.id : ""}${pack.class ? '.' + pack.class : ""}`;
        $(selector).each((idx, $elem) => {
            $($elem).replaceWith($($elem).contents());
            // console.log(chalk.red(`${selector} unwrapped...`));
        });
    });

    // Convert <strong> and <b> tags to **text** (Markdown)
    $('strong, b').each(function() {
        // Get the string
        let theString = '';

        // // Preserve whitespace, but it will need to be moved
        // let reg_result = WHITESPACE_PRESERVATION_REGEX.exec($(this).text());

        // theString = $(this).html().trim() || '';
        theString = $(this).html().trim() || '';

        // Create the string
        let htmlString = `**${theString}**`;

        // Handle inner <abbr>, <i>, or <tag><img /></tag> if present
        let inner_abbr = $(this).find('abbr');
        let inner_i = $(this).find('em, i'); // Special cases
        if (inner_abbr.length) {
            // Add the NON-Markdowned string inside the abbr
            $(inner_abbr).html(theString);

            // Replace the bold with the inner abbr
            $(this).replaceWith(inner_abbr);
        }
        else if (inner_i.length){
            htmlString = `***${$(inner_i).text().trim()}***`;
            $(this).replaceWith(htmlString);
        }
        else {
            // Replace the tag with the string
            $(this).replaceWith(htmlString);
        }
    });

    // Convert <em> and <i> tags to *text* (Markdown)
    $('em, i').each(function() {
        // Get the string
        let theString = '';

        // // Preserve whitespace, but it will need to be moved
        // let reg_result = WHITESPACE_PRESERVATION_REGEX.exec($(this).text());

        // theString = $(this).html().trim() || '';
        theString = $(this).html().trim() || '';
        

        // Create the string
        let htmlString = `*${theString}*`;

        // Replace the tag with the string
        $(this).replaceWith(htmlString);
    });

    // Convert latitude / longitude to plaintext with external link
    $('.geo-default').each((idx, $lat_long_elem) => {
        let $theParent = $($lat_long_elem).parent();
        let parentAttribs = $theParent.eq(0)[0].attribs;
        let the_href = parentAttribs && parentAttribs['href'] && parentAttribs['href'].replace(/^\/\//gimu, "http://");
        // let new_anchor_tag = ` <a class='external text' href='${parentAttribs.href}' ></a>`;
        let the_inner_text =$($theParent).find('.geo-dms').text();
        if(parentAttribs && parentAttribs['class'].search(/external/gimu) >= 0) {
            $($theParent).html(the_inner_text);
            let the_param_split = the_href.split("?")
            the_href = the_param_split[0] + "?" + encodeURIComponent(the_param_split[1]);
            $($theParent).attr('href', the_href); // Prevents the &para pilcrow issue
        }
        else {
            $($lat_long_elem).replaceWith(the_inner_text);
        }
    })

    // Search for geography red dots and other jank in the infobox
    // Doing this makes sure infobox maps for places / airports / etc show up correctly
    const $table = $('.infobox');
    if ($table.length > 0) {
        $($table).find("img").each((idx, img_elem) => {
            let theSrc = img_elem.attribs && img_elem.attribs['src'];
            if (theSrc && theSrc.search(/Red_pog|triangle_with_thick|Airplane_silhouette/gimu) >= 0){
                console.log(chalk.yellow("Found geodot. Converting it..."));
                // Get the class of the geodot
                let theDotClass = img_elem.attribs && img_elem.attribs['class'];

                // Mark the image as a geodot
                $(img_elem).attr('class', theDotClass ? theDotClass + " geodot" : "geodot");

                // Get the wrapping parent / map area
                let $dot_nugget = $(img_elem).parent().parent().parent().eq(0)[0];

                // Get the class of the parent
                let theParentClass = $dot_nugget.attribs && $dot_nugget.attribs['class'];

                // Mark the parent as a geonugget
                $($dot_nugget).attr('class', theParentClass ? theParentClass + " geonugget" : "geonugget");
            }
        })
    }

    // // Search for geography red dots and other jank in section images
    // // Doing this makes sure infobox maps for places / airports / etc show up correctly
    // $('.mw-parser-output').find(".thumb img").each((idx, img_elem) => {
    //     let theSrc = img_elem.attribs && img_elem.attribs['src'];
    //     if (theSrc && theSrc.search(/Red_pog|triangle_with_thick|Airplane_silhouette/gimu) >= 0){
    //         console.log(chalk.yellow("Found geodot. Converting it..."));
    //         // Get the class of the geodot
    //         let theDotClass = img_elem.attribs && img_elem.attribs['class'];

    //         // Mark the image as a geodot
    //         $(img_elem).attr('class', theDotClass ? theDotClass + " geodot" : "geodot");

    //         // Get the wrapping parent / map area
    //         let $dot_nugget = $(img_elem).parent().parent().parent().eq(0)[0];

    //         // Get the class of the parent
    //         let theParentClass = $dot_nugget.attribs && $dot_nugget.attribs['class'];

    //         // Mark the parent as a geonugget
    //         $($dot_nugget).attr('class', theParentClass ? theParentClass + " geonugget" : "geonugget");
    //     }
    // })
    
    // Try to find flagicons and mark them
    $(".flagicon a").each((idx, flag_anchor_elem) => {
        let theClass = $(flag_anchor_elem).eq(0)[0].attribs['class'];
        if (theClass) $(flag_anchor_elem).attr('class', theClass + " flagicon");
        else $(flag_anchor_elem).attr('class', "flagicon");
    })

    // Handle kartographers
    $('a.mw-kartographer-container').each((idx, kartographer) => {
        let theAttribs = $(kartographer).eq(0)[0].attribs;
        let cleanedAttribs = cleanAttributes(theAttribs);
        
        // Will be used for the attribution
        $(kartographer).attr('href', 'https://www.openstreetmap.org/copyright'); 

        // Mark the anchor as an image
        $(kartographer).addClass('image'); 

        // Parse out the attributes
        let the_style = cleanedAttribs && cleanedAttribs.style && cleanedAttribs.style;
        let the_image_url = the_style.backgroundImage;
        the_image_url = the_image_url.replace(/^url\(/gimu, "").replace(/\)$/gimu, "");

        // Get the raw dimensions
        let width = the_style.width.replace("px", "");
        let height = the_style.height.replace("px", "");
        the_image_url = the_image_url.replace(`${width}x${height}`, `___WIDTH_x_HEIGHT___`);

        // Scale the dimensions to fit a 1201 px width, as AMP wants at least 1200px images
        let the_multiplier = KARTOGRAPHER_PIXEL_WIDTH / parseInt(width);
        width = KARTOGRAPHER_PIXEL_WIDTH.toString();
        height = ((parseInt(height) * the_multiplier) as number).toFixed(0);
        the_image_url = the_image_url.replace(`___WIDTH_x_HEIGHT___`, `${width}x${height}`);

        // Create the new image to substitute for the contents of the kartographer
        let theNewImg = `
            <img 
                alt="" 
                src='${the_image_url}'
                width='${width}'
                height='${height}' 
                data-file-width='${width}' 
                data-file-height='${height}' 
            >
        `
        // Set the <a> contents as the img
        $(kartographer).html(theNewImg);
    })

    process.stdout.write(chalk.bold.green(` DONE\n`));
    return {
        cheerio_static: $
    }
}