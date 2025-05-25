# AnyAssist Update System Guide (AWS Server)

This guide explains how to publish updates for AnyAssist using your AWS server and how the update system works.

## Overview

AnyAssist uses Tauri's built-in updater system to provide seamless updates to users. The update system works by:

1. Checking for updates from your AWS server endpoint
2. Downloading the update if available
3. Installing the update and restarting the application

## AWS Server Setup

Before publishing updates, you need to set up your AWS server:

### 1. Run Server Setup Script

Upload and run the setup script on your AWS server:

```bash
# Upload the script to your server
scp scripts/setup-aws-server.sh user@your-server.com:~/

# SSH to your server and run the script
ssh user@your-server.com
sudo chmod +x setup-aws-server.sh
sudo ./setup-aws-server.sh
```

### 2. Configure Domain and SSL

1. Replace `YOUR_DOMAIN.com` in the nginx config with your actual domain
2. Set up SSL certificate:

```bash
sudo certbot --nginx -d your-domain.com
```

### 3. Update Configuration Files

Update the following files with your AWS server details:

- `src-tauri/tauri.conf.json`: Replace `YOUR_AWS_DOMAIN.com` with your domain
- `scripts/deploy-to-aws.js`: Update the `AWS_CONFIG` object with your server details

## Publishing Updates

To publish a new update for AnyAssist, follow these steps:

### 1. Update Version Numbers

Make sure to update the version in:
- `package.json` (main version)
- This will be synchronized with `src-tauri/tauri.conf.json` by the build script

### 2. Build the Application

Use the build script to compile the application for release:

```bash
# Create scripts directory if it doesn't exist
mkdir -p scripts

# Run the build script
node scripts/build-release.js
```

This script will:
- Ensure version consistency across files
- Build the application for your platform
- Generate a `latest.json` file in the `updater` directory

### 3. Sign the Update

The update needs to be cryptographically signed to ensure authenticity.

1. If you don't have minisign keys, generate them:

```bash
# Install minisign
# Windows (with Chocolatey): choco install minisign
# macOS (with Homebrew): brew install minisign
# Linux: apt install minisign

# Generate keys (do this only once, store the secret key safely)
minisign -G -s minisign.key -p minisign.pub
```

2. Sign the installer:

```bash
# Get the installer path from the build script output
minisign -S -s minisign.key -m path/to/installer
```

3. Update the signature in `latest.json`:
   - Copy the signature from the minisign output
   - Paste it into the `signature` field in `latest.json`

### 4. Deploy to AWS Server

Use the deployment script to upload files to your AWS server:

```bash
# Configure your AWS details in scripts/deploy-to-aws.js first
node scripts/deploy-to-aws.js
```

This will:
- Upload the installer to `/releases/v{version}/`
- Upload the signature file
- Upload `latest.json` to `/api/`
- Set proper file permissions

## Testing Updates

To test the update system locally:

1. Build a version of the app (e.g., v0.1.0)
2. Install it on your system
3. Increment the version (e.g., to v0.1.1)
4. Build the new version
5. Deploy to a test directory on your AWS server
6. Temporarily modify the endpoints in `tauri.conf.json` to point to your test directory
7. Run the application and check if it detects and installs the update

## Troubleshooting

Common issues:

### Update Not Detected

- Ensure the version in `latest.json` is higher than the installed version
- Check that the endpoint in `tauri.conf.json` is correctly configured
- Verify that `latest.json` is accessible from the endpoint URL

### Update Download Fails

- Check that the URL in `latest.json` is correct
- Ensure the installer file is available at the specified URL
- Verify that the signature in `latest.json` is valid

### Update Installation Fails

- Check for permissions issues
- On Windows, make sure the installer is an NSIS installer
- Verify that the updater configuration in `tauri.conf.json` is correct