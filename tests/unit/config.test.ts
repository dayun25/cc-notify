import { ConfigLoader } from '../../src/engine/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ConfigLoader', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notify-test-'));
  const configPath = path.join(tmpDir, 'config.yaml');

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns defaults when no config file exists', async () => {
    const loader = new ConfigLoader({ configPath: configPath });
    const config = await loader.load();

    // File doesn't exist yet, should return defaults
    expect(config).toBeDefined();
    expect(config.mode).toBe('hook');
    expect(config.idleTimeout).toBe(3);
    expect(config.providers).toBeDefined();
  });

  it('parses a valid YAML config', async () => {
    fs.writeFileSync(configPath, `
mode: wrapper
idle_timeout: 5
providers:
  windows-toast:
    enabled: true
providers_config:
  windows-toast:
    sound: false
`, 'utf-8');

    const loader = new ConfigLoader({ configPath: configPath });
    const config = await loader.load();

    expect(config.mode).toBe('wrapper');
    expect(config.idleTimeout).toBe(5);
    expect(config.providers['windows-toast']?.enabled).toBe(true);
  });

  it('falls back to defaults on invalid YAML', async () => {
    fs.writeFileSync(configPath, 'invalid: yaml: : :', 'utf-8');

    const loader = new ConfigLoader({ configPath: configPath });
    const config = await loader.load();

    expect(config.mode).toBe('hook');
    expect(config.idleTimeout).toBe(3);
  });
});
