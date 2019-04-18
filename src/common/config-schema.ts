import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AppConfigVars, ConfigKeyNames, PartialConfigMaker } from './config-types';

const GetServerConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        serverConfig: {
            serverProtocol: parsed[ConfigKeyNames.SERVER_PROTOCOL],
            serverHost: parsed[ConfigKeyNames.SERVER_HOST],
            serverHttpPort: parsed[ConfigKeyNames.SERVER_HTTP_PORT],
        }
    };
};

/**
 * Build DFuse.io API config
 * @param parsed dotenv parsed output
 */
const GetDfuseConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        dfuseConfig: {
            dfuseApiKey: parsed[ConfigKeyNames.DFUSE_API_KEY],
            dfuseWsEndpoint: parsed[ConfigKeyNames.DFUSE_API_WEBSOCKET_ENDPOINT],
            dfuseRestEndpoint: parsed[ConfigKeyNames.DFUSE_API_REST_ENDPOINT],
            dfuseOriginUrl: parsed[ConfigKeyNames.DFUSE_API_ORIGIN_URL],
            dfuseStartBlock: parsed[ConfigKeyNames.DFUSE_START_BLOCK]
        }
    };
};

/**
 * Build MongoDB connection config
 * @param parsed dotenv parsed output
 */
const GetMongoConnConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        mongoConfig: {
            mongoConnUrl: parsed[ConfigKeyNames.MONGODB_URL],
            mongoDbName: parsed[ConfigKeyNames.MONGODB_DATABASE_NAME]
        }
    };
};

/**
 * Build IPFS connection config
 * @param parsed dotenv parsed output
 */
const GetIpfsConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        ipfsConfig: {
            ipfsDaemonHost: parsed[ConfigKeyNames.IPFS_DAEMON_HOST],
            ipfsDaemonPort: parsed[ConfigKeyNames.IPFS_DAEMON_PORT]
        }
    };
};

/**
 * Build ElasticSearch connection config
 * @param parsed dotenv parsed output
 */
const GetElasticSearchConfig: PartialConfigMaker = (
    parsed: dotenv.DotenvParseOutput
): Partial<AppConfigVars> | null => {
    return {
        elasticSearchConfig: {
            elasticSearchProtocol: parsed[ConfigKeyNames.ELASTICSEARCH_PROTOCOL],
            elasticSearchHost: parsed[ConfigKeyNames.ELASTICSEARCH_HOST],
            elasticSearchPort: Number(parsed[ConfigKeyNames.ELASTICSEARCH_PORT]),
            elasticSearchUsername: parsed[ConfigKeyNames.ELASTICSEARCH_USERNAME],
            elasticSearchPassword: parsed[ConfigKeyNames.ELASTICSEARCH_PASSWORD],
            elasticSearchUrlPrefix: parsed[ConfigKeyNames.ELASTICSEARCH_URL_PREFIX]
        }
    };
};

/**
 * Build AWS S3 Bucket connection config
 * @param parsed dotenv parsed output
 */
const GetAWSS3Config: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        awsS3Config: {
            awsStorageBucketName: parsed[ConfigKeyNames.AWS_S3_STORAGE_BUCKET_NAME],
            awsFastCacheBucketName: parsed[ConfigKeyNames.AWS_S3_FAST_CACHE_BUCKET_NAME],
            awsAccessKeyID: parsed[ConfigKeyNames.AWS_S3_ACCESS_KEY_ID],
            awsSecretAccessKey: parsed[ConfigKeyNames.AWS_S3_SECRET_ACCESS_KEY]
        }
    };
};

/**
 * Build AWS SES connection config
 * @param parsed dotenv parsed output
 */
const GetAWSSESConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        awsSESConfig: {
            awsSESDefaultEmail: parsed[ConfigKeyNames.AWS_SES_DEFAULT_EMAIL],
            awsSESKey: parsed[ConfigKeyNames.AWS_SES_KEY],
            awsSESSecret: parsed[ConfigKeyNames.AWS_SES_SECRET],
            awsSESRegion: parsed[ConfigKeyNames.AWS_SES_REGION]
        }
    };
};

/**
 * Build Azure Bucket connection config
 * @param parsed dotenv parsed output
 */
const GetAzureStorageConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        azureStorageConfig: {
            azureStorageAccountName: parsed[ConfigKeyNames.AZURE_STORAGE_ACCOUNT_NAME],
            azureStorageAccountKey: parsed[ConfigKeyNames.AZURE_STORAGE_ACCOUNT_KEY],
            azureStorageContainer: parsed[ConfigKeyNames.AZURE_STORAGE_CONTAINER]
        }
    };
};

