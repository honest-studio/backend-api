import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AppConfigVars, ConfigKeyNames, PartialConfigMaker } from './config-types';

/**
 * Build SSL config if SSL key path and cert path are provided
 * @param parsed dotenv parsed output
 */
const GetSslConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    if (parsed[ConfigKeyNames.SSL_KEY_PATH] && [ConfigKeyNames.SSL_CERTIFICATE_PATH]) {
        return {
            sslConfig: {
                sslKeyPath: parsed[ConfigKeyNames.SSL_KEY_PATH],
                sslCertificatePath: parsed[ConfigKeyNames.SSL_CERTIFICATE_PATH]
            }
        };
    } else {
        return null;
    }
};

/**
 * Build Copyleaks API config
 * @param parsed dotenv parsed output
 */
const GetCopyLeaksConfig: PartialConfigMaker = (parsed: dotenv.DotenvParseOutput): Partial<AppConfigVars> | null => {
    return {
        copyLeaksConfig: {
            copyLeaksApiKey: parsed[ConfigKeyNames.COPYLEAKS_API_KEY],
            copyLeaksApiEmail: parsed[ConfigKeyNames.COPYLEAKS_API_EMAIL]
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
            dfuseOriginUrl: parsed[ConfigKeyNames.DFUSE_API_ORIGIN_URL]
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
 * Array of functions that will be applied, in order, to build AppConfigVars
 */
const ConfigMappingFunctions: PartialConfigMaker[] = [
    GetSslConfig,
    GetCopyLeaksConfig,
    GetDfuseConfig,
    GetMongoConnConfig
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
    [ConfigKeyNames.SSL_KEY_PATH]: Joi.string().optional(),
    [ConfigKeyNames.SSL_CERTIFICATE_PATH]: Joi.string().optional(),
    [ConfigKeyNames.COPYLEAKS_API_KEY]: Joi.string().required(),
    [ConfigKeyNames.COPYLEAKS_API_EMAIL]: Joi.string().required(),
    [ConfigKeyNames.MONGODB_URL]: Joi.string().required(),
    [ConfigKeyNames.MONGODB_DATABASE_NAME]: Joi.string().required(),
    [ConfigKeyNames.DFUSE_API_KEY]: Joi.string().required(),
    [ConfigKeyNames.DFUSE_API_WEBSOCKET_ENDPOINT]: Joi.string().required(),
    [ConfigKeyNames.DFUSE_API_REST_ENDPOINT]: Joi.string().required(),
    [ConfigKeyNames.DFUSE_API_ORIGIN_URL]: Joi.string().required()
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
