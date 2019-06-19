import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ResolveIpFromRequest } from '../utils/request-tools';

/**
 * Check the resolved IP against some list to see if it's b&.
 * You could also use an injectable service here to do the same.
 * @param ip IP to check
 */
const ipIsBlacklisted = (ip: string): boolean => {
    const shitlist: string[] = [];
    return shitlist.indexOf(ip) > -1;
};

/**
 * This is where you'd put the async DB IP logging stuff if needed
 * Returns the resolved remove IP address.
 */
async function resolveIpAsync(ctx: Request): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (ctx) {
            const resolvedIp = ResolveIpFromRequest(ctx);
            console.log(`RequestIpMiddleware middleware resolved IP: ${resolvedIp}`);
            return resolve(resolvedIp);
        } else {
            reject('The request is invalid');
        }
    });
}

const invalidClientUrl = '/invalid-client';

const fallbackErrorUrl = '/error';

/**
 * Get the IP address from a client, and asynchronously do a thing with it.
 */
@Injectable()
export class RequestIpMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: Function): Promise<any> {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const remoteIp = await resolveIpAsync(req);
                if (remoteIp && !ipIsBlacklisted(remoteIp)) {
                    next();
                } else {
                    res.redirect(invalidClientUrl);
                }
            } catch (argh) {
                console.log('Error resolving remote IP, does not seem legit: ', argh);
                if (res) {
                    res.redirect(fallbackErrorUrl);
                }
            }
        };
    }
}
