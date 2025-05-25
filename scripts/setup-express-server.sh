#!/bin/bash

# Express.js Update Server Setup Script for AnyAssist
# Run this script on your AWS server to set up the Express.js update server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up AnyAssist Express.js Update Server${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script as root (use sudo)${NC}"
  exit 1
fi

# Update system
echo -e "${YELLOW}→ Updating system packages${NC}"
apt update && apt upgrade -y

# Install Node.js 20
echo -e "${YELLOW}→ Installing Node.js 20${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
echo -e "${YELLOW}→ Installing PM2${NC}"
npm install -g pm2

# Install git (for cloning if needed)
apt-get install -y git

# Create application directory
echo -e "${YELLOW}→ Creating application directory${NC}"
mkdir -p /opt/anyassist-server
cd /opt/anyassist-server

# Create server files
echo -e "${YELLOW}→ Creating server files${NC}"

# Create package.json
cat > package.json << 'EOF'
{
  "name": "anyassist-update-server",
  "version": "1.0.0",
  "description": "AnyAssist Update Server",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop anyassist-updates",
    "pm2:restart": "pm2 restart anyassist-updates",
    "pm2:logs": "pm2 logs anyassist-updates"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "multer": "^1.4.5-lts.1",
    "express-rate-limit": "^7.1.5",
    "form-data": "^4.0.0"
  }
}
EOF

# Install dependencies
echo -e "${YELLOW}→ Installing dependencies${NC}"
npm install

# Create logs directory
mkdir -p logs

# Create data and releases directories
mkdir -p data releases

# Set proper ownership
chown -R www-data:www-data /opt/anyassist-server
chmod -R 755 /opt/anyassist-server

# Create systemd service
echo -e "${YELLOW}→ Creating systemd service${NC}"
cat > /etc/systemd/system/anyassist-server.service << 'EOF'
[Unit]
Description=AnyAssist Update Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/anyassist-server
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5s
Environment=NODE_ENV=production
Environment=PORT=80

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
echo -e "${YELLOW}→ Enabling services${NC}"
systemctl daemon-reload
systemctl enable anyassist-server

# Create management scripts
echo -e "${YELLOW}→ Creating management scripts${NC}"

cat > /usr/local/bin/anyassist-status << 'EOF'
#!/bin/bash
echo "=== AnyAssist Server Status ==="
systemctl status anyassist-server --no-pager

echo -e "\n=== Server Logs (last 10 lines) ==="
journalctl -u anyassist-server -n 10 --no-pager

echo -e "\n=== Port Check ==="
netstat -tlnp | grep :80

echo -e "\n=== Test URLs ==="
echo "Health Check: curl http://localhost/health"
echo "API Info: curl http://localhost/api/info"
echo "Latest API: curl http://localhost/api/latest"
echo "External: curl https://anyassist.anysola.com/health"
EOF

cat > /usr/local/bin/anyassist-restart << 'EOF'
#!/bin/bash
echo "Restarting AnyAssist Server..."
systemctl restart anyassist-server
echo "Server restarted!"
EOF

chmod +x /usr/local/bin/anyassist-status
chmod +x /usr/local/bin/anyassist-restart

echo -e "\n${GREEN}✓ Express.js server setup completed!${NC}\n"

echo -e "${YELLOW}NEXT STEPS:${NC}"
echo -e "1. Copy server.js and ecosystem.config.js to /opt/anyassist-server/"
echo -e "2. Start the server: systemctl start anyassist-server"
echo -e "3. Check status: anyassist-status"
echo -e "4. Test health check: curl http://localhost/health"
echo -e "5. Configure Cloudflare Tunnel to point to localhost:80"
echo -e "\n${BLUE}Useful commands:${NC}"
echo -e "- Check status: anyassist-status"
echo -e "- Restart server: anyassist-restart"
echo -e "- View logs: journalctl -u anyassist-server -f"
echo -e "- Test external: curl https://anyassist.anysola.com/health"
