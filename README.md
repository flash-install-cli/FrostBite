# Frostbite

<p align="center">
  <img src="assets/frostbite-logo-256.png" alt="Frostbite Logo" width="128">
</p>

<p align="center">
  <strong>Selective file encryption for your sensitive code and assets</strong>
</p>

<p align="center">
  <a href="https://github.com/flash-install-cli/FrostBite/actions"><img src="https://github.com/flash-install-cli/FrostBite/workflows/Tests/badge.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/frostbite"><img src="https://img.shields.io/npm/v/frostbite.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/frostbite"><img src="https://img.shields.io/npm/dm/frostbite.svg" alt="Downloads"></a>
  <a href="https://github.com/flash-install-cli/FrostBite/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/frostbite.svg" alt="License"></a>
</p>

Frostbite is a powerful file encryption utility that selectively encrypts and decrypts files or folders in a project to protect sensitive code or assets.

## Features

- Strong AES-256-GCM encryption
- Secure key derivation using PBKDF2 with salt
- Encrypt/decrypt individual files or entire directories
- Ignore specific files/patterns using `.frostbiteignore`
- License key binding for additional security
- Environment variable key support
- Dry run mode to preview changes
- Both CLI and programmatic API
- Beautiful progress bars and visual feedback
- Key rotation support
- Detailed error reporting
- Live project support with runtime API
- File watching for automatic encryption/decryption
- Memory-only decryption for sensitive data

## Installation

```bash
# Install globally
npm install -g frostbite

# Or install as a project dependency
npm install --save frostbite
```

## CLI Usage

### Encrypt files or directories

```bash
# Basic usage
frostbite lock path/to/file.js

# Encrypt a directory
frostbite lock path/to/directory

# Provide key directly
frostbite lock path/to/file.js --key mySecretKey

# Use environment variable for key
export FROST_KEY=mySecretKey
frostbite lock path/to/file.js --env FROST_KEY

# Add license key binding
frostbite lock path/to/file.js --license my-license-key

# Preview what would be encrypted
frostbite lock path/to/directory --dry-run
```

### Decrypt files or directories

```bash
# Basic usage
frostbite unlock path/to/file.js.fbz

# Decrypt a directory
frostbite unlock path/to/directory

# Provide key directly
frostbite unlock path/to/file.js.fbz --key mySecretKey

# Use environment variable for key
export FROST_KEY=mySecretKey
frostbite unlock path/to/file.js.fbz --env FROST_KEY

# With license key binding
frostbite unlock path/to/file.js.fbz --license my-license-key

# Preview what would be decrypted
frostbite unlock path/to/directory --dry-run
```

### Re-encrypt files with a new key (key rotation)

```bash
# Basic usage
frostbite rekey path/to/file.js.fbz

# Re-encrypt a directory
frostbite rekey path/to/directory

# Provide keys directly
frostbite rekey path/to/file.js.fbz --old-key oldSecret --new-key newSecret

# Use environment variables for keys
export OLD_KEY=oldSecret
export NEW_KEY=newSecret
frostbite rekey path/to/file.js.fbz --old-env OLD_KEY --new-env NEW_KEY

# With license key binding
frostbite rekey path/to/file.js.fbz --old-key oldSecret --new-key newSecret --old-license old-license --new-license new-license

# Preview what would be re-encrypted
frostbite rekey path/to/directory --dry-run
```

### Watch files for changes (live project mode)

```bash
# Basic usage - automatically decrypt files when they change
frostbite watch path/to/directory

# Watch with auto-encryption (both ways)
frostbite watch path/to/directory --auto-encrypt

# Provide key directly
frostbite watch path/to/directory --key mySecretKey

# Use environment variable for key
export FROST_KEY=mySecretKey
frostbite watch path/to/directory --env FROST_KEY
```

## Programmatic API

