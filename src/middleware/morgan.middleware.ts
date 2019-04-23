import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import morgan from 'morgan';

@Injectable()
export class MorganMiddleware implements NestMiddleware {
    use = morgan('combined');
}
