# 系统监控平台 - 完整部署指南

[English](./DEPLOYMENT.md)

本文覆盖系统监控平台（Server、Frontend、Clients）的完整部署流程。

## 目录

- [概览](#概览)
- [前置条件](#前置条件)
- [服务端部署](#服务端部署)
- [前端部署](#前端部署)
- [客户端部署](#客户端部署)
- [生产注意事项](#生产注意事项)
- [监控与维护](#监控与维护)

## 概览

平台包含三部分需分别部署：

1. **Server**：接收并存储监控数据的后台 API
2. **Frontend**：可视化的 Web 控制台
3. **Clients**：安装在各被监控系统上的代理

## 前置条件

### 系统要求

**Server：**
- Node.js 18+
- 内存 ≥ 2GB（推荐 4GB）
- 磁盘 ≥ 10GB
- Linux / Windows / macOS

**Frontend：**
- Node.js 18+
- 内存 ≥ 1GB
- 磁盘 ≥ 1GB
- 需 Web 服务器或 Node.js 运行时

**Clients：**
- Node.js 18+
- 内存 ≥ 512MB
- 磁盘 ≥ 100MB
- Linux / Windows / macOS

### 网络要求

- Server 需被所有客户端访问（HTTP/HTTPS）
- Frontend 能访问 Server API
- 防火墙放行必要端口

## 服务端部署

### 方案 1：PM2（推荐 Linux/macOS）

1. 安装 PM2：
   ```bash
   npm install -g pm2
   ```
2. 准备服务端：
   ```bash
   cd status-server
   npm install
   cp config.example.json config.json
   # 编辑 config.json
   npm run build
   ```
3. 启动：
   ```bash
   pm2 start dist/main.js --name system-monitor-server
   pm2 save
   pm2 startup
   ```
4. 查看状态：
   ```bash
   pm2 status
   pm2 logs system-monitor-server
   ```

### 方案 2：Docker

1. 创建 Dockerfile：
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
2. 构建与运行：
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

### 方案 3：systemd（Linux）

1. 创建服务 `/etc/systemd/system/system-monitor-server.service`：
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
2. 启用与启动：
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable system-monitor-server
   sudo systemctl start system-monitor-server
   sudo systemctl status system-monitor-server
   ```

### 方案 4：Windows 服务

1. 全局安装 node-windows：
   ```powershell
   npm install -g node-windows
   ```
2. 创建安装脚本 `install-service.js`：
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
3. 以管理员执行安装：
   ```powershell
   node install-service.js
   ```

### 服务端配置

编辑 `config.json`：

```json
{
  "port": 3000,
  "dataRetentionDays": 30
}
```

**配置项：**
- `port`：HTTP 端口（默认 3000）
- `dataRetentionDays`：历史数据保留天数（默认 30）

### Nginx 反向代理

生产环境推荐使用 Nginx：

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

## 前端部署

### 方案 1：静态导出（推荐）

1. 构建静态文件：
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. 部署到 Web 服务器：

   **Nginx：**
   ```nginx
   server {
       listen 80;
       server_name dashboard.example.com;
       root /var/www/system-monitor/frontend/out;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3000;
       }
   }
   ```

   **Apache：**
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

### 方案 2：Node.js 服务

1. 构建并启动：
   ```bash
   cd frontend
   npm install
   npm run build
   npm start
   ```
2. 使用 PM2：
   ```bash
   pm2 start npm --name system-monitor-frontend -- start
   pm2 save
   ```

### 方案 3：Vercel / Netlify

1. 连接代码仓库
2. 构建配置：
   - Build 命令：`npm run build`
   - 输出目录：`.next`（Vercel）或 `out`（Netlify）
3. 设置环境变量（如需）
4. 触发部署

### 前端配置

如需修改 API 地址，更新 `lib/api-client.ts`：

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

构建前设置：

```bash
NEXT_PUBLIC_API_URL=https://api.monitor.example.com
```

## 客户端部署

在每个被监控系统部署客户端，详细见 [客户端部署指南](./backend/client/DEPLOYMENT.md)。

### 快速开始

1. 准备客户端：
   ```bash
   cd status-client
   npm install
   cp config.example.json config.json
   # 编辑 config.json
   npm run build
   ```
2. 配置示例：
   ```json
   {
     "clientName": "Production Server 1",
     "clientTags": ["production", "web-server"],
     "clientPurpose": "Main web application server",
     "serverUrl": "http://your-server:3000",
     "reportInterval": 60000
   }
   ```
3. 安装为服务：

   **Windows：**
   ```powershell
   node install-windows-service.js install
   ```

   **Linux：**
   ```bash
   sudo ./install-linux-service.sh install
   ```

   **macOS：**
   ```bash
   ./install-macos-service.sh install
   ```

## 生产注意事项

### 安全

1. **启用 HTTPS**
   - 获取证书（推荐 Let's Encrypt）
   - 配置 Nginx/Apache
   - 客户端改用 HTTPS
2. **实现认证**
   - 为 Server 增加 API Key 或 JWT
   - 客户端配置 API Key
   - 前端使用 JWT 控制访问
3. **防火墙**
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```
4. **保护配置文件**
   ```bash
   chmod 600 config.json
   chown monitor:monitor config.json
   ```

### 性能优化

**Server：**
- 大规模部署建议使用 PostgreSQL
- 启用查询缓存与连接池
- 合理设置 `dataRetentionDays`

**Frontend：**
- 使用 CDN、浏览器缓存、gzip/brotli
- 启用懒加载

**Clients：**
- 根据需求调整 `reportInterval`
- 监控客户端资源占用
- 合理设置缓存大小

### 备份策略

1. **数据库**
   ```bash
   DATE=$(date +%Y%m%d)
   sqlite3 /path/to/database.db ".backup /backups/db-$DATE.db"
   find /backups -name "db-*.db" -mtime +7 -delete
   ```
2. **配置文件**
   ```bash
   tar -czf configs-backup.tar.gz \
     status-server/config.json \
     status-client/config.json \
     status-frontend/.env.local
   ```

### 监控

**Server 健康：**
```bash
curl http://localhost:3000/api/clients
pm2 logs system-monitor-server
# 或
sudo journalctl -u system-monitor-server -f
```

**数据库大小：**
```bash
ls -lh /path/to/database.db
```

**客户端状态：**
- 在前端仪表盘查看在线/离线
- 检查客户端日志并设置离线告警

### 扩展

**横向扩展（多实例）：**
1. 换用 PostgreSQL
2. 后端多实例 + 负载均衡
3. 共享数据库连接
4. Redis 做会话或缓存

**纵向扩展：**
1. 提升 CPU/RAM
2. 优化查询
3. 调整数据保留或归档

## 监控与维护

### 例行维护

- 周：检查错误日志、磁盘空间、客户端是否上报
- 月：更新依赖、调整保留策略、备份数据库、安全更新
- 季：性能评估、容量规划、安全审计

### 故障排查

**Server：**
```bash
pm2 status
systemctl status system-monitor-server
pm2 logs system-monitor-server
journalctl -u system-monitor-server -n 100
pm2 restart system-monitor-server
systemctl restart system-monitor-server
```

**Frontend：**
```bash
npm run build
rm -rf .next
npm run build
printenv | grep NEXT_PUBLIC
```

**Client：**
```bash
# Windows
net start | findstr SystemMonitor
# Linux
systemctl status system-monitor-client
tail -f /var/log/system-monitor-client.log
```

### 更新

**Server：**
```bash
cd status-server
git pull
npm install
npm run build
pm2 restart system-monitor-server
```

**Frontend：**
```bash
cd status-frontend
git pull
npm install
npm run build
```

**Client：**
```bash
cd status-client
# 停止服务后
npm install
npm run build
# 再启动服务
```

## 支持

- 阅读各组件 README
- 查看日志与故障排查章节
- 在 GitHub 提 Issue 并附详细信息

## 许可证

MIT