/**
 * Build MySQL connection config
 * @param parsed dotenv parsed output
 */
const GetMysqlConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        mysqlConfig: {
            mysqlHost: parsed[ConfigKeyNames.MYSQL_HOST],
            mysqlPort: Number(parsed[ConfigKeyNames.MYSQL_PORT]),
            mysqlUsername: parsed[ConfigKeyNames.MYSQL_USERNAME],
            mysqlPassword: parsed[ConfigKeyNames.MYSQL_PASSWORD],
            mysqlDatabase: parsed[ConfigKeyNames.MYSQL_DATABASE]
        }
    };
};

/**
 * Build Google Analytics config
 * @param parsed dotenv parsed output
 */
const GetGoogleAnalyticsConfig: PartialConfigMaker = (
    parsed: dotenv.DotenvParseOutput
): Partial<AppConfigVars> | null => {
    return {
        googleAnalyticsConfig: {
            googleAnalyticsTrackingId: parsed[ConfigKeyNames.GOOGLE_ANALYTICS_TRACKING_ID],
            googleAnalyticsViewId: parsed[ConfigKeyNames.GOOGLE_ANALYTICS_VIEW_ID],
            googleApiClientId: parsed[ConfigKeyNames.GOOGLE_API_CLIENT_ID],
            googleApiClientSecret: parsed[ConfigKeyNames.GOOGLE_API_CLIENT_SECRET],
            googleApiRefreshToken: parsed[ConfigKeyNames.GOOGLE_API_REFRESH_TOKEN],
            googleApiRedirectUri: parsed[ConfigKeyNames.GOOGLE_API_REDIRECT_URI]
        }
    };
};

/**
 * Array of functions that will be applied, in order, to build AppConfigVars
 */
const ConfigMappingFunctions: PartialConfigMaker[] = [
    GetServerConfig,
    GetDfuseConfig,
    GetMongoConnConfig,
    GetIpfsConfig,
    GetElasticSearchConfig,
    GetAWSS3Config,
    GetAWSSESConfig,
    GetAzureStorageConfig,
    GetMysqlConfig,
    GetGoogleAnalyticsConfig
];

/**
 * For each pass of the reducer that will build the AppConfigVars,
 * apply a PartialConfigMaker, and assign the result into the iterator if valid
 * @param configFn PartialConfigMaker to apply
 * @param parsed Parsed, validated dotenv output
 * @param acc Accumulator that is being built up to a full AppConfigVars
 */
const AppConfigSliceBuilder = (
    configFn: PartialConfigMaker,
    parsed: dotenv.DotenvParseOutput,
    acc: Partial<AppConfigVars>
): Partial<AppConfigVars> => {
    const cfgPart = configFn(parsed);
    if (cfgPart && Object.keys(cfgPart).length == 1) {
        return Object.assign(acc, { ...cfgPart });
    } else {
        return acc;
    }
};

/**
 * Take parsed .env file and iterate over individual config functions to build AppConfigVars
 * @param parsed .env file parsed result object
 */
const mapPropertyKeysToConfig = (parsed: dotenv.DotenvParseOutput): AppConfigVars | null => {
    if (parsed && Object.keys(parsed).length > 0) {
        return ConfigMappingFunctions.reduce((acc: Partial<AppConfigVars>, iter) => {
            return AppConfigSliceBuilder(iter, parsed, acc);
        }, {}) as AppConfigVars;
    } else {
        return null;
    }
};

/**
 * Schema to validate environment vars from .env file
 */
