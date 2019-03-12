import { Injectable } from '@nestjs/common';
import { AWSSESConfig, ConfigService } from '../../common';
const AWS = require('aws-sdk');

@Injectable()
export class AWSSESService {
    private readonly _awssesConfig: AWSSESConfig;
    private _ses;

    constructor(config: ConfigService) {
        // Fetch the SES config info
        this._awssesConfig = config.get('awsSESConfig');

        // Initialize the AWS SES connection
        this._ses = new AWS.SES({
            accessKeyId: this._awssesConfig.awsSESKey,
            secretAccessKey: this._awssesConfig.awsSESSecret,
            region: this._awssesConfig.awsSESRegion
        });

    }
    // Return the default email
    getDefaultEmail(){
        return this._awssesConfig.awsSESDefaultEmail;
    }

    // Return the sendEmail function
    sendEmail(...args){
        return this._ses.sendEmail(...args);
    }
}
