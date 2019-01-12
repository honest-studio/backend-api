import { Injectable } from '@nestjs/common';
import { MysqlConfig, ConfigService } from '../../common';
import * as mysql from 'mysql';
import { Pool } from 'mysql';

@Injectable()
export class MysqlService {
    private readonly mysqlConfig: MysqlConfig;
    private pool: Pool;

    constructor(config: ConfigService) {
        this.mysqlConfig = config.get('mysqlConfig');
    }

    connect(): Pool {
        if (this.pool) return this.pool;

        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: this.mysqlConfig.mysqlHost,
            port: this.mysqlConfig.mysqlPort,
            user: this.mysqlConfig.mysqlUsername,
            password: this.mysqlConfig.mysqlPassword,
            database: this.mysqlConfig.mysqlDatabase
        });
        return this.pool;
    }

    /**
     * get a connection to MongoDB
     */
    connection(): Pool {
        return this.pool;
    }
}