```javascript
const frostbite = require('frostbite');

// Encrypt a file or directory
async function encryptExample() {
  try {
    const result = await frostbite.encrypt('path/to/sensitive', {
      key: 'mySecretKey',
      license: 'optional-license',
      dryRun: false
    });

    console.log(`Encrypted ${result.files.length} files`);
  } catch (error) {
    console.error('Encryption failed:', error);
  }
}

// Decrypt a file or directory
async function decryptExample() {
  try {
    const result = await frostbite.decrypt('path/to/sensitive', {
      key: 'mySecretKey',
      license: 'optional-license',
      dryRun: false
    });

    console.log(`Decrypted ${result.files.length} files`);
  } catch (error) {
    console.error('Decryption failed:', error);
  }
}

// Encrypt raw data
async function encryptDataExample() {
  const data = Buffer.from('sensitive data');
  const encrypted = await frostbite.encryptData(data, 'mySecretKey', 'optional-license');
  console.log('Encrypted data:', encrypted.toString('hex'));
}

// Decrypt raw data
async function decryptDataExample() {
  try {
    const decrypted = await frostbite.decryptData(encryptedBuffer, 'mySecretKey', 'optional-license');
    console.log('Decrypted data:', decrypted.toString());
  } catch (error) {
    console.error('Decryption failed:', error);
  }
}

// Re-encrypt files with a new key (key rotation)
async function rekeyExample() {
  try {
    const result = await frostbite.rekey('path/to/sensitive', {
      oldKey: 'oldSecretKey',
      newKey: 'newSecretKey',
      oldLicense: 'old-optional-license',
      newLicense: 'new-optional-license',
      dryRun: false
    });

    console.log(`Re-encrypted ${result.files.length} files`);

    if (result.failed && result.failed.length > 0) {
      console.error(`Failed to re-encrypt ${result.failed.length} files`);
    }
  } catch (error) {
    console.error('Re-encryption failed:', error);
  }
}

// Re-encrypt raw data with a new key
async function rekeyDataExample() {
  try {
    const reEncrypted = await frostbite.rekeyData(
      encryptedBuffer,
      'oldSecretKey',
      'newSecretKey',
      'old-optional-license',
      'new-optional-license'
    );
    console.log('Data re-encrypted with new key');
  } catch (error) {
    console.error('Re-encryption failed:', error);
  }
}

// Runtime API for live projects
async function runtimeExample() {
  // Create a runtime instance
  const runtime = frostbite.createRuntime({
    key: process.env.FROSTBITE_KEY,
    license: process.env.FROSTBITE_LICENSE
  });

  // Initialize the runtime
  await runtime.initialize();

  try {
    // Decrypt a file without writing to disk (memory-only)
    const configContent = await runtime.decryptFile('./config/secrets.json.fbz', {
      encoding: 'utf8'  // Optional encoding for string output
    });

    // Parse JSON directly
    const config = await runtime.requireJSON('./config/database.json.fbz');
    console.log(`Connected to database: ${config.databaseUrl}`);

    // Watch files for changes
    await runtime.watch('./config', {
      autoEncrypt: true,  // Encrypt files when they change
      autoDecrypt: true,  // Decrypt files when they change
      onChange: (action, filePath, content) => {
        console.log(`File ${filePath} was ${action}ed`);
      }
    });

    // Later, clean up resources
    await runtime.close();
  } catch (error) {
    console.error('Runtime error:', error);
  }
}
```

## .frostbiteignore

Create a `.frostbiteignore` file in your project to specify patterns to ignore:

```
# Ignore node_modules
node_modules/**

# Ignore git files
.git/**

# Ignore specific files
config.dev.js
*.test.js

# Ignore build directory
dist/**
```

## Examples

Check out the [examples directory](examples/) for more usage examples:

- [Live Project Integration](examples/live-project/): Example of using Frostbite in a live Node.js application

## Documentation

For more detailed documentation, visit our [GitHub Pages site](https://flash-install-cli.github.io/FrostBite/).

## Security Notes

- Store your encryption keys securely
- For production use, consider using environment variables instead of hardcoded keys
- License keys add an extra layer of security but are not a replacement for strong passwords
- Encrypted files use the `.fbz` extension and are not readable without decryption

## License

MIT
