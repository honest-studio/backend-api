import * as cheerio from 'cheerio';
import { PRECLEAN_BAD_ELEMENTS, 
    PRECLEAN_UNWRAP_ELEMENTS, 
    ElementCleaningPack, 
    NON_AMP_BAD_TAGS, 
    REPLACE_CLASSES_PREPARSE_UNIVERSAL,
    PRECLEAN_BAD_FILE_REGEXES,
    PRECLEAN_IMG_FIX_REGEXES
} from '../wiki-constants';
const chalk = require('chalk');

export interface CheerioPack {
    cheerio_static: CheerioStatic
}

export const preCleanHTML = (input_html: string): CheerioPack => {
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
        if (theSrc.search(PRECLEAN_BAD_FILE_REGEXES) >= 0) {
            $(img_elem).remove();
            // console.log(chalk.red(`Pictobox found and removed`));
        }
        else if (theSrc.search(PRECLEAN_IMG_FIX_REGEXES) >= 0) {
            $(img_elem).attr("src", `https://en.wikipedia.org${theSrc}`);
            // console.log(chalk.red(`Image src fixed`));
        }

        // // Fix the //upload.wikimedia.org issue
        // $(img_elem).attr("src", theSrc.replace(/(?<!https:|http:)\/\/upload.wikimedia.org/gimu, "https://upload.wikimedia.org"));
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
        theString = $(this).html().trim() || '';

        // Create the string
        let htmlString = `**${theString}**`;

        // Replace the tag with the string
        $(this).replaceWith(htmlString);
    });

    
    // Convert <em> and <i> tags to *text* (Markdown)
    $('em, i').each(function() {
        // Get the string
        let theString = '';
        theString = $(this).html().trim() || '';

        // Create the string
        let htmlString = `*${theString}*`;

        // Replace the tag with the string
        $(this).replaceWith(htmlString);
    });

    // Convert latitude / longitude to plaintext
    $('.geo-default').each((idx, $lat_long_elem) => {
        let $theParent = $($lat_long_elem).parent();
        let parentAttribs = $theParent.eq(0)[0].attribs;
        if(parentAttribs && parentAttribs['class'].search(/external/gimu) >= 0) {
            $($theParent).replaceWith($($theParent).find('.geo-dms').text());
        }
        else {
            $($lat_long_elem).replaceWith($($theParent).find('.geo-dms').text());
        }
            
    })

    // Search for geography red dots and other jank
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

    return {
        cheerio_static: $
    }
}