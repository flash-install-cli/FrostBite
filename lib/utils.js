const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');

// Constants
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;
const ENCRYPTED_EXTENSION = '.fbz';
const IGNORE_FILE = '.frostbiteignore';

// Promisify crypto functions
const pbkdf2 = promisify(crypto.pbkdf2);

/**
 * Derives an encryption/decryption key from a password and optional license
 * 
 * @param {string} password - User provided password
 * @param {string} [license] - Optional license key
 * @returns {Promise<Buffer>} - Derived key
 */
async function deriveKey(password, license = '') {
  // If license is provided, combine it with the password
  const combinedKey = license ? `${password}:${license}` : password;
  
  // Create a deterministic salt based on the combined key
  // This ensures the same key is derived for the same password+license
  const salt = crypto.createHash('sha256')
    .update(combinedKey)
    .digest()
    .slice(0, SALT_LENGTH);
  
  // Derive key using PBKDF2
  return pbkdf2(combinedKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts a buffer using AES-256-GCM
 * 
 * @param {Buffer} buffer - Data to encrypt
 * @param {Buffer} key - Encryption key
 * @returns {Buffer} - Encrypted data with metadata
 */
function encryptBuffer(buffer, key) {
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt data
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Combine IV, auth tag, and encrypted data
  return Buffer.concat([
    iv,
    authTag,
    encrypted
  ]);
}

/**
 * Decrypts a buffer using AES-256-GCM
 * 
 * @param {Buffer} buffer - Encrypted data with metadata
 * @param {Buffer} key - Decryption key
 * @returns {Buffer} - Decrypted data
 */
function decryptBuffer(buffer, key) {
  // Extract IV, auth tag, and encrypted data
  const iv = buffer.slice(0, IV_LENGTH);
  const authTag = buffer.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.slice(IV_LENGTH + AUTH_TAG_LENGTH);
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt data
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
}

/**
 * Gets ignore patterns from .frostbiteignore file
 * 
 * @param {string} directory - Directory to search for ignore file
 * @returns {Promise<string[]>} - Array of ignore patterns
 */
async function getIgnorePatterns(directory) {
  const ignoreFile = path.join(directory, IGNORE_FILE);
  
  try {
    // Check if ignore file exists
    const exists = await fs.pathExists(ignoreFile);
    if (!exists) {
      return getDefaultIgnorePatterns();
    }
    
    // Read and parse ignore file
    const content = await fs.readFile(ignoreFile, 'utf8');
    const patterns = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    return [...getDefaultIgnorePatterns(), ...patterns];
  } catch (error) {
    return getDefaultIgnorePatterns();
  }
}

/**
 * Gets default ignore patterns
 * 
 * @returns {string[]} - Array of default ignore patterns
 */
function getDefaultIgnorePatterns() {
  return [
    'node_modules/**',
    '.git/**',
    '**/*.fbz',
    '.frostbiteignore'
  ];
}

/**
 * Checks if a file should be ignored
 * 
 * @param {string} filePath - Path to check
 * @param {string[]} patterns - Ignore patterns
 * @returns {boolean} - True if file should be ignored
 */
function isIgnored(filePath, patterns) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  for (const pattern of patterns) {
    // Simple glob matching
    if (pattern.endsWith('/**')) {
      const dir = pattern.slice(0, -3);
      if (relativePath.startsWith(dir)) {
        return true;
      }
    } else if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(relativePath)) {
        return true;
      }
    } else if (relativePath === pattern || relativePath.startsWith(pattern + '/')) {
      return true;
    }
  }
  
  return false;
}

module.exports = {
  deriveKey,
  encryptBuffer,
  decryptBuffer,
  getIgnorePatterns,
  isIgnored,
  ENCRYPTED_EXTENSION
};
