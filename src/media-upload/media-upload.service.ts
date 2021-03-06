import { Injectable } from '@nestjs/common';
import sizeOf from 'buffer-image-size';
import * as crypto from 'crypto';
import * as htmlparser2 from 'htmlparser2';
import { DWebp } from 'cwebp';
import * as Cheerio from 'cheerio';
import * as fs from 'fs';
const hbjs = require('handbrake-js')
const util = require('util');
import * as rp from 'request-promise';
const isGzip = require('is-gzip');

const imagemin = require('imagemin');
const imagemin_Gifsicle = require('imagemin-gifsicle');
const imagemin_Jpegtran = require('imagemin-jpegtran');
const imagemin_Optipng = require('imagemin-optipng');
const imagemin_Svgo = require('imagemin-svgo');
const imagemin_Webp = require('imagemin-webp');


import Jimp from 'jimp';
import * as mimeClass from 'mime';
import * as fetch from 'node-fetch';
import * as path from 'path';
import * as toArray from 'stream-to-array';
import { StringDecoder } from 'string_decoder';
import * as zlib from 'zlib';
import { AWSS3Service } from '../feature-modules/database';
import { fetchUrl } from './fetch-favicon';
import { linkCategorizer } from '../utils/article-utils/article-converter';
import { FileFetchResult, MediaUploadResult, MimePack, PhotoExtraData } from './media-upload-dto';
import { BookInfoPack, PeriodicalInfoPack } from '../types/api';
const sharp = require('sharp');
import * as axios from 'axios';
const isSvg = require('is-svg');
const extractFrame = require('ffmpeg-extract-frame');
const extractGIFFrames = require('./gif-extract-frames')
var colors = require('colors');
import { fromBuffer } from 'file-type';
const getYouTubeID = require('get-youtube-id');
const slugify = require('slugify');
slugify.extend({'%': '_u_'});

// const TEMP_DIR = path.join(__dirname, 'tmp-do-not-delete');
// const TEMP_DIR = path.join('tmp');
const TEMP_DIR = '/tmp';
export const PHOTO_CONSTANTS = {
    CROPPED_WIDTH: 1201,
    CROPPED_HEIGHT: 1201,
    DISPLAY_WIDTH: 275,
    CROPPED_MEDIUM_WIDTH: 640,
    CROPPED_MEDIUM_HEIGHT: 640,
    CROPPED_THUMB_WIDTH: 320,
    CROPPED_THUMB_HEIGHT: 320,
    CROPPED_TINYTHUMB_WIDTH: 100,
    CROPPED_TINYTHUMB_HEIGHT: 100,
    CROPPED_META_THUMB_WIDTH: 250,
    CROPPED_META_THUMB_HEIGHT: 250,
};

export interface UrlPack {
    url: string
}

const UNIVERSAL_HEADERS = {
    'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/71.0.3578.98 Chrome/71.0.3578.98 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Charset': 'utf-8,ISO-8859-1;q=0.7,*;q=0.3',
    'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8,it;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive'
};
const VALID_VIDEO_EXTENSIONS = [
    '.mp4',
    '.m4v',
    '.flv',
    '.f4v',
    '.ogv',
    '.ogx',
    '.wmv',
    '.webm',
    '.3gp',
    '.3g2',
    '.mpg',
    '.mpeg',
    '.mov',
    '.avi'
];
const VALID_AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a'];

function callbackClosure(i, callback) {
    return function() {
      return callback(i);
    }
  }

@Injectable()
export class MediaUploadService {
    constructor(private awsS3Service: AWSS3Service) {}

    // Fetch a thumbnail from an external URL, like the og:image or twitter:image
    getFavicon(inputPack: UrlPack, timeout?: number): Promise<any> {
        let timeoutToUse = undefined;
        timeoutToUse = timeout ? timeout : 3500;

        // Set up the timeout

        return fetchUrl(inputPack.url, timeoutToUse);
    }

    async getBookInfoFromISBN(inputISBN: string, timeout?: number): Promise<BookInfoPack> {
        let timeoutToUse = undefined;
        timeoutToUse = timeout ? timeout : 3500;

        let initialPack: BookInfoPack = {
            title: "<TITLE>",
            thumb: null,
            url: `https://openlibrary.org/api/books?bibkeys=ISBN:${inputISBN}&jscmd=data&format=json`,
            isbn_10: "<ISBN-10>",
            isbn_13: "<ISBN-13>",
            author: "<AUTHOR>",
            publisher: "<PUBLISHER>",
            published: "<PUBLISHED DATE>",
            description: []
        };
        
        // Fetch the url
        let response = await rp.default({
            uri: initialPack.url,
            headers: UNIVERSAL_HEADERS,
            resolveWithFullResponse: true,
            timeout: timeoutToUse
            // gzip: true
        }).then((response) => {
            return response;
        }).catch((err) => {
            console.log(err);
        });
        
        let bookJSON = JSON.parse(response.body);
        let theKey = Object.keys(bookJSON)[0];
        bookJSON = bookJSON[theKey];

        if(bookJSON && bookJSON.title){
            initialPack.title = `${bookJSON.title}${bookJSON.subtitle ? ": " + bookJSON.subtitle : ""}`;
            initialPack.thumb = bookJSON.cover && bookJSON.cover.medium;
            initialPack.url = bookJSON.url;
            initialPack.isbn_10 = bookJSON.identifiers && bookJSON.identifiers.isbn_10 && bookJSON.identifiers.isbn_10.length && bookJSON.identifiers.isbn_10[0];
            initialPack.isbn_13 = bookJSON.identifiers && bookJSON.identifiers.isbn_13 && bookJSON.identifiers.isbn_13.length && bookJSON.identifiers.isbn_13[0];
            initialPack.author = bookJSON.authors && bookJSON.authors.map(author => author.name).join(", ");
            initialPack.publisher = bookJSON.publishers && bookJSON.publishers.map(publisher => publisher.name).join(", ");
            initialPack.published = bookJSON.publish_date;
        }

        let availableIndex = 1;
        initialPack.description = [
            {
                index: 0,
                type: 'sentence',
                text: `${initialPack.author ? initialPack.author + '. ' : ''}***${initialPack.title}***, ${initialPack.publisher}, ${initialPack.published}.`
            },
        ]
        if (initialPack.isbn_10) {
            initialPack.description.push(
                {
                    index: availableIndex,
                    type: 'sentence',
                    text: `\nISBN-10: ${initialPack.isbn_10}`
                }
            );
            availableIndex++;
        }
        if (initialPack.isbn_13) {
            initialPack.description.push(
                {
                    index: availableIndex,
                    type: 'sentence',
                    text: `\nISBN-13: ${initialPack.isbn_13}`
                }
            );
            availableIndex++;
        }
        
        return initialPack;
    }

