'use strict';
 
// CONFIGURATION //////////////////////////////////////////////
var NewCacheControlHeader = 'public, max-age=31536000';
///////////////////////////////////////////////////////////////
 
let aws = require('aws-sdk');
let s3 = new aws.S3();
 
exports.handler = (event, context, callback) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    var params = { Bucket: bucket, Key: key };
    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err);
            var message = 'Error: Failed to get object: s3://'+bucket+'/'+key +'. Make sure it is in the same region as this function!';
            console.log(message);
        } else {
        const mimeHeader = data.ContentType;
            if (data.CacheControl != NewCacheControlHeader) {
                var params = { 
                    Bucket: bucket, 
                    Key: key, 
                    CopySource: encodeURIComponent(bucket+'/'+key), 
                    ContentType: data.ContentType, 
                    CacheControl: NewCacheControlHeader,
                    ContentEncoding:  data.ContentEncoding ? data.ContentEncoding : 'identity',
                    'Metadata':{}, 
                    MetadataDirective: 'REPLACE' 
                };
                s3.copyObject(params, (err, data) => {
                    if (err) {
                        console.log(err);
                        message = 'Error: Failed to get object: s3://'+bucket+'/'+key +'. Make sure it is in the same region as this function!';
                        console.log(message);
                    } else {
                       message = 'Metadata updated successfully! OBJECT: s3://'+bucket+'/'+key+' CONTENT-TYPE: '+mimeHeader+' CACHE-CONTROL: '+NewCacheControlHeader;
                       console.log(message);
                    }
                });
            } else {
                message = 'Metadata already updated! OBJECT: s3://'+bucket+'/'+key+' CONTENT-TYPE: '+mimeHeader+' CACHE-CONTROL: '+NewCacheControlHeader;
                console.log(message);
            }
        }
    });
};