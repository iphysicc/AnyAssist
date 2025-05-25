# AnyAssist Express.js Update System

Cloudflare Tunnel ile Express.js tabanlı güncelleme sistemi.

## 🚀 Hızlı Kurulum

### 1. AWS Sunucuda Express Server Kurulumu

```bash
# Setup script'ini çalıştır
sudo ./scripts/setup-express-server.sh

# Server dosyalarını kopyala
sudo cp server/server.js /opt/anyassist-server/
sudo cp server/ecosystem.config.js /opt/anyassist-server/
sudo cp server/package.json /opt/anyassist-server/

# Dependencies'leri yükle
cd /opt/anyassist-server
sudo npm install

# Server'ı başlat
sudo systemctl start anyassist-server

# Status kontrol et
anyassist-status
```

### 2. Cloudflare Tunnel Yapılandırması

Cloudflare Tunnel'ınızı `localhost:80`'e yönlendirin.

### 3. Test

```bash
# Local test
curl http://localhost/health

# External test
curl https://anyassist.anysola.com/health
```

## 📦 Güncelleme Yayınlama

### 1. Build ve İmzalama

```bash
# Release build
npm run build-release

# Installer'ı imzala
minisign -S -s minisign.key -m "path/to/installer.exe"
```

### 2. Deploy

```bash
# Express server'a yükle
npm run deploy-aws
```

## 🔧 API Endpoints

- **Health Check**: `GET /health`
- **Latest Version**: `GET /api/latest` (Tauri updater endpoint)
- **Server Info**: `GET /api/info`
- **All Versions**: `GET /api/versions`
- **Upload Release**: `POST /api/upload/:version`
- **Download**: `GET /releases/v:version/:filename`

## 📁 Sunucu Dosya Yapısı

```
/opt/anyassist-server/
├── server.js              # Express server
├── package.json           # Dependencies
├── ecosystem.config.js    # PM2 config
├── data/
│   └── latest.json       # Latest version info
├── releases/
│   ├── v0.1.0/
│   │   ├── installer.exe
│   │   └── installer.exe.sig
│   └── v0.1.1/
│       ├── installer.exe
│       └── installer.exe.sig
└── logs/                 # PM2 logs
```

## 🛠️ Yönetim Komutları

```bash
# Status kontrol
anyassist-status

# Server restart
anyassist-restart

# Logs
journalctl -u anyassist-server -f

# PM2 ile yönetim
cd /opt/anyassist-server
npm run pm2:start
npm run pm2:logs
npm run pm2:restart
```

## 🔄 Güncelleme Süreci

1. **Build**: `npm run build-release`
2. **Sign**: `minisign -S -s minisign.key -m installer.exe`
3. **Deploy**: `npm run deploy-aws`
4. **Test**: Uygulama otomatik güncelleme kontrolü yapar

## 🌐 URL'ler

- **API**: https://anyassist.anysola.com/api/latest
- **Health**: https://anyassist.anysola.com/health
- **Info**: https://anyassist.anysola.com/api/info

## ✅ Avantajlar

- ✅ Nginx'e gerek yok (Cloudflare Tunnel direkt Express'e)
- ✅ Basit API tabanlı upload
- ✅ Otomatik latest.json oluşturma
- ✅ Tauri updater uyumlu
- ✅ PM2 ile process management
- ✅ Systemd service
- ✅ Kolay yönetim script'leri

Bu sistem ile GitHub'a bağımlı olmadan kendi sunucunuzdan güncelleme yayınlayabilirsiniz!
