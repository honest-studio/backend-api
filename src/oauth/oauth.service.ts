import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../feature-modules/database';
import { ConfigService, GoogleAnalyticsConfig } from '../common';
import * as fetch from 'node-fetch';

export interface OAuthToken {
    provider: string; // google, facebook, etc.
    token_type: string; // refresh_token, access_token
    token: string;
    expires: number; // UNIX timestamp
    scope: string;
}

@Injectable()
export class OAuthService {
    private readonly googleAnalyticsConfig: GoogleAnalyticsConfig;

    constructor(private mongo: MongoDbService, private config: ConfigService) {
        this.googleAnalyticsConfig = config.get('googleAnalyticsConfig');
    }

    async googleAnalytics(query): Promise<any> {
        const redirect_uri = encodeURIComponent(this.googleAnalyticsConfig.googleApiRedirectUri);
        const client_id = this.googleAnalyticsConfig.googleApiClientId;
        const client_secret = this.googleAnalyticsConfig.googleApiClientSecret;

        if (query.code) {
            const token_json = fetch(`https://www.googleapis.com/oauth2/v4/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `code=${
                    query.code
                }&client_id=${client_id}&client_secret=${client_secret}&redirect_uri=${redirect_uri}&grant_type=authorization_code`
            }).then((response) => response.json());
            if (token_json.refresh_token) {
                const refresh_token: OAuthToken = {
                    provider: 'google',
                    token_type: 'refresh_token',
                    expires: 2000000000,
                    token: token_json.refresh_token,
                    scope: token_json.scope
                };
                await this.mongo.connection().oauth_tokens.deleteMany({
                    provider: 'google',
                    token_type: 'refresh_token'
                });
                await this.mongo.connection().oauth_tokens.insertOne(refresh_token);
            }
            if (token_json.access_token) {
                const access_token: OAuthToken = {
                    provider: 'google',
                    token_type: 'access_token',
                    expires: ((Date.now() / 1000) | 0) + token_json.expires_in,
                    token: token_json.access_token,
                    scope: token_json.scope
                };
                await this.mongo.connection().oauth_tokens.insertOne(access_token);
            }
            return token_json;
        } else {
            const scope = encodeURIComponent('https://www.googleapis.com/auth/analytics.readonly');

            return fetch(
                `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&access_type=offline&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}`
            ).then((response) => response.text());
        }
    }

    async getGoogleAnalyticsToken(): Promise<OAuthToken> {
        const refresh_token = this.googleAnalyticsConfig.googleApiRefreshToken;
        const client_id = this.googleAnalyticsConfig.googleApiClientId;
        const client_secret = this.googleAnalyticsConfig.googleApiClientSecret;

        const about_now = ((Date.now() / 1000) | 0) + 20;
        const access_token = await this.mongo.connection().oauth_tokens.findOne({
            provider: 'google',
            token_type: 'access_token',
            expires: { $gt: about_now }
        });
        if (access_token) return access_token;

        if (!refresh_token)
            throw new Error('No access or refresh token found. Use /v2/oauth/google-analytics to generate one');

        const oauth_response = await fetch(`https://www.googleapis.com/oauth2/v4/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `refresh_token=${refresh_token}&client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token`
        }).then((response) => response.json());

        if (oauth_response.access_token) {
            const access_token: OAuthToken = {
                provider: 'google',
                token_type: 'access_token',
                expires: ((Date.now() / 1000) | 0) + oauth_response.expires_in,
                token: oauth_response.access_token,
                scope: oauth_response.scope
            };
            await this.mongo.connection().oauth_tokens.insertOne(access_token);
            return access_token;
        } else throw new Error(`Could not refresh access token: ${oauth_response}`);
    }
}
