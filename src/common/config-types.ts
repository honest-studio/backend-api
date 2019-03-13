import * as dotenv from 'dotenv';

export interface ServerConfig {
    serverProtocol: string;
    serverHost: string;
    serverHttpPort: string;
    serverHttpsPort: string;
}
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
    /**
     * Block to start syncing a fresh database
     */
    dfuseStartBlock: string;
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
 * Configure connection to S3 on AWS
 */
export interface AWSS3Config {
    /**
     * Default storage bucket name
     */
    awsStorageBucketName: string;
    /**
     * Fast / Accelerated storage bucket name
     */
    awsFastCacheBucketName: string;
    /**
     * Access ID
     */
    awsAccessKeyID: string;
    /**
     * Access secret key
     */
    awsSecretAccessKey: string;
    /**
     * Domain to show
     */
}

/**
 * Configure connection to SES on AWS
 */
export interface AWSSESConfig {
    /**
     * Default SES email
     */
    awsSESDefaultEmail: string;
    /**
     * SES key
     */
    awsSESKey: string;
    /**
     * SES secret
     */
    awsSESSecret: string;
    /**
     * SES region
     */
    awsSESRegion: string;
}

/**
 * Configure connection to Azure
 */
export interface AzureStorageConfig {
    /**
     * Azure account name
     */
    azureStorageAccountName: string;
    /**
     * Azure key
     */
    azureStorageAccountKey: string;
    /**
     * Azure container
     */
    azureStorageContainer: string;
}


/**
 * Combined config for app
 */
export interface AppConfigVars {
    serverConfig: ServerConfig;
    /**
     * SSL config (optional)
     */
    sslConfig?: SslConfig;
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
     * AWS S3 connection config
    */
    awsS3Config: AWSS3Config;
    /**
     * AWS SES connection config
    */
    awsSESConfig: AWSSESConfig;
    /**
     * Azure connection config
    */
    azureStorageConfig: AzureStorageConfig;
    /**
     * ElasticSearch connection config
     */
    elasticSearchConfig: ElasticSearchConfig;
    /**
     * Mysql Connection config
     */
    mysqlConfig: MysqlConfig;
}


/**
 * Valid key names for the .env file
 */
export enum ConfigKeyNames {
    SERVER_PROTOCOL = 'SERVER_PROTOCOL',
    SERVER_HOST = 'SERVER_HOST',
    SERVER_HTTP_PORT = 'SERVER_HTTP_PORT',
    SERVER_HTTPS_PORT = 'SERVER_HTTPS_PORT',
    SSL_KEY_PATH = 'SSL_KEY_PATH',
    SSL_CERTIFICATE_PATH = 'SSL_CERTIFICATE_PATH',
    MONGODB_URL = 'MONGODB_URL',
    MONGODB_DATABASE_NAME = 'MONGODB_DATABASE_NAME',
    DFUSE_API_KEY = 'DFUSE_API_KEY',
    DFUSE_API_WEBSOCKET_ENDPOINT = 'DFUSE_API_WEBSOCKET_ENDPOINT',
    DFUSE_API_REST_ENDPOINT = 'DFUSE_API_REST_ENDPOINT',
    DFUSE_API_ORIGIN_URL = 'DFUSE_API_ORIGIN_URL',
    DFUSE_START_BLOCK = 'DFUSE_START_BLOCK',
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
    MYSQL_DATABASE = 'MYSQL_DATABASE',
    AWS_S3_STORAGE_BUCKET_NAME = 'AWS_S3_STORAGE_BUCKET_NAME',
    AWS_S3_FAST_CACHE_BUCKET_NAME = 'AWS_S3_FAST_CACHE_BUCKET_NAME',
    AWS_S3_ACCESS_KEY_ID = 'AWS_S3_ACCESS_KEY_ID',
    AWS_S3_SECRET_ACCESS_KEY = 'AWS_S3_SECRET_ACCESS_KEY',
    AWS_SES_DEFAULT_EMAIL='AWS_SES_DEFAULT_EMAIL',
    AWS_SES_KEY='AWS_SES_KEY',
    AWS_SES_SECRET='AWS_SES_SECRET',
    AWS_SES_REGION='AWS_SES_REGION',
    AZURE_FILE_STORAGE='AZURE_FILE_STORAGE',
    AZURE_STORAGE_ACCOUNT_NAME='AZURE_STORAGE_ACCOUNT_NAME',
    AZURE_STORAGE_ACCOUNT_KEY='AZURE_STORAGE_ACCOUNT_KEY',
    AZURE_STORAGE_CONTAINER='AZURE_STORAGE_CONTAINER'
}

/**
 * Describes a function that takes in parsed dotenv output and returns either a part
 * of AppConfigVars, or null
 */
export type PartialConfigMaker = (parsed: dotenv.DotenvParseOutput) => Partial<AppConfigVars> | null;
