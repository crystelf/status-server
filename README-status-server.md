# System Monitor Server

The monitoring server receives data from clients, stores it in a database, and provides a REST API for the frontend.

## Features

- RESTful API built with NestJS
- JSON file-based storage system
- Automatic client online/offline detection
- Configurable data retention policy
- Data validation and error handling
- Comprehensive logging
- File system retry mechanism
- Automatic cleanup of old data

## Installation

```bash
npm install
```

**Note**: The server uses JSON file-based storage, so no database installation is required.

## Configuration

Create a `config.json` file in the server directory. See `config.example.json` for reference:

```bash
cp config.example.json config.json
nano config.json
```

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

### Production Mode(recommended)

```bash
npm run build
npm run start:prod
```

### Build Only

```bash
npm run build
```

### Development Mode

```bash
npm run start:dev
```

The server will start with hot-reload enabled.

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

## Data Storage

The server uses JSON file-based storage with the following structure:

### Storage Directory Structure

```
data/
└── json-storage/
    ├── clients.json      # Client information
    ├── statuses.json     # Status records
    ├── configs.json      # Configuration data
    ├── diskInfos.json    # Disk information
    └── diskUsages.json   # Disk usage records
```

### Data Formats

#### clients.json
```json
[
  {
    "id": "uuid",
    "name": "Client Name",
    "tags": ["tag1", "tag2"],
    "purpose": "Client Purpose",
    "hostname": "hostname",
    "platform": "linux",
    "cpuModel": "Intel Core i7",
    "cpuCores": 8,
    "cpuArch": "x64",
    "systemVersion": "Ubuntu 22.04",
    "systemModel": "Dell PowerEdge",
    "totalMemory": 17179869184,
    "totalSwap": 8589934592,
    "totalDisk": 1099511627776,
    "location": "US-East",
    "createdAt": "2023-12-01T00:00:00.000Z",
    "updatedAt": "2023-12-01T12:00:00.000Z"
  }
]
```

#### statuses.json
```json
[
  {
    "id": "uuid",
    "clientId": "client-uuid",
    "cpuUsage": 45.5,
    "cpuFrequency": 3.6,
    "memoryUsage": 62.3,
    "swapUsage": 10.5,
    "diskUsage": 55.8,
    "networkUpload": 1048576,
    "networkDownload": 5242880,
    "timestamp": "2023-12-01T12:00:00.000Z"
  }
]
```

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
│      JSON Storage Service           │
│    (File-based JSON storage)       │
└─────────────────────────────────────┘
```

## Error Handling

The server implements comprehensive error handling:

1. **Validation Errors**: Returns 400 Bad Request with detailed error messages
2. **Not Found**: Returns 404 when client doesn't exist
3. **File System Errors**: Returns 500 Internal Server Error with logged details
4. **I/O Errors**: Automatic retry with exponential backoff

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

## Performance Considerations

- **File Caching**: JSON files are cached in memory for faster access
- **Async Operations**: All file I/O operations are asynchronous
- **Data Cleanup**: Automatic cleanup prevents file bloat
- **Efficient Filtering**: In-memory filtering for fast queries

## Security

- **Input Validation**: All inputs are validated before processing
- **File Access**: Secure file operations with proper error handling
- **Error Messages**: Sensitive information is not exposed in error messages
- **CORS**: Configure CORS for production deployments

## Monitoring

Monitor the server with:

- **Logs**: Check application logs for errors and warnings
- **Storage Size**: Monitor JSON file sizes in `data/json-storage/`
- **API Response Times**: Track endpoint performance
- **Client Count**: Monitor number of active clients

## Troubleshooting

### Server won't start

- Check that the port is not already in use
- Verify configuration file is valid JSON
- Check file permissions for `data/` directory

### Storage errors

- Ensure write permissions for `data/json-storage/` directory
- Check disk space
- Verify JSON file integrity

### High memory usage

- Reduce `dataRetentionDays` to store less data
- Check for memory leaks in logs
- Monitor number of concurrent clients
- Consider restarting the server periodically for large datasets

### Slow queries

- Monitor JSON file sizes
- Reduce query time ranges
- Consider implementing data pagination for large datasets

## Requirements

- Node.js 18 or higher
- Sufficient disk space for JSON storage files
- Write permissions for `data/` directory
- Network access for API endpoints

## License

MIT 
