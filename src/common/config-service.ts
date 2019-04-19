import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { envVarsSchema } from './config-schema';
import * as Joi from 'joi';
import * as fs from 'fs';

/**
 * Construct and build app config to be shared across modules
 * Call in a service like:
 *
 * constructor(private config: ConfigService) {}
 * 
 * get() {
 *     const serverHost = this.config.get('SERVER_HOST');
 * }
 */
@Injectable()
export class ConfigService {
    private readonly envConfig;
    private valid_keys;

    constructor(filePath: string) {
        this.envConfig = this.validateAndBuildConfig(filePath);
        this.valid_keys = Object.keys(Joi.describe(envVarsSchema).children);
    }

    get(key) {
        if (!this.valid_keys.includes(key))
            throw new Error(`${key} is not a valid configuration key in common/config-schema.ts`);
        return this.envConfig[key];
    }

    validateAndBuildConfig = (configFilePath: string) => {
        if (!fs.existsSync(configFilePath)) {
            throw new Error(`Config file not found at supplied path: ${configFilePath}`);
        } else {
            const cfg = fs.readFileSync(configFilePath);
            if (cfg) {
                // const parsedConfigFile = dotenv.parse(cfg, { debug: true });
                const parsedConfigFile = dotenv.parse(fs.readFileSync(configFilePath));

                if (parsedConfigFile) {
                    const { error, value } = Joi.validate(parsedConfigFile, envVarsSchema);
                    if (error) {
                        throw new Error(
                            `Invalid format of config file at path: ${configFilePath}. Error: ${error.message}`
                        );
                    } else {
                        return value;
                    }
                } else {
                    throw new Error(`Unable to parse config file at supplied path: ${configFilePath}`);
                }
            } else {
                throw new Error(`Unable to read config file at supplied path: ${configFilePath}`);
            }
        }
    }
}
