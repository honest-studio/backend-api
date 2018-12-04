import { AppConfigVars } from './config-types';
import { validateAndBuildConfig } from './config-schema';

/**
 * Construct and build app config to be shared across modules
 * Call in a service like:
 * constructor(config: ConfigService) {
 *       this.mongoConfig=config.get('mongoConfig');
 *  }
 */
export class ConfigService {
    /**
     * AppConfigVars describing app behavior
     */
    private readonly envConfig: AppConfigVars;

    constructor(filePath: string) {
        // this.envConfig = dotenv.parse(fs.readFileSync(filePath));
        this.envConfig = validateAndBuildConfig(filePath);
    }

    /**
     * Retrieve a slice of configuration
     * @param key KeyOf AppConfigVars
     */
    get<K extends keyof AppConfigVars>(key: K): AppConfigVars[K] {
        return this.envConfig[key];
    }
}
