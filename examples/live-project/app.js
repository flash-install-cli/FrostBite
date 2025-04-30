const express = require('express');
const path = require('path');
const frostbite = require('../../index');

// Create a simple Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create a runtime instance
const runtime = frostbite.createRuntime({
  key: process.env.FROSTBITE_KEY || 'example-key-123'
});

// Initialize the app
async function initializeApp() {
  console.log('Initializing application...');
  
  // Initialize the runtime
  await runtime.initialize();
  
  // Set up middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Load configuration from encrypted file
  const configPath = path.join(__dirname, 'config.json');
  let config;
  
  try {
    // Try to load config (will be decrypted if needed)
    config = await runtime.requireJSON(configPath);
    console.log('Configuration loaded successfully');
  } catch (error) {
    console.error('Failed to load configuration:', error.message);
    // Use default configuration
    config = {
      apiKey: 'default-api-key',
      databaseUrl: 'mongodb://localhost:27017/default',
      features: {
        enableAuth: true,
        enableLogging: true
      }
    };
    console.log('Using default configuration');
  }
  
  // Set up routes
  app.get('/', (req, res) => {
    res.send(`
      <h1>FrostBite Live Project Example</h1>
      <p>This is a demonstration of using FrostBite in a live project.</p>
      <p>Current configuration:</p>
      <pre>${JSON.stringify(config, null, 2)}</pre>
    `);
  });
  
  app.get('/api/config', (req, res) => {
    // Only return non-sensitive parts of the config
    const safeConfig = {
      features: config.features
    };
    res.json(safeConfig);
  });
  
  // Start watching the config file for changes
  await runtime.watch(__dirname, {
    autoDecrypt: true,
    onChange: async (action, filePath) => {
      if (filePath.includes('config.json') && action === 'decrypt') {
        try {
          // Reload configuration
          config = await runtime.requireJSON(configPath, { cache: false });
          console.log('Configuration reloaded after change');
        } catch (error) {
          console.error('Failed to reload configuration:', error.message);
        }
      }
    }
  });
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await runtime.close();
    process.exit(0);
  });
}

// Start the application
initializeApp().catch(error => {
  console.error('Failed to initialize application:', error);
  process.exit(1);
});