const envVarsSchema: Joi.ObjectSchema = Joi.object({
    [ConfigKeyNames.SERVER_HOST]: Joi.string().required(),
    [ConfigKeyNames.SERVER_PROTOCOL]: Joi.string().required(),
    [ConfigKeyNames.SERVER_HTTP_PORT]: Joi.string().optional(),
    [ConfigKeyNames.MONGODB_URL]: Joi.string().required(),
    [ConfigKeyNames.MONGODB_DATABASE_NAME]: Joi.string().required(),
    [ConfigKeyNames.DFUSE_API_KEY]: Joi.string().required(),
    [ConfigKeyNames.DFUSE_API_WEBSOCKET_ENDPOINT]: Joi.string()
        .uri()
        .required(),
    [ConfigKeyNames.DFUSE_API_REST_ENDPOINT]: Joi.string()
        .uri()
        .required(),
    [ConfigKeyNames.DFUSE_API_ORIGIN_URL]: Joi.string()
        .uri()
        .required(),
    [ConfigKeyNames.DFUSE_START_BLOCK]: Joi.number()
        .min(2)
        .default(2),
    [ConfigKeyNames.IPFS_DAEMON_HOST]: Joi.string().required(),
    [ConfigKeyNames.IPFS_DAEMON_PORT]: Joi.number()
        .integer()
        .min(0)
        .max(65535)
        .required(),
    [ConfigKeyNames.ELASTICSEARCH_USERNAME]: Joi.string().required(),
    [ConfigKeyNames.ELASTICSEARCH_PASSWORD]: Joi.string().required(),
    [ConfigKeyNames.ELASTICSEARCH_HOST]: Joi.string().required(),
    [ConfigKeyNames.ELASTICSEARCH_PROTOCOL]: Joi.string().required(),
    [ConfigKeyNames.ELASTICSEARCH_URL_PREFIX]: Joi.string(),
    [ConfigKeyNames.ELASTICSEARCH_PORT]: Joi.number()
        .integer()
        .min(0)
        .max(65535)
        .required(),
    [ConfigKeyNames.MYSQL_HOST]: Joi.string().required(),
    [ConfigKeyNames.MYSQL_PORT]: Joi.number()
        .integer()
        .min(0)
        .max(65535)
        .required(),
    [ConfigKeyNames.MYSQL_USERNAME]: Joi.string().required(),
    [ConfigKeyNames.MYSQL_PASSWORD]: Joi.string().required(),
    [ConfigKeyNames.MYSQL_DATABASE]: Joi.string().required(),
    [ConfigKeyNames.AWS_S3_STORAGE_BUCKET_NAME]: Joi.string().required(),
    [ConfigKeyNames.AWS_S3_FAST_CACHE_BUCKET_NAME]: Joi.string().required(),
    [ConfigKeyNames.AWS_S3_ACCESS_KEY_ID]: Joi.string().required(),
    [ConfigKeyNames.AWS_S3_SECRET_ACCESS_KEY]: Joi.string().required(),
    [ConfigKeyNames.AWS_SES_DEFAULT_EMAIL]: Joi.string().required(),
    [ConfigKeyNames.AWS_SES_KEY]: Joi.string().required(),
    [ConfigKeyNames.AWS_SES_SECRET]: Joi.string().required(),
    [ConfigKeyNames.AWS_SES_REGION]: Joi.string().required(),
    [ConfigKeyNames.AZURE_STORAGE_ACCOUNT_NAME]: Joi.string(),
    [ConfigKeyNames.AZURE_STORAGE_ACCOUNT_KEY]: Joi.string(),
    [ConfigKeyNames.AZURE_STORAGE_CONTAINER]: Joi.string(),
    [ConfigKeyNames.GOOGLE_ANALYTICS_TRACKING_ID]: Joi.string(),
    [ConfigKeyNames.GOOGLE_ANALYTICS_VIEW_ID]: Joi.string(),
    [ConfigKeyNames.GOOGLE_API_CLIENT_ID]: Joi.string(),
    [ConfigKeyNames.GOOGLE_API_CLIENT_SECRET]: Joi.string(),
    [ConfigKeyNames.GOOGLE_API_REFRESH_TOKEN]: Joi.string(),
    [ConfigKeyNames.GOOGLE_API_REDIRECT_URI]: Joi.string()
});

export const validateAndBuildConfig = (configFilePath: string): AppConfigVars => {
    if (!fs.existsSync(configFilePath)) {
        throw new Error(`Config file not found at supplied path: ${configFilePath}`);
    } else {
        const cfg = fs.readFileSync(configFilePath);
        if (cfg) {
            // const parsedConfigFile = dotenv.parse(cfg, { debug: true });
            const parsedConfigFile = dotenv.parse(fs.readFileSync(configFilePath));

            if (parsedConfigFile) {
                const { error, value: parsedEnvConfig } = Joi.validate(parsedConfigFile, envVarsSchema);
                if (error) {
                    throw new Error(
                        `Invalid format of config file at path: ${configFilePath}. Error: ${error.message}`
                    );
                } else {
                    const builtAppVars = mapPropertyKeysToConfig(parsedEnvConfig);
                    return builtAppVars;
                }
            } else {
                throw new Error(`Unable to parse config file at supplied path: ${configFilePath}`);
            }
        } else {
            throw new Error(`Unable to read config file at supplied path: ${configFilePath}`);
        }
    }
};
