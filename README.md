# System Monitor

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
- **npm** or pnpm(problems may arise)

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
cd status-fronted
npm install
cp config.example.json config.json
# Edit config.json with your backend API URL
npm run build
npm start
```

The frontend will be available at `http://localhost:7777`.

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
  "dataRetentionDays": 30,
  "cors": true
}
```

**CORS Configuration Options:**
- `"cors": false` - Disable CORS completely
- `"cors": true` - Enable CORS for all origins (useful for development)
- `"cors": ["http://localhost:7777", "https://yourdomain.com"]` - Enable CORS for specific origins (recommended for production)

**Note:** If you're running frontend and backend on different ports (e.g., frontend on 7777, backend on 7788), make sure to configure CORS properly to avoid CORS errors.

## Documentation

- [Client README](https://github.com/crystelf/status-client/blob/main/README.md) - Client features and usage
- [Client Deployment Guide](https://github.com/crystelf/status-client/blob/main/DEPLOYMENT.md) - Service installation for Windows, Linux, macOS
- [Server README](./README-status-server.md) - Server API and configuration
- [Frontend README](https://github.com/crystelf/status-fronted/blob/main/README.md) - Frontend features and development

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
- **CORS errors**: Configure the `cors` option in server's `config.json`. For development, set `"cors": true` to allow all origins. For production, specify allowed origins: `"cors": ["https://yourdomain.com"]`
- **Slow performance**: Enable virtualization for large client lists
- **Theme issues**: Clear browser cache and localStorage

### CORS Configuration

If you encounter CORS errors when connecting frontend to backend:

1. **Development mode**: Set `"cors": true` in `status-server/config.json` to allow all origins
2. **Production mode**: Specify allowed origins:
   ```json
   {
     "cors": ["https://your-frontend-domain.com"]
   }
   ```
3. **Disable CORS**: Set `"cors": false` if you're using a reverse proxy or handling CORS elsewhere

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
- Check existing GitHub issues
- Create a new issue with detailed information

---

Built with ❤️ using Node.js, NestJS, and Next.js
