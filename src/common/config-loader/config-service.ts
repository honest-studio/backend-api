import { AppConfigVars } from '../config-types';
import { validateAndBuildConfig } from '../config-schema';
import { Injectable } from '@nestjs/common';

/**
 * Construct and build app config to be shared across modules
 * Call in a service like:
 * constructor(config: ConfigService) {
 *       this.mongoConfig=config.get('mongoConfig');
 *  }
 */
@Injectable()
export class ConfigService {
    /**
     * AppConfigVars describing app behavior
     */
    private readonly envConfig: AppConfigVars;

    constructor(filePath: string) {
        try {
            this.envConfig = validateAndBuildConfig(filePath);
        } catch (derp) {
            console.error('Unable to load config file: ', derp);
            process.exit();
        }
    }

    /**
     * Retrieve a slice of configuration
     * @param key KeyOf AppConfigVars
     */
    get<K extends keyof AppConfigVars>(key: K): AppConfigVars[K] {
        return this.envConfig[key];
    }
}
