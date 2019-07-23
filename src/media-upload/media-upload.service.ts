import { Injectable } from '@nestjs/common';
import sizeOf from 'buffer-image-size';
import * as crypto from 'crypto';
import { DWebp } from 'cwebp';
import * as fs from 'fs';
import * as imagemin from 'imagemin';
import * as imagemin_Gifsicle from 'imagemin-gifsicle';
import * as imagemin_Jpegtran from 'imagemin-jpegtran';
import * as imagemin_Optipng from 'imagemin-optipng';
import * as imagemin_Svgo from 'imagemin-svgo';
import * as imagemin_Webp from 'imagemin-webp';
import * as Jimp from 'jimp';
import * as mimeClass from 'mime';
import * as fetch from 'node-fetch';
import * as path from 'path';
import * as toArray from 'stream-to-array';
import { StringDecoder } from 'string_decoder';
import * as zlib from 'zlib';
import { AWSS3Service } from '../feature-modules/database';
import { fetchUrl } from './fetch-favicon';
import { getYouTubeIdIfPresent } from '../utils/article-utils/article-tools';
import { linkCategorizer } from '../utils/article-utils/article-converter';
import { FileFetchResult, MediaUploadResult, MimePack, PhotoExtraData } from './media-upload-dto';
const extractFrame = require('ffmpeg-extract-frame')
const axios = require('axios');
const extractGIFFrames = require('./gif-extract-frames')
var colors = require('colors');
const fileType = require('file-type');
const getYouTubeID = require('get-youtube-id');
const slugify = require('slugify');
slugify.extend({'%': '_u_'});

