import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../feature-modules/database';

@Injectable()
export class OAuthService {
    constructor(private mongo: MongoDbService) {}
    
    async googleAnalytics(query): Promise<any> {
        if (query.code) {
            return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `code=${query.code}&client_id=${app_client_id}&client_secret=${app_secret}&redirect_uri=${redirect_uri}&grant_type=authorization_code`
            })
            .then(response => response.html());
        }
        else {
            const scope = encodeURIComponent("https://www.googleapis.com/auth/analytics.readonly")

            return fetch(`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&access_type=offline&client_id=${app_client_id}&scope=${scope}&redirect_uri=${redirect_uri}`)
                .then(response => response.json());
        }
    }

    async refreshGoogleAnalyticsToken() {
        const refresh_token = "1/dAoV2XU1BoFXsbb6bM4KGqLmG4JGw3x7ip418TjJ_T4";
        return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `refresh_token=${refresh_token}&client_id=${app_client_id}&client_secret=${app_secret}&grant_type=refresh_token`
        })
        .then(response => response.json());
    }
}
