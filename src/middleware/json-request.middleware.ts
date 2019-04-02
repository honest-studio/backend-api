import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class JsonRequestMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: Function): void {
        req.headers['content-type'] = 'application/json';
        next();
    }
}
