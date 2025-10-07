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
- (Optional) Node.js 24+ for local development

## Docker Compose Installation (Recommended)

The easiest way to run PulseStage is with Docker Compose using published images.

### 1. Clone Repository

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
```

### 2. Configure Environment

Run the setup script to generate secure configuration:

```bash
./setup.sh
```

This automatically:
- Creates `.env` file with all required settings
- Generates secure random secrets using OpenSSL
- Sets up database and Redis URLs
- Configures ports and CORS

**Manual Setup (Alternative)**:

If you prefer manual configuration:

```bash
cp env.example .env
```

Then edit `.env` and set:
- `SESSION_SECRET` - Random 32+ character string (generate with: `openssl rand -base64 32`)
- `ADMIN_SESSION_SECRET` - Different random 32+ character string
- `CSRF_SECRET` - Another random 32+ character string
- `ADMIN_KEY` - Admin authentication key (change from default!)
- `CORS_ORIGIN` - Your frontend URL (default: http://localhost:5173)

### 3. Start Services

```bash
docker compose up -d
```

This pulls and runs the latest published images from GitHub Container Registry:
- [pulsestage-api:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-api)
- [pulsestage-web:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-web)

### 4. Complete Setup Wizard

The API auto-creates a default tenant on first startup. Open your browser:

```
http://localhost:5173
```

You'll see the **Setup Wizard** which guides you through:
- **Load Demo Data** - Pre-configured teams, users, and sample questions
- **Create Organization** - Start fresh with your own setup

See the [Quick Start Guide](quick-start.md#setup-wizard) for detailed wizard instructions.

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

- **Web UI**: http://localhost:5173
- **API**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api-docs
- **SSO Test Page**: http://localhost:5173/sso-test.html

## Local Development Installation

For active development with hot reload and local builds:

### Prerequisites

```bash
node --version  # Should be 24.x
npm --version   # Should be 10.x
```

### 1. Clone and Install

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage

# Use Makefile for convenience
make setup     # Generate .env
make install   # Install dependencies
```

**Manual installation:**
```bash
# Install API dependencies
cd api
npm install

# Install Web dependencies
cd ../web
npm install
```

### 2. Start Development Environment

```bash
make dev
```

This starts all services with local builds and hot reload enabled.

**Manual start:**
```bash
# Start with local builds
docker compose -f docker-compose.yaml -f docker-compose.override.yaml up -d
```

### 3. Load Demo Data (Optional)

```bash
make db-seed
```

This loads the same demo data as the setup wizard for development purposes.

**Manual seeding:**
```bash
docker compose exec api npm run db:seed:full
docker compose restart api  # Reload mock SSO users
```

### 4. Access Development Environment

- **Web UI**: http://localhost:5173 (Vite dev server with HMR)
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs

### Development Workflow

See **[DEVELOPMENT.md](../../DEVELOPMENT.md)** for the complete development guide, including:
- Testing workflow
- Pre-push validation
- Common tasks
- Troubleshooting

## Production Deployment

See [Deployment Guide](../deployment/production.md) for production setup instructions.

**Key differences for production:**
- Use strong, unique secrets in `.env`
- Change `ADMIN_KEY` from default
- Enable HTTPS with proper certificates
- Configure proper SSO provider (not Mock SSO)
- Set `NODE_ENV=production`
- Use production-grade PostgreSQL (managed service)
- Configure backups and monitoring

## Troubleshooting

### Port Conflicts

If ports are already in use, modify `docker-compose.yaml`:

```yaml
services:
  web:
    ports:
      - "8080:80"  # Change external port 5173 to 8080
  
  api:
    ports:
      - "3001:3000"  # Change external port 3000 to 3001
```

Then update `CORS_ORIGIN` in `.env` to match your new web port.

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

**Warning**: This deletes all data! Use only for development.

### Setup Wizard Issues

If the setup wizard doesn't appear:

1. **Clear browser cache/localStorage**:
   - Open DevTools (F12)
   - Application → Local Storage → Clear All
   - Refresh page

2. **Or use incognito/private window**

3. **Check if teams already exist**:
   ```bash
   docker compose exec db psql -U app -d ama -c "SELECT COUNT(*) FROM \"Team\";"
   ```

### Permission Errors

On Linux, you may need to fix file permissions:

```bash
sudo chown -R $USER:$USER .
```

### Services Won't Start

Check Docker logs:

```bash
# All services
docker compose logs

# Specific service
docker compose logs api
docker compose logs db
```

Common issues:
- Ports already in use (see Port Conflicts above)
- Insufficient RAM (need at least 2GB)
- Docker daemon not running

## Upgrading

To upgrade to the latest version:

```bash
# Pull latest images
docker compose pull

# Restart services
docker compose up -d

# Database migrations are applied automatically on startup
```

For local development builds:

```bash
git pull origin main
make install  # Update dependencies
make dev      # Rebuild and restart
```

## Uninstalling

To completely remove PulseStage:

```bash
# Stop and remove all containers and volumes
docker compose down -v

# Remove images (optional)
docker rmi ghcr.io/seanmdalton/pulsestage-api:latest
docker rmi ghcr.io/seanmdalton/pulsestage-web:latest

# Remove repository
cd ..
rm -rf pulsestage
```

## Next Steps

- [Quick Start](quick-start.md) - Get running quickly
- [Configuration Guide](configuration.md) - Environment variables
- [First Steps](first-steps.md) - Getting started with PulseStage
- [Development Setup](../development/setup.md) - For contributors
