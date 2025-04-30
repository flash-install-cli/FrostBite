const frostbite = require('../../index');

// Decryption key
const key = process.env.FROSTBITE_KEY || 'example-key-123';

async function decryptConfig() {
  try {
    console.log('Decrypting configuration...');
    
    // Decrypt the configuration file
    const result = await frostbite.decrypt('./config.json.fbz', {
      key,
      dryRun: false
    });
    
    console.log(`Successfully decrypted ${result.files.length} files`);
    console.log('WARNING: The decrypted files contain sensitive information');
    console.log('Do not commit the decrypted files to your repository');
  } catch (error) {
    console.error('Decryption failed:', error.message);
    process.exit(1);
  }
}

decryptConfig();
