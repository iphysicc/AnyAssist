# AWS Sunucu Güncelleme Sistemi Kurulum Rehberi

Bu rehber, AnyAssist uygulamanız için AWS sunucunuzda güncelleme sistemi kurmanızı anlatır.

## 🚀 Hızlı Başlangıç

### 1. AWS Sunucu Hazırlığı

AWS sunucunuzda aşağıdaki gereksinimlerin olduğundan emin olun:
- Ubuntu 20.04+ veya benzer Linux dağıtımı
- Root erişimi (sudo)
- Domain adı (örn: updates.yoursite.com)
- SSH erişimi

### 2. Sunucu Kurulumu

```bash
# 1. Setup script'ini sunucuya yükleyin
scp scripts/setup-aws-server.sh user@your-server.com:~/

# 2. SSH ile sunucuya bağlanın
ssh user@your-server.com

# 3. Script'i çalıştırın
sudo chmod +x setup-aws-server.sh
sudo ./setup-aws-server.sh
```

### 3. Domain ve SSL Yapılandırması

```bash
# 1. Nginx config dosyasını düzenleyin
sudo nano /etc/nginx/sites-available/anyassist-updates

# 2. YOUR_DOMAIN.com kısımlarını gerçek domain'inizle değiştirin
# Örnek: updates.yoursite.com

# 3. SSL sertifikası kurun
sudo certbot --nginx -d updates.yoursite.com

# 4. Nginx'i yeniden başlatın
sudo systemctl reload nginx
```

### 4. Proje Yapılandırması

Proje dosyalarınızda aşağıdaki değişiklikleri yapın:

#### `src-tauri/tauri.conf.json`
```json
"endpoints": [
  "https://updates.yoursite.com/anyassist-updates/api/latest.json"
]
```

#### `scripts/deploy-to-aws.js`
```javascript
const AWS_CONFIG = {
  host: 'updates.yoursite.com',
  username: 'your-ssh-username',
  keyPath: '~/.ssh/your-key.pem',
  remotePath: '/var/www/anyassist-updates'
};
```

## 📦 Güncelleme Yayınlama

### 1. Sürüm Hazırlama

```bash
# 1. package.json'da version'ı güncelleyin
# 2. Release build yapın
npm run build-release

# 3. Installer'ı imzalayın (minisign gerekli)
minisign -S -s minisign.key -m path/to/installer.exe

# 4. İmzayı latest.json'a ekleyin
```

### 2. AWS'ye Deploy

```bash
# Deploy script'ini çalıştırın
npm run deploy-aws
```

## 🔧 Sunucu Yönetimi

### Dosya Yapısı

```
/var/www/anyassist-updates/
├── api/
│   └── latest.json          # Güncelleme bilgileri
├── releases/
│   ├── v0.1.0/
│   │   ├── anyassist-setup.exe
│   │   └── anyassist-setup.exe.sig
│   └── v0.1.1/
│       ├── anyassist-setup.exe
│       └── anyassist-setup.exe.sig
└── upload/                  # Geçici dosyalar
```

### Önemli URL'ler

- **API Endpoint**: `https://your-domain.com/anyassist-updates/api/latest.json`
- **Health Check**: `https://your-domain.com/anyassist-updates/health`
- **Releases**: `https://your-domain.com/anyassist-updates/releases/v{version}/`

### Log Dosyaları

```bash
# Nginx access logları
sudo tail -f /var/log/anyassist-updates/access.log

# Nginx error logları
sudo tail -f /var/log/anyassist-updates/error.log

# Sistem logları
sudo journalctl -u nginx -f
```

## 🛠️ Sorun Giderme

### Güncelleme Algılanmıyor

1. **API endpoint'ini kontrol edin**:
   ```bash
   curl https://your-domain.com/anyassist-updates/api/latest.json
   ```

2. **Sürüm numarasını kontrol edin**: `latest.json`'daki version, kurulu sürümden yüksek olmalı

3. **CORS ayarlarını kontrol edin**: Nginx config'de CORS headers doğru ayarlanmış olmalı

### SSL Sorunları

```bash
# SSL sertifikasını yenileyin
sudo certbot renew

# Nginx config'i test edin
sudo nginx -t

# Nginx'i yeniden başlatın
sudo systemctl reload nginx
```

### Dosya İzinleri

```bash
# Dosya izinlerini düzeltin
sudo chown -R www-data:www-data /var/www/anyassist-updates
sudo chmod -R 755 /var/www/anyassist-updates
sudo chmod -R 644 /var/www/anyassist-updates/api/*
sudo chmod -R 644 /var/www/anyassist-updates/releases/*/*
```

## 🔐 Güvenlik

### Minisign Anahtarları

```bash
# Yeni anahtar çifti oluşturun (sadece bir kez)
minisign -G -s minisign.key -p minisign.pub

# Public key'i tauri.conf.json'a ekleyin
# Private key'i güvenli bir yerde saklayın
```

### Sunucu Güvenliği

- SSH key-based authentication kullanın
- Firewall kurallarını ayarlayın (sadece 22, 80, 443 portları)
- Düzenli güvenlik güncellemeleri yapın
- Log dosyalarını düzenli kontrol edin

## 📞 Destek

Sorun yaşarsanız:

1. Log dosyalarını kontrol edin
2. Health check endpoint'ini test edin
3. Nginx config'ini doğrulayın
4. SSL sertifikasının geçerli olduğunu kontrol edin

Bu sistem sayesinde GitHub'a bağımlı olmadan kendi sunucunuzdan güncelleme yayınlayabilirsiniz!
