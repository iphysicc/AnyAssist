import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Cloudflare
app.set('trust proxy', true);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Directories
const RELEASES_DIR = path.join(__dirname, 'releases');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure directories exist
[RELEASES_DIR, DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const version = req.params.version;
    const versionDir = path.join(RELEASES_DIR, `v${version}`);
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }
    cb(null, versionDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Helper functions
function getLatestVersion() {
  const dataFile = path.join(DATA_DIR, 'latest.json');
  if (fs.existsSync(dataFile)) {
    try {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (error) {
      console.error('Error reading latest.json:', error);
    }
  }
  return null;
}

function saveLatestVersion(data) {
  const dataFile = path.join(DATA_DIR, 'latest.json');
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function getAllVersions() {
  if (!fs.existsSync(RELEASES_DIR)) return [];

  return fs.readdirSync(RELEASES_DIR)
    .filter(dir => dir.startsWith('v'))
    .map(dir => dir.substring(1))
    .sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if (aPart !== bPart) return bPart - aPart;
      }
      return 0;
    });
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'AnyAssist Update Server'
  });
});

// Get latest version info (Tauri updater endpoint)
app.get('/api/latest', (req, res) => {
  const latest = getLatestVersion();

  if (!latest) {
    return res.status(404).json({
      error: 'No updates available'
    });
  }

  // Return in Tauri updater format
  res.json(latest);
});

// Get all versions
app.get('/api/versions', (req, res) => {
  const versions = getAllVersions();
  res.json({ versions });
});

// Get specific version info
app.get('/api/version/:version', (req, res) => {
  const { version } = req.params;
  const versionDir = path.join(RELEASES_DIR, `v${version}`);

  if (!fs.existsSync(versionDir)) {
    return res.status(404).json({ error: 'Version not found' });
  }

  const files = fs.readdirSync(versionDir);
  const installer = files.find(f => f.endsWith('.exe') || f.endsWith('.dmg') || f.endsWith('.AppImage'));
  const signature = files.find(f => f.endsWith('.sig'));

  res.json({
    version,
    installer: installer || null,
    signature: signature || null,
    files
  });
});

// Download release file
app.get('/releases/v:version/:filename', (req, res) => {
  const { version, filename } = req.params;
  const filePath = path.join(RELEASES_DIR, `v${version}`, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set appropriate headers for download
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Upload new release (POST /api/upload/:version)
app.post('/api/upload/:version', upload.array('files'), (req, res) => {
  const { version } = req.params;
  const { notes, pub_date } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    // Find installer and signature files
    const installer = req.files.find(f =>
      f.originalname.endsWith('.exe') ||
      f.originalname.endsWith('.dmg') ||
      f.originalname.endsWith('.AppImage')
    );

    const signature = req.files.find(f => f.originalname.endsWith('.sig'));

    if (!installer) {
      return res.status(400).json({ error: 'No installer file found' });
    }

    if (!signature) {
      return res.status(400).json({ error: 'No signature file found' });
    }

    // Read signature content
    const signatureContent = fs.readFileSync(signature.path, 'utf8').trim();

    // Determine platform target
    let target;
    if (installer.originalname.endsWith('.exe')) {
      target = 'x86_64-pc-windows-msvc';
    } else if (installer.originalname.endsWith('.dmg')) {
      target = 'x86_64-apple-darwin';
    } else if (installer.originalname.endsWith('.AppImage')) {
      target = 'x86_64-unknown-linux-gnu';
    }

    // Create latest.json in Tauri format
    const latestData = {
      version,
      notes: notes || `AnyAssist v${version} release`,
      pub_date: pub_date || new Date().toISOString(),
      platforms: {
        [target]: {
          signature: signatureContent,
          url: `https://anyassist.anysola.com/releases/v${version}/${installer.originalname}`
        }
      }
    };

    // Save latest version info
    saveLatestVersion(latestData);

    res.json({
      success: true,
      version,
      files: req.files.map(f => f.originalname),
      latest_url: 'https://anyassist.anysola.com/api/latest'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete version
app.delete('/api/version/:version', (req, res) => {
  const { version } = req.params;
  const versionDir = path.join(RELEASES_DIR, `v${version}`);

  if (!fs.existsSync(versionDir)) {
    return res.status(404).json({ error: 'Version not found' });
  }

  try {
    fs.rmSync(versionDir, { recursive: true, force: true });

    // If this was the latest version, update latest.json
    const latest = getLatestVersion();
    if (latest && latest.version === version) {
      const versions = getAllVersions();
      if (versions.length > 0) {
        // Set the next latest version
        // This is a simplified approach - you might want more sophisticated logic
        const nextVersion = versions[0];
        // You'd need to reconstruct the latest.json for the next version
      } else {
        // No versions left, remove latest.json
        const dataFile = path.join(DATA_DIR, 'latest.json');
        if (fs.existsSync(dataFile)) {
          fs.unlinkSync(dataFile);
        }
      }
    }

    res.json({ success: true, message: `Version ${version} deleted` });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

// Server info
app.get('/api/info', (req, res) => {
  const versions = getAllVersions();
  const latest = getLatestVersion();

  res.json({
    server: 'AnyAssist Update Server',
    version: '1.0.0',
    total_versions: versions.length,
    latest_version: latest?.version || null,
    available_versions: versions
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AnyAssist Update Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Latest API: http://localhost:${PORT}/api/latest`);
  console.log(`📊 Server info: http://localhost:${PORT}/api/info`);
});
