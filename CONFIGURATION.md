# System Monitor - Configuration Guide

[中文文档](./CONFIGURATION.zh-CN.md)

This guide provides detailed information about configuring all components of the System Monitor platform.

## Table of Contents

- [Client Configuration](#client-configuration)
- [Server Configuration](#server-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Environment Variables](#environment-variables)
- [Advanced Configuration](#advanced-configuration)
- [Common Issues](#common-issues)

## Client Configuration

The client is configured using a `config.json` file in the `status-server` directory.

### Configuration File Location

```
status-server/config.json
```

### Example Configuration

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

### Configuration Options

#### clientName (string, optional)

**Description:** Custom name for this client that will be displayed in the dashboard.

**Default:** System hostname

**Example:**
```json
"clientName": "Production Server 1"
```

**Notes:**
- Use descriptive names to easily identify servers
- Can include environment, location, or purpose
- Maximum length: 255 characters

#### clientTags (array of strings, optional)

**Description:** Tags for categorizing and filtering clients in the dashboard.

**Default:** `[]` (empty array)

**Example:**
```json
"clientTags": ["production", "web-server", "us-east", "nginx"]
```

**Notes:**
- Use tags for grouping related servers
- Common tag categories: environment, role, location, technology
- Tags are case-sensitive
- Maximum 50 tags per client

**Common Tag Examples:**
- Environment: `production`, `staging`, `development`
- Role: `web-server`, `database`, `cache`, `load-balancer`
- Location: `us-east`, `us-west`, `eu-central`, `asia-pacific`
- Technology: `nginx`, `apache`, `mysql`, `redis`, `docker`

#### clientPurpose (string, optional)

**Description:** Brief description of what this client is used for.

**Default:** `""` (empty string)

**Example:**
```json
"clientPurpose": "Main web application server handling user requests"
```

**Notes:**
- Helps document server purposes
- Displayed in client details
- Maximum length: 500 characters

#### serverUrl (string, required)

**Description:** URL of the monitoring server where data will be sent.

**Default:** None (must be specified)

**Example:**
```json
"serverUrl": "http://monitor.example.com:3000"
```

**Notes:**
- Must include protocol (http:// or https://)
- Include port if not using default (80 for HTTP, 443 for HTTPS)
- Server must be accessible from the client
- Use HTTPS in production for security

#### reportInterval (number, optional)

**Description:** How often to collect and report data, in milliseconds.

**Default:** `60000` (1 minute)

**Minimum:** Value of `minReportInterval` (default 10000)

**Example:**
```json
"reportInterval": 30000
```

**Notes:**
- Lower values = more frequent updates, higher resource usage
- Higher values = less frequent updates, lower resource usage
- Recommended: 30000-300000 (30 seconds to 5 minutes)
- Will be adjusted to `minReportInterval` if set too low

**Common Values:**
- `30000` - 30 seconds (high frequency)
- `60000` - 1 minute (default, balanced)
- `300000` - 5 minutes (low frequency)

#### minReportInterval (number, optional)

**Description:** Minimum allowed report interval to prevent excessive reporting.

**Default:** `10000` (10 seconds)

**Example:**
```json
"minReportInterval": 15000
```

**Notes:**
- Prevents accidental configuration of very short intervals
- `reportInterval` will be adjusted to this value if set lower
- Recommended: 10000-30000

#### maxRetries (number, optional)

**Description:** Maximum number of retry attempts for failed reports.

**Default:** `3`

**Example:**
```json
"maxRetries": 5
```

**Notes:**
- Higher values = more persistent retries
- Uses exponential backoff between retries
- Failed reports are cached and retried later

#### cacheSize (number, optional)

**Description:** Maximum number of reports to cache when offline.

**Default:** `100`

**Example:**
```json
"cacheSize": 200
```

**Notes:**
- Prevents unlimited cache growth
- Oldest reports are discarded when limit is reached
- Each cached report is approximately 1-2 KB
- Recommended: 50-500 depending on available disk space

### Creating Configuration File

1. **Copy the example:**
   ```bash
   cd status-client
   cp config.example.json config.json
   ```

2. **Edit with your settings:**
   ```bash
   nano config.json
   # or
   vim config.json
   ```

3. **Validate JSON syntax:**
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
   ```

### Configuration Validation

The client validates configuration on startup:

- **Missing serverUrl:** Error - must be specified
- **Invalid reportInterval:** Warning - adjusted to minReportInterval
- **Invalid JSON:** Error - client won't start
- **Missing optional fields:** Info - defaults will be used

## Server Configuration

The server is configured using a `config.json` file in the `status-server` directory.

### Configuration File Location

```
status-server/config.json
```

### Example Configuration

```json
{
  "port": 3000,
  "dataRetentionDays": 30
}
```

### Configuration Options

#### port (number, optional)

**Description:** Port number for the HTTP server to listen on.

**Default:** `3000`

**Example:**
```json
"port": 8080
```

**Notes:**
- Must be available (not in use by another service)
- Ports below 1024 require root/admin privileges on Linux/macOS
- Common alternatives: 8080, 8000, 3001
- Update firewall rules when changing port

#### dataRetentionDays (number, optional)

**Description:** Number of days to retain historical status data.

**Default:** `30`

**Example:**
```json
"dataRetentionDays": 90
```

**Notes:**
- Older data is automatically deleted daily at midnight
- Client records are kept indefinitely
- Higher values = more disk space required
- Recommended: 7-90 days depending on needs

**Storage Estimates:**
- 1 client reporting every minute: ~50 MB/month
- 10 clients: ~500 MB/month
- 100 clients: ~5 GB/month

### Creating Configuration File

1. **Copy the example:**
   ```bash
   cd status-server
   cp config.example.json config.json
   ```

2. **Edit with your settings:**
   ```bash
   nano config.json
   ```

3. **Validate:**
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
   ```

## Frontend Configuration

The frontend is configured using environment variables.

### Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Configuration Options

#### NEXT_PUBLIC_API_URL (string, optional)

**Description:** Base URL of the monitoring server API.

**Default:** `http://localhost:3000`

**Example:**
```bash
NEXT_PUBLIC_API_URL=https://api.monitor.example.com
```

**Notes:**
- Must be accessible from user browsers
- Include protocol and port
- No trailing slash
- Use HTTPS in production

#### NEXT_PUBLIC_GA_ID (string, optional)

**Description:** Google Analytics tracking ID.

**Default:** None

**Example:**
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Notes:**
- Optional analytics integration
- Only used if specified

### Build-Time Configuration

For static exports, environment variables must be set during build:

```bash
NEXT_PUBLIC_API_URL=https://api.monitor.example.com npm run build
```

Or create `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://api.monitor.example.com
```

## Environment Variables

### Client Environment Variables

The client can also be configured using environment variables (overrides config.json):

```bash
# Server URL
MONITOR_SERVER_URL=http://monitor.example.com:3000

# Client name
MONITOR_CLIENT_NAME="Production Server 1"

# Report interval (milliseconds)
MONITOR_REPORT_INTERVAL=60000
```

**Priority:** Environment variables > config.json > defaults

### Server Environment Variables

```bash
# Server port
MONITOR_PORT=3000

# Data retention
MONITOR_DATA_RETENTION_DAYS=30

# Database path (optional)
MONITOR_DB_PATH=/var/lib/system-monitor/database.db
```

### Frontend Environment Variables

```bash
# API URL
NEXT_PUBLIC_API_URL=https://api.monitor.example.com

# Node environment
NODE_ENV=production
```

## Advanced Configuration

### Database Configuration (Server)

For advanced database configuration, modify `status-server/src/app.module.ts`:

```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: 'data/database.db',
  entities: [ClientEntity, StatusEntity, ConfigEntity],
  synchronize: true,
  logging: false, // Enable for debugging
  maxQueryExecutionTime: 1000, // Log slow queries
})
```

### CORS Configuration (Server)

To allow frontend from different domain, configure CORS in `status-server/src/main.ts`:

```typescript
app.enableCors({
  origin: ['https://dashboard.example.com'],
  methods: ['GET', 'POST'],
  credentials: true,
});
```

### Logging Configuration

#### Client Logging

Modify `status/client/src/utils/logger.ts`:

```typescript
export const logger = {
  level: 'info', // 'debug', 'info', 'warn', 'error'
  file: '/var/log/system-monitor-client.log',
  maxSize: '10m',
  maxFiles: 5,
};
```

#### Server Logging

Configure NestJS logger in `status-client/src/main.ts`:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'], // Add 'debug' for verbose
});
```

### Performance Tuning

#### Client Performance

```json
{
  "reportInterval": 60000,
  "cacheSize": 100,
  "maxRetries": 3,
  "timeout": 30000
}
```

#### Server Performance

```json
{
  "port": 3000,
  "dataRetentionDays": 30,
  "maxConnections": 100,
  "queryTimeout": 5000
}
```

## Common Issues

### Client Issues

**Issue:** Client won't start

**Solution:**
- Check config.json syntax with JSON validator
- Ensure serverUrl is specified
- Verify Node.js version (18+)

**Issue:** Reports not being sent

**Solution:**
- Verify serverUrl is correct and accessible
- Check network connectivity
- Review client logs for errors
- Ensure server is running

**Issue:** High CPU usage

**Solution:**
- Increase reportInterval
- Check for system-specific issues
- Review logs for errors

### Server Issues

**Issue:** Port already in use

**Solution:**
- Change port in config.json
- Stop conflicting service
- Use `lsof -i :3000` (Linux/macOS) or `netstat -ano | findstr :3000` (Windows)

**Issue:** Database errors

**Solution:**
- Check file permissions
- Verify disk space
- Check database file isn't corrupted

**Issue:** High memory usage

**Solution:**
- Reduce dataRetentionDays
- Check for memory leaks in logs
- Restart server periodically

### Frontend Issues

**Issue:** Can't connect to API

**Solution:**
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS configuration on server
- Ensure server is accessible from browser

**Issue:** Environment variables not working

**Solution:**
- Rebuild after changing .env files
- Use NEXT_PUBLIC_ prefix for client-side variables
- Check .env.local is in correct directory

## Configuration Best Practices

1. **Use descriptive names and tags** for easy identification
2. **Set appropriate report intervals** based on monitoring needs
3. **Configure data retention** based on storage capacity
4. **Use HTTPS** in production environments
5. **Backup configuration files** regularly
6. **Document custom configurations** for your team
7. **Test configuration changes** in development first
8. **Monitor resource usage** after configuration changes
9. **Use environment-specific configs** (dev, staging, prod)
10. **Secure sensitive configuration** with proper file permissions

## Configuration Templates

### High-Frequency Monitoring

```json
{
  "clientName": "Critical Production Server",
  "clientTags": ["production", "critical"],
  "serverUrl": "https://monitor.example.com",
  "reportInterval": 30000,
  "cacheSize": 200
}
```

### Low-Frequency Monitoring

```json
{
  "clientName": "Development Server",
  "clientTags": ["development"],
  "serverUrl": "http://monitor-dev.example.com:3000",
  "reportInterval": 300000,
  "cacheSize": 50
}
```

### High-Availability Setup

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

## Support

For configuration help:
- Review this guide thoroughly
- Check component-specific README files
- Consult the troubleshooting sections
- Create a GitHub issue with configuration details

## License

MIT