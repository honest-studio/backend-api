'use strict';
 
// CONFIGURATION //////////////////////////////////////////////
var NewCacheControlHeader = 'public, max-age=31536000';
///////////////////////////////////////////////////////////////
// GOOD NOTES
// https://www.alexdebrie.com/posts/s3-batch/#manifest 



let aws = require('aws-sdk');
let s3 = new aws.S3();
 
exports.handler = async (event) => {
    const promise = new Promise(function(resolve, reject) {
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

        s3.getObject(params, (err, data) => {
            if (err) {
                var message = 'Error: Failed to get object'; //: s3://'+bucket+'/'+key +'. Make sure it is in the same region as this function!';
                console.log(message);
                returnNugget.results[0].resultCode = 'PermanentFailure';
                returnNugget.results[0].resultString = message;
                console.log("REJECT\n" + JSON.stringify(returnNugget, null, 2));
                reject(returnNugget);
            } 
            else {
                if (data.CacheControl != NewCacheControlHeader) {
                    var params = { 
                        Bucket: bucket, 
                        Key: key, 
                        CopySource: encodeURIComponent(bucket+'/'+key), 
                        ContentType: data.ContentType, 
                        CacheControl: NewCacheControlHeader,
                        ContentEncoding:  data.ContentEncoding ? data.ContentEncoding : 'identity',
                        Metadata: data.Metadata ? data.Metadata : {}, 
                        MetadataDirective: 'REPLACE' 
                    };
                    s3.copyObject(params, (err, data) => {
                        if (err) {
                            message = 'Error: Failed to get object'; //: s3://'+bucket+'/'+key +'. Make sure it is in the same region as this function!';
                            console.log(message);
                            returnNugget.results[0].resultCode = 'PermanentFailure';
                            returnNugget.results[0].resultString = message;
                            console.log("REJECT\n" + JSON.stringify(returnNugget, null, 2));
                            reject(returnNugget);
                        } 
                        else {
                            message = 'Success: Metadata update completed!'; // OBJECT: s3://'+bucket+'/'+key+' CONTENT-TYPE: '+mimeHeader+' CACHE-CONTROL: '+NewCacheControlHeader;
                            console.log(message);
                            returnNugget.results[0].resultCode = 'Succeeded';
                            returnNugget.results[0].resultString = message;
                            console.log("RESOLVE\n" + JSON.stringify(returnNugget, null, 2));
                            resolve(returnNugget);
                        }
                    });
                } else {
                    message = 'Success: Metadata already updated!'; // OBJECT: s3://'+bucket+'/'+key+' CONTENT-TYPE: '+mimeHeader+' CACHE-CONTROL: '+NewCacheControlHeader;
                    console.log(message);
                    returnNugget.results[0].resultCode = 'Succeeded';
                    returnNugget.results[0].resultString = message;
                    console.log("RESOLVE\n" + JSON.stringify(returnNugget, null, 2));
                    resolve(returnNugget);
                }
            }
        });
    });
    return promise;
};