import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import * as mysql from 'mysql';
import chalk from 'chalk';
import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Pool, PoolConnection } from 'mysql';
import { any } from 'joi';

@Injectable()
export class MysqlService implements OnApplicationShutdown, OnModuleInit {
    private connectionPool: Pool;
    /**
     * Ensure that we only call terminate once
     */
    private isTerminating: boolean = false;

    constructor(private config: ConfigService) {
        this.attemptPoolInit();
    }

    /**
     * Try to init conn pool, or catch + log error
     */
    private attemptPoolInit = (): Promise<Pool> => {
        return new Promise<Pool>((resolve, reject) => {
            if (!this.connectionPool) {
                try {
                    this.connectionPool = mysql.createPool({
                        connectionLimit: 2,
                        host: this.config.get('MYSQL_HOST'),
                        port: this.config.get('MYSQL_PORT'),
                        user: this.config.get('MYSQL_USERNAME'),
                        password: this.config.get('MYSQL_PASSWORD'),
                        database: this.config.get('MYSQL_DATABASE')
                    });
                    resolve(this.connectionPool);
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
                    reject(e);
                }
            } else {
                resolve(this.connectionPool);
            }
        });
    };

    /**
     * Get a pool connection instance
     */
    private getConnInstance = (): Promise<PoolConnection> => {
        return new Promise<PoolConnection>((resolve, reject) => {
            try {
                this.attemptPoolInit()
                    .then((pool) => {
                        if (pool) {
                            pool.getConnection((err, conn) => {
                                if (conn && !err) {
                                    resolve(conn);
                                } else {
                                    reject(err);
                                }
                            });
                        } else {
                            reject(new Error(`Invalid/broken MySQL connection`));
                        }
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Attempt to get a MySQL client instance, execute a query, and release when done.
     * Pass a query (with optional queryValues as arguments) and return result set.
     * Times out after {timeoutMs}ms (default: 10000)
     */
    public TryQuery = <T>(sql: string, queryValues: any[] = [], timeoutMs: number = 10000): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            try {
                this.getConnInstance()
                    .then((conn) => {
                        const queryObj =
                            queryValues && queryValues.length > 0
                                ? { timeout: timeoutMs, sql: sql, values: queryValues.slice() }
                                : { timeout: timeoutMs, sql: sql };
                        try {
                            let qres = conn.query(queryObj, (sqlErrs, results, fields) => {
                                if (sqlErrs) {
                                    conn.end();
                                    reject(sqlErrs);
                                } else {
                                    conn.release();
                                    resolve(results as T);
                                }
                            });

                            // console.log('qres: ', qres);
                        } catch (derp) {
                            conn.end();
                            reject(derp);
                        }
                    })
                    .catch((e) => {
                        reject(e);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    private tryTerminate = () => {
        if (!this.isTerminating) {
            this.isTerminating = true;

            if (this.connectionPool) {
                this.connectionPool.end();
            }
        }
    };

    onModuleInit() {
        // this.attemptPoolInit();
    }

    /**
     * Try to shut down the connection gracefully when the app exits
     * @param signal Signal event (SIGINT/SIGTERM)
     */
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
                console.info('Exiting');
                resolve();
            }, 2500);
        });
    }
}
