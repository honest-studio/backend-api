import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import * as mysql from 'mysql';
import { Pool } from 'mysql';

@Injectable()
export class MysqlService {
    private connectionPool;

    constructor(private config: ConfigService) {
        this.connect();
    }

    connect(): Pool {
        if (this.connectionPool) return this.connectionPool;

        this.connectionPool = mysql.createPool({
            connectionLimit: 2,
            host: this.config.get("MYSQL_HOST"),
            port: this.config.get("MYSQL_PORT"),
            user: this.config.get("MYSQL_USERNAME"),
            password: this.config.get("MYSQL_PASSWORD"),
            database: this.config.get("MYSQL_DATABASE"),
        });
        return this.connectionPool;
    }

    /**
     * get a connection to MongoDB
     */
    pool() {
        return this.connectionPool;
    }
}
