import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import * as AWS from 'aws-sdk';

@Injectable()
export class AWSSESService {
    private _ses;

    constructor(private config: ConfigService) {
        this._ses = new AWS.SES({
            accessKeyId: this.config.get("AWS_SES_KEY"),
            secretAccessKey: this.config.get("AWS_SES_SECRET"),
            region: this.config.get("AWS_SES_REGION"),
        });
    }
    // Return the default email
    getDefaultEmail() {
        return this.config.get("AWS_SES_DEFAULT_EMAIL")
    }

    // Return the sendEmail function
    sendEmail(...args) {
        return this._ses.sendEmail(...args);
    }
}
