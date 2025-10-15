# Docker Compose Deployment

Deploy PulseStage using Docker Compose for a self-hosted solution.

## Quick Start

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
make setup
make start
```

Visit [http://localhost:5173](http://localhost:5173) and follow the setup wizard.

## Prerequisites

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Domain** (optional): For production deployment
- **SSL Certificate** (optional): For HTTPS

## Configuration

### Environment Variables

Create `.env` file in the project root:

```bash
# Required
DATABASE_URL=postgresql://postgres:password@postgres:5432/pulsestage
REDIS_URL=redis://redis:6379
SESSION_SECRET=<generate-64-char-random-string>
CSRF_SECRET=<generate-64-char-random-string>

# Authentication (choose one)
AUTH_MODE_DEMO=true  # For testing/demo only
# OR
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback

# Optional
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
OPENAI_API_KEY=<your-key>  # For content moderation
```

### Generate Secrets

```bash
cd api
npx tsx scripts/generate-secrets.ts
```

## Services

The `docker-compose.yaml` includes:

- **web**: React frontend (port 5173)
- **api**: Express backend (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)
- **mailpit**: Email testing (port 1025/8025, dev only)

## Production Deployment

### 1. Update Configuration

```yaml
# docker-compose.yaml
services:
  web:
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://api.yourdomain.com
  
  api:
    environment:
      - NODE_ENV=production
      - FRONTEND_URL=https://yourdomain.com
```

### 2. Set Up Reverse Proxy

Use Nginx or Traefik to handle HTTPS:

```nginx
# nginx.conf example
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Start Services

```bash
docker compose up -d
```

### 4. Run Migrations

```bash
docker compose exec api npx prisma migrate deploy
```

### 5. Verify Health

```bash
curl http://localhost:3000/health
```

## Management Commands

```bash
# View logs
docker compose logs -f

# Restart a service
docker compose restart api

# Stop all services
docker compose down

# Update to latest version
git pull
docker compose pull
docker compose up -d
```

## Backup & Restore

### Database Backup

```bash
docker compose exec postgres pg_dump -U postgres pulsestage > backup.sql
```

### Database Restore

```bash
docker compose exec -T postgres psql -U postgres pulsestage < backup.sql
```

## Monitoring

### Health Checks

All services include health checks:

```bash
docker compose ps
```

### Resource Usage

```bash
docker stats
```

### Application Health

```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if Postgres is running
docker compose ps postgres

# View Postgres logs
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U postgres -d pulsestage -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker compose ps redis

# View Redis logs
docker compose logs redis

# Test connection
docker compose exec redis redis-cli ping
```

### API Not Responding

```bash
# Check API logs
docker compose logs api

# Restart API
docker compose restart api
```

## Performance Tuning

### PostgreSQL

Edit `docker-compose.yaml`:

```yaml
services:
  postgres:
    environment:
      - POSTGRES_MAX_CONNECTIONS=200
      - POSTGRES_SHARED_BUFFERS=256MB
```

### Redis

```yaml
services:
  redis:
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

## See Also

- **[Environment Variables](environment.md)** - Configuration reference
- **[Production Checklist](production-checklist.md)** - Pre-launch guide
- **[Monitoring](monitoring.md)** - Monitoring setup
