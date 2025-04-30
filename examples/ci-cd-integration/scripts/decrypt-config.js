const frostbite = require('../../../index');
const path = require('path');

// Get encryption key from environment variable
const key = process.env.FROSTBITE_KEY;

if (!key) {
  console.error('Error: FROSTBITE_KEY environment variable is not set');
  process.exit(1);
}

async function decryptConfig() {
  try {
    console.log('Decrypting configuration files...');
    
    // Path to the config directory
    const configDir = path.join(__dirname, '../config');
    
    // Decrypt all encrypted files in the config directory
    const result = await frostbite.decrypt(configDir, {
      key,
      dryRun: false
    });
    
    console.log(`Successfully decrypted ${result.files.length} configuration files`);
  } catch (error) {
    console.error('Decryption failed:', error.message);
    process.exit(1);
  }
}

decryptConfig();