    async getPeriodicalInfoFromISSN(inputISSN: string, timeout?: number): Promise<PeriodicalInfoPack> {
        let timeoutToUse = undefined;
        timeoutToUse = timeout ? timeout : 3500;
        
        let initialPack: PeriodicalInfoPack = {
            title: "<TITLE>",
            thumb: null,
            url: `https://portal.issn.org/resource/ISSN/${inputISSN}`,
            issn: "<ISSN>",
            author: "<AUTHOR>",
            publisher: "<PUBLISHER>",
            published: "<PUBLISHED DATE>",
            description: []
        };
        
        // // Fetch the url
        // let response = await rp.default({
        //     uri: `https://portal.issn.org/resource/ISSN/${inputISSN}?format=json`,
        //     headers: UNIVERSAL_HEADERS,
        //     resolveWithFullResponse: true,
        //     // gzip: true
        // }).then((response) => {
        //     return response;
        // }).catch((err) => {
        //     console.log(err);
        // });
        
        // let bookJSON = JSON.parse(response.body);
        // let theKey = Object.keys(bookJSON)[0];
        // bookJSON = bookJSON[theKey];

        // if(bookJSON && bookJSON.title){
        //     initialPack.title = `${bookJSON.title}${bookJSON.subtitle ? ": " + bookJSON.subtitle : ""}`;
        //     initialPack.thumb = bookJSON.cover && bookJSON.cover.medium;
        //     initialPack.url = bookJSON.url;
        //     initialPack.isbn_10 = bookJSON.identifiers && bookJSON.identifiers.isbn_10 && bookJSON.identifiers.isbn_10.length && bookJSON.identifiers.isbn_10[0];
        //     initialPack.isbn_13 = bookJSON.identifiers && bookJSON.identifiers.isbn_13 && bookJSON.identifiers.isbn_13.length && bookJSON.identifiers.isbn_13[0];
        //     initialPack.author = bookJSON.authors && bookJSON.authors.map(author => author.name).join(", ");
        //     initialPack.publisher = bookJSON.publishers && bookJSON.publishers.map(publisher => publisher.name).join(", ");
        //     initialPack.published = bookJSON.publish_date;
        // }

        // let availableIndex = 1;
        // initialPack.description = [
        //     {
        //         index: 0,
        //         type: 'sentence',
        //         text: `${initialPack.author ? initialPack.author + '. ' : ''}***${initialPack.title}***, ${initialPack.publisher}, ${initialPack.published}.`
        //     },
        // ]
        // if (initialPack.isbn_10) {
        //     initialPack.description.push(
        //         {
        //             index: availableIndex,
        //             type: 'sentence',
        //             text: `\nISBN-10: ${initialPack.isbn_10}`
        //         }
        //     );
        //     availableIndex++;
        // }
        // if (initialPack.isbn_13) {
        //     initialPack.description.push(
        //         {
        //             index: availableIndex,
        //             type: 'sentence',
        //             text: `\nISBN-13: ${initialPack.isbn_13}`
        //         }
        //     );
        //     availableIndex++;
        // }
        
        return initialPack;
    }


    // Fetch a file from an external URL
    async getRemoteFile(inputPack: UrlPack, timeout?: number): Promise<FileFetchResult> {
        let theCategory = linkCategorizer(inputPack.url);
        let urlToUse = inputPack.url;

        // Set timeout
        let timeoutToUse = undefined;
        timeoutToUse = timeout ? timeout : 5000;

        // Test for YouTube first
        if (theCategory == 'YOUTUBE'){
            urlToUse = `https://i.ytimg.com/vi/${getYouTubeID(urlToUse)}/maxresdefault.jpg`;
        }

        // console.log("TESTING HERE!!!");
        // console.log("TESTING HERE!!!");
        // console.log(urlToUse)

        let response = await axios.default({
            url: urlToUse,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: timeoutToUse
        })

        let fileBuffer = response.data;
        let mimePack: MimePack = await fromBuffer(fileBuffer);
        if (mimePack == null){
            if (isSvg(fileBuffer)){
                mimePack = {
                    ext: 'svg',
                    mime: 'image/svg+xml'
                } as any;
            }
        }
        let returnPack: FileFetchResult = {
            file_buffer: fileBuffer,
            mime_pack: mimePack,
            category: theCategory as any,
        };
        return returnPack;
    }

    // Fetch a thumbnail from an external URL, like the og:image or twitter:image
    bufferToString(inputBuffer: Buffer) {
        try {
            // Create an empty decoder
            const decoder = new StringDecoder('utf8');

            // Create a Buffer from the string
            const rawString = Buffer.from(inputBuffer);

            // Return the stringified buffer
            return decoder.write(rawString);
        } catch (e) {
            return null;
        }
    }

    // TODO: NEED TO FIX THIS
    // Try to fetch a thumbnail from a website
    // async fetchMetaThumbnail(targetURL: string, slug: string, lang:string, ipfs_truncated: string){
    //     try {
    //         // Try to determine the favicon URL for a given HTML URL
    //         let linkToMetaImage = await this.getFavicon(targetURL);

    //         // Get the buffer of the favicon
    //         let faviconBuffer = await this.getImageBufferFromURL(linkToMetaImage);

    //         // Upload the favicon to the S3 bucket
    //         return await this.processMedia(faviconBuffer, 'GalleryMediaItem', slug, ipfs_truncated)

    //     }
    //     catch (e){
    //         return null;
    //     }
    // }

    // Get a buffer from a URL
    async getImageBufferFromURL(inputURL: string, timeout?: number): Promise<Buffer> {
        const options = {
            headers: UNIVERSAL_HEADERS
        };

        // Set timeout
        let timeoutToUse = undefined;
        timeoutToUse = timeout ? timeout : 5000;

        try {
            // console.log(colors.yellow(inputURL))
            return axios.default({
                url: inputURL,
                method: 'GET',
                responseType: 'arraybuffer',
                timeout: timeoutToUse
            }).then(response => {
                let buffer = response.data;
                return buffer;
            })
            
        } catch (e) {
            console.log(e);
        }
    }

    // Get the dimensions and the MIME type of a photo. This is used for AMP
    async getImageData(inputURL: string): Promise<PhotoExtraData> {
        let photoDataResult: PhotoExtraData = { width: null, height: null, mime: null };
        try {
            let imgBuffer = await this.getImageBufferFromURL(inputURL);
            let mimeResult = await fromBuffer(imgBuffer);
            if (mimeResult == null){
                if (isSvg(imgBuffer)){
                    mimeResult = {
                        ext: 'svg',
                        mime: 'image/svg+xml'
                    } as any;
                }
            }
            let sizeResult = sizeOf(imgBuffer);
            photoDataResult.width = sizeResult.width;
            photoDataResult.height = sizeResult.height;
            photoDataResult.mime = mimeResult.mime;
            return photoDataResult;
        } catch (e) {
            console.log(e);
            return photoDataResult;
        }
    }

