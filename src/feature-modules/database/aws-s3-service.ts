import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '../../common';

@Injectable()
export class AWSS3Service {
    private _s3;

    constructor(private config: ConfigService) {
        // Initialize the AWS S3 connection
        this._s3 = new AWS.S3({
            accessKeyId: this.config.get("AWS_S3_ACCESS_KEY_ID"),
            secretAccessKey: this.config.get("AWS_S3_SECRET_ACCESS_KEY")
        });
    }

    // Return the bucket name
    getBucket () {
        return this.config.get("AWS_S3_STORAGE_BUCKET_NAME");
    }

    // Return the upload function
    upload(...args) {
        return this._s3.upload(...args);
    }
}
