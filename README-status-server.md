# System Monitor Server

[中文文档](./README.zh-CN.md)

The monitoring server receives data from clients, stores it in a database, and provides a REST API for the frontend.

## Features

- RESTful API built with NestJS
- SQLite database with TypeORM
- Automatic client online/offline detection
- Configurable data retention policy
- Data validation and error handling
- Comprehensive logging
- Database connection retry mechanism
- Automatic cleanup of old data

## Installation

- If you choose to install under Windows, make sure you have the necessary components such as Python, Visual Studio build tools to install sqlite, or switch to linux for installation.

```bash
npm install
```

## Configuration

Create a `config.json` file in the server directory. See `config.example.json` for reference:

```json
{
  "port": 7788,
  "dataRetentionDays": 30
}
```

### Configuration Options

- **port**: Port number for the HTTP server (default: 7788)
- **dataRetentionDays**: Number of days to retain historical data (default: 30)

## Usage

### Development Mode

```bash
npm run start:dev
```

The server will start with hot-reload enabled.

### Production Mode

```bash
npm run build
npm run start:prod
```

### Build Only

```bash
npm run build
```

## API Endpoints

### Report Data

#### POST /api/reports

Receive monitoring data from clients.

**Request Body:**
```json
{
  "clientId": "uuid",
  "clientName": "Production Server 1",
  "clientTags": ["production", "web-server"],
  "clientPurpose": "Main web server",
  "hostname": "server1.example.com",
  "platform": "linux",
  "staticInfo": {
    "cpuModel": "Intel Core i7-9700K",
    "cpuCores": 8,
    "cpuArch": "x64",
    "systemVersion": "Ubuntu 22.04",
    "systemModel": "Dell PowerEdge",
    "totalMemory": 17179869184,
    "totalSwap": 8589934592,
    "totalDisk": 1099511627776,
    "diskType": "SSD",
    "location": "US-East"
  },
  "dynamicStatus": {
    "cpuUsage": 45.5,
    "cpuFrequency": 3.6,
    "memoryUsage": 62.3,
    "swapUsage": 10.5,
    "diskUsage": 55.8,
    "networkUpload": 1048576,
    "networkDownload": 5242880,
    "timestamp": 1703001234567
  }
}
```

**Response:**
```json
{
  "success": true
}
```

### Query Data

#### GET /api/clients

Get a list of all registered clients.

**Response:**
```json
[
  {
    "clientId": "uuid",
    "clientName": "Production Server 1",
    "clientTags": ["production", "web-server"],
    "clientPurpose": "Main web server",
    "hostname": "server1.example.com",
    "platform": "linux",
    "status": "online",
    "lastUpdate": 1703001234567
  }
]
```

#### GET /api/clients/:id

Get detailed information about a specific client.

**Response:**
```json
{
  "clientId": "uuid",
  "clientName": "Production Server 1",
  "clientTags": ["production", "web-server"],
  "clientPurpose": "Main web server",
  "hostname": "server1.example.com",
  "platform": "linux",
  "status": "online",
  "lastUpdate": 1703001234567,
  "staticInfo": {
    "cpuModel": "Intel Core i7-9700K",
    "cpuCores": 8,
    "cpuArch": "x64",
    "systemVersion": "Ubuntu 22.04",
    "systemModel": "Dell PowerEdge",
    "totalMemory": 17179869184,
    "totalSwap": 8589934592,
    "totalDisk": 1099511627776,
    "diskType": "SSD",
    "location": "US-East"
  },
  "currentStatus": {
    "cpuUsage": 45.5,
    "cpuFrequency": 3.6,
    "memoryUsage": 62.3,
    "swapUsage": 10.5,
    "diskUsage": 55.8,
    "networkUpload": 1048576,
    "networkDownload": 5242880,
    "timestamp": 1703001234567
  }
}
```

#### GET /api/clients/:id/history

Get historical data for a specific client.

**Query Parameters:**
- `startTime`: Start timestamp (milliseconds)
- `endTime`: End timestamp (milliseconds)

**Example:**
```
GET /api/clients/uuid/history?startTime=1703000000000&endTime=1703001234567
```

**Response:**
```json
[
  {
    "cpuUsage": 45.5,
    "cpuFrequency": 3.6,
    "memoryUsage": 62.3,
    "swapUsage": 10.5,
    "diskUsage": 55.8,
    "networkUpload": 1048576,
    "networkDownload": 5242880,
    "timestamp": 1703001234567
  }
]
```

## Database Schema

