# Operations (Runbook)

## Services Architecture

### Development Services

PulseStage development uses Docker Compose to orchestrate 5 services:

#### 1. API Server
- **Image**: `ghcr.io/seanmdalton/pulsestage-api:latest` (or local `pulsestage-api:latest`)
- **Port**: 3000
- **Technology**: Node.js + Express + Prisma
- **Dependencies**: PostgreSQL (required), Redis (optional in dev)
- **Hot Reload**: Enabled via volume mounts

#### 2. Web Frontend
- **Image**: `ghcr.io/seanmdalton/pulsestage-web:latest` (or local `pulsestage-web:latest`)
- **Port**: 5173
- **Technology**: Vite + React + TypeScript
- **Hot Reload**: Enabled
- **API URL**: `http://localhost:3000`

#### 3. PostgreSQL Database
- **Image**: `postgres:16-alpine`
- **Port**: 5432
- **Database**: `ama`
- **User/Password**: `app/app` (development only)
- **Persistence**: Docker volume `pgdata`

#### 4. Redis (Optional in Dev)
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Purpose**: 
  - Session storage (optional in dev, uses memory fallback)
  - Rate limiting (disabled in dev)
  - Email queue (optional in dev)
- **Note**: Not required for basic development

#### 5. Mailpit (Development Only)
- **Image**: `axllent/mailpit:latest`
- **Ports**: 
  - 8025 (Web UI for viewing emails)
  - 1025 (SMTP server)
- **Purpose**: Local email testing (captures all outbound emails)
- **Web UI**: `http://localhost:8025`
- **Not used in production** - Replace with real SMTP or Resend

### Production Services

Production deployments require:

1. **API Server** (Node.js)
   - Redis REQUIRED (sessions + rate limiting + email queue)
   - OAuth configured (GitHub/Google)
   - HTTPS enabled

2. **Web Frontend** (Static files via nginx)
   - Served via CDN or nginx
   - Environment variables baked at build time

3. **PostgreSQL** (Managed database recommended)
   - AWS RDS, Google Cloud SQL, or self-hosted
   - Automated backups
   - Connection pooling

4. **Redis** (Managed cache recommended)
   - AWS ElastiCache, Google Memorystore, or self-hosted
   - Persistence enabled
   - REQUIRED for production

5. **Email Service**
   - SMTP server (self-hosted or provider)
   - OR Resend (recommended)
   - Mailpit NOT used in production

---

## Development vs Production

| Feature | Development | Production |
|---------|------------|------------|
| **API Server** | Docker (hot reload) | Kubernetes/ECS/VM |
| **Web Frontend** | Vite dev server (port 5173) | Nginx static files |
| **PostgreSQL** | Docker (postgres:16-alpine) | Managed database (RDS, etc.) |
| **Redis** | Optional (Docker) | Required (ElastiCache, etc.) |
| **Email** | Mailpit (local capture) | SMTP or Resend (live delivery) |
| **Authentication** | Demo mode enabled | OAuth only (GitHub/Google) |
| **Rate Limiting** | Disabled | Enabled (Redis-based) |
| **Sessions** | Memory store | Redis store |
| **HTTPS** | Optional | Required |

---

## Development Environment

### Local Docker Build System
- `make build` - Build local Docker images (`pulsestage-api:latest`, `pulsestage-web:latest`)
- `docker-compose.yaml` - Production config (references `ghcr.io` images)
- `docker-compose.override.yaml` - Development override (uses local image tags)
- Purpose: Security scanning with Trivy on local builds before push

### Key Commands
- `make preflight` - [REQUIRED] Validate entire dev environment before user testing
- `make validate-ci` - Run ALL CI checks locally (tests, linting, formatting, security)
- `make dev` - Start development (foreground, hot reload)
- `make up` - Start services in background (hot reload)
- `make down` - Stop all services
- `make db-seed` - Reset & seed all data (idempotent)
- `make security` - Run Trivy scans on local images

### Demo Mode (Development Only)
- **Endpoint**: `GET /auth/demo?user={username}&tenant={tenant}`
- **Demo users**: `admin`, `alice`, `bob`, `moderator`
- **Email format**: `{username}@pulsestage.app`
- **SSO IDs**: Same as username (e.g., `admin`, not `demo-admin`)
- **Demo data**: 50 users, 2 teams (Engineering, Product), 12 weeks pulse history
- **NOT available in production** (security requirement)

### Email Testing with Mailpit
- **Web UI**: `http://localhost:8025` - View all captured emails
- **SMTP Server**: `localhost:1025` - Application sends here
- **Purpose**: Test email templates and delivery without sending real emails
- **All emails captured locally** - Nothing sent externally
- **Mailpit is development-only** - Not used in production

### Rate Limiting in Development
- **Status**: Disabled (for ease of development)
- **Reason**: Allows rapid testing without hitting limits
- **Production**: Rate limiting REQUIRED (Redis-based, per-tenant/IP)
- **See**: `/handbook/SECURITY_MODEL.md` for rate limit details

---

## Health Probes

### Endpoints
- **`GET /health`** - Basic health check (always returns 200 if process alive)
- **`GET /health/live`** - Liveness probe (Kubernetes-compatible)
- **`GET /health/ready`** - Readiness probe (DB + Redis healthy, migrations complete)

### Health Check Details

**`/health` Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T14:23:45Z"
}
```

**`/health/ready` Response (Success):**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "migrations": "ok"
  }
}
```

**`/health/ready` Response (Failure):**
```json
{
  "status": "not_ready",
  "checks": {
    "database": "ok",
    "redis": "failed",
    "migrations": "ok"
  }
}
```

### Kubernetes Configuration
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

## Backups
- Nightly pg_dump; weekly roles; 7–14 day retention
- Restore test monthly

## Observability
- JSON logs with tenantId/requestId
- Metrics: http reqs/latency/errors, SSE connections, pulse sends/responses

## Pre-Flight Validation
Before requesting user testing, ALWAYS run:
```bash
make preflight
```
Validates: Docker services, DB connectivity, API health, frontend access, auth flow, seed data integrity, core endpoints.
