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
  decryptBuffer,
  ENCRYPTED_EXTENSION
} = require('./utils');

/**
 * Re-encrypts files with a new key
 * 
 * @param {string} targetPath - Path to file or directory to re-encrypt
 * @param {Object} options - Re-encryption options
 * @param {string} options.oldKey - Old encryption key
 * @param {string} options.newKey - New encryption key
 * @param {string} [options.oldLicense] - Old license key
 * @param {string} [options.newLicense] - New license key
 * @param {boolean} [options.dryRun=false] - If true, don't actually re-encrypt
 * @returns {Promise<Object>} - Result object with re-encrypted files
 */
async function rekey(targetPath, options) {
  const { oldKey, newKey, oldLicense, newLicense, dryRun = false } = options;
  
  // Initialize spinner for key derivation
  const spinner = ora('Deriving encryption keys...').start();
  
  try {
    // Derive old and new keys
    const oldDerivedKey = await deriveKey(oldKey, oldLicense);
    const newDerivedKey = await deriveKey(newKey, newLicense);
    spinner.succeed('Encryption keys derived');
    
    // Track re-encrypted files
    const rekeyedFiles = [];
    const skippedFiles = [];
    const failedFiles = [];
    
    // Check if target is a file or directory
    spinner.text = 'Analyzing target...';
    spinner.start();
    const stats = await fs.stat(targetPath);
    
    if (stats.isFile()) {
      spinner.succeed('Target analyzed');
      
      // Single file re-encryption
      if (targetPath.endsWith(ENCRYPTED_EXTENSION)) {
        if (!dryRun) {
          spinner.text = `Re-encrypting ${path.basename(targetPath)}...`;
          spinner.start();
        }
        
        try {
          await rekeyFile(targetPath, oldDerivedKey, newDerivedKey, dryRun);
          rekeyedFiles.push(targetPath);
          
          if (!dryRun) {
            spinner.succeed(`Re-encrypted ${path.basename(targetPath)}`);
          }
        } catch (error) {
          failedFiles.push({ path: targetPath, error: error.message });
          spinner.fail(`Failed to re-encrypt ${path.basename(targetPath)}: ${error.message}`);
        }
      } else {
        skippedFiles.push(targetPath);
        spinner.info(`Skipped ${path.basename(targetPath)} (not encrypted)`);
      }
    } else if (stats.isDirectory()) {
      // Directory re-encryption - find all encrypted files recursively
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
        spinner.info('No files to re-encrypt');
      } else if (!dryRun) {
        // Create progress bar
        const progressBar = new cliProgress.SingleBar({
          format: `Re-encrypting files |${chalk.cyan('{bar}')}| {percentage}% | {value}/{total} files | {file}`,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        }, cliProgress.Presets.shades_classic);
        
        progressBar.start(files.length, 0, { file: 'Starting...' });
        
        // Re-encrypt each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileName = path.basename(file);
          
          progressBar.update(i, { file: fileName });
          
          try {
            await rekeyFile(file, oldDerivedKey, newDerivedKey, dryRun);
            rekeyedFiles.push(file);
          } catch (error) {
            failedFiles.push({ path: file, error: error.message });
            console.error(chalk.red(`\nFailed to re-encrypt ${fileName}: ${error.message}`));
          }
        }
        
        progressBar.update(files.length, { file: 'Complete!' });
        progressBar.stop();
      } else {
        // Just collect files for dry run
        for (const file of files) {
          rekeyedFiles.push(file);
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
      files: rekeyedFiles,
      skipped: skippedFiles,
      failed: failedFiles
    };
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Re-encrypts a single file with a new key
 * 
 * @param {string} filePath - Path to file to re-encrypt
 * @param {Buffer} oldKey - Old derived encryption key
 * @param {Buffer} newKey - New derived encryption key
 * @param {boolean} dryRun - If true, don't actually re-encrypt
 */
async function rekeyFile(filePath, oldKey, newKey, dryRun) {
  if (dryRun) return;
  
  // Read encrypted file content
  const encryptedContent = await fs.readFile(filePath);
  
  try {
    // Decrypt with old key
    const decryptedContent = decryptBuffer(encryptedContent, oldKey);
    
    // Re-encrypt with new key
    const reEncryptedContent = encryptBuffer(decryptedContent, newKey);
    
    // Create a temporary file for the re-encrypted content
    const tempFilePath = `${filePath}.temp`;
    await fs.writeFile(tempFilePath, reEncryptedContent);
    
    // Replace the original file with the re-encrypted one
    await fs.remove(filePath);
    await fs.move(tempFilePath, filePath);
  } catch (error) {
    throw new Error(`Failed to re-encrypt: ${error.message}`);
  }
}

module.exports = rekey;
