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
    console.log(chalk.yellow.bold("==================🚽 PRE-CLEANSING 🚽================="));
    const $ = cheerio.load(input_html, {decodeEntities: false});
    
    // Remove certain tags that mess with AMP
    process.stdout.write(chalk.yellow(`Removing tags that are problematic for AMP...`));
    $(NON_AMP_BAD_TAGS.join(", ")).remove();
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Remove style sections
    process.stdout.write(chalk.yellow(`Removing <style>...`));
    $('style').remove();
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Replace certain classes
    process.stdout.write(chalk.yellow(`Replacing certain classes...`));
    REPLACE_CLASSES_PREPARSE_UNIVERSAL.forEach(pack => {
        $(pack.target_selector).each((idx, $elem) => {
            $($elem).prop('tagName', pack.replacement_tag);
            let tempClass = $($elem).attr('class').replace(pack.target_class, pack.replacement_class);
            $($elem).attr('class', tempClass);
            // console.log(chalk.red(`${selector} replaced with ${pack.replacement_tag}.${pack.replacement_class}`));
        });
    });
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Remove certain elements
    process.stdout.write(chalk.yellow(`Removing certain elements...`));
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
    process.stdout.write(chalk.yellow(` DONE\n`));
    
    // Unwrap certain elements
    process.stdout.write(chalk.yellow(`Unwrapping certain elements...`));
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
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Remove crappy images that mess up the infobox
    // Also fix the hrefs for some images
    process.stdout.write(chalk.yellow(`Removing crappy images and fixing hrefs...`));
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
        if (theSrc.search(/Flag_of/gu) >= 0){
            // Mark the parent
            let theParent = $(img_elem).parent();
            let theClass = $(theParent).eq(0)[0].attribs['class'];
            if (theClass){
                if($(theParent).hasClass('flagicon')){
                    $(theParent).attr('class', theClass.replace('flagicon', "flagicon-parent"));
                }
                else{
                    $(theParent).attr('class', theClass + " flagicon-parent");
                }
            } 
            else $(theParent).attr('class', "flagicon-parent");

            // Add the class to the img too
            let theImgClass = $(img_elem).eq(0)[0].attribs['class'];
            if (theImgClass){
                if($(img_elem).hasClass('flagicon')){
                    $(img_elem).attr('class', theImgClass.replace('flagicon', "flagicon-img"));
                }
                else{
                    $(img_elem).attr('class', theImgClass + " flagicon-img");
                }
            } 
            else $(img_elem).attr('class', "flagicon-img");
        }

        // Try find medals
        if (theSrc.search(/medal_icon/gu) >= 0){
            let theMedalClass = $(img_elem).eq(0)[0].attribs['class'];
            if (theMedalClass && theMedalClass.search(/medalicon/gu) == -1) $(img_elem).attr('class', theMedalClass + " medalicon");
            else if (!theMedalClass) $(img_elem).attr('class', "medalicon");
        }
    })
    process.stdout.write(chalk.yellow(` DONE\n`));

    

    // Convert quoteboxes to blockquotes
    process.stdout.write(chalk.yellow(`Converting quoteboxes to <blockquote>...`));
    $('.quotebox').each((idx, quotebox) => {
        $(quotebox).prop('tagName', 'blockquote');
        $(quotebox).addClass('wiki-quotebox');
    });
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Convert <strong> and <b> tags to **text** (Markdown)
    process.stdout.write(chalk.yellow(`Converting <strong> and <b> tags to Markdown **text**...`));
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
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Convert <em> and <i> tags to *text* (Markdown)
    process.stdout.write(chalk.yellow(`Converting <em> and <i> tags to Markdown *text*...`));
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
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Unpack section images with multiple pictures
    process.stdout.write(chalk.yellow(`Unpacking tmulti section images into single thumbs...`)); 
    $('.thumb.tmulti').each((idx, multi_thumb_elem) => {
        // Start a collection
        let new_singles: CheerioElement[] = [];

        // Process each tsingle
        $(multi_thumb_elem).find('.tsingle').each((idx, tsingle_elem) => {
            // Re-class the tsingle into thumbinner
            $(tsingle_elem).removeClass('tsingle').addClass('thumbinner')

            // Unwrap the thumbimage
            let thumb_img = $(tsingle_elem).children('.thumbimage');
            $(thumb_img).replaceWith($(thumb_img).contents());

            // Add the new single to the collection
            new_singles.push(tsingle_elem);
        })

        new_singles.forEach(new_single_elem => {
            // Make a clone of the tmulti
            let the_clone = $(multi_thumb_elem).clone();

            // Fill the clone with the single image only
            $(the_clone).html($.html(new_single_elem));

            // Add the clone after the original
            $(multi_thumb_elem).after(the_clone);
        })

        // Remove the multi
        $(multi_thumb_elem).remove();
    });
    process.stdout.write(chalk.yellow(` DONE\n`));
    

    // Convert latitude / longitude to plaintext with external link
    process.stdout.write(chalk.yellow(`Cleaning up latitude and longitude stuff...`));
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
            $($theParent).attr('href', the_href); // Prevents the &para pilcrow issue (maybe)
        }
        else {
            $($lat_long_elem).replaceWith(the_inner_text);
        }
    })
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Search for geography red dots and other jank in the infobox
    // Doing this makes sure infobox maps for places / airports / etc show up correctly
    process.stdout.write(chalk.yellow(`Fixing Red_pog and other stuff that appears overlain on maps...`));
    const $table = $('.infobox');
    if ($table.length > 0) {
        $($table).find("img").each((idx, img_elem) => {
            let theSrc = img_elem.attribs && img_elem.attribs['src'];
            if (theSrc && theSrc.search(/Red_pog|triangle_with_thick|Airplane_silhouette|Lighthouse_icon/gimu) >= 0){
                // console.log(chalk.yellow("Found geodot. Converting it..."));
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
    process.stdout.write(chalk.yellow(` DONE\n`));

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
    process.stdout.write(chalk.yellow(`Finding flagicons and normalizing them...`));
    $(".flagicon img").each((idx, flag_img) => {
        // Get the parent
        let flag_parent = $(flag_img).closest('.flagicon');

        // Mark the parent
        let theClass = $(flag_parent).eq(0)[0].attribs['class'];
        if (theClass){
            if($(flag_parent).hasClass('flagicon')){
                $(flag_parent).attr('class', theClass.replace('flagicon', "flagicon-parent"));
            }
            else{
                $(flag_parent).attr('class', theClass + " flagicon-parent");
            }
        } 
        else $(flag_parent).attr('class', "flagicon-parent");

        // Mark the img
        let theImgClass = $(flag_img).eq(0)[0].attribs['class'];
        if (theImgClass){
            if($(flag_img).hasClass('flagicon')){
                $(flag_img).attr('class', theImgClass.replace('flagicon', "flagicon-img"));
            }
            else{
                $(flag_img).attr('class', theImgClass + " flagicon-img");
            }
        } 
        else $(flag_img).attr('class', "flagicon-img");
    })
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Handle kartographers
    process.stdout.write(chalk.yellow(`Normalizing kartographer...`));
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
    });
    process.stdout.write(chalk.yellow(` DONE\n`));

    // Handle some math stuff
    // Convert to a <samp> tag for now so it gets parsed as nested tags on the frontend
    process.stdout.write(chalk.yellow(`Converting math stuff to normalized <samp> tags...`));
    $('.mwe-math-element img').each((idx, math_elem_img) => {
        console.log("------------------------------")
        // Get the ancestor tag that is a direct child of .mw-parser-output
        // Only use <p> for now as sometimes irrelevant divs are caught
        let ancestor_tag = $(math_elem_img).closest('.mw-parser-output > p');

        // Convert the tag type to <samp>, which means anything inside it needs to be parsed as nested
        $(ancestor_tag).prop('tagName', 'samp');
        $(ancestor_tag).addClass('wiki-math');

    });
    process.stdout.write(chalk.yellow(` DONE\n`));

    console.log(chalk.bold.green(`DONE`));
    return {
        cheerio_static: $
    }
}