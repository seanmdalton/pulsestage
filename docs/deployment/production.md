# Production Deployment

Deploy PulseStage to production using Docker Compose.

## Prerequisites

- Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose
- Domain name with SSL certificate
- PostgreSQL 16 (managed or self-hosted)
- Redis 7 (managed or self-hosted)

## Quick Deploy

```bash
# Clone repository
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage

# Generate secrets
./setup.sh

# Configure for production
cp .env.example .env
nano .env

# Start services
docker compose up -d
```

## Environment Configuration

### Required Settings

```bash
# Server
NODE_ENV=production
PORT=3000

# Database (use managed PostgreSQL recommended)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (use managed Redis recommended)
REDIS_URL=redis://host:6379

# Sessions (generate with: openssl rand -hex 32)
SESSION_SECRET=your_generated_secret
ADMIN_SESSION_SECRET=your_generated_secret

# CSRF (generate with: openssl rand -base64 32)
CSRF_SECRET=your_generated_secret

# Frontend
CORS_ORIGIN=https://yourdomain.com
```

### Authentication

Disable demo mode and configure OAuth:

```bash
AUTH_MODE_DEMO=false

# GitHub OAuth (recommended)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

See [GitHub OAuth Setup](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app) and [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2).

### Email

Required for pulse invitations:

```bash
# Using Resend (recommended)
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=noreply@yourdomain.com

# Or SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password
SMTP_FROM=noreply@yourdomain.com
```

### Content Moderation (Optional)

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODERATION_ENABLED=true
```

See [handbook/TRUST_AND_SAFETY.md](../handbook/TRUST_AND_SAFETY.md).

## Docker Compose

### Pin Versions

Production should use specific versions, not `latest`:

```yaml
services:
  api:
    image: ghcr.io/seanmdalton/pulsestage-api:0.1.0
  web:
    image: ghcr.io/seanmdalton/pulsestage-web:0.1.0
```

Available tags:
- `0.1.0` (exact version)
- `0.1` (minor version)
- `0` (major version)
- `latest` (always newest)

See [CHANGELOG.md](../../CHANGELOG.md) for versions.

### Resource Limits

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Reverse Proxy

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE (Server-Sent Events)
    location /events {
        proxy_pass http://localhost:3000/events;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Traefik Configuration

```yaml
services:
  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=your@email.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"

  api:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`yourdomain.com`) && PathPrefix(`/api`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"

  web:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
```

## Database

### Using Managed PostgreSQL

Recommended providers:
- AWS RDS PostgreSQL
- Google Cloud SQL for PostgreSQL
- Azure Database for PostgreSQL
- Supabase
- Neon
- DigitalOcean Managed Databases

Minimum requirements:
- PostgreSQL 16+
- 2GB RAM
- 20GB storage

### Self-Hosted PostgreSQL

If self-hosting, use PostgreSQL Docker service from `docker-compose.yaml`.

**Important**: Configure backups.

## Backups

### PostgreSQL Backups

```bash
# Daily backup script
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20250101.sql
```

### Automated Backups

Add to crontab:

```bash
0 2 * * * /path/to/backup-script.sh
```

### Backup Retention

Recommended:
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

## Monitoring

### Health Checks

Configure monitoring for these endpoints:

- Liveness: `https://yourdomain.com/health/live`
- Readiness: `https://yourdomain.com/health/ready`
- Full health: `https://yourdomain.com/health`

Expected response (healthy):
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123456,
  "database": "ok",
  "redis": "ok"
}
```

See [Monitoring](monitoring.md) for detailed monitoring setup.

## Updates

### Update to New Version

1. **Check changelog**: [CHANGELOG.md](../../CHANGELOG.md)

2. **Pull new images**:
```bash
docker compose pull
```

3. **Run migrations**:
```bash
docker compose exec api npx prisma migrate deploy
```

4. **Restart services**:
```bash
docker compose up -d
```

5. **Verify health**:
```bash
curl https://yourdomain.com/health
```

### Rollback

```bash
# Edit docker-compose.yaml to previous version
docker compose up -d
```

## Security

### Environment Variables

- Store in `.env` files (never commit to git)
- Use strong, randomly generated secrets
- Rotate secrets periodically

### SSL/TLS

- Use Let's Encrypt or commercial certificate
- Force HTTPS (redirect HTTP to HTTPS)
- Enable HSTS header

### Rate Limiting

Rate limiting is enabled by default in production:

```bash
RATE_LIMIT_ENABLED=true
```

See [handbook/SECURITY_MODEL.md](../handbook/SECURITY_MODEL.md#rate-limiting).

### Audit Logging

Audit logs track all admin/moderator actions:

- View in Admin → Audit Logs
- Stored in database (append-only)
- Includes actor, action, entity, timestamp

See [handbook/SECURITY_MODEL.md](../handbook/SECURITY_MODEL.md#audit-logging).

## Scaling

### Horizontal Scaling

Run multiple API instances behind load balancer:

```yaml
services:
  api:
    deploy:
      replicas: 3
```

Requires:
- Shared PostgreSQL
- Shared Redis (for sessions)
- Load balancer (Nginx, Traefik, or cloud LB)

### Vertical Scaling

Increase resources in `docker-compose.yaml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

## Troubleshooting

### Services Won't Start

```bash
# View logs
docker compose logs -f

# Check service status
docker compose ps
```

### Database Connection Issues

```bash
# Test connection
docker compose exec api npx prisma db push --preview-feature

# Verify DATABASE_URL
echo $DATABASE_URL
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli -u $REDIS_URL ping
```

## Support

- [Monitoring Guide](monitoring.md) - Set up monitoring
- [Environment Variables](environment.md) - All configuration options
- [handbook/OPERATIONS.md](../handbook/OPERATIONS.md) - Operations runbook
- [GitHub Issues](https://github.com/seanmdalton/pulsestage/issues) - Report issues
