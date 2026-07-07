import { NotificationPayload, DispatchResult, Config } from '../types';
import { ProviderRegistry } from '../providers/registry';
import { ConfigLoader } from './config';
import { FloatingWindowProvider } from '../providers/floating-window';
import { TerminalBellProvider } from '../providers/terminal-bell';
import { WindowsToastProvider } from '../providers/windows-toast';

/**
 * Core notification engine.
 *
 * Loads config, registers built-in providers, and dispatches
 * notifications to all enabled providers.
 */
export class NotificationEngine {
  private registry = new ProviderRegistry();
  private configLoader: ConfigLoader;
  private config!: Config;
  private initialized = false;

  constructor(opts?: { configPath?: string }) {
    this.configLoader = new ConfigLoader(opts);
  }

  /** Initialize: load config and register built-in providers. */
  async initialize(): Promise<void> {
    this.config = await this.configLoader.load();

    // Register built-in providers
    const floating = new FloatingWindowProvider();
    const windowsToast = new WindowsToastProvider();
    const terminalBell = new TerminalBellProvider();

    this.registry.register(floating);
    this.registry.register(windowsToast);
    this.registry.register(terminalBell);

    // Merge style into floating-window provider config
    await this.syncStyleToProvider();

    // Initialize all registered providers with their config
    const allProviders = this.registry.getAll();
    for (const provider of allProviders) {
      if (provider.id === 'floating-window') continue; // already initialized above
      const providerConfig = this.config.providersConfig?.[provider.id] ?? {};
      await provider.initialize(providerConfig);
    }

    this.initialized = true;
  }

  /** Apply the style config from Config to the floating-window provider. */
  async syncStyleToProvider(): Promise<void> {
    const provider = this.registry.get('floating-window');
    if (!provider) return;
    const style = this.config.style ?? {};
    // Also read from providersConfig if present
    const pc = this.config.providersConfig?.['floating-window'] ?? {};
    await provider.initialize({ ...style, ...pc });
  }

  /** Set style and re-sync to provider. */
  async setStyle(style: Record<string, unknown>): Promise<void> {
    this.config.style = { ...(this.config.style ?? {}), ...style };
    await this.syncStyleToProvider();
  }

  /** Dispatch a notification to all enabled providers. */
  async dispatch(payload: NotificationPayload): Promise<DispatchResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const results = await Promise.all(
      this.registry.getAll().map(async (provider) => {
        // Check if this provider is enabled in config
        const entry = this.config.providers[provider.id];
        if (entry && entry.enabled === false) {
          return null; // skip
        }

        try {
          return await provider.send(payload);
        } catch (err) {
          return {
            success: false,
            providerId: provider.id,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );

    const filtered = results.filter(Boolean) as Exclude<(typeof results)[number], null>[];
    return {
      success: filtered.some((r) => r.success),
      results: filtered,
    };
  }

  /** Expose the registry for external provider registration. */
  getRegistry(): ProviderRegistry {
    return this.registry;
  }

  /** Return the currently loaded config. */
  getConfig(): Config {
    return this.config;
  }
}