    // Compress a PNG, GIF, JPEG, or SVG buffer and return the compressed buffer
    async compressImage(inputBuffer: Buffer) {
        try {
            let result = await imagemin.buffer(inputBuffer, {
                plugins: [
                    imagemin_Gifsicle({ optimizationLevel: 3 }),
                    imagemin_Jpegtran(),
                    imagemin_Optipng({ number: 7 }),
                    imagemin_Svgo({ removeViewBox: false, }),
                    imagemin_Webp({ preset: 'photo', quality: 60, method: 6, alphaQuality: 60 })
                ]
            });
            return result;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    // Get a png buffer from the first frame of a GIF. Will be used as the GIF's thumbnail.
    async getPNGFrameFromGIF(gifBuffer: Buffer): Promise<Buffer> {

        try {
            // Get the PNG stream first
            const pngStream = await extractGIFFrames({
                input_buffer: gifBuffer,
                input_mime: 'image/gif'
            });

            // Convert the stream to a Buffer so jimp can use it later
            return toArray(pngStream).then(function(parts) {
                var buffers: any[] = [];
                for (var i = 0, l = parts.length; i < l; ++i) {
                    var part = parts[i];
                    buffers.push(part instanceof Buffer ? part : new Buffer(part));
                }
                // Return the Buffer
                let result = Buffer.concat(buffers);
                return result;
            });
        } catch (e) {
            return null;
        }
    }

    // Process a photo and upload it to the AWS S3 Bucket.
    async processMedia(
        mediaBuffer: Buffer | string,
        lang: string,
        slug: string,
        identifier: string,
        uploadType: string,
        fileCaption: string,
        filename_override: string
    ): Promise<MediaUploadResult> {
        try {
            // let bufferToUse: Buffer;
            // if (mediaBuffer.constructor !== Array) {
            //     bufferToUse = await this.getImageBufferFromURL(mediaBuffer as string);
            // }
            // else { bufferToUse = mediaBuffer as Buffer };
            let bufferToUse = mediaBuffer as Buffer;
            let useMediaRoute = true;

            // Determine the MIME type
            let mimePack: MimePack = await fromBuffer(bufferToUse);
            let isVideo = false, isAudio = false;
            if (mimePack == null || mimePack.mime == 'application/xml'){
                if (isSvg(bufferToUse)){
                    mimePack = {
                        ext: 'svg',
                        mime: 'image/svg+xml'
                    } as any;
                }
            }

            // // Test the buffer to see if it corrupted
            // try {
            //     await sharp(bufferToUse).toBuffer()
            // }
            // catch (e) {
            //     throw('Gzip error with old PNG. Moving on.')
            // }

            if (mimePack.mime.includes('video')) isVideo = true;
            else if (mimePack.mime.includes('audio')) isAudio = true;

            // Determine whether to use the extra sizes
            let useExtraSizes = ['ChainProfile', 'ProfilePicture'].includes(uploadType) ? true : false;

            // Set some variables
            let varPack = { suffix: '', thumbSuffix: '', thumbMIME: '', mainMIME: '' };
            let bufferPack = { 
                mainBuf: null, 
                mediumBuf: null,
                thumbBuf: null,
                tinythumbBuf: null,
                webpOriginalBuf: null,
                webpMediumBuf: null,
                webpThumbBuf: null,
                webpTinyThumbBuf: null
            };

            // NOTES FOR S3 AND PUSHING STREAMS/BUFFERS
            // https://stackoverflow.com/questions/15817746/stream-uploading-an-gm-resized-image-to-s3-with-aws-sdk
            // TODO: Add TIFF support and resize down BMP thumbs
            // VALID_VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.flv', '.f4v', '.ogv', '.ogx', '.wmv', '.webm', '.3gp', '.3g2',
            // '.mpg', '.mpeg', '.mov', '.avi']

            // VALID_AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a']

            // Initialize the height and width of the thumbnails
            let mainWidth = PHOTO_CONSTANTS.CROPPED_WIDTH;
            let mainHeight = PHOTO_CONSTANTS.CROPPED_HEIGHT;
            let mediumWidth = PHOTO_CONSTANTS.CROPPED_MEDIUM_WIDTH;
            let mediumHeight = PHOTO_CONSTANTS.CROPPED_MEDIUM_HEIGHT;
            let thumbWidth = PHOTO_CONSTANTS.CROPPED_THUMB_WIDTH;
            let thumbHeight = PHOTO_CONSTANTS.CROPPED_THUMB_WIDTH;
            let tinythumbWidth = PHOTO_CONSTANTS.CROPPED_TINYTHUMB_WIDTH;
            let tinythumbHeight = PHOTO_CONSTANTS.CROPPED_TINYTHUMB_WIDTH;
            let includeMainPhoto: boolean = true;

            // Get a timestamp string from the Unix epoch
            let theTimeString = new Date()
                .getTime()
                .toString()
                .slice(-5);

            // Create a filename
            let filename_to_use = slugify(filename_override, { remove: /[*+~.()'"#%?!:@]/g });
            let filename = filename_to_use; //identifier.toString() // + '__' + theTimeString;

            // Initialize the return dictionaries
            let returnMiniDict = { filename: filename, caption: fileCaption };
            let returnPack: MediaUploadResult = { 
                mainPhotoURL: '', 
                thumbnailPhotoURL: '', 
                returnDict: returnMiniDict,
                mime: '',
                category: 'NONE'
            };

            // Determine how to move forward based on the MIME type
            let videoThumbBuffer = null;
            if (mimePack.mime.includes('image')) {
                switch (mimePack.mime) {
                    // Process SVGs
                    case 'image/svg+xml': {
                        varPack.suffix = 'svg';
                        varPack.mainMIME = 'image/svg+xml';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';
                        bufferPack.mainBuf = await this.compressImage(bufferToUse);

                        // Convert the uncompressed SVG into jpeg and resize it into a thumbnail
                        // let temp_buffer = await svg2png(bufferToUse)
                        //     .then(buffer => buffer)
                        //     .catch(e => console.error(e));

                        let temp_buffer = bufferToUse;

                        bufferPack.thumbBuf = await sharp(temp_buffer)
                            .resize(thumbWidth, thumbHeight, {
                                fit: 'inside',
                                // background: { r: 255, g: 255, b: 255, alpha: 1 }
                            })
                            .jpeg({ quality: 60, force: true })
                            .toBuffer()
                            .then((buffer) => buffer)
                            .catch((err) => console.log(colors.red("SVG ERROR ON thumbBuf: "), colors.red(err)));

                        if (useExtraSizes){
                            bufferPack.mediumBuf = await sharp(temp_buffer)
                                .resize(mediumWidth, mediumHeight, {
                                    fit: 'inside',
                                    // background: { r: 255, g: 255, b: 255, alpha: 1 }
                                })
                                .jpeg({ quality: 60, force: true })
                                .toBuffer()
                                .then((buffer) => buffer)
                                .catch((err) => console.log(colors.red("SVG ERROR ON mediumBuf: "), colors.red(err)));
                            
                            bufferPack.tinythumbBuf = await sharp(temp_buffer)
                                .resize(tinythumbWidth, tinythumbHeight, {
                                    fit: 'inside',
                                    // background: { r: 255, g: 255, b: 255, alpha: 1 }
                                })
                                .jpeg({ quality: 60, force: true })
                                .toBuffer()
                                .then((buffer) => buffer)
                                .catch((err) => console.log(colors.red("SVG ERROR ON tinythumbBuf: "), colors.red(err)));
                        }

                        break;
                    }
                    // Process HEIF / HEIC
                    case 'image/heif':
                    case 'image/heic':
                    case 'image/heif-sequence':
                    case 'image/heic-sequence': {
                        // TODO: NEED TO CONVERT TO JPEG
                        // WAIT UNTIL THERE IS MORE NPM SUPPORT
                        // JS library stolen from https://github.com/devMYC/heif-to-jpeg-demo since there is no npm package (yet)
                        // varPack.suffix = 'jpeg';
                        // varPack.mainMIME = 'image/jpeg';
                        // varPack.thumbSuffix = 'jpeg';
                        // varPack.thumbMIME = "image/jpeg";

                        // // Decode the HEIF and convert to a JPEG buffer using Canvas
                        // const decoder = new libheif.HeifDecoder();
                        // const [image] = decoder.decode(bufferToUse);
                        // const w = image.get_width();
                        // const h = image.get_height();
                        // const canvas = new Canvas(w, h);
                        // const ctx = canvas.getContext('2d');
                        // const imgData = ctx.createImageData(w, h);
                        // image.display(imgData, displayData => {
                        //     ctx.putImageData(displayData, 0, 0);
                        //     let coinmongler = ctx.toBuffer("image/jpeg");
                        //     let one = 1;
                        // })

                        // bufferPack.mainBuf = bufferToUse;
                        // bufferPack.thumbBuf = bufferToUse;
                        break;
                    }
                    // Process BMPs
                    case 'image/bmp':
                    case 'image/x-bmp':
                    case 'image/x-ms-bmp': {
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';

                        // Resize the BMP and convert it to JPEG due to AMP and compatibility issues (1200px width minimum)
                        bufferPack.mainBuf = await (Jimp as any).read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mainWidth, mainHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Set the BMP thumbnail as a JPEG
                        bufferPack.thumbBuf = await (Jimp as any).read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        if (useExtraSizes){
                            bufferPack.mediumBuf = await (Jimp as any).read(bufferToUse)
                                .then((image) =>
                                    image
                                        .background(0xffffffff)
                                        .scaleToFit(mediumWidth, mediumHeight)
                                        .quality(60)
                                        .getBufferAsync('image/jpeg')
                                )
                                .then((buffer) => buffer as any)
                                .catch((err) => console.log(err));
                            
                            bufferPack.tinythumbBuf = await (Jimp as any).read(bufferToUse)
                                .then((image) =>
                                    image
                                        .background(0xffffffff)
                                        .scaleToFit(tinythumbWidth, tinythumbHeight)
                                        .quality(60)
                                        .getBufferAsync('image/jpeg')
                                )
                                .then((buffer) => buffer as any)
                                .catch((err) => console.log(err));
                        }


                        break;
                    }
                    // Process TIFF files
                    case 'image/tiff':
                    case 'image/tiff-fx': {
                        console.log("TIFF HERE!!!")
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';

                        // Resize the TIFF and convert it to JPEG due to AMP and compatibility issues (1200px width minimum)
                        bufferPack.mainBuf = await (Jimp as any).read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mainWidth, mainHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Set the TIFF thumbnail as a JPEG
                        bufferPack.thumbBuf = await (Jimp as any).read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));


                        if (useExtraSizes){
                            bufferPack.mediumBuf = await (Jimp as any).read(bufferToUse)
                                .then((image) =>
                                    image
                                        .background(0xffffffff)
                                        .scaleToFit(mediumWidth, mediumHeight)
                                        .quality(60)
                                        .getBufferAsync('image/jpeg')
                                )
                                .then((buffer) => buffer as any)
                                .catch((err) => console.log(err));
                            
                            bufferPack.tinythumbBuf = await (Jimp as any).read(bufferToUse)
                                .then((image) =>
                                    image
                                        .background(0xffffffff)
                                        .scaleToFit(tinythumbWidth, tinythumbHeight)
                                        .quality(60)
                                        .getBufferAsync('image/jpeg')
                                )
                                .then((buffer) => buffer as any)
                                .catch((err) => console.log(err));
                        }

                        break;
                    }
                    // Process GIFs
                    case 'image/gif': {
                        varPack.suffix = 'gif';
                        varPack.mainMIME = 'image/gif';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';
                        bufferPack.mainBuf = await this.compressImage(bufferToUse);

                        // Get a PNG frame from the GIF, resize, then compress it to a JPEG
                        // Must resize to fit 1201x1201 to help with AMP
                        // FIX THIS LATER
                        bufferPack.thumbBuf = await sharp(bufferPack.mainBuf)
                            .resize(thumbWidth, thumbHeight, {
                                fit: 'inside',
                                // background: { r: 255, g: 255, b: 255, alpha: 1 }
                            })
                            .jpeg({ quality: 60, force: true })
                            .toBuffer()
                            .then((buffer) => buffer)
                            .catch((err) => console.log(colors.red("GIF ERROR ON thumbBuf: "), colors.red(err)));

                        if (useExtraSizes){
                            bufferPack.mediumBuf = await sharp(bufferPack.mainBuf)
                                .resize(mediumWidth, mediumHeight, {
                                    fit: 'inside',
                                    // background: { r: 255, g: 255, b: 255, alpha: 1 }
                                })
                                .jpeg({ quality: 60, force: true })
                                .toBuffer()
                                .then((buffer) => buffer)
                                .catch((err) => console.log(colors.red("GIF ERROR ON mediumBuf: "), colors.red(err)));
                            
                            bufferPack.tinythumbBuf = await sharp(bufferPack.mainBuf)
                                .resize(tinythumbWidth, tinythumbHeight, {
                                    fit: 'inside',
                                    // background: { r: 255, g: 255, b: 255, alpha: 1 }
                                })
                                .jpeg({ quality: 60, force: true })
                                .toBuffer()
                                .then((buffer) => buffer)
                                .catch((err) => console.log(colors.red("GIF ERROR ON tinythumbBuf: "), colors.red(err)));
                        }
                        break;
                    }
                    // Process WEBPs
                    case 'image/webp': {
                        // Convert to JPEG for maximum browser compatibility
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';

                        // Convert to PNG temporarily
                        let dwebpObj = new DWebp(bufferToUse);
                        // dwebpObj.png().toBuffer(function(err, thisBuffer) {
                        //     bufferPack.mainBuf = thisBuffer;
                        // });

                        // Convert to a PNG buffer temporarily
                        bufferPack.mainBuf = await dwebpObj
                            .png()
                            .toBuffer()
                            .then(function(thisBuffer) {
                                return thisBuffer;
                            });

                        // Need to switch the orders (thumb first) so the mainBuf gets evaluated
                        // Otherwise, errors will show up

                        // Convert the PNG to JPEG for the thumbnail
                        bufferPack.thumbBuf = await (Jimp as any).read(bufferPack.mainBuf)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Resize the PNG and convert to AMP JPEG due to AMP (1200px width minimum)
                        bufferPack.mainBuf = await (Jimp as any).read(bufferPack.mainBuf)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mainWidth, mainHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));


                        if (useExtraSizes){
                            bufferPack.mediumBuf = await (Jimp as any).read(bufferPack.mainBuf)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mediumWidth, mediumHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));
                            
                            bufferPack.tinythumbBuf = await (Jimp as any).read(bufferPack.mainBuf)
                                .then((image) =>
                                    image
                                        .background(0xffffffff)
                                        .scaleToFit(tinythumbWidth, tinythumbHeight)
                                        .quality(60)
                                        .getBufferAsync('image/jpeg')
                                )
                                .then((buffer) => buffer as any)
                                .catch((err) => console.log(err));
                        }

                        break;
                    }
                    // Process ICO files
                    case 'image/ico':
                    case 'image/icon':
                    case 'image/vnd.microsoft.icon':
                    case 'image/x-icon': {
                        varPack.suffix = 'ico';
                        varPack.mainMIME = 'image/x-icon';
                        varPack.thumbSuffix = 'ico';
                        varPack.thumbMIME = 'image/x-icon';
                        bufferPack.mainBuf = bufferToUse;
                        bufferPack.thumbBuf = bufferToUse;
                        break;
                    }
                    // Process JPEGs
                    case 'image/jpeg': {
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';

                        // Resize the JPEG due to AMP (1200px width minimum)
                        bufferPack.mainBuf = await (Jimp as any).read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mainWidth, mainHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Resize the JPEG for its thumbnail
                        bufferPack.thumbBuf = await (Jimp as any).read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));


                        if (useExtraSizes){
                            bufferPack.mediumBuf = await (Jimp as any).read(bufferPack.mainBuf)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mediumWidth, mediumHeight)
                                    .quality(60)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));
                            
