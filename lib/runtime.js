const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');
const ora = require('ora');
const { 
  deriveKey, 
  encryptBuffer,
  decryptBuffer,
  ENCRYPTED_EXTENSION
} = require('./utils');

/**
 * FrostBite Runtime - Provides runtime decryption and file watching capabilities
 * for live project environments
 */
class FrostbiteRuntime {
  /**
   * Create a new FrostbiteRuntime instance
   * 
   * @param {Object} options - Runtime options
   * @param {string} options.key - Encryption/decryption key
   * @param {string} [options.license] - Optional license key
   */
  constructor(options = {}) {
    this.key = options.key;
    this.license = options.license;
    this.derivedKey = null;
    this.decryptedCache = new Map();
    this.watchers = new Map();
    
    if (!this.key) {
      throw new Error('Encryption key is required');
    }
  }
  
  /**
   * Initialize the runtime by deriving the key
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.derivedKey) {
      const spinner = ora('Initializing FrostBite runtime...').start();
      try {
        this.derivedKey = await deriveKey(this.key, this.license);
        spinner.succeed('FrostBite runtime initialized');
      } catch (error) {
        spinner.fail(`Failed to initialize FrostBite runtime: ${error.message}`);
        throw error;
      }
    }
    return this;
  }
  
  /**
   * Decrypt a file and return its contents without writing to disk
   * 
   * @param {string} filePath - Path to the encrypted file
   * @param {Object} [options] - Decryption options
   * @param {boolean} [options.cache=true] - Whether to cache the decrypted content
   * @param {string} [options.encoding] - Encoding to use for the decrypted content
   * @returns {Promise<Buffer|string>} - Decrypted content
   */
  async decryptFile(filePath, options = {}) {
    const { cache = true, encoding } = options;
    
    // Initialize if not already initialized
    if (!this.derivedKey) {
      await this.initialize();
    }
    
    // Check if we have a cached version
    const cacheKey = filePath;
    if (cache && this.decryptedCache.has(cacheKey)) {
      const cached = this.decryptedCache.get(cacheKey);
      return encoding ? cached.toString(encoding) : cached;
    }
    
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    let actualPath = resolvedPath;
    
    // If the path doesn't end with the encrypted extension, try to find the encrypted file
    if (!resolvedPath.endsWith(ENCRYPTED_EXTENSION)) {
      actualPath = `${resolvedPath}${ENCRYPTED_EXTENSION}`;
      
      // Check if the encrypted file exists
      if (!await fs.pathExists(actualPath)) {
        // If the original file exists, return its contents
        if (await fs.pathExists(resolvedPath)) {
          const content = await fs.readFile(resolvedPath);
          if (cache) {
            this.decryptedCache.set(cacheKey, content);
          }
          return encoding ? content.toString(encoding) : content;
        }
        throw new Error(`File not found: ${filePath} or ${actualPath}`);
      }
    } else if (!await fs.pathExists(actualPath)) {
      throw new Error(`File not found: ${actualPath}`);
    }
    
    try {
      // Read and decrypt the file
      const encryptedContent = await fs.readFile(actualPath);
      const decryptedContent = decryptBuffer(encryptedContent, this.derivedKey);
      
      // Cache the decrypted content if requested
      if (cache) {
        this.decryptedCache.set(cacheKey, decryptedContent);
      }
      
      return encoding ? decryptedContent.toString(encoding) : decryptedContent;
    } catch (error) {
      throw new Error(`Failed to decrypt ${filePath}: ${error.message}`);
    }
  }
  
