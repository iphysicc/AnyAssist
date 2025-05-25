#!/bin/bash

# AWS Server Setup Script for AnyAssist Updates
# Run this script on your AWS server to set up the update system

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up AnyAssist Update Server on AWS${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script as root (use sudo)${NC}"
  exit 1
fi

# Update system
echo -e "${YELLOW}→ Updating system packages${NC}"
apt update && apt upgrade -y

# Install required packages
echo -e "${YELLOW}→ Installing required packages${NC}"
apt install -y nginx curl wget

# Create directory structure
echo -e "${YELLOW}→ Creating directory structure${NC}"
mkdir -p /var/www/anyassist-updates/{api,releases,upload}
mkdir -p /var/log/anyassist-updates

# Set proper ownership
chown -R www-data:www-data /var/www/anyassist-updates
chmod -R 755 /var/www/anyassist-updates

# Create nginx configuration for Cloudflare Tunnel
echo -e "${YELLOW}→ Creating nginx configuration for Cloudflare Tunnel${NC}"
cat > /etc/nginx/sites-available/anyassist-updates << 'EOF'
server {
    listen 80;
    server_name localhost;  # Cloudflare Tunnel will handle the domain

    # Trust Cloudflare IPs
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Root directory
    root /var/www/anyassist-updates;
    index index.html;

    # Logging
    access_log /var/log/anyassist-updates/access.log;
    error_log /var/log/anyassist-updates/error.log;

    # API endpoint for update checks
    location /anyassist-updates/api/ {
        alias /var/www/anyassist-updates/api/;

        # CORS headers for update checks
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        # Cache control for API responses
        expires 5m;
        add_header Cache-Control "public, no-transform";

        try_files $uri $uri/ =404;
    }

    # Release files (installers)
    location /anyassist-updates/releases/ {
        alias /var/www/anyassist-updates/releases/;

        # Allow large file downloads
        client_max_body_size 500M;

        # Cache control for release files
        expires 1y;
        add_header Cache-Control "public, immutable";

        try_files $uri $uri/ =404;
    }

    # Upload endpoint (for future automated uploads)
    location /anyassist-updates/upload/ {
        alias /var/www/anyassist-updates/upload/;

        # Restrict access to upload directory
        deny all;
        return 403;
    }

    # Health check endpoint
    location /anyassist-updates/health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # Block access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable the site
echo -e "${YELLOW}→ Enabling nginx site${NC}"
ln -sf /etc/nginx/sites-available/anyassist-updates /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo -e "${YELLOW}→ Testing nginx configuration${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
    systemctl reload nginx
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    exit 1
fi

# Create a simple index page
echo -e "${YELLOW}→ Creating index page${NC}"
cat > /var/www/anyassist-updates/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>AnyAssist Update Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .status { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <h1>AnyAssist Update Server</h1>
    <p class="status">✓ Server is running</p>
    <p>This server provides updates for AnyAssist application.</p>
    <ul>
        <li><a href="/anyassist-updates/api/latest.json">Latest Version Info</a></li>
        <li><a href="/anyassist-updates/health">Health Check</a></li>
    </ul>
</body>
</html>
EOF

echo -e "\n${GREEN}✓ Basic setup completed!${NC}\n"

echo -e "${YELLOW}NEXT STEPS:${NC}"
echo -e "1. Install Cloudflare Tunnel (cloudflared) on this server"
echo -e "2. Configure tunnel to point to localhost:80"
echo -e "3. Update scripts/deploy-to-aws.js with your server details"
echo -e "4. Test the setup by visiting: https://YOUR_DOMAIN.com/anyassist-updates/health"
echo -e "\n${BLUE}Cloudflare Tunnel setup:${NC}"
echo -e "curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
echo -e "sudo dpkg -i cloudflared.deb"
echo -e "cloudflared tunnel login"
