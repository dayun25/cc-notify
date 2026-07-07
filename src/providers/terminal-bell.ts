import { NotificationProvider } from './interface';
import { NotificationPayload, SendResult } from '../types';

/**
 * Minimal notification provider that writes the ASCII bell character (\x07)
 * to stderr. Works in any terminal and serves as a universal fallback.
 */
export class TerminalBellProvider implements NotificationProvider {
  readonly id = 'terminal-bell';
  readonly name = 'Terminal Bell';
  readonly description = 'Plays the terminal bell (ASCII 0x07)';

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // No setup needed.
  }

  async send(notification: NotificationPayload): Promise<SendResult> {
    try {
      process.stderr.write('\x07');
      return { success: true, providerId: this.id };
    } catch (err) {
      return {
        success: false,
        providerId: this.id,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
