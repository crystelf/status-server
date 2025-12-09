# 系统监控平台

[English](./README.md)

一个分布式的实时系统监控解决方案，提供现代化的 Web 界面。支持在单一控制台监控多个服务器的 CPU、内存、磁盘、网络与交换分区使用率。

## 功能

- 🖥️ **跨平台客户端**：支持 Windows、Linux、macOS
- 📊 **实时监控**：指标自动刷新
- 🎨 **现代 UI**：响应式界面，支持明暗主题
- 🏷️ **标签与分组**：使用自定义标签与用途组织服务器
- 📈 **历史数据**：交互式图表查看趋势
- 🔄 **离线容错**：客户端断线时本地缓存数据
- 🚀 **简单部署**：全平台易于安装

## 架构

系统包含三个组件：

1. **Client**：轻量代理，采集系统指标并上报服务器
2. **Server**：NestJS 后端，接收数据并提供 REST API
3. **Frontend**：Next.js 前端，用于可视化

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │◀────│  Frontend   │
│  (Agent)    │     │  (NestJS)   │     │  (Next.js)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 快速开始

### 前置条件

- Node.js 18+
- npm 或 pnpm

### 1. 启动 Server

```bash
cd status-server
npm install
cp config.example.json config.json
# 编辑 config.json
npm run build
npm start
```

默认地址：`http://localhost:3000`

### 2. 启动 Frontend

```bash
cd frontend
npm install
npm run build
npm start
```

默认地址：`http://localhost:3001`

### 3. 部署 Client

在每台需要监控的主机上：

```bash
cd status-clients
npm install
cp config.example.json config.json
# 编辑 config.json，填入服务器地址与客户端信息
npm run build
npm start
```

生产环境作为服务运行请见 [客户端部署指南](https://github.com/crystelf/status-client/blob/main/DEPLOYMENT.md)。

## 配置

### Client 配置

创建 `status-client/config.json`：

```json
{
  "clientName": "Production Server 1",
  "clientTags": ["production", "web-server", "us-east"],
  "clientPurpose": "Main web application server",
  "serverUrl": "http://your-server:3000",
  "reportInterval": 60000
}
```

### Server 配置

创建 `status-server/config.json`：

```json
{
  "port": 3000,
  "dataRetentionDays": 30
}
```

## 文档

- [客户端 README](https://github.com/crystelf/status-client/blob/main/README.md)
- [客户端部署指南](https://github.com/crystelf/status-client/blob/main/DEPLOYMENT.md)
- [服务端 README](./README-status-server.md)
- [前端 README](https://github.com/crystelf/status-fronted/blob/main/README.md)

## 技术栈

### 后端
- Runtime：Node.js 18+
- 语言：TypeScript
- 框架：NestJS
- 数据库：SQLite（TypeORM）
- 系统信息：systeminformation

### 前端
- 框架：Next.js 14
- 语言：TypeScript
- 样式：Tailwind CSS
- UI 组件：Radix UI
- 图表：Recharts
- 动画：Framer Motion
- 图标：Lucide React

## 开发

### 安装依赖

```bash
# 安装所有依赖
cd status-client && npm install
cd status-server && npm install
cd status-frontend && npm install
```

### 开发模式

```bash
# 终端 1 - Server
cd status-server
npm run start:dev

# 终端 2 - Frontend
cd status-frontend
npm run dev

# 终端 3 - Client
cd status-client
npm run dev
```

### 测试

```bash
# Client 测试
cd status-client
npm test

# Server 测试
cd status-server
npm test
```

## API

### 上报数据
- `POST /api/reports`：接收客户端数据

### 查询数据
- `GET /api/clients`：获取全部客户端
- `GET /api/clients/:id`：获取单个客户端详情
- `GET /api/clients/:id/history`：获取历史数据

## 监控指标

### 静态信息
- CPU 型号、核心数、架构
- 系统版本与型号
- 总内存与交换分区
- 总磁盘容量与类型
- 地理位置

### 动态状态
- CPU 占用与频率
- 内存与交换分区占用
- 磁盘占用
- 网络上/下行速率
- 时间戳

## 功能细节

### Client
- 跨平台系统信息采集
- 可配置上报间隔
- 指数退避的自动重试
- 离线本地缓存
- 完整错误日志
- 服务安装脚本

### Server
- 基于 NestJS 的 REST API
- SQLite + TypeORM
- 客户端在线/离线检测
- 可配置数据保留
- 输入验证与错误处理
- 历史数据查询

### Frontend
- 响应式设计（移动/平板/桌面）
- 明暗主题
- 实时数据更新
- Recharts 交互图表
- 标签过滤与分组
- 平滑动画
- 大列表虚拟滚动

## 部署

### 生产部署

1. **Server**：使用 Docker 或 PM2
2. **Frontend**：静态导出或部署至 Vercel/Netlify
3. **Clients**：安装为系统服务（见部署指南）

### Docker 部署（Server）

```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## 安全建议

- 生产环境使用 HTTPS
- 实现 API 认证（JWT/API Key）
- 限制数据库访问与防火墙规则
- 定期更新依赖
- 使用环境变量存放敏感配置

## 常见问题

### 客户端
- **无法启动**：检查 config.json 语法与 serverUrl
- **不上报**：确认网络连通与服务器状态
- **CPU 占用高**：增大 reportInterval

### 服务端
- **数据库错误**：检查文件权限与磁盘空间
- **端口被占用**：修改配置或停止冲突服务
- **内存问题**：降低 dataRetentionDays 或升级硬件

### 前端
- **无法连接**：确认服务器 URL 与 CORS 配置
- **性能慢**：启用大列表虚拟化
- **主题异常**：清理浏览器缓存与 localStorage

## 贡献

欢迎贡献：

1. Fork 仓库
2. 新建功能分支
3. 为新功能编写测试
4. 确保全部测试通过
5. 提交 Pull Request

## 许可证

MIT

## 支持

如有问题请：
- 查看各组件 README
- 查阅部署指南
- 检查现有 GitHub Issues
- 提交包含详细信息的新 Issue

---

由 ❤️ 构建，基于 Node.js、NestJS 与 Next.js



