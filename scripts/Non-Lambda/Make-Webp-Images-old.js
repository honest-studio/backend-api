'use strict';

let aws = require('aws-sdk');
let s3 = new aws.S3();
const sharp = require('sharp');
const zlib = require('zlib');

const mainWidth = 1201;
const mainHeight = 1201;
const mediumWidth = 450;
const mediumHeight = 450;
const thumbWidth = 200;
const thumbHeight = 200;
 
exports.handler = async (event) => {
    const promise = new Promise(async function(resolve, reject) {
        console.log("EVENT\n" + JSON.stringify(event, null, 2));
        const taskId = event.tasks[0].taskId;
        const invocationId = event['invocationId'];
        const invocationSchemaVersion = event['invocationSchemaVersion'];
        const bucket = event.tasks[0].s3BucketArn.replace("arn:aws:s3:::", "");
        const key = decodeURIComponent(event.tasks[0].s3Key);
        var params = { Bucket: bucket, Key: key };

        let returnNugget = {
            "invocationSchemaVersion": invocationSchemaVersion,
            "treatMissingKeysAs": "PermanentFailure",
            "invocationId": invocationId,
            "results": [{
                "taskId": taskId,
                "resultCode": "",
                "resultString": ""
            }],
        }

        s3.getObject(params, async (err, data) => {
            if (err) {
                var message = 'Error: Failed to get object'; //: s3://'+bucket+'/'+key +'. Make sure it is in the same region as this function!';
                console.log(message);
                returnNugget.results[0].resultCode = 'PermanentFailure';
                returnNugget.results[0].resultString = message;
                console.log("REJECT\n" + JSON.stringify(returnNugget, null, 2));
                reject(returnNugget);
            } 
            else {
                let bufferPack = { 
                    webpOriginalBuf: new Buffer(''),
                    webpMediumBuf: new Buffer(''),
                    webpThumbBuf: new Buffer('')
                };

                let bufferToUse = data.Body;

                // Get the original image in WEBP form
                bufferPack.webpOriginalBuf = await sharp(bufferToUse)
                    .resize(mainWidth, mainHeight, {
                        fit: 'inside',
                        // background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .webp({ quality: 100, lossless: true, force: true })
                    .toBuffer()
                    .then((buffer) => buffer)
                    .catch((err) => console.log(err));

                // Resize the WEBP for the medium image
                bufferPack.webpMediumBuf = await sharp(bufferToUse)
                    .resize(mediumWidth, mediumHeight, {
                        fit: 'inside',
                        // background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .webp({ quality: 85, nearLossless: true, force: true })
                    .toBuffer()
                    .then((buffer) => buffer)
                    .catch((err) => console.log(err));

                // Resize the WEBP for the thumb image
                bufferPack.webpThumbBuf = await sharp(bufferToUse)
                    .resize(thumbWidth, thumbHeight, {
                        fit: 'inside',
                        // background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .webp({ quality: 85, lossless: false, force: true })
                    .toBuffer()
                    .then((buffer) => buffer)
                    .catch((err) => console.log(err));


                // Gzip the webp images
                bufferPack.webpOriginalBuf = zlib.gzipSync(bufferPack.webpOriginalBuf, {
                    level: zlib.constants.Z_BEST_COMPRESSION
                });
                bufferPack.webpMediumBuf = zlib.gzipSync(bufferPack.webpMediumBuf, {
                    level: zlib.constants.Z_BEST_COMPRESSION
                });
                bufferPack.webpThumbBuf = zlib.gzipSync(bufferPack.webpThumbBuf, {
                    level: zlib.constants.Z_BEST_COMPRESSION
                });

                let keyFirstPart = key.substring(0, key.lastIndexOf("/"));
                let keyLastPart = key.substring(key.lastIndexOf("/") + 1, key.lastIndexOf(".") - 1);
                let keyLastPartWebpOriginal = `${keyLastPart}_original.webp`;
                let keyLastPartWebpMedium = `${keyLastPart}_medium.webp`;
                let keyLastPartWebpThumb = `${keyLastPart}_thumb.webp`;
                let theFullKeyWebpOriginal = `${keyFirstPart}${keyLastPartWebpOriginal}`;
                let theFullKeyWebpMedium = `${keyFirstPart}${keyLastPartWebpMedium}`;
                let theFullKeyWebpThumb = `${keyFirstPart}${keyLastPartWebpThumb}`;

                console.log(theFullKeyWebpOriginal);
                console.log(theFullKeyWebpMedium);
                console.log(theFullKeyWebpThumb);

                // if (data.CacheControl != NewCacheControlHeader) {
                //     var params = { 
                //         Bucket: bucket, 
                //         Key: key, 
                //         CopySource: encodeURIComponent(bucket+'/'+key), 
                //         ContentType: data.ContentType, 
                //         CacheControl: NewCacheControlHeader,
                //         ContentEncoding:  data.ContentEncoding ? data.ContentEncoding : 'identity',
                //         Metadata: data.Metadata ? data.Metadata : {}, 
                //         MetadataDirective: 'REPLACE' 
                //     };
                //     s3.copyObject(params, (err, data) => {
                //         if (err) {
                //             message = 'Error: Failed to get object'; //: s3://'+bucket+'/'+key +'. Make sure it is in the same region as this function!';
                //             console.log(message);
                //             returnNugget.results[0].resultCode = 'PermanentFailure';
                //             returnNugget.results[0].resultString = message;
                //             console.log("REJECT\n" + JSON.stringify(returnNugget, null, 2));
                //             reject(returnNugget);
                //         } 
                //         else {
                //             message = 'Success: Metadata update completed!'; // OBJECT: s3://'+bucket+'/'+key+' CONTENT-TYPE: '+mimeHeader+' CACHE-CONTROL: '+NewCacheControlHeader;
                //             console.log(message);
                //             returnNugget.results[0].resultCode = 'Succeeded';
                //             returnNugget.results[0].resultString = message;
                //             console.log("RESOLVE\n" + JSON.stringify(returnNugget, null, 2));
                //             resolve(returnNugget);
                //         }
                //     });
                // } else {
                //     message = 'Success: Metadata already updated!'; // OBJECT: s3://'+bucket+'/'+key+' CONTENT-TYPE: '+mimeHeader+' CACHE-CONTROL: '+NewCacheControlHeader;
                //     console.log(message);
                //     returnNugget.results[0].resultCode = 'Succeeded';
                //     returnNugget.results[0].resultString = message;
                //     console.log("RESOLVE\n" + JSON.stringify(returnNugget, null, 2));
                //     resolve(returnNugget);
                // }
            }
        });
    });
    return promise;
};