# Development Setup

This guide covers setting up PulseStage for local development.

## Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Git
- OpenSSL (for generating secrets)

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
./setup.sh
```

### 2. Start Services for Development

For development with local builds and hot reload:

```bash
docker compose -f docker-compose.dev.yaml up -d
```

Or to use published images (like production):

```bash
docker compose up -d
```

### 3. Load Test Data

**With published images:**
```bash
docker compose exec api npm run db:seed:full
```

**With local builds:**
```bash
docker compose -f docker-compose.dev.yaml exec api npm run db:seed:dev
docker compose -f docker-compose.dev.yaml exec api npm run db:seed:tags:dev
docker compose -f docker-compose.dev.yaml exec api node load-comprehensive-test-data.js
```

**Or run directly on host (if you have Node.js and dependencies installed):**
```bash
cd api
npm install
npm run db:seed:dev
npm run db:seed:tags:dev
node load-comprehensive-test-data.js
```

### 4. Access Development Environment

- Web: http://localhost:5173
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

## Database Seeding

PulseStage includes several npm scripts for database seeding:

| Script | Description | Use Case |
|--------|-------------|----------|
| `npm run db:seed` | Basic seed: tenants, teams, and users | Published images (compiled JS) |
| `npm run db:seed:tags` | Add default tags only | Published images (compiled JS) |
| `npm run db:seed:full` | Full seed with 100+ realistic questions | Published images (compiled JS) |
| `npm run db:seed:dev` | Basic seed from TypeScript source | Local development |
| `npm run db:seed:tags:dev` | Add tags from TypeScript source | Local development |

**With published images (from container):**
```bash
docker compose exec api npm run db:seed:full
```

**With local development:**
```bash
cd api
npm run db:seed:dev
npm run db:seed:tags:dev
node load-comprehensive-test-data.js
```

## Docker Compose Files

PulseStage includes two Docker Compose configurations:

| File | Purpose | Usage |
|------|---------|-------|
| `docker-compose.yaml` | Published images | Quick start, production-like testing |
| `docker-compose.dev.yaml` | Local builds | Active development with hot reload |

### Using Published Images

```bash
docker compose up -d
```

Uses the latest images from GitHub Container Registry:
- [pulsestage-api:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-api)
- [pulsestage-web:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-web)

### Using Local Builds

```bash
docker compose -f docker-compose.dev.yaml up -d
```

Builds from local source with volume mounts for hot reload.

## Development Workflow

### Running Tests

```bash
# API tests
cd api
npm test

# API tests with coverage
npm run test:coverage

# API tests in watch mode
npm run test:watch

# E2E tests (requires services running)
cd web
npm run test:e2e
```

### Code Quality

```bash
# Run pre-push checks (tests + security scans)
./run-tests.sh

# Test security headers and configuration
./test-security.sh
```

### Database Management

```bash
cd api

# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Development Tips

### Hot Reload

Both API and web support hot reload:

```bash
# API with auto-restart
cd api
npm run dev

# Web with Vite HMR
cd web
npm run dev
```

### Mock SSO

In development, authentication uses mock SSO. Access the test page to switch users:

```
http://localhost:5173/sso-test.html
```

### Inspecting Logs

```bash
# View all service logs
docker compose logs -f

# View specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
```

### Resetting Database

```bash
# Complete reset (published images)
docker compose down -v
docker compose up -d
docker compose exec api npm run db:seed:full

# Complete reset (local builds)
docker compose -f docker-compose.dev.yaml down -v
docker compose -f docker-compose.dev.yaml up -d
docker compose -f docker-compose.dev.yaml exec api npm run db:seed:dev
docker compose -f docker-compose.dev.yaml exec api npm run db:seed:tags:dev
```

## Common Issues

### Port Already in Use

Change ports in `docker-compose.yaml` and update `.env` accordingly.

### Database Connection Failed

Ensure PostgreSQL is running:
```bash
docker compose ps db
docker compose logs db
```

### Redis Connection Failed

Check Redis status:
```bash
docker compose ps redis
docker compose logs redis
```

## Next Steps

- [Running Locally](running-locally.md) - Detailed development guide
- [Testing](testing.md) - Testing strategies and practices
- [Contributing](contributing.md) - How to contribute
