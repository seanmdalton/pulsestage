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

### 2. Start Infrastructure

Start PostgreSQL and Redis via Docker:

```bash
docker compose up db redis -d
```

### 3. Install Dependencies and Setup Database

```bash
# API dependencies
cd api
npm install
npx prisma db push
npm run db:seed:dev

# Web dependencies
cd ../web
npm install
```

### 4. Start Development Servers

In separate terminals:

```bash
# Terminal 1: API with hot reload
cd api
npm run dev

# Terminal 2: Web with Vite HMR
cd web
npm run dev
```

### 5. Access Development Environment

- **Web**: http://localhost:5173 (Vite dev server with HMR)
- **API**: http://localhost:3000 (ts-node-dev with auto-restart)
- **API Docs**: http://localhost:3000/api-docs

## Database Seeding

| Script | Description | Use Case |
|--------|-------------|----------|
| `npm run db:seed:dev` | Basic seed: tenants, teams, users | Local development |
| `npm run db:seed:tags:dev` | Add default tags | Local development |
| `npm run db:seed` | Compiled JS version | Docker containers |
| `npm run db:seed:full` | Full demo data | Docker containers |

**For local development:**
```bash
cd api
npm run db:seed:dev
npm run db:seed:tags:dev
node load-comprehensive-test-data.js
```

**For Docker testing:**
```bash
docker compose up -d
docker compose exec api npm run db:seed:full
```

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

### Working with Docker Compose

For testing production-like setup with published images:

```bash
docker compose up -d
```

This uses the latest images from GitHub Container Registry:
- [pulsestage-api:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-api)
- [pulsestage-web:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-web)

**Auto-bootstrap**: The API automatically creates a default tenant on first startup if the database is empty.

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

**For local development:**
```bash
cd api
npx prisma db push --force-reset
npm run db:seed:dev
```

**For Docker:**
```bash
docker compose down -v
docker compose up -d
docker compose exec api npm run db:seed:full
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
