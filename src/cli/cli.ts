#!/usr/bin/env node

import { Command } from 'commander';
import { sendCommand } from './commands/send';
import { runCommand } from './commands/run';
import { initCommand } from './commands/init';
import { listProvidersCommand } from './commands/list-providers';
import { webCommand } from './commands/web';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json') as { version: string };

const program = new Command();

program
  .name('cc-notify')
  .description('Claude Code completion notifier')
  .version(pkg.version);

program
  .command('send <message>')
  .description('Send a notification immediately')
  .option('-t, --title <title>', 'Notification title')
  .action(sendCommand);

program
  .command('run')
  .description('Run a command and notify on idle/exit')
  .argument('<command...>', 'Command to run')
  .action(runCommand);

program
  .command('init')
  .description('Create a default config file')
  .option('-p, --path <path>', 'Custom config path')
  .action(initCommand);

program
  .command('list-providers')
  .alias('ls')
  .description('List registered notification providers')
  .action(listProvidersCommand);

program
  .command('web')
  .description('Start the web management UI')
  .option('-p, --port <port>', 'Port to listen on')
  .action(webCommand);

program.parse(process.argv);
