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
    DFUSE_API_ORIGIN_URL = 'DFUSE_API_ORIGIN_URL'
}

/**
 * Describes a function that takes in parsed dotenv output and returns either a part
 * of AppConfigVars, or null
 */
export type PartialConfigMaker = (parsed: dotenv.DotenvParseOutput) => Partial<AppConfigVars> | null;
