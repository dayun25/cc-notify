import { NotificationEngine } from '../../engine/notification-engine';

export async function listProvidersCommand(): Promise<void> {
  const engine = new NotificationEngine();
  await engine.initialize();

  const registry = engine.getRegistry();
  const providers = registry.getAll();
  const config = engine.getConfig();

  console.log('Registered providers:\n');
  for (const p of providers) {
    const entry = config.providers[p.id];
    const enabled = entry ? entry.enabled !== false : true;
    const status = enabled ? '✓' : '✗';
    console.log(`  ${status} ${p.id.padEnd(18)} ${p.name}`);
    console.log(`     ${p.description}`);
    console.log();
  }
}
