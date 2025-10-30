# Production Deployment Configuration

## Server Setup
- **Frontend**: http://195.35.2.209:3001
- **Backend**: http://195.35.2.209:3002

## Deployment Steps

### 1. Build Production Version
```bash
deploy-production.bat
```
This will:
- Set environment variables
- Build the React app with production URLs
- Create optimized build in `build/` folder

### 2. Start Production Server
```bash
start-production.bat
```
This will:
- Serve the built React app on port 3001
- Use the production backend on port 3002

### 3. Manual Commands
```bash
# Build for production
npm run build:production

# Serve production build
npm run serve:production

# Or manually serve
serve -s build -l 3001
```

## Environment Variables
- `REACT_APP_API_URL=http://195.35.2.209:3002`
- `REACT_APP_SOCKET_URL=http://195.35.2.209:3002`
- `NODE_ENV=production`

## Port Configuration
- Development: Uses default React port (3000) or 3001 with `start:dev`
- Production: Serves on port 3001 using `serve` package

## Socket.IO Configuration
- Production-optimized connection settings
- Increased timeout and retry attempts
- Better error handling and reconnection logic
