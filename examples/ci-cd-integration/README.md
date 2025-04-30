# CI/CD Integration Example

This example demonstrates how to integrate Frostbite into your CI/CD pipeline to securely manage encrypted files.

## Files

- `.github/workflows/deploy.yml` - Example GitHub Actions workflow
- `config/production.json.fbz` - Encrypted production configuration
- `scripts/decrypt-config.js` - Script to decrypt configuration during deployment
- `app.js` - Example application that uses the decrypted configuration

## How It Works

In a CI/CD pipeline, you often need to access sensitive configuration files during the build or deployment process. Frostbite allows you to:

1. Store encrypted configuration files in your repository
2. Decrypt them during the CI/CD process using environment variables
3. Use the decrypted configuration for your build or deployment
4. Clean up the decrypted files afterward

## GitHub Actions Example

The example workflow in `.github/workflows/deploy.yml` shows how to:

1. Check out your code
2. Set up Node.js
3. Install dependencies
4. Decrypt configuration files using a secret stored in GitHub
5. Build and deploy your application
6. Clean up decrypted files

## Usage

To use this example in your own project:

1. Store your encryption key as a secret in your GitHub repository settings
2. Adapt the workflow file to your project's needs
3. Encrypt your configuration files using Frostbite
4. Push the encrypted files to your repository

## Security Considerations

- Never commit decrypted configuration files to your repository
- Store encryption keys as secrets in your CI/CD platform
- Use different keys for different environments (development, staging, production)
- Rotate keys periodically for enhanced security
