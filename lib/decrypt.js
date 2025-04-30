const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const ora = require('ora');
const figures = require('figures');
const {
  deriveKey,
  decryptBuffer,
  ENCRYPTED_EXTENSION
} = require('./utils');

/**
 * Decrypts a file or directory
 *
 * @param {string} targetPath - Path to file or directory to decrypt
 * @param {Object} options - Decryption options
 * @param {string} options.key - Decryption key
 * @param {string} [options.license] - Optional license key
 * @param {boolean} [options.dryRun=false] - If true, don't actually decrypt
 * @returns {Promise<Object>} - Result object with decrypted files
 */
async function decrypt(targetPath, options) {
  const { key, license, dryRun = false } = options;

  // Initialize spinner for key derivation
  const spinner = ora('Deriving decryption key...').start();

  try {
    // Derive decryption key
    const derivedKey = await deriveKey(key, license);
    spinner.succeed('Decryption key derived');

    // Track decrypted files
    const decryptedFiles = [];
    const skippedFiles = [];

    // Check if target is a file or directory
    spinner.text = 'Analyzing target...';
    spinner.start();
    const stats = await fs.stat(targetPath);

    if (stats.isFile()) {
      spinner.succeed('Target analyzed');

      // Single file decryption
      if (targetPath.endsWith(ENCRYPTED_EXTENSION)) {
        if (!dryRun) {
          spinner.text = `Decrypting ${path.basename(targetPath)}...`;
          spinner.start();
        }

        await decryptFile(targetPath, derivedKey, dryRun);
        decryptedFiles.push(targetPath);

        if (!dryRun) {
          spinner.succeed(`Decrypted ${path.basename(targetPath)}`);
        }
      } else {
        skippedFiles.push(targetPath);
        spinner.info(`Skipped ${path.basename(targetPath)} (not encrypted)`);
      }
    } else if (stats.isDirectory()) {
      // Directory decryption - find all encrypted files recursively
      spinner.text = 'Scanning directory for encrypted files...';
      spinner.start();

      const files = glob.sync(`**/*${ENCRYPTED_EXTENSION}`, {
        cwd: targetPath,
        nodir: true,
        dot: true,
        absolute: true
      });

      spinner.succeed(`Found ${files.length} encrypted files`);

      if (files.length === 0) {
        spinner.info('No files to decrypt');
      } else if (!dryRun) {
        // Create progress bar
        const progressBar = new cliProgress.SingleBar({
          format: `Decrypting files |${chalk.cyan('{bar}')}| {percentage}% | {value}/{total} files | {file}`,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        }, cliProgress.Presets.shades_classic);

        progressBar.start(files.length, 0, { file: 'Starting...' });

        // Decrypt each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileName = path.basename(file);

          progressBar.update(i, { file: fileName });

          try {
            await decryptFile(file, derivedKey, dryRun);
            decryptedFiles.push(file);
          } catch (error) {
            // If decryption fails for a specific file, log it but continue with others
            skippedFiles.push(file);
            console.error(chalk.red(`\nFailed to decrypt ${fileName}: ${error.message}`));
          }
        }

        progressBar.update(files.length, { file: 'Complete!' });
        progressBar.stop();
      } else {
        // Just collect files for dry run
        for (const file of files) {
          decryptedFiles.push(file);
        }
      }

      // Get all non-encrypted files for skipped count
      const allFiles = glob.sync('**/*', {
        cwd: targetPath,
        nodir: true,
        dot: true,
        absolute: true
      });

      const nonEncryptedFiles = allFiles.filter(file => !file.endsWith(ENCRYPTED_EXTENSION));
      skippedFiles.push(...nonEncryptedFiles);
    } else {
      throw new Error(`Unsupported file type: ${targetPath}`);
    }

    return {
      files: decryptedFiles,
      skipped: skippedFiles
    };
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Decrypts a single file
 *
 * @param {string} filePath - Path to file to decrypt
 * @param {Buffer} key - Derived decryption key
 * @param {boolean} dryRun - If true, don't actually decrypt
 */
async function decryptFile(filePath, key, dryRun) {
  // Read encrypted file content
  const encryptedContent = await fs.readFile(filePath);

  try {
    // Decrypt content
    const decryptedContent = decryptBuffer(encryptedContent, key);

    if (!dryRun) {
      // Write decrypted content to original file path
      const originalPath = filePath.slice(0, -ENCRYPTED_EXTENSION.length);
      await fs.writeFile(originalPath, decryptedContent);

      // Remove encrypted file
      await fs.remove(filePath);
    }
  } catch (error) {
    throw new Error(`Failed to decrypt ${filePath}: ${error.message}`);
  }
}

module.exports = decrypt;
