import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class JsonRequestMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: Function): void {
        req.headers['content-type'] = 'application/json';
        next();
    }
}
