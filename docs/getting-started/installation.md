# Installation Guide

This guide provides detailed instructions for installing PulseStage in various environments.

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 2GB
- **Disk**: 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

### Software Requirements
- Docker 20.10+ and Docker Compose 2.0+
- Git 2.30+
- (Optional) Node.js 20+ for local development

## Docker Compose Installation (Recommended)

The easiest way to run PulseStage is with Docker Compose.

### 1. Clone Repository

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
```

### 2. Configure Environment

```bash
./setup.sh
```

Or manually create `.env`:

```bash
cp env.example .env
```

Edit `.env` and set:
- `SESSION_SECRET` - Random 32+ character string
- `ADMIN_SESSION_SECRET` - Different random 32+ character string
- `CORS_ORIGIN` - Your frontend URL (default: http://localhost:3000)

### 3. Start Services

```bash
docker compose up -d
```

### 4. Initialize Database

The database is automatically initialized with:
- Default tenant
- Sample teams
- Test users

### 5. Verify Installation

Check all services are running:

```bash
docker compose ps
```

Expected output:
```
NAME                IMAGE               STATUS
ama-app-api-1       ama-app-api         Up
ama-app-db-1        postgres:16-alpine  Up
ama-app-redis-1     redis:7-alpine      Up
ama-app-web-1       ama-app-web         Up
```

### 6. Access Application

- **Web UI**: http://localhost:3000
- **API**: http://localhost:5001
- **API Docs**: http://localhost:5001/api-docs

## Local Development Installation

For active development without Docker:

### Prerequisites

```bash
node --version  # Should be 20.x
npm --version   # Should be 10.x
```

### 1. Install Dependencies

```bash
# Install API dependencies
cd api
npm install

# Install Web dependencies
cd ../web
npm install
```

### 2. Start External Services

```bash
# Start PostgreSQL and Redis via Docker
docker compose up db redis -d
```

### 3. Configure Environment

```bash
cp env.example .env
# Edit .env with your settings
```

### 4. Run Database Migrations

```bash
cd api
npx prisma migrate dev
npx prisma db seed
```

### 5. Start Development Servers

In separate terminals:

```bash
# Terminal 1: API server
cd api
npm run dev

# Terminal 2: Web frontend
cd web
npm run dev
```

### 6. Access Development Environment

- **Web UI**: http://localhost:5173 (Vite dev server)
- **API**: http://localhost:5001

## Production Deployment

See [Deployment Guide](../deployment/production.md) for production setup instructions.

## Troubleshooting

### Port Conflicts

If ports 3000 or 5001 are already in use, modify `docker-compose.yaml`:

```yaml
services:
  web:
    ports:
      - "8080:80"  # Change 3000 to 8080
  
  api:
    ports:
      - "5002:5001"  # Change 5001 to 5002
```

### Database Connection Errors

Check PostgreSQL is running:

```bash
docker compose logs db
```

Reset database if needed:

```bash
docker compose down -v
docker compose up -d
```

### Permission Errors

On Linux, you may need to fix file permissions:

```bash
sudo chown -R $USER:$USER .
```

## Next Steps

- [Configuration Guide](configuration.md) - Environment variables
- [First Steps](first-steps.md) - Getting started with PulseStage
- [Development Setup](../development/setup.md) - For contributors
