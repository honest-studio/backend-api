import * as dotenv from 'dotenv';

/**
 * SSL Server configuration
 */
export interface SslConfig {
    /**
     * Path to file containing SSL key
     */
    sslKeyPath: string;
    /**
     * Path to file containing SSL certificate
     */
    sslCertificatePath: string;
}

/**
 * CopyLeaks API configuration
 */
export interface CopyLeaksConfig {
    /**
     * CopyLeaks API Key
     */
    copyLeaksApiKey: string;
    /**
     * E-mail used to register with CopyLeaks
     */
    copyLeaksApiEmail: string;
}

/**
 * Dfuse.io API configuration
 */
export interface DfuseConfig {
    /**
     * Dfuse API Key
     */
    dfuseApiKey: string;
    /**
     * Dfuse WebSocket endpoint
     */
    dfuseWsEndpoint: string;
    /**
     * Dfuse REST endpoint
     */
    dfuseRestEndpoint: string;
    /**
     * Origin URL to send with requests to DFuse API
     */
    dfuseOriginUrl: string;
}

/**
 * Configure connection to mongodb instance
 */
export interface MongoDbConnectionConfig {
    /**
     * Connection string for mongodb
     */
    mongoConnUrl: string;
    /**
     * DB name to use in MongoDB
     */
    mongoDbName: string;
}

/**
 * Configure connection to IPFS daemon
 */
export interface IpfsConfig {
    /**
     * Connection host for IPFS daemon
     */
    ipfsDaemonHost: string;
    /**
     * Connection port for IPFS daemon
     */
    ipfsDaemonPort: string;
}
/**
 * Configure connection to Azure ElasticSearch
 */
export interface ElasticSearchConfig {
    /**
     * Connection Protocol for ElasticSearch
     */
    elasticSearchProtocol: string;
    /**
     * Connection Host for ElasticSearch
     */
    elasticSearchHost: string;
    /**
     * Connection Port for ElasticSearch
     */
    elasticSearchPort: number;
    /**
     * Username for ElasticSearch connection
     */
    elasticSearchUsername: string;
    /**
     * Password for ElasticSearch connection
     */
    elasticSearchPassword: string;
    /**
     * URL Prefix for ElasticSearch connection
     */
    elasticSearchUrlPrefix: string;
}

/**
 * Configure connection to MySQL on AWS
 */
export interface MysqlConfig {
    /**
     * Connection Host for Mysql
     */
    mysqlHost: string;
    /**
     * Connection Port for Mysql
     */
    mysqlPort: number;
    /**
     * Username for Mysql connection
     */
    mysqlUsername: string;
    /**
     * Password for Mysql connection
     */
    mysqlPassword: string;
    /**
     * Database for Mysql connection
     */
    mysqlDatabase: string;
}

/**
 * Combined config for app
 */
export interface AppConfigVars {
    /**
     * SSL config (optional)
     */
    sslConfig?: SslConfig;
    /**
     * CopyLeaks API config
     */
    copyLeaksConfig: CopyLeaksConfig;
    /**
     * Dfuse.IO API config
     */
    dfuseConfig: DfuseConfig;
    /**
     * MongoDb connection config
     */
    mongoConfig: MongoDbConnectionConfig;
    /**
     * IPFS connection config
     */
    ipfsConfig: IpfsConfig;
    /**
     * ElasticSearch connection config
     */
    elasticSearchConfig?: ElasticSearchConfig;
    /**
     * Mysql Connection config
     */
    mysqlConfig?: MysqlConfig;
}

/**
 * Valid key names for the .env file
 */
export enum ConfigKeyNames {
    SSL_KEY_PATH = 'SSL_KEY_PATH',
    SSL_CERTIFICATE_PATH = 'SSL_CERTIFICATE_PATH',
    COPYLEAKS_API_KEY = 'COPYLEAKS_API_KEY',
    COPYLEAKS_API_EMAIL = 'COPYLEAKS_API_EMAIL',
    MONGODB_URL = 'MONGODB_URL',
    MONGODB_DATABASE_NAME = 'MONGODB_DATABASE_NAME',
    DFUSE_API_KEY = 'DFUSE_API_KEY',
    DFUSE_API_WEBSOCKET_ENDPOINT = 'DFUSE_API_WEBSOCKET_ENDPOINT',
    DFUSE_API_REST_ENDPOINT = 'DFUSE_API_REST_ENDPOINT',
    DFUSE_API_ORIGIN_URL = 'DFUSE_API_ORIGIN_URL',
    IPFS_DAEMON_HOST = 'IPFS_DAEMON_HOST',
    IPFS_DAEMON_PORT = 'IPFS_DAEMON_PORT',
    ELASTICSEARCH_PROTOCOL = 'ELASTICSEARCH_PROTOCOL',
    ELASTICSEARCH_HOST = 'ELASTICSEARCH_HOST',
    ELASTICSEARCH_PORT = 'ELASTICSEARCH_PORT',
    ELASTICSEARCH_USERNAME = 'ELASTICSEARCH_USERNAME',
    ELASTICSEARCH_PASSWORD = 'ELASTICSEARCH_PASSWORD',
    ELASTICSEARCH_URL_PREFIX = 'ELASTICSEARCH_URL_PREFIX',
    MYSQL_HOST = 'MYSQL_HOST',
    MYSQL_PORT = 'MYSQL_PORT',
    MYSQL_USERNAME = 'MYSQL_USERNAME',
    MYSQL_PASSWORD = 'MYSQL_PASSWORD',
    MYSQL_DATABASE = 'MYSQL_DATABASE'
}

/**
 * Describes a function that takes in parsed dotenv output and returns either a part
 * of AppConfigVars, or null
 */
export type PartialConfigMaker = (parsed: dotenv.DotenvParseOutput) => Partial<AppConfigVars> | null;
