import { NotificationProvider } from './interface';

/**
 * Registry for notification providers.
 *
 * Built-in providers are auto-registered at engine startup. External
 * providers can be registered programmatically via `register()`.
 */
export class ProviderRegistry {
  private providers = new Map<string, NotificationProvider>();

  /** Register a provider. Overwrites if an entry with the same id exists. */
  register(provider: NotificationProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`[cc-notify] Provider "${provider.id}" already registered — overwriting.`);
    }
    this.providers.set(provider.id, provider);
  }

  /** Retrieve a provider by id. */
  get(id: string): NotificationProvider | undefined {
    return this.providers.get(id);
  }

  /** Return all registered providers. */
  getAll(): NotificationProvider[] {
    return Array.from(this.providers.values());
  }

  /** Check if a provider is already registered. */
  isRegistered(id: string): boolean {
    return this.providers.has(id);
  }
}
