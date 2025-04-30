const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const frostbite = require('../index');

// Test directory
const TEST_DIR = path.join(__dirname, 'runtime-test-files');
const TEST_FILE = path.join(TEST_DIR, 'config.json');
const TEST_CONTENT = JSON.stringify({
  apiKey: 'test-api-key-123',
  databaseUrl: 'postgres://user:password@localhost:5432/testdb',
  secretToken: 'super-secret-token'
}, null, 2);
const TEST_KEY = 'test-runtime-key';

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

// Test runtime functionality
async function testRuntime() {
  console.log('Testing runtime functionality...');
  
  try {
    // Create runtime instance
    const runtime = frostbite.createRuntime({ key: TEST_KEY });
    await runtime.initialize();
    
    // Encrypt the test file
    await frostbite.encrypt(TEST_FILE, { key: TEST_KEY });
    
    // Verify original file is gone and encrypted file exists
    const encryptedFile = `${TEST_FILE}${frostbite.ENCRYPTED_EXTENSION}`;
    assert(!(await fs.pathExists(TEST_FILE)), 'Original file should be removed');
    assert(await fs.pathExists(encryptedFile), 'Encrypted file should exist');
    
    // Test memory-only decryption
    const decryptedContent = await runtime.decryptFile(TEST_FILE, { encoding: 'utf8' });
    assert.strictEqual(decryptedContent, TEST_CONTENT, 'Decrypted content should match original');
    
    // Verify the original file was not recreated
    assert(!(await fs.pathExists(TEST_FILE)), 'Original file should not be recreated');
    
    // Test JSON parsing
    const jsonContent = await runtime.requireJSON(TEST_FILE);
    assert.strictEqual(jsonContent.apiKey, 'test-api-key-123', 'JSON content should be parsed correctly');
    
    // Test caching
    const cachedContent = await runtime.decryptFile(TEST_FILE, { encoding: 'utf8' });
    assert.strictEqual(cachedContent, TEST_CONTENT, 'Cached content should match original');
    
    // Clean up
    await runtime.close();
    
    console.log('✓ Runtime functionality test passed');
    return true;
  } catch (error) {
    console.error('✗ Runtime functionality test failed:', error);
    return false;
  }
}

// Test file watching
async function testWatching() {
  console.log('Testing file watching functionality...');
  
  try {
    // Create runtime instance
    const runtime = frostbite.createRuntime({ key: TEST_KEY });
    await runtime.initialize();
    
    // Create a new test file
    const watchFile = path.join(TEST_DIR, 'watch-test.json');
    const watchContent = JSON.stringify({ test: 'initial value' }, null, 2);
    await fs.writeFile(watchFile, watchContent);
    
    // Set up a promise to track changes
    let changeDetected = false;
    const changePromise = new Promise(resolve => {
      // Start watching
      runtime.watch(TEST_DIR, {
        autoEncrypt: true,
        autoDecrypt: true,
        onChange: (action, filePath, content) => {
          if (action === 'encrypt' && filePath.includes('watch-test.json')) {
            changeDetected = true;
            resolve();
          }
        }
      });
    });
    
    // Wait a moment for the watcher to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Modify the file to trigger the watcher
    const updatedContent = JSON.stringify({ test: 'updated value' }, null, 2);
    await fs.writeFile(watchFile, updatedContent);
    
    // Wait for the change to be detected (with timeout)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout waiting for file change')), 5000)
    );
    
    await Promise.race([changePromise, timeoutPromise]);
    
    // Verify the encrypted file was created
    const encryptedFile = `${watchFile}${frostbite.ENCRYPTED_EXTENSION}`;
    assert(await fs.pathExists(encryptedFile), 'Encrypted file should be created');
    assert(changeDetected, 'Change should be detected');
    
    // Clean up
    await runtime.close();
    
    console.log('✓ File watching test passed');
    return true;
  } catch (error) {
    console.error('✗ File watching test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  try {
    await setup();
    const runtimeResult = await testRuntime();
    
    await setup();
    const watchingResult = await testWatching();
    
    if (runtimeResult && watchingResult) {
      console.log('\n✅ All runtime tests passed!');
    } else {
      console.error('\n❌ Some runtime tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Tests failed with error:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
