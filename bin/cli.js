#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const figures = require('figures');
const encrypt = require('../lib/encrypt');
const decrypt = require('../lib/decrypt');
const rekey = require('../lib/rekey');
const FrostbiteRuntime = require('../lib/runtime');
const { version } = require('../package.json');

program
  .name('frostbite')
  .description('Selectively encrypt and decrypt files or folders to protect sensitive code or assets')
  .version(version);

program
  .command('lock <path>')
  .description('Encrypt a file or directory')
  .option('-k, --key <key>', 'Encryption key (will prompt if not provided)')
  .option('-e, --env <variable>', 'Environment variable containing the encryption key')
  .option('-l, --license <license>', 'License key for additional protection')
  .option('-d, --dry-run', 'Show what would be encrypted without making changes', false)
  .action(async (targetPath, options) => {
    try {
      const resolvedPath = path.resolve(process.cwd(), targetPath);

      // Get encryption key
      let key = options.key;
      if (options.env) {
        key = process.env[options.env];
        if (!key) {
          console.error(chalk.red(`Environment variable ${options.env} not found or empty`));
          process.exit(1);
        }
      }

      if (!key) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'key',
            message: 'Enter encryption key:',
            validate: input => input.length >= 8 ? true : 'Key must be at least 8 characters'
          }
        ]);
        key = answers.key;
      }

      // Perform encryption
      const result = await encrypt(resolvedPath, {
        key,
        license: options.license,
        dryRun: options.dryRun
      });

      if (options.dryRun) {
        console.log(chalk.yellow(`${figures.warning} DRY RUN - No changes made`));
        console.log(chalk.cyan(`${figures.pointer} Files that would be encrypted:`));
        result.files.forEach(file => console.log(`  ${chalk.green(figures.tick)} ${file}`));

        if (result.skipped && result.skipped.length > 0) {
          console.log(chalk.cyan(`${figures.pointer} Files that would be skipped:`));
          result.skipped.forEach(file => console.log(`  ${chalk.yellow(figures.warning)} ${file}`));
        }
      } else {
        console.log();
        console.log(chalk.green(`${figures.tick} Successfully encrypted ${result.files.length} files`));

        if (result.skipped && result.skipped.length > 0) {
          console.log(chalk.yellow(`${figures.warning} Skipped ${result.skipped.length} files (ignored or already encrypted)`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('unlock <path>')
  .description('Decrypt a file or directory')
  .option('-k, --key <key>', 'Decryption key (will prompt if not provided)')
  .option('-e, --env <variable>', 'Environment variable containing the decryption key')
  .option('-l, --license <license>', 'License key for additional protection')
  .option('-d, --dry-run', 'Show what would be decrypted without making changes', false)
  .action(async (targetPath, options) => {
    try {
      const resolvedPath = path.resolve(process.cwd(), targetPath);

      // Get decryption key
      let key = options.key;
      if (options.env) {
        key = process.env[options.env];
        if (!key) {
          console.error(chalk.red(`Environment variable ${options.env} not found or empty`));
          process.exit(1);
        }
      }

      if (!key) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'key',
            message: 'Enter decryption key:',
            validate: input => input.length >= 8 ? true : 'Key must be at least 8 characters'
          }
        ]);
        key = answers.key;
      }

      // Perform decryption
      const result = await decrypt(resolvedPath, {
        key,
        license: options.license,
        dryRun: options.dryRun
      });

      if (options.dryRun) {
        console.log(chalk.yellow(`${figures.warning} DRY RUN - No changes made`));
        console.log(chalk.cyan(`${figures.pointer} Files that would be decrypted:`));
        result.files.forEach(file => console.log(`  ${chalk.green(figures.tick)} ${file}`));

        if (result.skipped && result.skipped.length > 0) {
          console.log(chalk.cyan(`${figures.pointer} Files that would be skipped:`));
          result.skipped.forEach(file => console.log(`  ${chalk.yellow(figures.warning)} ${file}`));
        }
      } else {
        console.log();
        console.log(chalk.green(`${figures.tick} Successfully decrypted ${result.files.length} files`));

        if (result.skipped && result.skipped.length > 0) {
          console.log(chalk.yellow(`${figures.warning} Skipped ${result.skipped.length} files (not encrypted)`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('rekey <path>')
  .description('Re-encrypt files with a new key')
  .option('-k, --old-key <key>', 'Old encryption key (will prompt if not provided)')
  .option('-n, --new-key <key>', 'New encryption key (will prompt if not provided)')
  .option('--old-env <variable>', 'Environment variable containing the old encryption key')
  .option('--new-env <variable>', 'Environment variable containing the new encryption key')
  .option('--old-license <license>', 'Old license key')
  .option('--new-license <license>', 'New license key')
  .option('-d, --dry-run', 'Show what would be re-encrypted without making changes', false)
  .action(async (targetPath, options) => {
    try {
      const resolvedPath = path.resolve(process.cwd(), targetPath);

      // Get old encryption key
      let oldKey = options.oldKey;
      if (options.oldEnv) {
        oldKey = process.env[options.oldEnv];
        if (!oldKey) {
          console.error(chalk.red(`Environment variable ${options.oldEnv} not found or empty`));
          process.exit(1);
        }
      }

      if (!oldKey) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'key',
            message: 'Enter old encryption key:',
            validate: input => input.length >= 8 ? true : 'Key must be at least 8 characters'
          }
        ]);
        oldKey = answers.key;
      }

      // Get new encryption key
      let newKey = options.newKey;
      if (options.newEnv) {
        newKey = process.env[options.newEnv];
        if (!newKey) {
          console.error(chalk.red(`Environment variable ${options.newEnv} not found or empty`));
          process.exit(1);
        }
      }

      if (!newKey) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'key',
            message: 'Enter new encryption key:',
            validate: input => input.length >= 8 ? true : 'Key must be at least 8 characters'
          },
          {
            type: 'password',
            name: 'confirmKey',
            message: 'Confirm new encryption key:',
            validate: (input, answers) => {
              if (input.length < 8) return 'Key must be at least 8 characters';
              if (input !== answers.key) return 'Keys do not match';
              return true;
            }
          }
        ]);
        newKey = answers.key;
      }

      // Perform re-encryption
      const result = await rekey(resolvedPath, {
        oldKey,
        newKey,
        oldLicense: options.oldLicense,
        newLicense: options.newLicense,
        dryRun: options.dryRun
      });

      if (options.dryRun) {
        console.log(chalk.yellow(`${figures.warning} DRY RUN - No changes made`));
        console.log(chalk.cyan(`${figures.pointer} Files that would be re-encrypted:`));
        result.files.forEach(file => console.log(`  ${chalk.green(figures.tick)} ${file}`));

        if (result.skipped && result.skipped.length > 0) {
          console.log(chalk.cyan(`${figures.pointer} Files that would be skipped:`));
          result.skipped.forEach(file => console.log(`  ${chalk.yellow(figures.warning)} ${file}`));
        }
      } else {
        console.log();
        console.log(chalk.green(`${figures.tick} Successfully re-encrypted ${result.files.length} files`));

        if (result.skipped && result.skipped.length > 0) {
          console.log(chalk.yellow(`${figures.warning} Skipped ${result.skipped.length} files (not encrypted)`));
        }

        if (result.failed && result.failed.length > 0) {
          console.log(chalk.red(`${figures.cross} Failed to re-encrypt ${result.failed.length} files`));
          result.failed.forEach(item => {
            console.log(`  ${chalk.red(figures.cross)} ${item.path}: ${item.error}`);
          });
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('watch <path>')
  .description('Watch files and automatically encrypt/decrypt when they change')
  .option('-k, --key <key>', 'Encryption/decryption key (will prompt if not provided)')
  .option('-e, --env <variable>', 'Environment variable containing the key')
  .option('-l, --license <license>', 'License key for additional protection')
  .option('--auto-encrypt', 'Automatically encrypt files when they change', false)
  .option('--auto-decrypt', 'Automatically decrypt files when they change', true)
  .action(async (targetPath, options) => {
    try {
      const resolvedPath = path.resolve(process.cwd(), targetPath);

      // Get key
      let key = options.key;
      if (options.env) {
        key = process.env[options.env];
        if (!key) {
          console.error(chalk.red(`Environment variable ${options.env} not found or empty`));
          process.exit(1);
        }
      }

      if (!key) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'key',
            message: 'Enter encryption/decryption key:',
            validate: input => input.length >= 8 ? true : 'Key must be at least 8 characters'
          }
        ]);
        key = answers.key;
      }

      // Create runtime instance
      const runtime = new FrostbiteRuntime({
        key,
        license: options.license
      });

      // Initialize runtime
      await runtime.initialize();

      // Start watching
      await runtime.watch(resolvedPath, {
        autoEncrypt: options.autoEncrypt,
        autoDecrypt: options.autoDecrypt
      });

      console.log(chalk.green(`\nWatching ${resolvedPath} for changes`));
      console.log(chalk.cyan('Press Ctrl+C to stop'));

      // Keep the process running
      process.stdin.resume();

      // Handle exit
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\nStopping file watcher...'));
        await runtime.close();
        console.log(chalk.green('Watcher stopped'));
        process.exit(0);
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
