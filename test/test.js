const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const frostbite = require('../index');

// Test directory
const TEST_DIR = path.join(__dirname, 'test-files');
const TEST_FILE = path.join(TEST_DIR, 'test-file.txt');
const TEST_CONTENT = 'This is a test file with sensitive information.';
const TEST_KEY = 'test-password-123';
const TEST_LICENSE = 'test-license-456';

// Clean up test directory
async function cleanup() {
  await fs.remove(TEST_DIR);
}

// Setup test environment
async function setup() {
  await cleanup();
  await fs.ensureDir(TEST_DIR);
  await fs.writeFile(TEST_FILE, TEST_CONTENT);
}

// Test buffer encryption/decryption
async function testBufferEncryption() {
  console.log('Testing buffer encryption/decryption...');

  const originalData = Buffer.from(TEST_CONTENT);

  // Encrypt data
  const encryptedData = await frostbite.encryptData(originalData, TEST_KEY, TEST_LICENSE);

  // Verify encrypted data is different
  assert(Buffer.compare(originalData, encryptedData) !== 0, 'Encrypted data should be different from original');

  // Decrypt data
  const decryptedData = await frostbite.decryptData(encryptedData, TEST_KEY, TEST_LICENSE);

  // Verify decrypted data matches original
  assert(Buffer.compare(originalData, decryptedData) === 0, 'Decrypted data should match original');
  assert(decryptedData.toString() === TEST_CONTENT, 'Decrypted content should match original');

  console.log('✓ Buffer encryption/decryption test passed');
}

// Test file encryption/decryption
async function testFileEncryption() {
  console.log('Testing file encryption/decryption...');

  // Encrypt file
  await frostbite.encrypt(TEST_FILE, {
    key: TEST_KEY,
    license: TEST_LICENSE
  });

  // Verify original file is gone and encrypted file exists
  const encryptedFile = `${TEST_FILE}${frostbite.ENCRYPTED_EXTENSION}`;
  assert(!(await fs.pathExists(TEST_FILE)), 'Original file should be removed');
  assert(await fs.pathExists(encryptedFile), 'Encrypted file should exist');

  // Decrypt file
  await frostbite.decrypt(encryptedFile, {
    key: TEST_KEY,
    license: TEST_LICENSE
  });

  // Verify encrypted file is gone and original file is restored
  assert(!(await fs.pathExists(encryptedFile)), 'Encrypted file should be removed');
  assert(await fs.pathExists(TEST_FILE), 'Original file should be restored');

  // Verify content is correct
  const content = await fs.readFile(TEST_FILE, 'utf8');
  assert(content === TEST_CONTENT, 'Decrypted content should match original');

  console.log('✓ File encryption/decryption test passed');
}

// Test directory encryption/decryption
async function testDirectoryEncryption() {
  console.log('Testing directory encryption/decryption...');

  // Create additional test files
  const subDir = path.join(TEST_DIR, 'subdir');
  await fs.ensureDir(subDir);
  await fs.writeFile(path.join(subDir, 'file1.txt'), 'File 1 content');
  await fs.writeFile(path.join(subDir, 'file2.txt'), 'File 2 content');

  // Encrypt directory
  await frostbite.encrypt(TEST_DIR, {
    key: TEST_KEY,
    license: TEST_LICENSE
  });

  // Verify original files are gone and encrypted files exist
  assert(!(await fs.pathExists(TEST_FILE)), 'Original file should be removed');
  assert(!(await fs.pathExists(path.join(subDir, 'file1.txt'))), 'Original file should be removed');
  assert(await fs.pathExists(`${TEST_FILE}${frostbite.ENCRYPTED_EXTENSION}`), 'Encrypted file should exist');
  assert(await fs.pathExists(`${path.join(subDir, 'file1.txt')}${frostbite.ENCRYPTED_EXTENSION}`), 'Encrypted file should exist');

  // Decrypt directory
  await frostbite.decrypt(TEST_DIR, {
    key: TEST_KEY,
    license: TEST_LICENSE
  });

  // Verify encrypted files are gone and original files are restored
  assert(await fs.pathExists(TEST_FILE), 'Original file should be restored');
  assert(await fs.pathExists(path.join(subDir, 'file1.txt')), 'Original file should be restored');
  assert(!(await fs.pathExists(`${TEST_FILE}${frostbite.ENCRYPTED_EXTENSION}`)), 'Encrypted file should be removed');

  console.log('✓ Directory encryption/decryption test passed');
}

// Test wrong key/license
async function testWrongKey() {
  console.log('Testing wrong key/license...');

  // Encrypt file
  await frostbite.encrypt(TEST_FILE, {
    key: TEST_KEY,
    license: TEST_LICENSE
  });

  // Try to decrypt with wrong key
  const encryptedFile = `${TEST_FILE}${frostbite.ENCRYPTED_EXTENSION}`;
  try {
    await frostbite.decrypt(encryptedFile, {
      key: 'wrong-key',
      license: TEST_LICENSE
    });
    assert(false, 'Decryption with wrong key should fail');
  } catch (error) {
    assert(error.message.includes('Failed to decrypt'), 'Error message should indicate decryption failure');
  }

  // Try to decrypt with wrong license
  try {
    await frostbite.decrypt(encryptedFile, {
      key: TEST_KEY,
      license: 'wrong-license'
    });
    assert(false, 'Decryption with wrong license should fail');
  } catch (error) {
    assert(error.message.includes('Failed to decrypt'), 'Error message should indicate decryption failure');
  }

  // Decrypt with correct key/license
  await frostbite.decrypt(encryptedFile, {
    key: TEST_KEY,
    license: TEST_LICENSE
  });

  console.log('✓ Wrong key/license test passed');
}

// Import runtime tests
const runtimeTests = require('./runtime-test');

// Run all tests
async function runTests() {
  try {
    await setup();
    await testBufferEncryption();
    await setup();
    await testFileEncryption();
    await setup();
    await testDirectoryEncryption();
    await setup();
    await testWrongKey();

    // Run runtime tests
    await runtimeTests.runTests();

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run tests
runTests();
