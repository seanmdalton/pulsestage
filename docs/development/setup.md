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

### 2. Start Services

```bash
docker compose up -d
```

### 3. Load Test Data

```bash
cd api
npm install
npm run db:seed:full
```

### 4. Access Development Environment

- Web: http://localhost:5173
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

## Database Seeding

PulseStage includes several npm scripts for database seeding:

| Script | Description |
|--------|-------------|
| `npm run db:seed` | Basic seed: tenants, teams, and users |
| `npm run db:seed:tags` | Add default tags only |
| `npm run db:seed:full` | Full seed with 100+ realistic questions |

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
# Complete reset
docker compose down -v
docker compose up -d
cd api && npm run db:seed:full
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
