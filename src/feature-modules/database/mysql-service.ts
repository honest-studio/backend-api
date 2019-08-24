import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import chalk from 'chalk';
import * as mysql from 'mysql';
import { Pool, PoolConnection } from 'mysql';
import { ConfigService } from '../../common';

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
                        connectionLimit: this.config.get('MYSQL_POOL_SIZE'),
                        host: this.config.get('MYSQL_HOST'),
                        port: this.config.get('MYSQL_PORT'),
                        user: this.config.get('MYSQL_USERNAME'),
                        password: this.config.get('MYSQL_PASSWORD'),
                        database: this.config.get('MYSQL_DATABASE'),
                        charset: 'UTF8MB4_UNICODE_CI'
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
                                    conn.release();
                                    reject(sqlErrs);
                                } else {
                                    conn.release();
                                    if (sqlErrs) reject (sqlErrs);
                                    resolve(results as T);
                                }
                            });

                        } catch (derp) {
                            conn.release();
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

    // Our DB has very specific legacy encoding schemes for slugs
    // This function takes care of that
    public cleanSlugForMysql(slug: string, encodeToo: boolean = false) {
        let slugToReturn = slug;
        // slugToReturn = decodeURIComponent(slug)
        const replacements = [
           { find: /%2C/g, replace: "," },
            { find: /'/g, replace: "%27" },
            { find: /\(/g, replace: "%28" },
            { find: /\)/g, replace: "%29" },
    //        { find: /–/g, replace: "%E2%80%93" },
        ]
        for (let set of replacements) {
            slugToReturn = slugToReturn.replace(set.find, set.replace);
        }

        if (encodeToo) slugToReturn = encodeURIComponent(slugToReturn);
        slugToReturn = slugToReturn.replace(/%25/g, '%');
        return slugToReturn;
    }

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
    async onApplicationShutdown(signal: string) {
        console.info(
            chalk.cyan(`${signal} - shutting down, PID`) +
                chalk.yellow(' [') +
                chalk.red(`${process.pid}`) +
                chalk.yellow('] ')
        );
        return this.tryTerminate();
    }
}
