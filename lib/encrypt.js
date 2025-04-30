const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const ora = require('ora');
const figures = require('figures');
const {
  deriveKey,
  getIgnorePatterns,
  isIgnored,
  encryptBuffer,
  ENCRYPTED_EXTENSION
} = require('./utils');

/**
 * Encrypts a file or directory
 *
 * @param {string} targetPath - Path to file or directory to encrypt
 * @param {Object} options - Encryption options
 * @param {string} options.key - Encryption key
 * @param {string} [options.license] - Optional license key
 * @param {boolean} [options.dryRun=false] - If true, don't actually encrypt
 * @returns {Promise<Object>} - Result object with encrypted files
 */
async function encrypt(targetPath, options) {
  const { key, license, dryRun = false } = options;

  // Initialize spinner for key derivation
  const spinner = ora('Deriving encryption key...').start();

  try {
    // Derive encryption key
    const derivedKey = await deriveKey(key, license);
    spinner.succeed('Encryption key derived');

    // Get ignore patterns
    spinner.text = 'Loading ignore patterns...';
    spinner.start();
    const ignorePatterns = await getIgnorePatterns(path.dirname(targetPath));
    spinner.succeed('Ignore patterns loaded');

    // Track encrypted files
    const encryptedFiles = [];
    const skippedFiles = [];

    // Check if target is a file or directory
    spinner.text = 'Analyzing target...';
    spinner.start();
    const stats = await fs.stat(targetPath);

    if (stats.isFile()) {
      spinner.succeed('Target analyzed');

      // Single file encryption
      if (!isIgnored(targetPath, ignorePatterns) && !targetPath.endsWith(ENCRYPTED_EXTENSION)) {
        if (!dryRun) {
          spinner.text = `Encrypting ${path.basename(targetPath)}...`;
          spinner.start();
        }

        await encryptFile(targetPath, derivedKey, dryRun);
        encryptedFiles.push(targetPath);

        if (!dryRun) {
          spinner.succeed(`Encrypted ${path.basename(targetPath)}`);
        }
      } else {
        skippedFiles.push(targetPath);
        spinner.info(`Skipped ${path.basename(targetPath)} (ignored or already encrypted)`);
      }
    } else if (stats.isDirectory()) {
      // Directory encryption - find all files recursively
      spinner.text = 'Scanning directory...';
      spinner.start();

      const files = glob.sync('**/*', {
        cwd: targetPath,
        nodir: true,
        dot: true,
        absolute: true
      });

      spinner.succeed(`Found ${files.length} files to process`);

      // Filter files to encrypt
      const filesToEncrypt = files.filter(file =>
        !isIgnored(file, ignorePatterns) && !file.endsWith(ENCRYPTED_EXTENSION)
      );

      if (filesToEncrypt.length === 0) {
        spinner.info('No files to encrypt');
      } else if (!dryRun) {
        // Create progress bar
        const progressBar = new cliProgress.SingleBar({
          format: `Encrypting files |${chalk.cyan('{bar}')}| {percentage}% | {value}/{total} files | {file}`,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        }, cliProgress.Presets.shades_classic);

        progressBar.start(filesToEncrypt.length, 0, { file: 'Starting...' });

        // Encrypt each file
        for (let i = 0; i < filesToEncrypt.length; i++) {
          const file = filesToEncrypt[i];
          const fileName = path.basename(file);

          progressBar.update(i, { file: fileName });
          await encryptFile(file, derivedKey, dryRun);
          encryptedFiles.push(file);
        }

        progressBar.update(filesToEncrypt.length, { file: 'Complete!' });
        progressBar.stop();
      } else {
        // Just collect files for dry run
        for (const file of filesToEncrypt) {
          encryptedFiles.push(file);
        }
      }

      // Track skipped files
      skippedFiles.push(...files.filter(file =>
        isIgnored(file, ignorePatterns) || file.endsWith(ENCRYPTED_EXTENSION)
      ));
    } else {
      throw new Error(`Unsupported file type: ${targetPath}`);
    }

    return {
      files: encryptedFiles,
      skipped: skippedFiles
    };
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Encrypts a single file
 *
 * @param {string} filePath - Path to file to encrypt
 * @param {Buffer} key - Derived encryption key
 * @param {boolean} dryRun - If true, don't actually encrypt
 */
async function encryptFile(filePath, key, dryRun) {
  // Read file content
  const fileContent = await fs.readFile(filePath);

  // Encrypt content
  const encryptedContent = encryptBuffer(fileContent, key);

  if (!dryRun) {
    // Write encrypted content to new file
    const encryptedPath = `${filePath}${ENCRYPTED_EXTENSION}`;
    await fs.writeFile(encryptedPath, encryptedContent);

    // Remove original file
    await fs.remove(filePath);
  }
}

module.exports = encrypt;
