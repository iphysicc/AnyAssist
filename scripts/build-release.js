// Build release script for AnyAssist
// This script helps package the application for release with proper update artifacts

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { version } = require('../package.json');

// Colored console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}Building AnyAssist v${version} for release${colors.reset}\n`);

// Step 1: Ensure version is consistent
console.log(`${colors.yellow}→ Checking version consistency${colors.reset}`);
const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));

if (tauriConfig.version !== version) {
  console.log(`${colors.red}Version mismatch detected!${colors.reset}`);
  console.log(`  Package.json: ${version}`);
  console.log(`  tauri.conf.json: ${tauriConfig.version}`);

  // Update tauri.conf.json to match package.json
  console.log(`${colors.yellow}Updating tauri.conf.json version to ${version}${colors.reset}`);
  tauriConfig.version = version;
  fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2));
}

// Step 2: Run build
console.log(`\n${colors.yellow}→ Building application${colors.reset}`);
try {
  console.log('Running: pnpm tauri build');
  execSync('pnpm tauri build', { stdio: 'inherit' });
  console.log(`${colors.green}Build completed successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Build failed:${colors.reset}`, error);
  process.exit(1);
}

// Step 3: Generate latest.json
console.log(`\n${colors.yellow}→ Generating update artifacts${colors.reset}`);

const platforms = {
  windows: {
    extension: 'nsis',
    target: 'x86_64-pc-windows-msvc'
  },
  macos: {
    extension: 'dmg',
    target: 'x86_64-apple-darwin'
  },
  linux: {
    extension: 'AppImage',
    target: 'x86_64-unknown-linux-gnu'
  }
};

// Auto-detect platform
let platform;
if (process.platform === 'win32') platform = platforms.windows;
else if (process.platform === 'darwin') platform = platforms.macos;
else if (process.platform === 'linux') platform = platforms.linux;
else {
  console.error(`${colors.red}Unsupported platform: ${process.platform}${colors.reset}`);
  process.exit(1);
}

// Create latest.json
const artifactsDir = path.join(__dirname, `../src-tauri/target/release/bundle/${platform.extension}`);
const installerFileName = fs.readdirSync(artifactsDir)
  .find(file => file.endsWith(`.${platform.extension}`));

if (!installerFileName) {
  console.error(`${colors.red}Installer not found in ${artifactsDir}${colors.reset}`);
  process.exit(1);
}

// Path where this will be uploaded on Express server
const releaseDirName = `anyassist_${version}_${platform.target}`;
const downloadUrl = `https://anyassist.anysola.com/releases/v${version}/${installerFileName}`;

const latestJson = {
  version,
  notes: `AnyAssist v${version} release`,
  pub_date: new Date().toISOString(),
  platforms: {
    [platform.target]: {
      signature: "", // Will need to be filled with minisign signature
      url: downloadUrl
    }
  }
};

const updaterDir = path.join(__dirname, '../updater');
if (!fs.existsSync(updaterDir)) {
  fs.mkdirSync(updaterDir, { recursive: true });
}

const latestJsonPath = path.join(updaterDir, 'latest.json');
fs.writeFileSync(latestJsonPath, JSON.stringify(latestJson, null, 2));

console.log(`${colors.green}Generated ${latestJsonPath}${colors.reset}`);
console.log(`\n${colors.bright}${colors.blue}Release build completed${colors.reset}`);
console.log(`\n${colors.yellow}NEXT STEPS:${colors.reset}`);
console.log(`1. Sign the installer using minisign:`);
console.log(`   minisign -S -s minisign.key -m "${installerPath}"`);
console.log(`2. Deploy to server:`);
console.log(`   npm run deploy-aws`);
console.log(`3. Test the update:`);
console.log(`   curl https://anyassist.anysola.com/api/latest`);