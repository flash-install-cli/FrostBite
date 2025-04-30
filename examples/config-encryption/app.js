const frostbite = require('../../index');

// Create a runtime instance
const runtime = frostbite.createRuntime({
  key: process.env.FROSTBITE_KEY || 'example-key-123'
});

async function main() {
  try {
    // Initialize the runtime
    await runtime.initialize();
    
    console.log('Loading configuration...');
    
    // Load configuration (will be decrypted if needed)
    const config = await runtime.requireJSON('./config.json');
    
    console.log('Configuration loaded successfully!');
    console.log('-----------------------------------');
    console.log(`Database URL: ${config.databaseUrl}`);
    console.log(`Features enabled: ${Object.keys(config.features).filter(f => config.features[f]).join(', ')}`);
    
    // Don't show sensitive data in logs
    console.log('API Key: ********');
    console.log('JWT Secret: ********');
    console.log('Admin Credentials: ********');
    
    // Clean up resources
    await runtime.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
