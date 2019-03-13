import { Injectable } from '@nestjs/common';
import { AWSS3Config, ConfigService } from '../../common';
const AWS = require('aws-sdk');

@Injectable()
export class AWSS3Service {
    private readonly _awss3Config: AWSS3Config;
    private _s3;

    constructor(config: ConfigService) {
        // Fetch the S3 config info
        this._awss3Config = config.get('awsS3Config');

        // Initialize the AWS S3 connection
        this._s3 = new AWS.S3({
            accessKeyId: this._awss3Config.awsAccessKeyID,
            secretAccessKey: this._awss3Config.awsSecretAccessKey
        });
    }

    // Return the bucket name
    getBucket() {
        return this._awss3Config.awsStorageBucketName;
    }

    // Return the upload function
    upload(...args) {
        return this._s3.upload(...args);
    }
}
