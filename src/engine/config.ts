import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';
import { Config } from '../types';

const DEFAULT_CONFIG_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || '~',
  '.config',
  'cc-notify',
  'config.yaml',
);

/** Default configuration used when no config file is found. */
const DEFAULT_CONFIG: Config = {
  mode: 'hook',
  idleTimeout: 3,
  providers: {
    'floating-window': { enabled: true },
    'windows-toast': { enabled: false },
    'terminal-bell': { enabled: false },
  },
  providersConfig: {},
};

/**
 * Loads and validates the YAML configuration file.
 *
 * Resolution order:
 * 1. `CC_NOTIFY_CONFIG` environment variable
 * 2. `~/.config/cc-notify/config.yaml`
 * 3. Built-in defaults
 */
export class ConfigLoader {
  private customPath?: string;

  constructor(opts?: { configPath?: string }) {
    this.customPath = opts?.configPath;
  }

  /** Resolve the config file path. */
  private resolvePath(): string {
    if (this.customPath) return this.customPath;
    if (process.env.CC_NOTIFY_CONFIG) return process.env.CC_NOTIFY_CONFIG;
    return DEFAULT_CONFIG_PATH;
  }

  /** Load, parse, and validate the config. */
  async load(): Promise<Config> {
    const filePath = this.resolvePath();

    if (!fs.existsSync(filePath)) {
      console.warn(`[cc-notify] Config not found at ${filePath}, using defaults.`);
      return { ...DEFAULT_CONFIG };
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = parse(raw) as Record<string, unknown>;

      // Validate and fill defaults
      const config: Config = {
        mode: parsed.mode === 'wrapper' ? 'wrapper' : 'hook',
        // Support both snake_case (YAML) and camelCase (TypeScript)
        idleTimeout: typeof parsed.idle_timeout === 'number'
          ? (parsed.idle_timeout as number)
          : typeof parsed.idleTimeout === 'number'
            ? (parsed.idleTimeout as number)
            : 3,
        providers: (parsed.providers ?? {}) as Record<string, import('../types').ProviderEntry>,
        providersConfig: (parsed.providers_config ?? parsed.providersConfig ?? {}) as Record<string, Record<string, unknown>>,
      };

      return config;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[cc-notify] Failed to parse config: ${msg}. Using defaults.`);
      return { ...DEFAULT_CONFIG };
    }
  }
}
