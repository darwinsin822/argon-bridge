import { Configuration } from './types.js';
export declare const DEFAULT_CONFIG_DIR: string;
export declare const DEFAULT_DB_PATH: string;
export declare class ConfigManager {
    private static instance;
    static getConfig(): Configuration;
    static reload(): Configuration;
    private static loadConfig;
}
//# sourceMappingURL=config.d.ts.map