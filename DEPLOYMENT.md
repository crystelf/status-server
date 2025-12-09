# System Monitor - Complete Deployment Guide

[中文文档](./DEPLOYMENT.zh-CN.md)

This guide covers the complete deployment process for the System Monitor platform, including server, frontend, and client components.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Server Deployment](#server-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Client Deployment](#client-deployment)
- [Production Considerations](#production-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Overview

The System Monitor platform consists of three components that need to be deployed:

1. **Server** - Backend API that receives and stores monitoring data
2. **Frontend** - Web dashboard for visualization
3. **Clients** - Agents installed on monitored systems

## Prerequisites

### System Requirements

**Server:**
- Node.js 18 or higher
- 2GB RAM minimum (4GB recommended)
- 10GB disk space minimum
- Linux, Windows, or macOS

**Frontend:**
- Node.js 18 or higher
- 1GB RAM minimum
- 1GB disk space minimum
- Web server (Nginx, Apache) or Node.js runtime

**Clients:**
- Node.js 18 or higher
- 512MB RAM minimum
- 100MB disk space minimum
- Linux, Windows, or macOS

### Network Requirements

- Server must be accessible from all clients (HTTP/HTTPS)
- Frontend must be able to reach the server API
- Firewall rules configured to allow necessary traffic

## Server Deployment

### Option 1: PM2 (Recommended for Linux/macOS)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Prepare the server:**
   ```bash
   cd status-server
   npm install
   cp config.example.json config.json
   # Edit config.json with your settings
   npm run build
   ```

3. **Start with PM2:**
   ```bash
   pm2 start dist/main.js --name system-monitor-server
   pm2 save
   pm2 startup
   ```

4. **Verify it's running:**
   ```bash
   pm2 status
   pm2 logs system-monitor-server
   ```

### Option 2: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist ./dist
   COPY config.json ./
   EXPOSE 3000
   CMD ["node", "dist/main.js"]
   ```

2. **Build and run:**
   ```bash
   cd status-server
   npm run build
   docker build -t system-monitor-server .
   docker run -d \
     --name system-monitor-server \
     -p 3000:3000 \
     -v $(pwd)/data:/app/data \
     --restart unless-stopped \
     system-monitor-server
   ```

### Option 3: systemd (Linux)

1. **Create service file** `/etc/systemd/system/system-monitor-server.service`:
   ```ini
   [Unit]
   Description=System Monitor Server
   After=network.target

   [Service]
   Type=simple
   User=monitor
   WorkingDirectory=/opt/system-monitor-server
   ExecStart=/usr/bin/node dist/main.js
   Restart=on-failure
   RestartSec=10
   StandardOutput=journal
   StandardError=journal

   [Install]
   WantedBy=multi-user.target
   ```

2. **Enable and start:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable system-monitor-server
   sudo systemctl start system-monitor-server
   sudo systemctl status system-monitor-server
   ```

### Option 4: Windows Service

1. **Install node-windows:**
   ```powershell
   npm install -g node-windows
   ```

2. **Create service script** `install-service.js`:
   ```javascript
   const Service = require('node-windows').Service;
   
   const svc = new Service({
     name: 'System Monitor Server',
     description: 'System monitoring server',
     script: 'C:\\path\\to\\backend\\server\\dist\\main.js'
   });
   
   svc.on('install', () => {
     svc.start();
   });
   
   svc.install();
   ```

3. **Install as administrator:**
   ```powershell
   node install-service.js
   ```

### Server Configuration

Edit `config.json`:

```json
{
  "port": 3000,
  "dataRetentionDays": 30
}
```

**Configuration Options:**
- `port`: HTTP server port (default: 3000)
- `dataRetentionDays`: Days to keep historical data (default: 30)

### Reverse Proxy Setup (Nginx)

For production, use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name monitor.example.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Frontend Deployment

### Option 1: Static Export (Recommended)

1. **Build static files:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy to web server:**
   
   **Nginx:**
   ```nginx
   server {
       listen 80;
       server_name dashboard.example.com;
       root /var/www/system-monitor/frontend/out;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Proxy API requests to backend
       location /api {
           proxy_pass http://localhost:3000;
       }
   }
   ```

   **Apache:**
   ```apache
   <VirtualHost *:80>
       ServerName dashboard.example.com
       DocumentRoot /var/www/system-monitor/frontend/out
       
       <Directory /var/www/system-monitor/frontend/out>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>

       ProxyPass /api http://localhost:3000/api
       ProxyPassReverse /api http://localhost:3000/api
   </VirtualHost>
   ```

### Option 2: Node.js Server

1. **Build and start:**
   ```bash
   cd frontend
   npm install
   npm run build
   npm start
   ```

2. **Use PM2 for production:**
   ```bash
   pm2 start npm --name system-monitor-frontend -- start
   pm2 save
   ```

### Option 3: Vercel/Netlify

1. **Connect your repository**
2. **Configure build settings:**
   - Build command: `npm run build`
   - Output directory: `.next` (Vercel) or `out` (Netlify)
3. **Set environment variables** (if needed)
4. **Deploy**

### Frontend Configuration

Update API endpoint in `lib/api-client.ts` if needed:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

Set environment variable:
```bash
NEXT_PUBLIC_API_URL=https://api.monitor.example.com
```

## Client Deployment

Clients should be deployed on each system you want to monitor. See the detailed [Client Deployment Guide](./backend/client/DEPLOYMENT.md) for platform-specific instructions.

### Quick Start

1. **Prepare the client:**
   ```bash
   cd status-client
   npm install
   cp config.example.json config.json
   # Edit config.json
   npm run build
   ```

2. **Configure the client** in `config.json`:
   ```json
   {
     "clientName": "Production Server 1",
     "clientTags": ["production", "web-server"],
     "clientPurpose": "Main web application server",
     "serverUrl": "http://your-server:3000",
     "reportInterval": 60000
   }
   ```

3. **Install as service:**

   **Windows:**
   ```powershell
   node install-windows-service.js install
   ```

   **Linux:**
   ```bash
   sudo ./install-linux-service.sh install
   ```

   **macOS:**
   ```bash
   ./install-macos-service.sh install
   ```

## Production Considerations

### Security

1. **Use HTTPS:**
   - Obtain SSL certificates (Let's Encrypt recommended)
   - Configure Nginx/Apache with SSL
   - Update client configs to use HTTPS URLs

2. **Implement Authentication:**
   - Add API key authentication to server
   - Configure clients with API keys
   - Implement JWT for frontend access

3. **Firewall Configuration:**
   ```bash
   # Allow server port
   sudo ufw allow 3000/tcp
   
   # Allow HTTP/HTTPS for frontend
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

4. **Secure Configuration Files:**
   ```bash
   chmod 600 config.json
   chown monitor:monitor config.json
   ```

### Performance Optimization

1. **Server:**
   - Use PostgreSQL instead of SQLite for large deployments
   - Enable database query caching
   - Configure connection pooling
   - Set appropriate `dataRetentionDays`

2. **Frontend:**
   - Enable CDN for static assets
   - Configure browser caching
   - Use compression (gzip/brotli)
   - Implement lazy loading

3. **Clients:**
   - Adjust `reportInterval` based on needs
   - Monitor client resource usage
   - Use local caching effectively

### Backup Strategy

1. **Server Database:**
   ```bash
   # Daily backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d)
   sqlite3 /path/to/database.db ".backup /backups/db-$DATE.db"
   find /backups -name "db-*.db" -mtime +7 -delete
   ```

2. **Configuration Files:**
   ```bash
   # Backup configs
   tar -czf configs-backup.tar.gz \
     status-server/config.json \
     status-client/config.json \
     status-frontend/.env.local
   ```

### Monitoring

1. **Server Health:**
   ```bash
   # Check server status
   curl http://localhost:3000/api/clients
   
   # Monitor logs
   pm2 logs system-monitor-server
   # or
   sudo journalctl -u system-monitor-server -f
   ```

2. **Database Size:**
   ```bash
   # Check SQLite database size
   ls -lh /path/to/database.db
   ```

3. **Client Status:**
   - Monitor client online/offline status in dashboard
   - Check client logs on each system
   - Set up alerts for offline clients

### Scaling

**Horizontal Scaling (Multiple Servers):**

1. Use PostgreSQL instead of SQLite
2. Deploy multiple server instances behind load balancer
3. Configure shared database connection
4. Use Redis for session management

**Vertical Scaling:**

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Adjust data retention policy
4. Implement data archiving

## Monitoring and Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Review error logs
   - Check disk space
   - Verify all clients are reporting

2. **Monthly:**
   - Update dependencies
   - Review and adjust data retention
   - Backup database
   - Check for security updates

3. **Quarterly:**
   - Performance review
   - Capacity planning
   - Security audit

### Troubleshooting

**Server Issues:**
```bash
# Check server status
pm2 status
systemctl status system-monitor-server

# View logs
pm2 logs system-monitor-server
journalctl -u system-monitor-server -n 100

# Restart server
pm2 restart system-monitor-server
systemctl restart system-monitor-server
```

**Frontend Issues:**
```bash
# Check build
npm run build

# Clear cache
rm -rf .next
npm run build

# Check environment variables
printenv | grep NEXT_PUBLIC
```

**Client Issues:**
```bash
# Check client status (Windows)
net start | findstr SystemMonitor

# Check client status (Linux)
systemctl status system-monitor-client

# View client logs
tail -f /var/log/system-monitor-client.log
```

### Updating

**Server Update:**
```bash
cd status-server
git pull
npm install
npm run build
pm2 restart system-monitor-server
```

**Frontend Update:**
```bash
cd status-frontend
git pull
npm install
npm run build
# Restart or redeploy based on your setup
```

**Client Update:**
```bash
cd status-client
# Stop service first
npm install
npm run build
# Restart service
```

## Support

For issues and questions:
- Check component-specific README files
- Review logs for error messages
- Consult the troubleshooting sections
- Create a GitHub issue with details

## License

MIT
