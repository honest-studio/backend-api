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
            $($elem).eq(0)[0].tagName = pack.replacement_tag;
            $($elem).eq(0)[0].attribs['class'].replace(pack.target_class, pack.replacement_class);
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

    // try:
    //     # Search for geography red dots and other jank
    //     geoTable = boobSoup.findAll("table", {"class": re.compile("infobox")})
    //     dotImages = geoTable[0].findAll("img", {"src": re.compile("Red_pog|triangle_with_thick|Airplane_silhouette")})
    //     for geoDot in dotImages:
    //         print("FOUND GEODOT")
    //         dotNugget = geoDot.parent.parent.parent
    //         try:
    //             assert (dotNugget['class'])
    //             dotNugget['class'] = dotNugget['class'] + " geonugget"
    //         except:
    //             dotNugget['class'] = "geonugget"

    //         try:
    //             assert (geoDot['class'])
    //             geoDot['class'] = geoDot['class'] + " geodot"
    //         except:
    //             geoDot['class'] = "geodot"

    // except:
    //     pass

    return {
        cheerio_static: $
    }
}