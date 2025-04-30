# Config Encryption Example

This example demonstrates how to use Frostbite to encrypt configuration files in your project.

## Files

- `config.json` - Example configuration file with sensitive data
- `app.js` - Example application that uses the encrypted configuration
- `encrypt.js` - Script to encrypt the configuration
- `decrypt.js` - Script to decrypt the configuration

## Usage

### 1. Install dependencies

```bash
npm install
```

### 2. Encrypt the configuration

```bash
node encrypt.js
```

### 3. Run the application

```bash
node app.js
```

### 4. Decrypt the configuration (if needed)

```bash
node decrypt.js
```

## How It Works

The application uses Frostbite's runtime API to decrypt the configuration file in memory without writing the decrypted content to disk. This keeps your sensitive data secure while still allowing your application to access it.
