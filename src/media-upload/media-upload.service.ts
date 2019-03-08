import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { MimePack } from './media-upload-dto';
const crypto = require("crypto");
const extractFrames = require('./gif-extract-frames');
const extractVideoPreview = require('ffmpeg-extract-frame');
const fetch = require('node-fetch');
const fetchFavicon = require('@meltwater/fetch-favicon').fetchFavicon;
const fileType = require('file-type');
const fs = require('fs');
const getYouTubeID = require('get-youtube-id');
const http = require('http');
const https = require('https');
const intostream = require('into-stream');
const imagemin = require('imagemin');
const imagemin_Gifsicle = require('imagemin-gifsicle');
const imagemin_Jpegtran = require('imagemin-jpegtran');
const imagemin_Optipng = require('imagemin-optipng');
const imagemin_Svgo = require('imagemin-svgo');
const mimeClass = require('mime');
const path = require('path');
const sizeOf = require('buffer-image-size');
const toArray = require('stream-to-array');
const stream = require('stream');
const url = require('url');
const zlib = require('zlib');
const Jimp = require('jimp');
const { StringDecoder } = require('string_decoder');
const AWS = require('aws-sdk');
import { ConfigService, AWSS3Config } from '../common';

const TEMP_DIR = path.join(__dirname, 'tmp')
const PHOTO_CONSTANTS =  {
    CROPPED_WIDTH: 1201,
    CROPPED_HEIGHT: 1201,
    DISPLAY_WIDTH: 275,
    SCALING_RATIO: function (){return (this.CROPPED_WIDTH / this.DISPLAY_WIDTH);},
    CROPPED_THUMB_WIDTH: 250,
    CROPPED_THUMB_HEIGHT: 250,
    SCALING_RATIO_THUMB: function (){return (this.CROPPED_WIDTH / this.DISPLAY_WIDTH);},
    CROPPED_META_THUMB_WIDTH: 250,
    CROPPED_META_THUMB_HEIGHT: 250,
    SCALING_RATIO_META_THUMB: function (){return (this.CROPPED_WIDTH / this.DISPLAY_WIDTH);}
}
const UNIVERSAL_HEADERS = {
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/71.0.3578.98 Chrome/71.0.3578.98 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Charset': 'utf-8,ISO-8859-1;q=0.7,*;q=0.3',
    'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8,it;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
}
const VALID_VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.flv', '.f4v', '.ogv', '.ogx', '.wmv', '.webm', '.3gp', '.3g2', '.mpg', '.mpeg', '.mov', '.avi']
const VALID_AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a']

@Injectable()
export class MediaUploadService {
    // Should probably convert to a service for reusability later
    private awss3Config
    private s3;

    constructor( config: ConfigService ) {
        // Fetch the S3 config info
        this.awss3Config = config.get('AWSS3Config');

        // Initialize the AWS S3 connection
        this.s3 = new AWS.S3({
            accessKeyId: this.awss3Config.awsAccessKeyID,
            secretAccessKey: this.awss3Config.awsSecretAccessKey
        });
    }

    // Get the YouTube ID from a URL
    getYouTubeIdIfPresent(inputURL: string){
        try {
            // Also handle image URLs
            inputURL = inputURL.replace("https://i.ytimg.com/vi/", "https://youtu.be/").replace("/hqdefault.jpg", "");

            // Get the ID
            let result = getYouTubeID(inputURL);

            // Return the YouTube ID string
            return result ? result : false;
        }
        catch (e){
            return false;
        }
    }

    // Fetch a thumbnail from an external URL, like the og:image or twitter:image
    getFavicon(inputURL: string){
        try {
            // Fetch the favicon
            let result = fetchFavicon(inputURL);

            // Return the favicon URL
            return result ? result : null;
        }
        catch (e){
            return null;
        }
    }