The server uses SQLite with the following schema:

### clients table

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| name | VARCHAR(255) | Client name |
| tags | TEXT | JSON array of tags |
| purpose | VARCHAR(500) | Client purpose |
| hostname | VARCHAR(255) | Hostname |
| platform | VARCHAR(20) | OS platform |
| cpu_model | VARCHAR(255) | CPU model |
| cpu_cores | INTEGER | Number of CPU cores |
| cpu_arch | VARCHAR(50) | CPU architecture |
| system_version | VARCHAR(255) | OS version |
| system_model | VARCHAR(255) | System model |
| total_memory | BIGINT | Total memory (bytes) |
| total_swap | BIGINT | Total swap (bytes) |
| total_disk | BIGINT | Total disk (bytes) |
| disk_type | VARCHAR(50) | Disk type |
| location | VARCHAR(255) | Geographic location |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### statuses table

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| client_id | VARCHAR(36) | Foreign key to clients |
| cpu_usage | DECIMAL(5,2) | CPU usage (0-100) |
| cpu_frequency | DECIMAL(5,2) | CPU frequency (GHz) |
| memory_usage | DECIMAL(5,2) | Memory usage (0-100) |
| swap_usage | DECIMAL(5,2) | Swap usage (0-100) |
| disk_usage | DECIMAL(5,2) | Disk usage (0-100) |
| network_upload | BIGINT | Upload speed (bytes/sec) |
| network_download | BIGINT | Download speed (bytes/sec) |
| timestamp | TIMESTAMP | Status timestamp |

### config table

| Column | Type | Description |
|--------|------|-------------|
| key | VARCHAR(100) | Primary key |
| value | TEXT | Configuration value |
| updated_at | TIMESTAMP | Last update timestamp |

## Architecture

```
┌─────────────────────────────────────┐
│         Controllers                 │
│ (ReportController, ClientController)│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Services                   │
│  (ClientService, ValidationService) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Repositories                 │
│ (ClientRepository, StatusRepository)│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database (SQLite)           │
└─────────────────────────────────────┘
```

## Error Handling

The server implements comprehensive error handling:

1. **Validation Errors**: Returns 400 Bad Request with detailed error messages
2. **Not Found**: Returns 404 when client doesn't exist
3. **Database Errors**: Returns 500 Internal Server Error with logged details
4. **Connection Errors**: Automatic retry with exponential backoff

All errors are logged with timestamps and stack traces.

## Data Cleanup

The server automatically cleans up old data based on the `dataRetentionDays` configuration:

- Runs daily at midnight
- Deletes status records older than the retention period
- Keeps client records indefinitely
- Logs cleanup operations

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## Deployment

### Using PM2

```bash
npm install -g pm2
npm run build
pm2 start dist/main.js --name system-monitor-server
pm2 save
pm2 startup
```

### Using Docker

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

Build and run:
```bash
docker build -t system-monitor-server .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data system-monitor-server
```

### Using systemd (Linux)

Create `/etc/systemd/system/system-monitor-server.service`:

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
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=system-monitor-server

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable system-monitor-server
sudo systemctl start system-monitor-server
```

## Performance Considerations

- **Database Indexing**: Indexes on `client_id` and `timestamp` for fast queries
- **Connection Pooling**: TypeORM manages database connections efficiently
- **Async Operations**: All I/O operations are asynchronous
- **Data Cleanup**: Automatic cleanup prevents database bloat

## Security

- **Input Validation**: All inputs are validated before processing
- **SQL Injection**: TypeORM prevents SQL injection attacks
- **Error Messages**: Sensitive information is not exposed in error messages
- **CORS**: Configure CORS for production deployments

## Monitoring

Monitor the server with:

- **Logs**: Check application logs for errors and warnings
- **Database Size**: Monitor SQLite file size
- **API Response Times**: Track endpoint performance
- **Client Count**: Monitor number of active clients

## Troubleshooting

### Server won't start

- Check that the port is not already in use
- Verify configuration file is valid JSON
- Check file permissions for database directory

### Database errors

- Ensure write permissions for database file
- Check disk space
- Verify SQLite is properly installed

### High memory usage

- Reduce `dataRetentionDays` to store less data
- Check for memory leaks in logs
- Monitor number of concurrent clients

### Slow queries

- Check database indexes
- Reduce query time ranges
- Consider upgrading to PostgreSQL for large deployments

## Requirements

- Node.js 18 or higher
- SQLite 3
- Sufficient disk space for database
- Network access for API endpoints

## License

MIT 
