#!/usr/bin/env node

/**
 * LokiVector CLI
 * Command-line interface for managing LokiVector instances
 */

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const http = require('http');

// CLI version
const CLI_VERSION = '1.0.0';

// Commands
const startCommand = require('./commands/start');
const initCommand = require('./commands/init');
const statusCommand = require('./commands/status');
const logsCommand = require('./commands/logs');
const shellCommand = require('./commands/shell');
const keyCommand = require('./commands/key');
const collectionsCommand = require('./commands/collections');
const statsCommand = require('./commands/stats');

program
  .name('loki-vector')
  .description('LokiVector CLI - AI-Era Embedded Database')
  .version(CLI_VERSION);

// Init command
program
  .command('init')
  .description('Initialize a new LokiVector project')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(initCommand);

// Start command
program
  .command('start')
  .description('Start LokiVector server')
  .option('-p, --port <port>', 'HTTP port', '4000')
  .option('-t, --tcp-port <port>', 'TCP port', '5000')
  .option('-d, --data-dir <dir>', 'Data directory', './data')
  .option('--dev', 'Development mode (auto-reload)')
  .action(startCommand);

// Status command
program
  .command('status')
  .description('Check server status')
  .option('-p, --port <port>', 'Server port', '4000')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .action(statusCommand);

// Logs command
program
  .command('logs')
  .description('View server logs')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action(logsCommand);

// Shell command
program
  .command('shell')
  .description('Interactive shell (SQLite-like)')
  .option('-p, --port <port>', 'Server port', '4000')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('-k, --key <key>', 'API key')
  .action(shellCommand);

// Key commands
const keyCmd = program
  .command('key')
  .description('Manage API keys');

keyCmd
  .command('create')
  .description('Create new API key')
  .option('-n, --name <name>', 'Key name')
  .option('-u, --user <user>', 'User ID', 'default')
  .option('-c, --collections <collections>', 'Allowed collections (comma-separated, * for all)', '*')
  .option('-o, --operations <operations>', 'Allowed operations (comma-separated)', 'read,write')
  .option('-r, --rate-limit <limit>', 'Rate limit (requests)', '1000')
  .option('-w, --window <window>', 'Rate limit window (e.g., 1h, 1d)', '1h')
  .action(keyCommand.create);

keyCmd
  .command('list')
  .description('List all API keys')
  .option('-u, --user <user>', 'Filter by user ID')
  .action(keyCommand.list);

keyCmd
  .command('revoke')
  .description('Revoke an API key')
  .argument('<keyId>', 'Key ID to revoke')
  .action(keyCommand.revoke);

// Collections commands
const collectionsCmd = program
  .command('collections')
  .description('Manage collections');

collectionsCmd
  .command('list')
  .description('List all collections')
  .option('-k, --key <key>', 'API key')
  .option('-p, --port <port>', 'Server port', '4000')
  .action(collectionsCommand.list);

collectionsCmd
  .command('create')
  .description('Create a new collection')
  .argument('<name>', 'Collection name')
  .option('-k, --key <key>', 'API key')
  .option('-p, --port <port>', 'Server port', '4000')
  .action(collectionsCommand.create);

// Stats command
program
  .command('stats')
  .description('Show server statistics')
  .option('-k, --key <key>', 'API key')
  .option('-p, --port <port>', 'Server port', '4000')
  .action(statsCommand);

// Parse arguments
program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

