import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { MysqlService } from '../feature-modules/database/mysql-service';

@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
    private constructor(private mysql: MysqlService) {}

    use(req: Request, res: Response, next: Function): void {
        const url = req.originalUrl;
        const parts = url.split('?');
        const path = parts[0];
        let query;
        if (parts[1]) query = parts[1];
        else query = '';
        this.mysql.TryQuery(`
            INSERT INTO ep2_backend_requests (path, query, timestamp)
            VALUES (?, ?, NOW())`,
            [path, query]
        );
        next();
    }
}
