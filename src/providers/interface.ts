import { NotificationPayload, SendResult } from '../types';

/**
 * Abstract interface that every notification provider must implement.
 *
 * Providers are registered with the engine and invoked when a notification
 * is dispatched. Each provider handles its own platform-specific rendering.
 */
export interface NotificationProvider {
  /** Unique machine-readable identifier (e.g., "windows-toast", "terminal-bell"). */
  readonly id: string;

  /** Human-readable name for display in lists and logs. */
  readonly name: string;

  /** Short description of what this provider does. */
  readonly description: string;

  /**
   * Called once at registration time with provider-specific config values
   * from `providersConfig.<id>` in the YAML config.
   */
  initialize(config: Record<string, unknown>): Promise<void>;

  /**
   * Send a notification. The engine catches errors so a failing provider
   * never crashes the dispatch loop.
   */
  send(notification: NotificationPayload): Promise<SendResult>;
}