                            bufferPack.tinythumbBuf = await (Jimp as any).read(bufferPack.mainBuf)
                                .then((image) =>
                                    image
                                        .background(0xffffffff)
                                        .scaleToFit(tinythumbWidth, tinythumbHeight)
                                        .quality(60)
                                        .getBufferAsync('image/jpeg')
                                )
                                .then((buffer) => buffer as any)
                                .catch((err) => console.log(err));
                        }


                        break;
                    }
                    // Process PNG files
                    case 'image/png': {
                        varPack.suffix = 'png';
                        varPack.mainMIME = 'image/png';
                        varPack.thumbSuffix = 'png';
                        varPack.thumbMIME = 'image/png';
                        

                        // Resize the PNG due to AMP (1200px width minimum)
                        bufferPack.mainBuf = await (Jimp as any).read(bufferToUse)
                            .then((image) => 
                                image
                                    .scaleToFit(mainWidth, mainHeight)
                                    .quality(60)
                                    .getBufferAsync('image/png')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Resize the PNG for its thumbnail
                        bufferPack.thumbBuf = await (Jimp as any).read(bufferToUse)
                            .then((image) =>
                                image
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(60)
                                    .getBufferAsync('image/png')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));


                        if (useExtraSizes){
                            bufferPack.mediumBuf = await (Jimp as any).read(bufferToUse)
                                .then((image) =>
                                    image
                                        .scaleToFit(mediumWidth, mediumHeight)
                                        .quality(60)
                                        .getBufferAsync('image/png')
                                )
                                .then((buffer) => buffer as any)
                                .catch((err) => console.log(err));
                            
                            bufferPack.tinythumbBuf = await (Jimp as any).read(bufferToUse)
                                .then((image) =>
                                    image
                                        .scaleToFit(tinythumbWidth, tinythumbHeight)
                                        .quality(60)
                                        .getBufferAsync('image/png')
                                )
                                .then((buffer) => buffer as any)
                                .catch((err) => console.log(err));
                        }


                        // bufferPack.thumbBuf = await sharp(bufferToUse)
                        //     .resize(mainWidth, mainHeight, {
                        //         fit: 'inside',
                        //         // background: { r: 255, g: 255, b: 255, alpha: 1 }
                        //     })
                        //     .jpeg({ quality: 60, force: true })
                        //     .toBuffer()
                        //     .then((buffer) => buffer)
                        //     .catch((err) => console.log(colors.red("PNG ERROR ON thumbBuf: "), colors.red(err)));

                        // // Resize the PNG due to AMP (1200px width minimum)
                        // bufferPack.thumbBuf = await sharp(bufferToUse)
                        //     .resize(thumbWidth, thumbHeight, {
                        //         fit: 'inside',
                        //         // background: { r: 255, g: 255, b: 255, alpha: 1 }
                        //     })
                        //     .jpeg({ quality: 60, force: true })
                        //     .toBuffer()
                        //     .then((buffer) => buffer)
                        //     .catch((err) => console.log(colors.red("PNG ERROR ON thumbBuf: "), colors.red(err)));

                        // if (useExtraSizes){
                        //     bufferPack.mediumBuf = await sharp(bufferToUse)
                        //         .resize(mediumWidth, mediumHeight, {
                        //             fit: 'inside',
                        //             // background: { r: 255, g: 255, b: 255, alpha: 1 }
                        //         })
                        //         .jpeg({ quality: 60, force: true })
                        //         .toBuffer()
                        //         .then((buffer) => buffer)
                        //         .catch((err) => console.log(colors.red("PNG ERROR ON mediumBuf: "), colors.red(err)));
                            
                        //     bufferPack.tinythumbBuf = await sharp(bufferToUse)
                        //         .resize(tinythumbWidth, tinythumbHeight, {
                        //             fit: 'inside',
                        //             // background: { r: 255, g: 255, b: 255, alpha: 1 }
                        //         })
                        //         .jpeg({ quality: 60, force: true })
                        //         .toBuffer()
                        //         .then((buffer) => buffer)
                        //         .catch((err) => console.log(colors.red("PNG ERROR ON tinythumbBuf: "), colors.red(err)));
                        // }
                        // break;


                        break;
                    }
                    default: {
                        break;
                    }
                }
            } else if (isVideo) {
                // Because of various shenanigans, you need to write the buffer to /tmp first...
                var tempFileNameInput = crypto.randomBytes(5).toString('hex') + '-' + theTimeString + '.' + mimePack.ext;
                var tempFileNameOutput = crypto.randomBytes(5).toString('hex') + '-' + theTimeString + '.jpeg';
                // var tempFileNameOutputAltered = tempFileNameOutput.replace('.jpeg', '__altered.jpeg');
                let tempPath = path.join(TEMP_DIR, tempFileNameInput);
                let snapshotPath = path.join(TEMP_DIR, tempFileNameOutput);
                // let snapshotPathAltered = path.join(TEMP_DIR, tempFileNameOutputAltered);
                fs.writeFileSync(tempPath, bufferToUse);
                fs.writeFileSync(snapshotPath, '');
                // fs.writeFileSync(snapshotPathAltered, '');

                // Convert other video types to mp4
                let convertedPath;
                if (mimePack.ext != 'mp4'){
                    convertedPath = tempPath.replace(`.${mimePack.ext}`, '.mp4')
                    const options = {
                        input: tempPath,
                        output: convertedPath
                    }

                    try {
                        const result = await hbjs.run(options);
                    } catch (err) {
                        console.log(err);
                    }

                }
                
                if (convertedPath){
                    bufferToUse = fs.readFileSync(convertedPath);
                    await fs.unlinkSync(tempPath);
                    tempPath = convertedPath;
                }

                try {
                    await extractFrame({
                        input: tempPath,
                        output: snapshotPath,
                        offset: 1000 // seek offset in milliseconds
                    });

                    // Set some variables
                    varPack.suffix = 'mp4';
                    varPack.mainMIME = 'video/mp4';
                    varPack.thumbSuffix = 'jpeg';
                    varPack.thumbMIME = 'image/jpeg';

                    // Set the buffer
                    bufferPack.mainBuf = bufferToUse;
                    videoThumbBuffer = fs.readFileSync(snapshotPath);

                    // Resize the snapshot JPEG
                    bufferPack.thumbBuf = await (Jimp as any)
                        .read(snapshotPath)
                        .then((image) =>
                            image
                                .background(0xffffffff)
                                .scaleToFit(thumbWidth, thumbHeight)
                                .quality(60)
                                .getBufferAsync('image/jpeg')
                        )
                        .then((buffer) => buffer as any)
                        .catch((err) => {
                            console.log(colors.yellow('Video thumb buffer failed'));
                            console.log(err);
                        });
                    
                        // await fs.writeFileSync(snapshotPathAltered, bufferPack.thumbBuf)
                    

                } catch (err) {
                    console.log(err);
                }

                // Delete the temp files
                // await fs.unlinkSync(tempPath);
                await fs.unlinkSync(snapshotPath);
                // await fs.unlinkSync(snapshotPathAltered);
            } else {
                // Normal file (or audio)
                useMediaRoute = false;
                varPack.suffix = mimePack.ext;
                varPack.mainMIME = mimePack.mime;
                bufferPack.mainBuf = bufferToUse;
            }

            if(
                useMediaRoute && (
                    varPack.suffix == 'jpeg' 
                    || varPack.suffix == 'png' 
                    || mimePack.mime.indexOf('webp') >= 0 
                    || mimePack.mime.indexOf('tiff') >= 0
                    || mimePack.mime.indexOf('gif') >= 0
                    || mimePack.mime.indexOf('svg') >= 0
                    || mimePack.mime.indexOf('application/xml') >= 0
                    || mimePack.mime.indexOf('image/svg+xml') >= 0
                    || (isVideo && videoThumbBuffer)
                )
            ){
                let temp_bufferToUse = bufferToUse;
                
                // Fix for SVGs. Sharp crashes on them
                if ( mimePack.mime.indexOf('svg') >= 0
                    || mimePack.mime.indexOf('application/xml') >= 0
                    || mimePack.mime.indexOf('image/svg+xml') >= 0
                ){
                    // temp_bufferToUse = await svg2png(bufferToUse, { width: PHOTO_CONSTANTS.CROPPED_WIDTH, height: PHOTO_CONSTANTS.CROPPED_HEIGHT })
                    //     .then(buffer => buffer)
                    //     .catch(e => console.error(e));
                    temp_bufferToUse = bufferToUse;
                }
                else if (isVideo){
                    temp_bufferToUse = videoThumbBuffer;
                }

                // Get the original image in WEBP form
                bufferPack.webpOriginalBuf = await sharp(temp_bufferToUse)
                    .resize(mainWidth, mainHeight, {
                        fit: 'inside',
                        // background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .webp({ quality: 60, reductionEffort: 6, alphaQuality: 60, force: true })
                    .toBuffer()
                    .then((buffer) => buffer as any)
                    .catch((err) => console.log("webpOriginalBuf error: ", err));

                // Resize the WEBP for the medium image
                bufferPack.webpMediumBuf = await sharp(temp_bufferToUse)
                    .resize(mediumWidth, mediumHeight, {
                        fit: 'inside',
                        // background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .webp({ quality: 60, reductionEffort: 6, alphaQuality: 60, force: true })
                    .toBuffer()
                    .then((buffer) => buffer as any)
                    .catch((err) => console.log("webpMediumBuf error: ", err));

                // Resize the WEBP for the thumb image
                bufferPack.webpThumbBuf = await sharp(temp_bufferToUse)
                    .resize(thumbWidth, thumbHeight, {
                        fit: 'inside',
                        // background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .webp({ quality: 60, reductionEffort: 6, alphaQuality: 60, force: true })
                    .toBuffer()
                    .then((buffer) => buffer as any)
                    .catch((err) => console.log("webpThumbBuf error: ", err));

                if (useExtraSizes){
                    // Resize the WEBP for the tinythumb image
                    bufferPack.webpTinyThumbBuf = await sharp(temp_bufferToUse)
                        .resize(tinythumbWidth, tinythumbHeight, {
                            fit: 'inside',
                            // background: { r: 255, g: 255, b: 255, alpha: 1 }
                        })
                        .webp({ quality: 60, reductionEffort: 6, alphaQuality: 60, force: true })
                        .toBuffer()
                        .then((buffer) => buffer as any)
                        .catch((err) => console.log("webpTinyThumbBuf error: ", err));
                }

            }


            // gzip the main files (and the webp's, if present)
            if (!isVideo && !isAudio){
                bufferPack.mainBuf = zlib.gzipSync(bufferPack.mainBuf, {
                    level: zlib.constants.Z_BEST_COMPRESSION
                });
            }
            
            if (useMediaRoute){
                bufferPack.webpOriginalBuf = zlib.gzipSync(bufferPack.webpOriginalBuf, {
                    level: zlib.constants.Z_BEST_COMPRESSION
                });
                bufferPack.webpMediumBuf = zlib.gzipSync(bufferPack.webpMediumBuf, {
                    level: zlib.constants.Z_BEST_COMPRESSION
                });
                bufferPack.webpThumbBuf = zlib.gzipSync(bufferPack.webpThumbBuf, {
                    level: zlib.constants.Z_BEST_COMPRESSION
                });
                if (useExtraSizes){
                    bufferPack.webpTinyThumbBuf = zlib.gzipSync(bufferPack.webpTinyThumbBuf, {
                        level: zlib.constants.Z_BEST_COMPRESSION
                    });
                }
            }

            // Set the AWS S3 bucket keys
            let encodedSuffixFirstPart = encodeURIComponent(slugify(slug, { remove: /[*+~.()'"#%?!:@]/g })) + `/${filename}`;
            let encodedSuffix = `${encodedSuffixFirstPart}.${varPack.suffix}`;
            let theMainKey = `${uploadType}/${lang}/${encodedSuffix}`;
            
            // Specify S3 upload options for the original image
            let uploadParamsMain = {
                Bucket: this.awsS3Service.getBucket(),
                Key: theMainKey,
                Body: bufferPack.mainBuf,
                ACL: 'public-read',
                ContentType: varPack.mainMIME,
                CacheControl: 'max-age=31536000',
            };

            if (!isVideo && !isAudio){
                uploadParamsMain['ContentEncoding'] = 'gzip';
            };

            if (useMediaRoute){
                let encodedSuffixWebpOriginal = `${encodedSuffixFirstPart}_original.webp`;
                let encodedSuffixWebpMedium = `${encodedSuffixFirstPart}_medium.webp`;
                let encodedSuffixWebpThumb = `${encodedSuffixFirstPart}_thumb.webp`;
                let encodedSuffixWebpTinyThumb = `${encodedSuffixFirstPart}_tinythumb.webp`;
                let theMainKeyWebpOriginal = `${uploadType}/${lang}/${encodedSuffixWebpOriginal}`;
                let theMainKeyWebpMedium = `${uploadType}/${lang}/${encodedSuffixWebpMedium}`;
                let theMainKeyWebpThumb = `${uploadType}/${lang}/${encodedSuffixWebpThumb}`;
                let theMainKeyWebpTinyThumb = `${uploadType}/${lang}/${encodedSuffixWebpTinyThumb}`;

                if (!isVideo || videoThumbBuffer){
                    // Specify S3 upload options for the webp'd original
                    let uploadParamsMainWebpOriginal = {
                        Bucket: this.awsS3Service.getBucket(),
                        Key: theMainKeyWebpOriginal,
                        Body: bufferPack.webpOriginalBuf,
                        ACL: 'public-read',
                        ContentType: "image/webp",
                        CacheControl: 'max-age=31536000',
                        ContentEncoding: 'gzip'
                    };

                    // Specify S3 upload options for the medium webp
                    let uploadParamsMainWebpMedium = {
                        Bucket: this.awsS3Service.getBucket(),
                        Key: theMainKeyWebpMedium,
                        Body: bufferPack.webpMediumBuf,
                        ACL: 'public-read',
                        ContentType: "image/webp",
                        CacheControl: 'max-age=31536000',
                        ContentEncoding: 'gzip'
                    };

                    // Specify S3 upload options for the thumb webp
                    let uploadParamsMainWebpThumb = {
                        Bucket: this.awsS3Service.getBucket(),
                        Key: theMainKeyWebpThumb,
                        Body: bufferPack.webpThumbBuf,
                        ACL: 'public-read',
                        ContentType: "image/webp",
                        CacheControl: 'max-age=31536000',
                        ContentEncoding: 'gzip'
                    };

                    let uploadParamsMainWebpTinyThumb;
                    if (useExtraSizes){
                        // Specify S3 upload options for the tinythumb webp
                        uploadParamsMainWebpTinyThumb = {
                            Bucket: this.awsS3Service.getBucket(),
                            Key: theMainKeyWebpTinyThumb,
                            Body: bufferPack.webpTinyThumbBuf,
                            ACL: 'public-read',
                            ContentType: "image/webp",
                            CacheControl: 'max-age=31536000',
                            ContentEncoding: 'gzip'
                        };
                    }

                    // Upload the original in webp form
                    returnPack = await new Promise<MediaUploadResult>((resolve, reject) => {
                        this.awsS3Service.upload(uploadParamsMainWebpOriginal, (s3ErrOuter, dataOuter) => {
                            if (s3ErrOuter){
                                console.log(colors.yellow('ERROR: s3ErrOuter for webp original image'));
                                console.log(s3ErrOuter);
                                reject(s3ErrOuter);
                            }
                            else {
                                returnPack.webp_original = dataOuter.Location;
                                resolve(returnPack);
                            }
                        });
                    });

                    // Upload the medium webp
                    returnPack = await new Promise<MediaUploadResult>((resolve, reject) => {
                        this.awsS3Service.upload(uploadParamsMainWebpMedium, (s3ErrOuter, dataOuter) => {
                            if (s3ErrOuter){
                                console.log(colors.yellow('ERROR: s3ErrOuter for webp medium image'));
                                console.log(s3ErrOuter);
                                reject(s3ErrOuter);
                            }
                            else {
                                returnPack.webp_medium = dataOuter.Location;
                                resolve(returnPack);
                            }
                        });
                    });

                    // Upload the thumb webp
                    returnPack = await new Promise<MediaUploadResult>((resolve, reject) => {
                        this.awsS3Service.upload(uploadParamsMainWebpThumb, (s3ErrOuter, dataOuter) => {
                            if (s3ErrOuter){
                                console.log(colors.yellow('ERROR: s3ErrOuter for webp thumb image'));
                                console.log(s3ErrOuter);
                                reject(s3ErrOuter);
                            }
                            else {
                                returnPack.webp_thumb = dataOuter.Location;
                                resolve(returnPack);
                            }
                        });
                    });

                    if (useExtraSizes && uploadParamsMainWebpTinyThumb){
                        // Upload the tinythumb webp
                        returnPack = await new Promise<MediaUploadResult>((resolve, reject) => {
                            this.awsS3Service.upload(uploadParamsMainWebpTinyThumb, (s3ErrOuter, dataOuter) => {
                                if (s3ErrOuter){
                                    console.log(colors.yellow('ERROR: s3ErrOuter for webp tinythumb image'));
                                    console.log(s3ErrOuter);
                                    reject(s3ErrOuter);
                                }
                                else {
                                    returnPack.webp_tinythumb = dataOuter.Location;
                                    resolve(returnPack);
                                }
                            });
                        });
                    }

                }
            }
            
            // Upload the main image and the main thumb
            returnPack = await new Promise<MediaUploadResult>((resolve, reject) => {
                this.awsS3Service.upload(uploadParamsMain, (s3ErrOuter, dataOuter) => {
                    if (s3ErrOuter){
                        console.log(colors.yellow('ERROR: s3ErrOuter for main image'));
                        console.log(s3ErrOuter);
                        reject(s3ErrOuter);
                    }
                    else {
                        // Update the return dictionary with the main photo URL
                        // returnPack.mainPhotoURL = 'https://everipedia-storage.s3.amazonaws.com/' + theMainKey;
                        returnPack.mainPhotoURL = dataOuter.Location;
                        returnPack.mime = varPack.mainMIME;
                        returnPack.category = linkCategorizer(returnPack.mainPhotoURL);
                        if (isAudio) returnPack.thumbnailPhotoURL = 'https://epcdn-vz.azureedge.net/static/images/placeholder-audio.png';

                        if (useMediaRoute) {
                            // Create and upload the thumbnail
                            // gzip the thumbnail
                            bufferPack.thumbBuf = zlib.gzipSync(bufferPack.thumbBuf, { level: zlib.constants.Z_BEST_COMPRESSION });

                            // Set the AWS S3 bucket key
                            let theThumbSuffix = encodeURIComponent(slugify(slug, { remove: /[*+~.()'"#%?!:@]/g })) + `/${filename}__thumb.${varPack.thumbSuffix}`;
                            let theThumbKey = `${uploadType}/${lang}/${theThumbSuffix}`;

                            // Specify S3 upload options
                            let uploadParamsThumb = {
                                Bucket: this.awsS3Service.getBucket(),
                                Key: theThumbKey,
                                Body: bufferPack.thumbBuf,
                                ACL: 'public-read',
                                ContentType: varPack.thumbMIME,
                                CacheControl: 'max-age=31536000',
                                ContentEncoding: 'gzip'
                            };

                            // Upload the file to S3
                            this.awsS3Service.upload(uploadParamsThumb, (s3ErrInner, dataInner) => {
                                if (s3ErrInner){
                                    console.log(colors.yellow('ERROR: s3ErrInner for thumb'));
                                    console.log(s3ErrInner);
                                    reject(s3ErrInner);
                                }
                                else {
                                    // Update the return dictionary with the thumbnail URL
                                    // returnPack.thumbnailPhotoURL = 'https://everipedia-storage.s3.amazonaws.com/' + theThumbKey;
                                    returnPack.thumbnailPhotoURL = dataInner.Location;

                                    if (useExtraSizes){
                                        // Create and upload the medium and tinythumb

                                        // gzip the medium and tinythumb
                                        bufferPack.mediumBuf = zlib.gzipSync(bufferPack.mediumBuf, { level: zlib.constants.Z_BEST_COMPRESSION });
                                        bufferPack.tinythumbBuf = zlib.gzipSync(bufferPack.tinythumbBuf, { level: zlib.constants.Z_BEST_COMPRESSION });
                                        

                                        // Set the AWS S3 bucket keys

                                        let theMediumSuffix = encodeURIComponent(slugify(slug, { remove: /[*+~.()'"#%?!:@]/g })) + `/${filename}__medium.${varPack.thumbSuffix}`;
                                        let theMediumKey = `${uploadType}/${lang}/${theMediumSuffix}`;
                                        let theTinyThumbSuffix = encodeURIComponent(slugify(slug, { remove: /[*+~.()'"#%?!:@]/g })) + `/${filename}__tinythumb.${varPack.thumbSuffix}`;
                                        let theTinyThumbKey = `${uploadType}/${lang}/${theTinyThumbSuffix}`;


                                        // Specify S3 upload options
                                        let uploadParamsMedium = {
                                            Bucket: this.awsS3Service.getBucket(),
                                            Key: theMediumKey,
                                            Body: bufferPack.mediumBuf,
                                            ACL: 'public-read',
                                            ContentType: varPack.thumbMIME,
                                            CacheControl: 'max-age=31536000',
                                            ContentEncoding: 'gzip'
                                        };

                                        let uploadParamsTinyThumb = {
                                            Bucket: this.awsS3Service.getBucket(),
                                            Key: theTinyThumbKey,
                                            Body: bufferPack.tinythumbBuf,
                                            ACL: 'public-read',
                                            ContentType: varPack.thumbMIME,
                                            CacheControl: 'max-age=31536000',
                                            ContentEncoding: 'gzip'
                                        };

                                        // Upload the medium to S3
                                        this.awsS3Service.upload(uploadParamsMedium, (s3ErrMedium, dataMedium) => {
                                            if (s3ErrMedium){
                                                console.log(colors.yellow('ERROR: s3ErrMedium for thumb'));
                                                console.log(s3ErrMedium);
                                                reject(s3ErrMedium);
                                            }
                                            else {
                                                // Update the return dictionary with the medium URL
                                                returnPack.mediumPhotoURL = dataMedium.Location;


                                                // Upload the tinythumb to S3
                                                this.awsS3Service.upload(uploadParamsTinyThumb, (s3ErrTinyThumb, dataTinyThumb) => {
                                                    if (s3ErrTinyThumb){
                                                        console.log(colors.yellow('ERROR: s3ErrTinyThumb for thumb'));
                                                        console.log(s3ErrTinyThumb);
                                                        reject(s3ErrTinyThumb);
                                                    }
                                                    else {
                                                        // Update the return dictionary with the medium URL
                                                        returnPack.tinythumbPhotoURL = dataTinyThumb.Location;
                                                        resolve(returnPack);
                                                    }
                                                });

                                            }
                                        });
                                        
                                    }
                                    else { resolve(returnPack) };
                                }
                            });
                        } else resolve(returnPack);
                        
                    }
                });
            });

            console.log(returnPack);
            return returnPack;
        } catch (e) {
            console.log(e);
            return null;
        }
    }
}
