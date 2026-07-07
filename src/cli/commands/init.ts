import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const DEFAULT_CONFIG_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || '~',
  '.config',
  'cc-notify',
  'config.yaml',
);

const DEFAULT_CONFIG_YAML = `# cc-notify configuration
# Detection mode: "hook" (Claude Code hook) or "wrapper" (process wrapper)
mode: hook

# Seconds of inactivity before firing (wrapper mode only)
idle_timeout: 3

# Per-provider enable/disable settings
providers:
  floating-window:
    enabled: true
  windows-toast:
    enabled: false
  terminal-bell:
    enabled: false

# Visual style for floating window notifications
style:
  fontSize: 9
  fontFamily: "Microsoft YaHei"
  bgColor: "#323232"
  textColor: "#ffffff"
  opacity: 0.95
  duration: 4
  position: "bottom-right"
  width: 340
  height: 62

# Provider-specific configuration
providers_config: {}
`;

function askOverwrite(filePath: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`Config already exists at ${filePath}. Overwrite? (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

export async function initCommand(options: { path?: string }): Promise<void> {
  const filePath = options.path || DEFAULT_CONFIG_PATH;
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    const ok = await askOverwrite(filePath);
    if (!ok) {
      console.log('[cc-notify] Aborted.');
      return;
    }
    // Backup existing file
    const backup = filePath + '.bak';
    fs.copyFileSync(filePath, backup);
    console.log(`[cc-notify] Backed up existing config to ${backup}`);
  }

  fs.writeFileSync(filePath, DEFAULT_CONFIG_YAML, 'utf-8');
  console.log(`[cc-notify] Created config at ${filePath}`);
}
