import { NotificationEngine } from '../../engine/notification-engine';
import { NotificationPayload } from '../../types';

export async function sendCommand(
  message: string,
  options: { title?: string },
): Promise<void> {
  const engine = new NotificationEngine();
  await engine.initialize();

  const payload: NotificationPayload = {
    message,
    title: options.title ?? 'Claude Code',
  };

  const result = await engine.dispatch(payload);
  if (!result.success) {
    console.error('[cc-notify] All providers failed to send notification.');
    process.exit(1);
  }
}
