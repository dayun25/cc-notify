// eslint-disable-next-line @typescript-eslint/no-var-requires
const notifier: { notify: (opts: Record<string, unknown>, cb: (err: Error | null) => void, metadata?: unknown) => void } = require('node-notifier');
import { NotificationProvider } from './interface';
import { NotificationPayload, SendResult } from '../types';

// Reconstruct the WindowsToaster notification type to avoid namespace issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WindowsToastNotification = Record<string, any>;

/**
 * Windows Toast notification provider.
 *
 * Uses the `node-notifier` library which wraps SnoreToast on Windows.
 * On non-Windows platforms it falls back to terminal-notifier (macOS)
 * or notify-send (Linux).
 */
export class WindowsToastProvider implements NotificationProvider {
  readonly id = 'windows-toast';
  readonly name = 'Windows Toast';
  readonly description = 'Native Windows toast notification (via SnoreToast)';

  private sound: boolean | string = true;
  private appID?: string;

  async initialize(config: Record<string, unknown>): Promise<void> {
    if (typeof config.sound === 'boolean') this.sound = config.sound;
    if (typeof config.sound === 'string') this.sound = config.sound;
    if (typeof config.app_id === 'string') this.appID = config.app_id;
  }

  async send(notification: NotificationPayload): Promise<SendResult> {
    return new Promise((resolve) => {
      try {
        const opts: WindowsToastNotification = {
          title: notification.title ?? 'Claude Code',
          message: notification.message,
          sound: this.sound,
          appID: this.appID,
          wait: false,
        };
        notifier.notify(opts, (err: Error | null) => {
          if (err) {
            resolve({ success: false, providerId: this.id, error: err.message });
          } else {
            resolve({ success: true, providerId: this.id });
          }
        });
      } catch (err) {
        resolve({
          success: false,
          providerId: this.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });
  }
}
