const frostbite = require('../../index');

// Encryption key
const key = process.env.FROSTBITE_KEY || 'example-key-123';

async function encryptConfig() {
  try {
    console.log('Encrypting configuration...');
    
    // Encrypt the configuration file
    const result = await frostbite.encrypt('./config.json', {
      key,
      dryRun: false
    });
    
    console.log(`Successfully encrypted ${result.files.length} files`);
    console.log('You can now safely commit the encrypted files to your repository');
  } catch (error) {
    console.error('Encryption failed:', error.message);
    process.exit(1);
  }
}

encryptConfig();
