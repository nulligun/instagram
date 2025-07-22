#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const InstagramTokenCLI = require('../src/index');

const cli = new InstagramTokenCLI();

program
  .name('instagram-token')
  .description('CLI tool for obtaining and managing Instagram long-term access tokens')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize app configuration with Facebook App credentials')
  .action(async () => {
    try {
      await cli.init();
    } catch (error) {
      console.error(chalk.red('Error during initialization:'), error.message);
      process.exit(1);
    }
  });

program
  .command('add [alias]')
  .description('Add a new Instagram account and obtain access token')
  .action(async (alias) => {
    try {
      await cli.addAccount(alias);
    } catch (error) {
      console.error(chalk.red('Error adding account:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all stored Instagram accounts')
  .action(async () => {
    try {
      await cli.listAccounts();
    } catch (error) {
      console.error(chalk.red('Error listing accounts:'), error.message);
      process.exit(1);
    }
  });

program
  .command('use <alias>')
  .description('Set default Instagram account')
  .action(async (alias) => {
    try {
      await cli.useAccount(alias);
    } catch (error) {
      console.error(chalk.red('Error setting default account:'), error.message);
      process.exit(1);
    }
  });

program
  .command('info [alias]')
  .description('Get account details and token information')
  .option('--show-token', 'Show the full access token (security risk)')
  .option('--token-only', 'Output only the access token')
  .action(async (alias, options) => {
    try {
      await cli.getAccountInfo(alias, options);
    } catch (error) {
      console.error(chalk.red('Error getting account info:'), error.message);
      process.exit(1);
    }
  });

program
  .command('refresh [alias]')
  .description('Refresh access token for account')
  .action(async (alias) => {
    try {
      await cli.refreshToken(alias);
    } catch (error) {
      console.error(chalk.red('Error refreshing token:'), error.message);
      process.exit(1);
    }
  });

program
  .command('remove <alias>')
  .description('Remove stored Instagram account')
  .action(async (alias) => {
    try {
      await cli.removeAccount(alias);
    } catch (error) {
      console.error(chalk.red('Error removing account:'), error.message);
      process.exit(1);
    }
  });

program
  .command('export [file]')
  .description('Export accounts and configuration to file')
  .action(async (file) => {
    try {
      await cli.exportData(file);
    } catch (error) {
      console.error(chalk.red('Error exporting data:'), error.message);
      process.exit(1);
    }
  });

program
  .command('import <file>')
  .description('Import accounts and configuration from file')
  .action(async (file) => {
    try {
      await cli.importData(file);
    } catch (error) {
      console.error(chalk.red('Error importing data:'), error.message);
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();