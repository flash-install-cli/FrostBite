# Frostbite 1.0.0

🚀 First official release of Frostbite - a powerful Node.js utility for selective file encryption!

## Features

- **AES-256-GCM Encryption**: Industry-standard encryption for your sensitive files
- **Selective Encryption**: Encrypt only the files you need, leave the rest untouched
- **CLI Interface**: Easy-to-use command line interface with interactive prompts
- **Programmatic API**: Integrate encryption into your Node.js applications
- **Runtime API**: Work with encrypted files in live project environments
- **File Watching**: Automatically encrypt/decrypt files as they change
- **Key Rotation**: Easily update encryption keys without decrypting to disk
- **Custom File Icons**: Encrypted .fbz files have custom icons in file explorers
- **Automatic File Association**: File associations are set up during installation

## Installation

```bash
npm install -g frostbite
```

## Quick Start

```bash
# Encrypt a file
frostbite lock config.json --key your-secret-key

# Decrypt a file
frostbite unlock config.json.fbz --key your-secret-key
```

## Documentation

For complete documentation, visit our [GitHub Pages site](https://flash-install-cli.github.io/FrostBite/).

## Changelog

See the [CHANGELOG.md](https://github.com/flash-install-cli/FrostBite/blob/main/CHANGELOG.md) file for details on this release.
