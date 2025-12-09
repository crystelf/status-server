# System Monitor

[中文文档](./README.zh-CN.md)

A distributed real-time system monitoring solution with a modern web interface. Monitor CPU, memory, disk, network, and swap usage across multiple servers from a single dashboard.

## Features

- 🖥️ **Cross-Platform Client** - Monitor Windows, Linux, and macOS systems
- 📊 **Real-Time Monitoring** - Live system metrics with automatic updates
- 🎨 **Modern UI** - Beautiful, responsive interface with light/dark themes
- 🏷️ **Tagging & Grouping** - Organize servers with custom tags and purposes
- 📈 **Historical Data** - View trends with interactive charts
- 🔄 **Offline Resilience** - Clients cache data when disconnected
- 🚀 **Easy Deployment** - Simple service installation on all platforms

## Architecture

The system consists of three components:

1. **Client** - Lightweight agent that collects system metrics and reports to the server
2. **Server** - NestJS backend that receives data and provides REST API
3. **Frontend** - Next.js web application for visualization

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │◀────│  Frontend   │
│  (Agent)    │     │  (NestJS)   │     │  (Next.js)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### 1. Start the Server

```bash
cd status-server
npm install
cp config.example.json config.json
# Edit config.json with your settings
npm run build
npm start
```

The server will start on `http://localhost:7788` by default.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run build
npm start
```

The frontend will be available at `http://localhost:3001`.

### 3. Deploy Clients

On each system you want to monitor:

```bash
cd status-clients
npm install
cp config.example.json config.json
# Edit config.json with server URL and client details
npm run build
npm start
```

For production deployment as a service, see [Client Deployment Guide](./backend/client/DEPLOYMENT.md).

## Configuration

### Client Configuration

Create `status-client/config.json`:

```json
{
  "clientName": "Production Server 1",
  "clientTags": ["production", "web-server", "us-east"],
  "clientPurpose": "Main web application server",
  "serverUrl": "http://your-server:7788",
  "reportInterval": 60000
}
```

### Server Configuration

Create `status-server/config.json`:

```json
{
  "port": 7788,
  "dataRetentionDays": 30
}
```

## Documentation

- [Client README](https://github.com/crystelf/status-client/README.md) - Client features and usage
- [Client Deployment Guide](https://github.com/crystelf/status-client/DEPLOYMENT.md) - Service installation for Windows, Linux, macOS
- [Server README](./README-status-server.md) - Server API and configuration
- [Frontend README](https://github.com/crystelf/status-fronted/README.md) - Frontend features and development

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Server Framework**: NestJS
- **Database**: SQLite (TypeORM)
- **System Info**: systeminformation

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Icons**: Lucide React

## Development

### Install Dependencies

```bash
# Install all dependencies
cd status-client && npm install
cd status-server && npm install
cd status-frontend && npm install
```

### Run in Development Mode

```bash
# Terminal 1 - Server
cd status-server
npm run start:dev

# Terminal 2 - Frontend
cd status-frontend
npm run dev

# Terminal 3 - Client
cd status-client
npm run dev
```

### Run Tests

```bash
# Client tests
cd status-client
npm test

# Server tests
cd status-server
npm test
```

## API Endpoints

### Report Data
- `POST /api/reports` - Receive client data

### Query Data
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client details
- `GET /api/clients/:id/history` - Get historical data

## Monitoring Metrics

### Static Information
- CPU model, cores, architecture
- System version and model
- Total memory and swap
- Total disk capacity and type
- Geographic location

### Dynamic Status
- CPU usage and frequency
- Memory and swap usage
- Disk usage
- Network upload/download speed
- Timestamp

## Features in Detail

### Client Features
- ✅ Cross-platform system information collection
- ✅ Configurable reporting intervals
- ✅ Automatic retry with exponential backoff
- ✅ Local caching for offline resilience
- ✅ Comprehensive error logging
- ✅ Service installation scripts

### Server Features
- ✅ RESTful API with NestJS
- ✅ SQLite database with TypeORM
- ✅ Data validation and error handling
- ✅ Automatic data cleanup (configurable retention)
- ✅ Client online/offline detection
- ✅ Historical data queries

### Frontend Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Light/dark theme with system detection
- ✅ Real-time data updates
- ✅ Interactive charts with Recharts
- ✅ Tag-based filtering
- ✅ Grouping by tags, purpose, or platform
- ✅ Smooth animations with Framer Motion
- ✅ Virtualized scrolling for large datasets

## Deployment

### Production Deployment

1. **Server**: Deploy with Docker or PM2
2. **Frontend**: Build static export or deploy with Vercel/Netlify
3. **Clients**: Install as system services (see [Deployment Guide](https://github.com/crystelf/status-client/DEPLOYMENT.md))

### Docker Deployment (Server)

```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## Security Considerations

- Use HTTPS for production deployments
- Implement API authentication (JWT/API keys)
- Restrict database access
- Configure firewall rules
- Keep dependencies updated
- Use environment variables for sensitive config

## Troubleshooting

### Client Issues
- **Won't start**: Check config.json syntax and server URL
- **Not reporting**: Verify network connectivity and server status
- **High CPU**: Increase reportInterval in config

### Server Issues
- **Database errors**: Check file permissions and disk space
- **Port in use**: Change port in config or stop conflicting service
- **Memory issues**: Reduce dataRetentionDays or upgrade hardware

### Frontend Issues
- **Can't connect**: Verify server URL and CORS settings
- **Slow performance**: Enable virtualization for large client lists
- **Theme issues**: Clear browser cache and localStorage

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Check the documentation in each component's README
- Review the [Deployment Guide](https://github.com/crystelf/status-client/DEPLOYMENT.md)
- Check existing GitHub issues
- Create a new issue with detailed information

---

Built with ❤️ using Node.js, NestJS, and Next.js
