import * as Joi from 'joi';

/**
 * Schema to validate environment vars from .env file
 */
export const envVarsSchema: Joi.ObjectSchema = Joi.object({
    SERVER_HOST: Joi.string().required(),
    SERVER_PROTOCOL: Joi.string().required(),
    SERVER_HTTP_PORT: Joi.string().optional(),
    MONGODB_URL: Joi.string().required(),
    MONGODB_DATABASE_NAME: Joi.string().required(),
    DFUSE_API_KEY: Joi.string().required(),
    DFUSE_API_WEBSOCKET_ENDPOINT: Joi.string()
        .uri()
        .required(),
    DFUSE_API_REST_ENDPOINT: Joi.string()
        .uri()
        .required(),
    DFUSE_API_ORIGIN_URL: Joi.string()
        .uri()
        .required(),
    DFUSE_START_BLOCK: Joi.number()
        .min(2)
        .default(2),
    DFUSE_ACTION_LOGGING: Joi.boolean()
        .default(false),
    DFUSE_CATCHUP_URL: Joi.string()
        .uri(),
    DFUSE_SYNC: Joi.boolean().default(true),
    IPFS_DAEMON_HOST: Joi.string().required(),
    IPFS_DAEMON_PORT: Joi.number()
        .integer()
        .min(0)
        .max(65535)
        .required(),
    ELASTICSEARCH_USERNAME: Joi.string().required(),
    ELASTICSEARCH_PASSWORD: Joi.string().required(),
    ELASTICSEARCH_HOST: Joi.string().required(),
    ELASTICSEARCH_PROTOCOL: Joi.string().required(),
    ELASTICSEARCH_URL_PREFIX: Joi.string(),
    ELASTICSEARCH_PORT: Joi.number()
        .integer()
        .min(0)
        .max(65535)
        .required(),
    MYSQL_HOST: Joi.string().required(),
    MYSQL_PORT: Joi.number()
        .integer()
        .min(0)
        .max(65535)
        .required(),
    MYSQL_USERNAME: Joi.string().required(),
    MYSQL_PASSWORD: Joi.string().required(),
    MYSQL_DATABASE: Joi.string().required(),
    MYSQL_POOL_SIZE: Joi.number().min(1).max(100).required(),
    AWS_S3_STORAGE_BUCKET_NAME: Joi.string().required(),
    AWS_S3_FAST_CACHE_BUCKET_NAME: Joi.string().required(),
    AWS_S3_ACCESS_KEY_ID: Joi.string().required(),
    AWS_S3_SECRET_ACCESS_KEY: Joi.string().required(),
    AWS_SES_DEFAULT_EMAIL: Joi.string().required(),
    AWS_SES_KEY: Joi.string().required(),
    AWS_SES_SECRET: Joi.string().required(),
    AWS_SES_REGION: Joi.string().required(),
    AZURE_STORAGE_ACCOUNT_NAME: Joi.string(),
    AZURE_STORAGE_ACCOUNT_KEY: Joi.string(),
    AZURE_STORAGE_CONTAINER: Joi.string(),
    GOOGLE_ANALYTICS_TRACKING_ID: Joi.string(),
    GOOGLE_ANALYTICS_VIEW_ID: Joi.string(),
    GOOGLE_API_CLIENT_ID: Joi.string(),
    GOOGLE_API_CLIENT_SECRET: Joi.string(),
    GOOGLE_API_REFRESH_TOKEN: Joi.string(),
    GOOGLE_API_REDIRECT_URI: Joi.string()
});

