import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import * as mysql from 'mysql';
import chalk from 'chalk';
import { OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'mysql';

@Injectable()
export class MysqlService implements OnApplicationShutdown {
    private connectionPool: Pool;
    /**
     * Ensure that we only call terminate once
     */
    private isTerminating: boolean = false;

    constructor(private config: ConfigService) {
        this.connect();
    }

    /**
     * Try to init conn pool, or catch + log error
     */
    private attemptPoolInit = () => {
        if (!this.connectionPool) {
            try {
                this.connectionPool = mysql.createPool({
                    connectionLimit: 5,
                    host: this.config.get('MYSQL_HOST'),
                    port: this.config.get('MYSQL_PORT'),
                    user: this.config.get('MYSQL_USERNAME'),
                    password: this.config.get('MYSQL_PASSWORD'),
                    database: this.config.get('MYSQL_DATABASE')
                });
            } catch (e) {
                console.error(
                    chalk.cyan('Backend could not init MySql conn pool, PID') +
                        chalk.yellow(' [') +
                        chalk.red(`${process.pid}`) +
                        chalk.yellow('] ') +
                        chalk.red('[') +
                        chalk.red(e) +
                        chalk.red('] ')
                );
                this.connectionPool = null;
            }
        }
    };

    public connect = (): Pool => {
        if (this.connectionPool) return this.connectionPool;

        this.attemptPoolInit();
        return this.connectionPool;
    };

    /**
     * Get a connection to MongoDB
     */
    public pool = () => {
        return this.connectionPool;
    };

    private tryTerminate = () => {
        if (!this.isTerminating) {
            this.isTerminating = true;

            if (this.connectionPool) {
                this.connectionPool.end();
            }
        }
    };
    onApplicationShutdown(signal: string) {
        console.info(
            chalk.cyan(`${signal} - shutting down, PID`) +
                chalk.yellow(' [') +
                chalk.red(`${process.pid}`) +
                chalk.yellow('] ')
        );
        this.tryTerminate();
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.info('Exiting')
                resolve();
            }, 2500);
        });
    }
}
