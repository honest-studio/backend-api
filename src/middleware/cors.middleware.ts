import { Injectable, NestMiddleware } from '@nestjs/common';
import cors from 'cors';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
    use = cors();
}