  /**
   * Require a JSON file, decrypting it if necessary
   * 
   * @param {string} filePath - Path to the JSON file
   * @param {Object} [options] - Decryption options
   * @param {boolean} [options.cache=true] - Whether to cache the decrypted content
   * @returns {Promise<Object>} - Parsed JSON object
   */
  async requireJSON(filePath, options = {}) {
    const content = await this.decryptFile(filePath, { 
      ...options, 
      encoding: 'utf8' 
    });
    
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON from ${filePath}: ${error.message}`);
    }
  }
  
  /**
   * Watch a file or directory for changes and automatically encrypt/decrypt
   * 
   * @param {string} targetPath - Path to file or directory to watch
   * @param {Object} [options] - Watch options
   * @param {boolean} [options.autoDecrypt=true] - Automatically decrypt files when they change
   * @param {boolean} [options.autoEncrypt=false] - Automatically encrypt files when they change
   * @param {Function} [options.onChange] - Callback function when a file changes
   * @returns {Promise<Object>} - Watcher object
   */
  async watch(targetPath, options = {}) {
    const { 
      autoDecrypt = true, 
      autoEncrypt = false,
      onChange
    } = options;
    
    // Initialize if not already initialized
    if (!this.derivedKey) {
      await this.initialize();
    }
    
    // Resolve the target path
    const resolvedPath = path.resolve(targetPath);
    
    // Check if we're already watching this path
    if (this.watchers.has(resolvedPath)) {
      return this.watchers.get(resolvedPath);
    }
    
    // Create a watcher
    const watcher = chokidar.watch(resolvedPath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });
    
    // Set up event handlers
    watcher.on('add', async (filePath) => {
      try {
        // Handle new files
        if (filePath.endsWith(ENCRYPTED_EXTENSION) && autoDecrypt) {
          // New encrypted file - decrypt it
          const originalPath = filePath.slice(0, -ENCRYPTED_EXTENSION.length);
          const encryptedContent = await fs.readFile(filePath);
          const decryptedContent = decryptBuffer(encryptedContent, this.derivedKey);
          await fs.writeFile(originalPath, decryptedContent);
          console.log(chalk.green(`Decrypted: ${path.basename(filePath)}`));
          
          if (onChange) {
            onChange('decrypt', originalPath, decryptedContent);
          }
        } else if (!filePath.endsWith(ENCRYPTED_EXTENSION) && autoEncrypt) {
          // New unencrypted file - encrypt it
          const encryptedPath = `${filePath}${ENCRYPTED_EXTENSION}`;
          const fileContent = await fs.readFile(filePath);
          const encryptedContent = encryptBuffer(fileContent, this.derivedKey);
          await fs.writeFile(encryptedPath, encryptedContent);
          console.log(chalk.green(`Encrypted: ${path.basename(filePath)}`));
          
          if (onChange) {
            onChange('encrypt', encryptedPath, fileContent);
          }
        }
      } catch (error) {
        console.error(chalk.red(`Error processing ${filePath}: ${error.message}`));
      }
    });
    
    watcher.on('change', async (filePath) => {
      try {
        // Handle file changes
        if (filePath.endsWith(ENCRYPTED_EXTENSION) && autoDecrypt) {
          // Encrypted file changed - update decrypted version
          const originalPath = filePath.slice(0, -ENCRYPTED_EXTENSION.length);
          const encryptedContent = await fs.readFile(filePath);
          const decryptedContent = decryptBuffer(encryptedContent, this.derivedKey);
          await fs.writeFile(originalPath, decryptedContent);
          
          // Update cache
          this.decryptedCache.set(originalPath, decryptedContent);
          console.log(chalk.blue(`Updated decrypted: ${path.basename(filePath)}`));
          
          if (onChange) {
            onChange('decrypt', originalPath, decryptedContent);
          }
        } else if (!filePath.endsWith(ENCRYPTED_EXTENSION) && autoEncrypt) {
          // Unencrypted file changed - update encrypted version
          const encryptedPath = `${filePath}${ENCRYPTED_EXTENSION}`;
          const fileContent = await fs.readFile(filePath);
          const encryptedContent = encryptBuffer(fileContent, this.derivedKey);
          await fs.writeFile(encryptedPath, encryptedContent);
          console.log(chalk.blue(`Updated encrypted: ${path.basename(filePath)}`));
          
          if (onChange) {
            onChange('encrypt', encryptedPath, fileContent);
          }
        }
      } catch (error) {
        console.error(chalk.red(`Error processing ${filePath}: ${error.message}`));
      }
    });
    
    // Store the watcher
    this.watchers.set(resolvedPath, watcher);
    
    console.log(chalk.green(`Watching ${resolvedPath} for changes`));
    return watcher;
  }
  
  /**
   * Stop watching a file or directory
   * 
   * @param {string} targetPath - Path to stop watching
   * @returns {Promise<void>}
   */
  async unwatch(targetPath) {
    const resolvedPath = path.resolve(targetPath);
    
    if (this.watchers.has(resolvedPath)) {
      const watcher = this.watchers.get(resolvedPath);
      await watcher.close();
      this.watchers.delete(resolvedPath);
      console.log(chalk.yellow(`Stopped watching ${resolvedPath}`));
    }
  }
  
  /**
   * Clear the decrypted content cache
   */
  clearCache() {
    this.decryptedCache.clear();
  }
  
  /**
   * Close the runtime and clean up resources
   * 
   * @returns {Promise<void>}
   */
  async close() {
    // Close all watchers
    for (const [path, watcher] of this.watchers.entries()) {
      await watcher.close();
      console.log(chalk.yellow(`Stopped watching ${path}`));
    }
    
    this.watchers.clear();
    this.decryptedCache.clear();
    this.derivedKey = null;
  }
}

module.exports = FrostbiteRuntime;
