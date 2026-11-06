import { Configuration, ConfigurationSchema } from './types.js';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

export const DEFAULT_CONFIG_DIR = join(homedir(), '.argon-bridge');
export const DEFAULT_DB_PATH = join(DEFAULT_CONFIG_DIR, 'argon.db');

export class ConfigManager {
  private static instance: Configuration | null = null;

  public static getConfig(): Configuration {
    if (!this.instance) {
      this.instance = this.loadConfig();
    }
    return this.instance;
  }

  public static reload(): Configuration {
    this.instance = this.loadConfig();
    return this.instance;
  }

  private static loadConfig(): Configuration {
    const configPath = join(DEFAULT_CONFIG_DIR, 'config.json');
    let fileConfig: Record<string, any> = {};

    if (existsSync(configPath)) {
      try {
        const raw = readFileSync(configPath, 'utf-8');
        fileConfig = JSON.parse(raw);
      } catch (err) {
        console.warn(`[ArgonConfig] Failed to parse config file at ${configPath}:`, err);
      }
    }

    const envConfig = {
      maxRetries: process.env.ARGON_MAX_RETRIES
        ? parseInt(process.env.ARGON_MAX_RETRIES, 10)
        : undefined,
      maxReviewCycles: process.env.ARGON_MAX_REVIEW_CYCLES
        ? parseInt(process.env.ARGON_MAX_REVIEW_CYCLES, 10)
        : undefined,
      maxParallelTasks: process.env.ARGON_MAX_PARALLEL_TASKS
        ? parseInt(process.env.ARGON_MAX_PARALLEL_TASKS, 10)
        : undefined,
      taskTimeoutMinutes: process.env.ARGON_TASK_TIMEOUT_MINUTES
        ? parseInt(process.env.ARGON_TASK_TIMEOUT_MINUTES, 10)
        : undefined,
      databasePath: process.env.ARGON_DB_PATH || undefined,
      httpPort: process.env.ARGON_HTTP_PORT
        ? parseInt(process.env.ARGON_HTTP_PORT, 10)
        : undefined,
    };

    // Strip undefined
    const cleanEnv = Object.fromEntries(
      Object.entries(envConfig).filter(([_, v]) => v !== undefined)
    );

    const merged = {
      databasePath: DEFAULT_DB_PATH,
      ...fileConfig,
      ...cleanEnv,
    };

    return ConfigurationSchema.parse(merged);
  }
}
