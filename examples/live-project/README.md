# FrostBite Live Project Example

This example demonstrates how to use FrostBite in a live project environment.

## Features

- Express.js web server with runtime decryption of configuration
- Automatic reloading of configuration when files change
- Memory-only decryption (no decrypted files on disk)
- File watching for automatic updates

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Encrypt the configuration:
   ```
   npm run encrypt-config
   ```

3. Start the server:
   ```
   npm start
   ```

4. Visit http://localhost:3000 to see the application

## How It Works

1. The application uses FrostBite's runtime API to decrypt configuration files in memory
2. No decrypted files are written to disk, enhancing security
3. The application watches for changes to encrypted files and automatically reloads
4. When the application shuts down, resources are cleaned up properly

## Modifying the Configuration

1. Decrypt the configuration:
   ```
   npm run decrypt-config
   ```

2. Edit the `config.json` file

3. Re-encrypt the configuration:
   ```
   npm run encrypt-config
   ```

The application will automatically detect the change and reload the configuration.

## Environment Variables

- `PORT`: Port to run the server on (default: 3000)
- `FROSTBITE_KEY`: Encryption key (default: example-key-123)