// const TEMP_DIR = path.join(__dirname, 'tmp-do-not-delete');
// const TEMP_DIR = path.join('tmp');
const TEMP_DIR = '/tmp';
const PHOTO_CONSTANTS = {
    CROPPED_WIDTH: 1201,
    CROPPED_HEIGHT: 1201,
    DISPLAY_WIDTH: 275,
    CROPPED_MEDIUM_WIDTH: 600,
    CROPPED_MEDIUM_HEIGHT: 600,
    CROPPED_THUMB_WIDTH: 200,
    CROPPED_THUMB_HEIGHT: 200,
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

@Injectable()
export class MediaUploadService {
    constructor(private awsS3Service: AWSS3Service) {}



    // Fetch a thumbnail from an external URL, like the og:image or twitter:image
    getFavicon(inputPack: UrlPack): Promise<any> {
        return fetchUrl(inputPack.url);
    }

    // Fetch a file from an external URL
    getRemoteFile(inputPack: UrlPack): Promise<FileFetchResult> {
        let theCategory = linkCategorizer(inputPack.url);
        let urlToUse = inputPack.url;

        // Test for YouTube first
        if (theCategory == 'YOUTUBE'){
            urlToUse = `https://i.ytimg.com/vi/${getYouTubeID(urlToUse)}/hqdefault.jpg`;
        }

        // console.log("TESTING HERE!!!");
        // console.log("TESTING HERE!!!");
        // console.log(urlToUse)

        return axios({
            url: urlToUse,
            method: 'GET',
            responseType: 'arraybuffer',
        }).then(response => {
            let fileBuffer = response.data;
            let mimePack: MimePack = fileType(fileBuffer);
            let returnPack: FileFetchResult = {
                file_buffer: fileBuffer,
                mime_pack: mimePack,
                category: theCategory as any,
            };
            return returnPack;
        })
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
    async getImageBufferFromURL(inputURL: string): Promise<Buffer> {
        const options = {
            headers: UNIVERSAL_HEADERS
        };
        try {
            return fetch(inputURL, options)
                .then((res) => res.buffer())
                .then((buffer) => {
                    return buffer;
                });
        } catch (e) {
            console.log(e);
        }
    }

    // Get the dimensions and the MIME type of a photo. This is used for AMP
    async getImageData(inputURL: string): Promise<PhotoExtraData> {
        let photoDataResult: PhotoExtraData = { width: null, height: null, mime: null };
        try {
            let imgBuffer = await this.getImageBufferFromURL(inputURL);
            let mimeResult = fileType(imgBuffer);
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
                    imagemin_Gifsicle(),
                    imagemin_Jpegtran(),
                    imagemin_Optipng({ number: 7 }),
                    imagemin_Svgo(),
                    imagemin_Webp({ quality: 90, method: 6 })
                ]
            });
            return result;
        } catch (e) {
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
        fileCaption: string
    ): Promise<MediaUploadResult> {
        try {
            // let bufferToUse: Buffer;
            // if (mediaBuffer.constructor !== Array) {
            //     bufferToUse = await this.getImageBufferFromURL(mediaBuffer as string);
            // }
            // else { bufferToUse = mediaBuffer as Buffer };
            let bufferToUse = mediaBuffer as Buffer;

            // Determine the MIME type
            let mimePack: MimePack = fileType(bufferToUse);

            // Set some variables
            let varPack = { suffix: '', thumbSuffix: '', thumbMIME: '', mainMIME: '' };
            let bufferPack = { mainBuf: new Buffer(''), thumbBuf: new Buffer('') };

            // NOTES FOR S3 AND PUSHING STREAMS/BUFFERS
            // https://stackoverflow.com/questions/15817746/stream-uploading-an-gm-resized-image-to-s3-with-aws-sdk
            // TODO: Add TIFF support and resize down BMP thumbs
            // VALID_VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.flv', '.f4v', '.ogv', '.ogx', '.wmv', '.webm', '.3gp', '.3g2',
            // '.mpg', '.mpeg', '.mov', '.avi']

            // VALID_AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a']

            // Initialize the height and width of the thumbnails
            let mainWidth = PHOTO_CONSTANTS.CROPPED_WIDTH;
            let mainHeight = PHOTO_CONSTANTS.CROPPED_HEIGHT;
            let mediumWidth = 450;
            let mediumHeight = 450;
            let thumbWidth = 200;
            let thumbHeight = 200;
            let includeMainPhoto: boolean = true;

            // Set the thumbnail width and height
            // if (uploadType == 'ProfilePicture' || uploadType == 'NewlinkFiles') {
            //     thumbWidth = PHOTO_CONSTANTS.CROPPED_THUMB_WIDTH;
            //     thumbHeight = PHOTO_CONSTANTS.CROPPED_THUMB_HEIGHT;
            //     includeMainPhoto = true;
            // } else if (uploadType == 'GalleryMediaItem') {
            //     thumbWidth = PHOTO_CONSTANTS.CROPPED_META_THUMB_WIDTH;
            //     thumbHeight = PHOTO_CONSTANTS.CROPPED_META_THUMB_HEIGHT;
            //     includeMainPhoto = false;
            // }



            // Get a timestamp string from the Unix epoch
            let theTimeString = new Date()
                .getTime()
                .toString()
                .slice(-5);

            // Create a filename
            let filename = identifier.toString() + '__' + theTimeString;

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
            if (mimePack.mime.includes('image')) {
                switch (mimePack.mime) {
                    // Process SVGs
                    case 'image/svg+xml': {
                        varPack.suffix = 'svg';
                        varPack.mainMIME = 'image/svg+xml';
                        varPack.thumbSuffix = 'svg';
                        varPack.thumbMIME = 'image/svg+xml';
                        bufferPack.mainBuf = bufferToUse;
                        bufferPack.thumbBuf = bufferPack.mainBuf;
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
                        bufferPack.mainBuf = await Jimp.read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mainWidth, mainHeight)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Set the BMP thumbnail as a JPEG
                        bufferPack.thumbBuf = await Jimp.read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(85)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));
                        break;
                    }
                    // Process TIFF files
                    case 'image/tiff':
                    case 'image/tiff-fx': {
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';

                        // Resize the TIFF and convert it to JPEG due to AMP and compatibility issues (1200px width minimum)
                        bufferPack.mainBuf = await Jimp.read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mainWidth, mainHeight)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Set the TIFF thumbnail as a JPEG
                        bufferPack.thumbBuf = await Jimp.read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(85)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));
                        break;
                    }
                    // Process GIFs
                    case 'image/gif': {
                        varPack.suffix = 'gif';
                        varPack.mainMIME = 'image/gif';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';
                        bufferPack.mainBuf = bufferToUse;

                        // Get a PNG frame from the GIF, resize, then compress it to a JPEG
                        // Must resize to fit 1201x1201 to help with AMP
                        // FIX THIS LATER
                        bufferPack.thumbBuf = bufferPack.mainBuf;
                        // try {
                        //     bufferPack.thumbBuf = await this.getPNGFrameFromGIF(bufferToUse)
                        //         .then((pngFrame) => {
                        //             console.log(pngFrame);
                        //             // return pngFrame;
                        //             return Jimp.read(pngFrame)
                        //         })
                        //         .then((image) => { 
                        //             return image
                        //             .background(0xffffffff)
                        //             .scaleToFit(mainWidth, mainHeight)
                        //             .quality(85)
                        //             .getBufferAsync('image/jpeg');
                        //         })
                        //         .then((buffer) => buffer as any)
                        //         .catch((err) => {
                        //             console.log("ERROR BEE")
                        //             console.log(err)
                        //         });
                        // } catch (e) {
                        //     bufferPack.thumbBuf = bufferPack.mainBuf;
                        // }
                        break;
                    }
                    // Process WEBPs
                    case 'image/webp': {
                        // Convert to PNG for maximum browser compatibility
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = 'image/jpeg';
                        bufferPack.mainBuf = await this.compressImage(bufferToUse);

                        // Convert to PNG
                        let dwebpObj = new DWebp(bufferPack.mainBuf);
                        dwebpObj.png().toBuffer(function(err, thisBuffer) {
                            bufferPack.mainBuf = thisBuffer;
                        });

                        // Convert to a PNG buffer
                        bufferPack.mainBuf = await dwebpObj
                            .png()
                            .toBuffer()
                            .then(function(thisBuffer) {
                                return thisBuffer;
                            });

                        // Need to switch the orders (thumb first) so the mainBuf gets evaluated
                        // Otherwise, errors will show up

                        // Convert the PNG to JPEG for the thumbnail
                        bufferPack.thumbBuf = await Jimp.read(bufferPack.mainBuf)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(85)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Resize the PNG and convert to AMP JPEG due to AMP (1200px width minimum)
                        bufferPack.mainBuf = await Jimp.read(bufferPack.mainBuf)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mainWidth, mainHeight)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));
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
                        bufferPack.mainBuf = await Jimp.read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(mainWidth, mainHeight)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Resize the JPEG for its thumbnail
                        bufferPack.thumbBuf = await Jimp.read(bufferToUse)
                            .then((image) =>
                                image
                                    .background(0xffffffff)
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(85)
                                    .getBufferAsync('image/jpeg')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));
                        break;
                    }
                    // Process PNG files
                    case 'image/png': {
                        varPack.suffix = 'png';
                        varPack.mainMIME = 'image/png';
                        varPack.thumbSuffix = 'png';
                        varPack.thumbMIME = 'image/png';

                        // Resize the PNG due to AMP (1200px width minimum)
                        bufferPack.mainBuf = await Jimp.read(bufferToUse)
                            .then((image) => image.scaleToFit(mainWidth, mainHeight).getBufferAsync('image/png'))
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));

                        // Resize the PNG for its thumbnail
                        bufferPack.thumbBuf = await Jimp.read(bufferToUse)
                            .then((image) =>
                                image
                                    .scaleToFit(thumbWidth, thumbHeight)
                                    .quality(85)
                                    .getBufferAsync('image/png')
                            )
                            .then((buffer) => buffer as any)
                            .catch((err) => console.log(err));
                        break;
                    }
                    default: {
                        break;
                    }
                }
            } else if (mimePack.mime.includes('video')) {
                // Because of various shenanigans, you need to write the buffer to /tmp first...
                var tempFileNameInput =
                    crypto.randomBytes(5).toString('hex') + '-' + theTimeString + '.' + mimePack.ext;
                var tempFileNameOutput = crypto.randomBytes(5).toString('hex') + '-' + theTimeString + '.jpeg';
                let tempPath = path.join(TEMP_DIR, tempFileNameInput);
                let snapshotPath = path.join(TEMP_DIR, tempFileNameOutput);
                fs.writeFileSync(tempPath, bufferToUse);
                fs.writeFileSync(snapshotPath, '');

                try {
                    await extractFrame({
                        input: tempPath,
                        output: snapshotPath,
                        offset: 1000 // seek offset in milliseconds
                    });

                    // Set some variables
                    varPack.suffix = mimePack.ext;
                    varPack.mainMIME = mimePack.mime;
                    varPack.thumbSuffix = 'jpeg';
                    varPack.thumbMIME = 'image/jpeg';

                    // Set the buffer
                    bufferPack.mainBuf = bufferToUse;

                    // Resize the snapshot JPEG
                    bufferPack.thumbBuf = await Jimp.read(fs.readFileSync(snapshotPath))
                        .then((image) =>
                            image
                                .background(0xffffffff)
                                .scaleToFit(thumbWidth, thumbHeight)
                                .quality(85)
                                .getBufferAsync('image/jpeg')
                        )
                        .then((buffer) => buffer as any)
                        .catch((err) => {
                            console.log(colors.yellow('Video thumb buffer failed'));
                            console.log(err);
                        });

                } catch (err) {
                    console.log(err);
                }

                // Delete the temp files
                await fs.unlinkSync(tempPath);
                await fs.unlinkSync(snapshotPath);
            } else if (mimePack.mime.includes('audio')) {
                // TODO: Audio support
            }

            // gzip the main file
            if (!mimePack.mime.includes('video')){
                bufferPack.mainBuf = zlib.gzipSync(bufferPack.mainBuf, {
                    level: zlib.constants.Z_BEST_COMPRESSION
                });
            }


            // Set the AWS S3 bucket key
            let encodedSuffix = encodeURIComponent(slugify(slug + "__" + crypto.randomBytes(3).toString('hex'))) + `/${filename}.${varPack.suffix}`;
            let theMainKey = `${uploadType}/${lang}/${encodedSuffix}`;

            // Specify S3 upload options
            let uploadParamsMain = {
                Bucket: this.awsS3Service.getBucket(),
                Key: theMainKey,
                Body: bufferPack.mainBuf,
                ACL: 'public-read',
                ContentType: varPack.mainMIME,
                CacheControl: 'max-age=31536000',
            };

            if (!mimePack.mime.includes('video')){
                uploadParamsMain['ContentEncoding'] = 'gzip';
            }

            return new Promise((resolve, reject) => {
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

                        // Create and upload the thumbnail
                        // gzip the thumbnail
                        bufferPack.thumbBuf = zlib.gzipSync(bufferPack.thumbBuf, { level: zlib.constants.Z_BEST_COMPRESSION });

                        // Set the AWS S3 bucket key
                        let theThumbSuffix = encodeURIComponent(slugify(slug + "__" + crypto.randomBytes(3).toString('hex'))) + `/${filename}__thumb.${varPack.thumbSuffix}`;
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
                                console.log(returnPack);
                                resolve(returnPack);
                            }
                        });
                    }
                });
            });
        } catch (e) {
            return null;
        }
    }
}
