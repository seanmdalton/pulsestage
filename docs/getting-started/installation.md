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

This pulls and runs the latest published images from GitHub Container Registry.

### 4. Initialize Database

The database is automatically initialized on first startup with:
- Default tenant
- Sample teams (Engineering, People, Product, etc.)
- Test users with different roles
- Basic data structures

**Load Additional Test Data (Optional)**:

For comprehensive testing with realistic data, execute in the API container:

```bash
# Full comprehensive data load
docker compose exec api npm run db:seed:full

# Or individually:
docker compose exec api npm run db:seed        # Teams and users only
docker compose exec api npm run db:seed:tags   # Add tags only
```

This adds:
- 100+ sample questions across all teams
- Answered questions with responses
- Tags (Currently Presenting, Urgent, Feature Request, etc.)
- Upvotes and interactions

**Note**: When using published images, seed scripts run from the compiled `dist` folder inside the container.

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
npx prisma db push
npm run db:seed
```

**Note**: We use `prisma db push` for development. For production, use proper migrations with `prisma migrate deploy`.

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
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs

## Production Deployment

See [Deployment Guide](../deployment/production.md) for production setup instructions.

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

### Permission Errors

On Linux, you may need to fix file permissions:

```bash
sudo chown -R $USER:$USER .
```

## Next Steps

- [Configuration Guide](configuration.md) - Environment variables
- [First Steps](first-steps.md) - Getting started with PulseStage
- [Development Setup](../development/setup.md) - For contributors
