# Production Deployment

Deploy PulseStage to production with proper security and reliability.

## Overview

PulseStage can be deployed to:
- **Self-hosted** with Docker Compose
- **Cloud platforms** like Render, Heroku, Railway
- **Kubernetes** (advanced)

This guide covers general production considerations.

## Pre-Deployment Checklist

✅ **[Use the Production Checklist](production-checklist.md)** - Complete guide

Quick checklist:
- [ ] Generate secure secrets
- [ ] Configure OAuth (GitHub/Google)
- [ ] Set up PostgreSQL database
- [ ] Set up Redis instance
- [ ] Configure environment variables
- [ ] Set up domain and SSL
- [ ] Configure email provider (optional)
- [ ] Set up backups
- [ ] Plan monitoring

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Nginx/    │ ← SSL termination
│  Traefik    │
└──────┬──────┘
       │
       ├────────► Web (React) :5173
       │
       └────────► API (Express) :3000
                      │
                      ├────► PostgreSQL :5432
                      └────► Redis :6379
```

## Environment Configuration

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/pulsestage

# Cache & Sessions
REDIS_URL=redis://host:6379
SESSION_SECRET=<64-char-random>
CSRF_SECRET=<64-char-random>

# Authentication (GitHub example)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=https://api.yourdomain.com/auth/github/callback

# Application
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com

# Admin
ADMIN_KEY=<32-char-random>
ADMIN_SESSION_SECRET=<64-char-random>
```

**[Complete Environment Reference →](environment.md)**

## Security Hardening

### 1. Secrets Management

**Never hardcode secrets**. Use:
- Environment variables
- Secret management service (AWS Secrets Manager, HashiCorp Vault)
- Encrypted configuration files

### 1a. Security Headers

**Implement Content Security Policy (CSP)** for the frontend:

- ✅ **Meta tag** - Already included in `web/index.html`
- ✅ **Nginx headers** - Add to your web server config

```nginx
# See docs/deployment/nginx-csp.conf for full configuration
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; ..." always;
```

**Test your CSP:**
- Mozilla Observatory: https://observatory.mozilla.org/
- Target: A grade or higher

**[Complete CSP Documentation →](../security/security-headers.md)**

### 2. Network Security

- ✅ Use HTTPS only (`secure: true` cookies)
- ✅ Configure CORS properly
- ✅ Enable rate limiting
- ✅ Use security headers (Helmet)
- ✅ Keep services on private network

### 3. Database Security

- ✅ Use strong passwords
- ✅ Limit network access
- ✅ Enable SSL connections
- ✅ Regular backups
- ✅ Principle of least privilege

### 4. Authentication

- ✅ **Disable demo mode** (`AUTH_MODE_DEMO=false`)
- ✅ Use OAuth (GitHub/Google)
- ✅ Configure session timeouts
- ✅ Monitor failed login attempts

## Deployment Options

### Option 1: Docker Compose (Self-Hosted)

**Best for:** Full control, on-premises deployment

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
# Configure .env
make setup
make start
```

**[Docker Compose Guide →](docker-compose.md)**

### Option 2: Cloud Platform (Render, Heroku)

**Best for:** Managed infrastructure, easy scaling

**Render example:**
1. Connect GitHub repository
2. Configure environment variables
3. Deploy via `render.yaml`

**[Render Deployment Guide →](render-deployment.template.md)**

### Option 3: Kubernetes

**Best for:** Enterprise scale, complex deployments

- Use Helm charts (community-maintained)
- Configure persistent volumes
- Set up ingress controller
- Configure horizontal pod autoscaling

## Database Setup

### PostgreSQL

**Minimum requirements:**
- Version: 16+
- Extensions: `pg_trgm` (for full-text search)
- Storage: 10GB minimum

**Recommended:**
- Connection pooling (PgBouncer)
- Read replicas for high load
- Regular backups (automated)

### Redis

**Minimum requirements:**
- Version: 7+
- Memory: 512MB minimum

**Recommended:**
- Persistence enabled
- High availability (Redis Sentinel/Cluster)
- Monitoring

## Email Configuration

**Optional but recommended** for user notifications.

### Supported Providers

- **SMTP**: SendGrid, AWS SES, Mailgun
- **Resend**: Modern email API

### Example: SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_api_key
SMTP_FROM=noreply@yourdomain.com
```

**[Complete Email Configuration →](email-configuration.md)**

## SSL/TLS Setup

### Option 1: Let's Encrypt (Free)

```bash
# Using Certbot
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Option 2: Cloud Provider

Most cloud platforms (Render, Heroku) handle SSL automatically.

### Option 3: Cloudflare

Free SSL proxy with additional security features.

## Backups

### Database Backups

**Automated daily backups:**

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U postgres pulsestage \
  | gzip > backups/pulsestage_$DATE.sql.gz

# Keep last 30 days
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

**Add to crontab:**
```bash
0 2 * * * /path/to/backup.sh
```

### Disaster Recovery

Test restores regularly:

```bash
# Test restore
gunzip < backup.sql.gz | \
  docker compose exec -T postgres psql -U postgres pulsestage
```

## Scaling

### Vertical Scaling

Increase resources for single instances:
- CPU: 2+ cores recommended
- Memory: 4GB+ recommended
- Storage: Scale with data growth

### Horizontal Scaling

For high traffic:
- **Multiple API instances** behind load balancer
- **Read replicas** for PostgreSQL
- **Redis Cluster** for distributed caching
- **CDN** for static assets

## Monitoring

**Essential monitoring:**
- Health checks (`/health` endpoint)
- Error tracking
- Performance metrics
- Resource usage

**[Complete Monitoring Guide →](monitoring.md)**

## Maintenance

### Updates

```bash
# Pull latest changes
git pull

# Update dependencies
cd api && npm ci
cd web && npm ci

# Run migrations
docker compose exec api npx prisma migrate deploy

# Restart services
docker compose up -d
```

### Database Migrations

```bash
# Check migration status
docker compose exec api npx prisma migrate status

# Apply pending migrations
docker compose exec api npx prisma migrate deploy
```

## Troubleshooting

**[Complete Troubleshooting Guide →](render-troubleshooting.md)**

Quick fixes:

**API not responding:**
```bash
docker compose logs api
docker compose restart api
```

**Database connection issues:**
```bash
docker compose exec postgres psql -U postgres -c "SELECT 1;"
```

**Redis connection issues:**
```bash
docker compose exec redis redis-cli ping
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Demo mode disabled
- [ ] OAuth configured
- [ ] Strong secrets generated
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Database access restricted
- [ ] Backups automated
- [ ] Monitoring set up
- [ ] Audit logging enabled
- [ ] Content moderation active

## See Also

- **[Production Checklist](production-checklist.md)** - Pre-launch guide
- **[Production Runbook](production-runbook.md)** - Operational procedures
- **[Docker Compose Deployment](docker-compose.md)** - Self-hosted setup
- **[Environment Variables](environment.md)** - Configuration reference
- **[Monitoring](monitoring.md)** - Monitoring setup