    // Fetch a thumbnail from an external URL, like the og:image or twitter:image
    bufferToString(inputBuffer: Buffer){
        try {
            // Create an empty decoder
            const decoder = new StringDecoder('utf8');

            // Create a Buffer from the string
            const rawString = Buffer.from(inputBuffer);

            // Return the stringified buffer
            return decoder.write(rawString);
        }
        catch (e){
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
    async getImageBufferFromURL(inputURL: string){
        const options = {
            headers: UNIVERSAL_HEADERS
        };
        try {
                return fetch(inputURL, options)
                .then(res => res.buffer())
                .then(buffer => {
                    return buffer;
                })
            }
        catch (e){
            console.log(e)
        }
    }

    // Get the dimensions and the MIME type of a photo. This is used for AMP
    async getImageData(inputURL: string){
        let photoDataResult = {'width': null, 'height': null, 'mime': null};
        try {
            let imgBuffer = await this.getImageBufferFromURL(inputURL);
            let mimeResult = fileType(imgBuffer);
            let sizeResult = sizeOf.sizeOf(imgBuffer);
            photoDataResult.width = sizeResult.width;
            photoDataResult.height = sizeResult.height;
            photoDataResult.mime = mimeResult.mime;
            return photoDataResult;
            }
        catch (e){
            console.log(e)
            return photoDataResult;
        }

    }

    // Categorize a link
    linkCategorizer(inputString: string){
        try {
            // Find the MIME type and the extension
            let theMIME = mimeClass.getType(inputString); 
            let theExtension = mimeClass.getExtension(theMIME); 

            // Test for different categories
            if (theMIME == "" || theMIME == null){ return "NONE"; }
            else if (theMIME == 'image/gif'){ return "GIF"; }
            else if (theMIME.includes("image")){ return "PICTURE"; }
            else if (this.getYouTubeIdIfPresent(inputString)){ return "YOUTUBE"; }
            else if (VALID_VIDEO_EXTENSIONS.includes(theExtension)){ return "NORMAL_VIDEO"; }
            else if (VALID_AUDIO_EXTENSIONS.includes(theExtension)){ return "AUDIO"; }
            else { return 'NONE'; }

        }
        catch (e){
            console.log(e);
            return 'NONE';
        }
    }

    // Compress a PNG, GIF, JPEG, or SVG buffer and return the compressed buffer
    async compressImage(inputBuffer: Buffer) {
        try {
            let result = await imagemin.buffer(inputBuffer, {
                plugins: [
                    imagemin_Gifsicle(),
                    imagemin_Jpegtran(),
                    imagemin_Optipng({number: 7}),
                    imagemin_Svgo()
                ]
            });
            return result;
        }
        catch (e){
            return null;
        }
    }

    // Get a png buffer from the first frame of a GIF. Will be used as the GIF's thumbnail.
    async getPNGFrameFromGIF(gifBuffer: Buffer) {
        try {
            // Get the PNG stream first
            const pngStream = await extractFrames({
                input_buffer: gifBuffer,
                input_mime: 'image/gif'
            })

            // Convert the stream to a Buffer so jimp can use it later
            return toArray(pngStream)
            .then(function (parts) {
                var buffers: any[] = [];
                for (var i = 0, l = parts.length; i < l ; ++i) {
                    var part = parts[i];
                    buffers.push((part instanceof Buffer) ? part : new Buffer(part));
                }
                // Return the Buffer
                let result = Buffer.concat(buffers);
                return result;
            })
        }
        catch (e){
            return null;
        }
    }

    // Process a photo and upload it to the AWS S3 Bucket.
    async processMedia(mediaBuffer: Buffer, lang: string, slug: string, identifier: string, uploadType: string,  fileCaption: string){
        try {
            // Determine the MIME type
            let mimePack : MimePack = fileType(mediaBuffer);

            // Set some variables
            let varPack = {'suffix': '', 'thumbSuffix': '', 'thumbMIME': '', 'mainMIME': ''};
            let bufferPack = {'mainBuf': new Buffer(''), 'thumbBuf': new Buffer('')};
            
            // NOTES FOR S3 AND PUSHING STREAMS/BUFFERS
            // https://stackoverflow.com/questions/15817746/stream-uploading-an-gm-resized-image-to-s3-with-aws-sdk
            // TODO: Add TIFF support and resize down BMP thumbs
            // VALID_VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.flv', '.f4v', '.ogv', '.ogx', '.wmv', '.webm', '.3gp', '.3g2',
            // '.mpg', '.mpeg', '.mov', '.avi']

            // VALID_AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a']

            // Initialize the height and width of the thumbnails
            let mainWidth = PHOTO_CONSTANTS.CROPPED_WIDTH;
            let mainHeight = PHOTO_CONSTANTS.CROPPED_HEIGHT;
            let thumbWidth = 200; 
            let thumbHeight = 200;
            let includeMainPhoto: boolean = true;

            // Set the thumbnail width and height
            if (uploadType == 'ProfilePicture' || uploadType == 'NewlinkFiles'){
                thumbWidth = PHOTO_CONSTANTS.CROPPED_THUMB_WIDTH;
                thumbHeight = PHOTO_CONSTANTS.CROPPED_THUMB_HEIGHT;
                includeMainPhoto = true;
            }
            else if (uploadType == 'GalleryMediaItem'){
                thumbWidth = PHOTO_CONSTANTS.CROPPED_META_THUMB_WIDTH;
                thumbHeight = PHOTO_CONSTANTS.CROPPED_META_THUMB_HEIGHT;
                includeMainPhoto = false;
            }

            // Get a timestamp string from the Unix epoch
            let theTimeString = (new Date).getTime().toString().slice(-5);

            // Create a filename
            let filename = identifier.toString() + "__" + theTimeString;

            // Initialize the return dictionaries
            let returnMiniDict = {"filename": filename, "caption": fileCaption};
            let returnPack = {"mainPhotoURL": '', "thumbnailPhotoURL": '', "returnDict": returnMiniDict};

            // Determine how to move forward based on the MIME type
            if (mimePack.mime.includes("image")){
                switch (mimePack.mime) {
                    // Process SVGs
                    case "image/svg+xml": {
                        varPack.suffix = 'svg';
                        varPack.mainMIME = "image/svg+xml";
                        varPack.thumbSuffix = 'svg';
                        varPack.thumbMIME = "image/svg+xml";
                        bufferPack.mainBuf = await this.compressImage(mediaBuffer);
                        bufferPack.thumbBuf = bufferPack.mainBuf;
                        break;
                    } 
                    // Process HEIF / HEIC
                    case "image/heif":
                    case "image/heic":
                    case "image/heif-sequence":
                    case "image/heic-sequence": {
                        // TODO: NEED TO CONVERT TO JPEG
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = "image/jpeg";
                        // bufferPack.mainBuf = mediaBuffer;
                        // bufferPack.thumbBuf = mediaBuffer;
                        break;
                    } 
                    // Process BMPs
                    case "image/bmp":
                    case "image/x-bmp":
                    case "image/x-ms-bmp": {
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = "image/jpeg";

                        // Resize the BMP and convert it to JPEG due to AMP and compatibility issues (1200px width minimum)
                        bufferPack.mainBuf = await Jimp.read(mediaBuffer)
                        .then(image => 
                            image.background(0xFFFFFFFF)
                            .scaleToFit(mainWidth, mainHeight)
                            .getBufferAsync('image/jpeg')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));

                        // Set the BMP thumbnail as a JPEG
                        bufferPack.thumbBuf = await Jimp.read(mediaBuffer)
                        .then(image => 
                            image.background(0xFFFFFFFF)
                            .scaleToFit(thumbWidth, thumbHeight)
                            .quality(85)
                            .getBufferAsync('image/jpeg')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));
                        break;
                    }
                    // Process TIFF files
                    case 'image/tiff':
                    case 'image/tiff-fx': {
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = "image/jpeg";

                        // Resize the TIFF and convert it to JPEG due to AMP and compatibility issues (1200px width minimum)
                        bufferPack.mainBuf = await Jimp.read(mediaBuffer)
                        .then(image => 
                            image.background(0xFFFFFFFF)
                            .scaleToFit(mainWidth, mainHeight)
                            .getBufferAsync('image/jpeg')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));

                        // Set the TIFF thumbnail as a JPEG
                        bufferPack.thumbBuf = await Jimp.read(mediaBuffer)
                        .then(image => 
                            image.background(0xFFFFFFFF)
                            .scaleToFit(thumbWidth, thumbHeight)
                            .quality(85)
                            .getBufferAsync('image/jpeg')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));
                        break;
                    }
                    // Process GIFs
                    case "image/gif": {
                        varPack.suffix = 'gif';
                        varPack.mainMIME = 'image/gif';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = "image/jpeg";
                        bufferPack.mainBuf = await this.compressImage(mediaBuffer);

                        // Get a PNG frame from the GIF, resize, then compress it to a JPEG
                        // Must resize to fit 1201x1201 to help with AMP
                        bufferPack.thumbBuf = await this.getPNGFrameFromGIF(mediaBuffer).then(pngFrame => 
                            Jimp.read(pngFrame)
                        ).then(image => 
                            image.background(0xFFFFFFFF)
                            .scaleToFit(mainWidth, mainHeight)
                            .quality(85)
                            .getBufferAsync('image/jpeg')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));
                        break;
                    }
                    // Process WEBPs
                    case 'image/webp': {
                        // TODO: NEED TO CONVERT TO JPEG
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = "image/jpeg";
                        // bufferPack.mainBuf = mediaBuffer;
                        // bufferPack.thumbBuf = mediaBuffer;
                        break
                    }
                    // Process ICO files
                    case 'image/ico':
                    case 'image/icon':
                    case 'image/vnd.microsoft.icon':
                    case 'image/x-icon': {
                        varPack.suffix = 'ico';
                        varPack.mainMIME = 'image/x-icon';
                        varPack.thumbSuffix = 'ico';
                        varPack.thumbMIME = "image/x-icon";
                        bufferPack.mainBuf = mediaBuffer;
                        bufferPack.thumbBuf = mediaBuffer;
                        break
                    }
                    // Process JPEGs
                    case "image/jpeg": {
                        varPack.suffix = 'jpeg';
                        varPack.mainMIME = 'image/jpeg';
                        varPack.thumbSuffix = 'jpeg';
                        varPack.thumbMIME = "image/jpeg";

                        // Resize the JPEG due to AMP (1200px width minimum)
                        bufferPack.mainBuf = await Jimp.read(mediaBuffer)
                        .then(image => 
                            image.background(0xFFFFFFFF)
                            .scaleToFit(mainWidth, mainHeight)
                            .getBufferAsync('image/jpeg')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));

                        // Resize the JPEG for its thumbnail
                        bufferPack.thumbBuf = await Jimp.read(mediaBuffer)
                        .then(image => 
                            image.background(0xFFFFFFFF)
                            .scaleToFit(thumbWidth, thumbHeight)
                            .quality(85)
                            .getBufferAsync('image/jpeg')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));
                        break;
                    }
                    // Process PNG files
                    case "image/png": {
                        varPack.suffix = 'png';
                        varPack.mainMIME = 'image/png';
                        varPack.thumbSuffix = 'png';
                        varPack.thumbMIME = "image/png";

                        // Resize the PNG due to AMP (1200px width minimum)
                        bufferPack.mainBuf = await Jimp.read(mediaBuffer)
                        .then(image => 
                            image.scaleToFit(mainWidth, mainHeight)
                            .getBufferAsync('image/png')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));

                        // Resize the PNG for the its thumbnail
                        bufferPack.thumbBuf = await Jimp.read(mediaBuffer)
                        .then(image => 
                            image.scaleToFit(thumbWidth, thumbHeight)
                            .quality(85)
                            .getBufferAsync('image/png')
                        ).then(buffer => 
                            this.compressImage(buffer)
                        ).catch(err => console.log(err));
                        break;
                    }
                    default: {
                        break;
                    }
                }

                // Create and upload the main file
                if (includeMainPhoto){
                    // gzip the main file
                    bufferPack.mainBuf = zlib.gzipSync(bufferPack.mainBuf, {level: zlib.constants.Z_BEST_COMPRESSION});

                    // Set the AWS S3 bucket key
                    let theMainKey = `${uploadType}/${lang}/${slug}/${filename}.${varPack.suffix}`;

                    // Specify S3 upload options
                    let uploadParamsMain = {
                        Bucket: this.awss3Config.awsStorageBucketName,
                        Key: theMainKey,
                        Body: bufferPack.mainBuf,
                        ACL: 'public-read',
                        ContentType: varPack.mainMIME,
                        CacheControl: 'max-age=31536000',
                        ContentEncoding: 'gzip'
                    };

                    // Upload the file to S3
                    await this.s3.upload(uploadParamsMain, function(s3Err, data) {
                        if (s3Err) throw s3Err;
                    });

                    // Update the return dictionary with the main photo URL
                    returnPack.mainPhotoURL = 'https://everipedia-storage.s3.amazonaws.com/' + theMainKey;
                    console.log(returnPack.mainPhotoURL);
                }
                
            }
            else if (mimePack.mime.includes("video")){
                // Because of various shenanigans, you need to write the buffer to /tmp first...
                var tempFileNameInput = crypto.randomBytes(5).toString('hex') + "-" + theTimeString + "." + mimePack.ext;
                var tempFileNameOutput = crypto.randomBytes(5).toString('hex') + "-" + theTimeString + ".jpeg";
                let tempPath = path.join(TEMP_DIR, tempFileNameInput);
                let snapshotPath = path.join(TEMP_DIR, tempFileNameOutput);
                fs.writeFileSync(tempPath, mediaBuffer);
                fs.writeFileSync(snapshotPath, "");

                try {

                    await extractVideoPreview({
                        input: tempPath,
                        output: snapshotPath,
                        offset: 1000 // seek offset in milliseconds
                    })

                    // Set some variables
                    varPack.suffix = mimePack.ext;
                    varPack.thumbSuffix = 'jpeg';
                    varPack.thumbMIME = "image/jpeg";

                    // Set the buffer
                    bufferPack.mainBuf = mediaBuffer;

                    // Resize the snapshot JPEG
                    bufferPack.thumbBuf = await Jimp.read(fs.readFileSync(snapshotPath))
                    .then(image => 
                        image.background(0xFFFFFFFF)
                        .scaleToFit(thumbWidth, thumbHeight)
                        .quality(85)
                        .getBufferAsync('image/jpeg')
                    ).then(buffer => 
                        this.compressImage(buffer)
                    ).catch(err => {
                        console.log(err);
                        throw "File upload failed";
                    });

                    // Delete the temp file
                    await fs.unlinkSync(snapshotPath);

                    // Upload the video as a stream
                    // Set the AWS S3 bucket key
                    let theMainKey = `${uploadType}/${lang}/${slug}/${filename}.${varPack.suffix}`;

                    fs.readFile(tempPath, function (err, data) {
                        if (err) { 
                            console.log('fs error:' + err);
                            throw "File upload failed";
                        } 
                        else {
                            // Specify S3 upload options
                            let uploadParamsMain = {
                                Bucket: this.awss3Config.awsStorageBucketName,
                                Key: theMainKey,
                                Body: data,
                                ACL: 'public-read',
                                ContentType: mimePack.mime,
                                CacheControl: 'max-age=31536000',
                            };
                    
                            // Upload the file as a stream
                            this.s3.putObject(uploadParamsMain, function(err, data) {
                                if (err) { 
                                    console.log('Error putting object on S3: ', err); 
                                    throw "File upload failed";
                                }
                            });
                        }
                    });

                    // Delete the temp file
                    await fs.unlinkSync(tempPath);

                    // Update the return dictionary with the main photo URL
                    returnPack.mainPhotoURL = 'https://everipedia-storage.s3.amazonaws.com/' + theMainKey;
                }
                catch (err){
                    console.log(err);

                    // Delete the temp files
                    await fs.unlinkSync(tempPath);
                    await fs.unlinkSync(snapshotPath);
                }

            }
            else if (mimePack.mime.includes("audio")){
                // TODO: Audio support
            }

            // Create and upload the thumbnail
            // gzip the thumbnail
            bufferPack.thumbBuf = zlib.gzipSync(bufferPack.thumbBuf, {level: zlib.constants.Z_BEST_COMPRESSION});

            // Set the AWS S3 bucket key
            let theThumbKey = `${uploadType}/${lang}/${slug}/${filename}__thumb.${varPack.suffix}`;

            // Specify S3 upload options
            let uploadParamsThumb = {
                Bucket: this.awss3Config.awsStorageBucketName,
                Key: theThumbKey,
                Body: bufferPack.thumbBuf,
                ACL: 'public-read',
                ContentType: varPack.thumbMIME,
                CacheControl: 'max-age=31536000',
                ContentEncoding: 'gzip'
            };

            // Upload the file to S3
            await this.s3.upload(uploadParamsThumb, function(s3Err, data) {
                if (s3Err) throw s3Err;
            });

            // Update the return dictionary with the thumbnail URL
            returnPack.thumbnailPhotoURL = 'https://everipedia-storage.s3.amazonaws.com/' + theThumbKey;
            console.log(returnPack.thumbnailPhotoURL);

            // Return some information about the uploads
            return returnPack;

        }
        catch (e){
            return null;
        }
    }



}

