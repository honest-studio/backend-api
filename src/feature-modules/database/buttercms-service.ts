import { Injectable } from '@nestjs/common';
import Butter from 'buttercms';
import { ConfigService } from '../../common';

@Injectable()
export class ButterCMSService {
    private buttercms_service;

    constructor(private config: ConfigService) {
        this.buttercms_service = Butter(this.config.get('BUTTERCMS_KEY'), false, 5000);
    }
    // Return the default email
    getButter() {
        return this.buttercms_service;
    }

}
