import { NotificationEngine } from '../../engine/notification-engine';
import { runWithDetection } from '../../detector/idle-detector';

export async function runCommand(commandAndArgs: string[]): Promise<void> {
  const engine = new NotificationEngine();
  await engine.initialize();

  const config = engine.getConfig();
  const command = commandAndArgs[0];
  const args = commandAndArgs.slice(1);

  const code = await runWithDetection(command, args, {
    timeout: config.idleTimeout ?? 3,
    engine,
  });

  process.exit(code);
}
