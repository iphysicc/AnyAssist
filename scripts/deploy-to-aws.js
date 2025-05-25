// AWS deployment script for AnyAssist updates
// This script deploys updates to your Express.js server via API

const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');

// Configuration - Update these with your server details
const SERVER_CONFIG = {
  apiUrl: 'https://anyassist.anysola.com', // Your Cloudflare domain
  uploadEndpoint: '/api/upload', // Express server upload endpoint
  // Optional: Add authentication if needed
  // apiKey: 'your-api-key'
};

// Colored console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}Deploying AnyAssist v${version} to Express Server${colors.reset}\n`);

// Check if files exist
const updaterDir = path.join(__dirname, '../updater');
const latestJsonPath = path.join(updaterDir, 'latest.json');

if (!fs.existsSync(latestJsonPath)) {
  console.error(`${colors.red}latest.json not found. Run build-release.js first.${colors.reset}`);
  process.exit(1);
}

// Auto-detect platform and find installer
const platforms = {
  windows: { extension: 'nsis' },
  macos: { extension: 'dmg' },
  linux: { extension: 'AppImage' }
};

let platform;
if (process.platform === 'win32') platform = platforms.windows;
else if (process.platform === 'darwin') platform = platforms.macos;
else if (process.platform === 'linux') platform = platforms.linux;
else {
  console.error(`${colors.red}Unsupported platform: ${process.platform}${colors.reset}`);
  process.exit(1);
}

const artifactsDir = path.join(__dirname, `../src-tauri/target/release/bundle/${platform.extension}`);
const installerFileName = fs.readdirSync(artifactsDir)
  .find(file => file.endsWith(`.${platform.extension}`));

if (!installerFileName) {
  console.error(`${colors.red}Installer not found in ${artifactsDir}${colors.reset}`);
  process.exit(1);
}

const installerPath = path.join(artifactsDir, installerFileName);
const signaturePath = `${installerPath}.sig`;

if (!fs.existsSync(signaturePath)) {
  console.error(`${colors.red}Signature file not found: ${signaturePath}${colors.reset}`);
  console.log(`${colors.yellow}Please sign the installer first using minisign${colors.reset}`);
  process.exit(1);
}

// Deploy functions
async function uploadToServer() {
  console.log(`${colors.yellow}→ Uploading files to Express server${colors.reset}`);

  try {
    // Create form data
    const FormData = (await import('form-data')).default;
    const form = new FormData();

    // Add installer file
    console.log(`Adding installer: ${installerFileName}`);
    form.append('files', fs.createReadStream(installerPath), installerFileName);

    // Add signature file
    console.log(`Adding signature: ${installerFileName}.sig`);
    form.append('files', fs.createReadStream(signaturePath), `${installerFileName}.sig`);

    // Add metadata
    form.append('notes', `AnyAssist v${version} release`);
    form.append('pub_date', new Date().toISOString());

    // Upload via HTTP POST
    const uploadUrl = `${SERVER_CONFIG.apiUrl}${SERVER_CONFIG.uploadEndpoint}/${version}`;
    console.log(`Uploading to: ${uploadUrl}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        // Add API key if configured
        ...(SERVER_CONFIG.apiKey && { 'Authorization': `Bearer ${SERVER_CONFIG.apiKey}` })
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    console.log(`${colors.green}✓ Upload successful${colors.reset}`);
    return result;

  } catch (error) {
    console.error(`${colors.red}Upload failed:${colors.reset}`, error.message);
    throw error;
  }
}

// Main deployment process
(async () => {
  try {
    const result = await uploadToServer();

    console.log(`\n${colors.green}✓ Deployment completed successfully${colors.reset}`);
    console.log(`\n${colors.bright}Update URLs:${colors.reset}`);
    console.log(`API: ${SERVER_CONFIG.apiUrl}/api/latest`);
    console.log(`Installer: ${SERVER_CONFIG.apiUrl}/releases/v${version}/${installerFileName}`);
    console.log(`\n${colors.bright}Server Response:${colors.reset}`);
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error(`\n${colors.red}Deployment failed:${colors.reset}`, error.message);
    process.exit(1);
  }
})();
