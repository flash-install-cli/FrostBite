const fs = require('fs');
const path = require('path');

// In a real application, this would be your server or application code
function startApplication() {
  try {
    // Load the decrypted configuration
    const configPath = path.join(__dirname, 'config/production.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('Application starting with configuration:');
    console.log('---------------------------------------');
    console.log(`Environment: ${config.environment}`);
    console.log(`API URL: ${config.apiUrl}`);
    console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    
    // Don't log sensitive information
    console.log('Database credentials: ********');
    console.log('API Key: ********');
    
    console.log('---------------------------------------');
    console.log('Application started successfully!');
  } catch (error) {
    console.error('Failed to start application:', error.message);
    process.exit(1);
  }
}

startApplication();
