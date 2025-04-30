const encrypt = require('./lib/encrypt');
const decrypt = require('./lib/decrypt');
const rekey = require('./lib/rekey');
const FrostbiteRuntime = require('./lib/runtime');
const {
  deriveKey,
  encryptBuffer,
  decryptBuffer,
  ENCRYPTED_EXTENSION
} = require('./lib/utils');

/**
 * FrostBite - File encryption utility
 *
 * @module frostbite
 */
module.exports = {
  /**
   * Encrypt a file or directory
   *
   * @param {string} targetPath - Path to file or directory to encrypt
   * @param {Object} options - Encryption options
   * @param {string} options.key - Encryption key
   * @param {string} [options.license] - Optional license key
   * @param {boolean} [options.dryRun=false] - If true, don't actually encrypt
   * @returns {Promise<Object>} - Result object with encrypted files
   */
  encrypt,

  /**
   * Decrypt a file or directory
   *
   * @param {string} targetPath - Path to file or directory to decrypt
   * @param {Object} options - Decryption options
   * @param {string} options.key - Decryption key
   * @param {string} [options.license] - Optional license key
   * @param {boolean} [options.dryRun=false] - If true, don't actually decrypt
   * @returns {Promise<Object>} - Result object with decrypted files
   */
  decrypt,

  /**
   * Re-encrypt files with a new key
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
  rekey,

  /**
   * Encrypt a buffer
   *
   * @param {Buffer} buffer - Data to encrypt
   * @param {string} key - Encryption key
   * @param {string} [license] - Optional license key
   * @returns {Promise<Buffer>} - Encrypted data
   */
  async encryptData(buffer, key, license) {
    const derivedKey = await deriveKey(key, license);
    return encryptBuffer(buffer, derivedKey);
  },

  /**
   * Decrypt a buffer
   *
   * @param {Buffer} buffer - Encrypted data
   * @param {string} key - Decryption key
   * @param {string} [license] - Optional license key
   * @returns {Promise<Buffer>} - Decrypted data
   */
  async decryptData(buffer, key, license) {
    const derivedKey = await deriveKey(key, license);
    return decryptBuffer(buffer, derivedKey);
  },

  /**
   * Re-encrypt a buffer with a new key
   *
   * @param {Buffer} buffer - Encrypted data
   * @param {string} oldKey - Old encryption key
   * @param {string} newKey - New encryption key
   * @param {string} [oldLicense] - Old license key
   * @param {string} [newLicense] - New license key
   * @returns {Promise<Buffer>} - Re-encrypted data
   */
  async rekeyData(buffer, oldKey, newKey, oldLicense, newLicense) {
    const oldDerivedKey = await deriveKey(oldKey, oldLicense);
    const newDerivedKey = await deriveKey(newKey, newLicense);
    const decrypted = decryptBuffer(buffer, oldDerivedKey);
    return encryptBuffer(decrypted, newDerivedKey);
  },

  /**
   * Derive an encryption key from a password and optional license
   *
   * @param {string} password - User provided password
   * @param {string} [license] - Optional license key
   * @returns {Promise<Buffer>} - Derived key
   */
  deriveKey,

  /**
   * File extension used for encrypted files
   */
  ENCRYPTED_EXTENSION,

  /**
   * Create a runtime instance for live project environments
   *
   * @param {Object} options - Runtime options
   * @param {string} options.key - Encryption/decryption key
   * @param {string} [options.license] - Optional license key
   * @returns {FrostbiteRuntime} - Runtime instance
   */
  createRuntime(options) {
    return new FrostbiteRuntime(options);
  }
};
