import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import * as ua from 'universal-analytics';

@Injectable()
export class GoogleAnalyticsMiddleware implements NestMiddleware {
    private readonly client = ua('UA-57561457-7');

    use(req: Request, res: Response, next: Function): void {
        const url = req.originalUrl;
        const parts = url.split('?');
        const path = parts[0];
        let query;
        if (parts[1])
            query = parts[1];
        else
            query = '';
        this.client.pageview(path, query).send();
        next();
    }
}
