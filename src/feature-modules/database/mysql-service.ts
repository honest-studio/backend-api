import { Injectable } from '@nestjs/common';
import { MysqlConfig, ConfigService } from '../../common';
import * as mysql from 'mysql';
import { Pool } from 'mysql';

@Injectable()
export class MysqlService {
    private readonly mysqlConfig: MysqlConfig;
    private connectionPool;

    constructor(config: ConfigService) {
        this.mysqlConfig = config.get('mysqlConfig');
        this.connect();
    }

    connect(): Pool {
        if (this.connectionPool) return this.connectionPool;

        this.connectionPool = mysql.createPool({
            connectionLimit: 10,
            host: this.mysqlConfig.mysqlHost,
            port: this.mysqlConfig.mysqlPort,
            user: this.mysqlConfig.mysqlUsername,
            password: this.mysqlConfig.mysqlPassword,
            database: this.mysqlConfig.mysqlDatabase
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
