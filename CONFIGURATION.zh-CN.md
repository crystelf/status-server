# 系统监控平台 - 配置指南

[English](./CONFIGURATION.md)

本文详细说明平台各组件的配置方式。

## 目录

- [客户端配置](#客户端配置)
- [服务端配置](#服务端配置)
- [前端配置](#前端配置)
- [环境变量](#环境变量)
- [高级配置](#高级配置)
- [常见问题](#常见问题)
- [配置最佳实践](#配置最佳实践)
- [配置模板](#配置模板)

## 客户端配置

客户端使用 `status-server/config.json`（或对应目录）进行配置。

### 配置文件位置

```
status-server/config.json
```

### 示例

```json
{
  "clientName": "Production Server 1",
  "clientTags": ["production", "web-server", "us-east"],
  "clientPurpose": "Main web application server",
  "serverUrl": "http://monitor-server.example.com:3000",
  "reportInterval": 60000,
  "minReportInterval": 10000,
  "maxRetries": 3,
  "cacheSize": 100
}
```

### 配置项

#### clientName (string, 可选)
- 描述：仪表盘显示的客户端名称
- 默认：系统主机名
- 建议包含环境/位置/用途，最长 255 字符

#### clientTags (string 数组, 可选)
- 描述：用于分组与过滤
- 默认：`[]`，最大 50 个
- 示例：`["production","web-server","us-east","nginx"]`

常用分类：环境（production/staging/dev）、角色（web/database/cache/load-balancer）、位置（us-east/eu-central）、技术（nginx/mysql/redis/docker）

#### clientPurpose (string, 可选)
- 描述：用途说明，最长 500 字符

#### serverUrl (string, 必填)
- 描述：监控服务器地址（含协议）
- 生产环境请使用 HTTPS

#### reportInterval (number, 可选)
- 描述：上报间隔（毫秒）
- 默认：60000；最小受 `minReportInterval` 限制
- 参考：30000（高频）、60000（默认）、300000（低频）

#### minReportInterval (number, 可选)
- 描述：最小上报间隔，防止过于频繁
- 默认：10000

#### maxRetries (number, 可选)
- 描述：失败重试次数（指数退避）
- 默认：3

#### cacheSize (number, 可选)
- 描述：离线缓存条目上限
- 默认：100，建议 50-500

### 创建配置文件

```bash
cd status-client
cp config.example.json config.json
# 编辑 config.json
node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
```

### 配置校验

- 缺少 serverUrl：报错并退出
- reportInterval 低于最小值会被提升
- JSON 无效：报错并退出
- 缺失可选项：使用默认值

## 服务端配置

服务端在 `status-server/config.json` 中配置。

### 示例

```json
{
  "port": 3000,
  "dataRetentionDays": 30
}
```

### 配置项

#### port (number, 可选)
- 描述：HTTP 监听端口
- 默认：3000；常用替代 8080/8000/3001
- 修改端口需同步调整防火墙

#### dataRetentionDays (number, 可选)
- 描述：历史状态数据保留天数
- 默认：30；更高占用更多磁盘
- 估算：1 客户端每分钟上报约 50 MB/月；10 个≈500 MB/月；100 个≈5 GB/月

### 创建与校验

```bash
cd status-server
cp config.example.json config.json
node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
```

## 前端配置

前端使用环境变量（例如 `.env.local`）：

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX # 可选
```

#### NEXT_PUBLIC_API_URL
- 描述：监控服务 API 基础地址
- 默认：`http://localhost:3000`
- 需包含协议与端口，无尾随斜杠，生产建议 HTTPS

#### NEXT_PUBLIC_GA_ID
- 描述：Google Analytics 跟踪 ID，可选

构建时需已设置环境变量，或使用 `.env.production`。

## 环境变量

### Client
```bash
MONITOR_SERVER_URL=http://monitor.example.com:3000
MONITOR_CLIENT_NAME="Production Server 1"
MONITOR_REPORT_INTERVAL=60000
```
优先级：环境变量 > config.json > 默认值

### Server
```bash
MONITOR_PORT=3000
MONITOR_DATA_RETENTION_DAYS=30
MONITOR_DB_PATH=/var/lib/system-monitor/database.db
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=https://api.monitor.example.com
NODE_ENV=production
```

## 高级配置

### 数据库（Server）

在 `status-server/src/app.module.ts` 调整：

```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: 'data/database.db',
  entities: [ClientEntity, StatusEntity, ConfigEntity],
  synchronize: true,
  logging: false, // 调试时可开启
  maxQueryExecutionTime: 1000, // 慢查询日志
})
```

### CORS（Server）

在 `status-server/src/main.ts` 配置：

```typescript
app.enableCors({
  origin: ['https://dashboard.example.com'],
  methods: ['GET', 'POST'],
  credentials: true,
});
```

### 日志

**Client 日志**（示例位置）：
```typescript
export const logger = {
  level: 'info', // debug/info/warn/error
  file: '/var/log/system-monitor-client.log',
  maxSize: '10m',
  maxFiles: 5,
};
```

**Server 日志**（NestJS 创建时）：
```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'], // 调试可加入 'debug'
});
```

### 性能调优

**Client：**
```json
{
  "reportInterval": 60000,
  "cacheSize": 100,
  "maxRetries": 3,
  "timeout": 30000
}
```

**Server：**
```json
{
  "port": 3000,
  "dataRetentionDays": 30,
  "maxConnections": 100,
  "queryTimeout": 5000
}
```

## 常见问题

### 客户端
- **无法启动**：校验 JSON；确保 serverUrl；Node.js 18+
- **不上报**：检查 serverUrl、网络、客户端日志与服务端状态
- **CPU 占用高**：增大 reportInterval

### 服务端
- **端口被占用**：更换端口或停止冲突服务；`netstat -ano | findstr :3000`（Windows）
- **数据库错误**：检查权限/磁盘空间/文件是否损坏
- **内存高**：降低 dataRetentionDays，检查日志，必要时重启

### 前端
- **无法连接 API**：确认 NEXT_PUBLIC_API_URL、CORS 与网络可达
- **环境变量无效**：修改 .env 后需重新构建；变量需带 NEXT_PUBLIC_ 前缀；确认文件路径

## 配置最佳实践

1. 使用描述性名称与标签
2. 根据监控需求设置合适的上报间隔
3. 合理的数据保留策略平衡存储
4. 生产强制使用 HTTPS
5. 定期备份配置文件
6. 记录团队的定制配置
7. 先在开发环境验证配置再上线
8. 配置变更后观察资源占用
9. 区分环境配置（dev/staging/prod）
10. 保护敏感配置文件权限

## 配置模板

### 高频监控
```json
{
  "clientName": "Critical Production Server",
  "clientTags": ["production", "critical"],
  "serverUrl": "https://monitor.example.com",
  "reportInterval": 30000,
  "cacheSize": 200
}
```

### 低频监控
```json
{
  "clientName": "Development Server",
  "clientTags": ["development"],
  "serverUrl": "http://monitor-dev.example.com:3000",
  "reportInterval": 300000,
  "cacheSize": 50
}
```

### 高可用场景
```json
{
  "clientName": "HA Web Server 1",
  "clientTags": ["production", "web-server", "ha-cluster"],
  "serverUrl": "https://monitor.example.com",
  "reportInterval": 60000,
  "maxRetries": 5,
  "cacheSize": 500
}
```

## 支持

- 阅读本指南与各组件 README
- 参考故障排查章节
- 在 GitHub 提 Issue 并附配置细节

## 许可证

MIT



