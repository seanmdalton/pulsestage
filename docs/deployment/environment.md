# Environment Variables

This document provides a comprehensive reference for all environment variables used by PulseStage.

## Quick Start

Copy the example environment file and customize it for your deployment:

```bash
cp env.example .env
```

Then edit `.env` with your specific values.

## Core Configuration

### Database

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | [OK] Yes | - | `postgresql://user:pass@host:5432/dbname` |

**Format:** `postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]`

**Production recommendations:**
- Use connection pooling (e.g., PgBouncer)
- Enable SSL: Add `?sslmode=require` to the URL
- Use a dedicated database user with minimal permissions
- Separate read replicas for analytics queries (future)

### Redis

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `REDIS_URL` | Full Redis connection string | [WARNING] One of `REDIS_URL` or `REDIS_HOST` | - | `redis://redis:6379` |
| `REDIS_HOST` | Redis hostname | [WARNING] One of `REDIS_URL` or `REDIS_HOST` | `localhost` | `redis` |
| `REDIS_PORT` | Redis port | No | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis authentication password | No | - | `your-redis-password` |

**Used for:**
- Session storage
- Rate limiting
- Email queue (BullMQ)

**Production recommendations:**
- Enable authentication (`requirepass` in redis.conf)
- Use Redis 7+ for best performance
- Consider Redis Cluster for high availability
- Monitor memory usage (set `maxmemory` policy)

### API Server

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `PORT` | API server port | No | `3000` | `3000` |
| `NODE_ENV` | Environment mode | No | `development` | `production` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | [OK] Yes | `http://localhost:5173` | `https://app.yourdomain.com,https://admin.yourdomain.com` |

**`NODE_ENV` behavior:**
- `development`: Rate limiting disabled, verbose logging
- `production`: Rate limiting enabled, error logging only

**CORS configuration:**
- Development: Use `http://localhost:5173`
- Production: Use your actual frontend domain(s)
- Multiple origins: Separate with commas (no spaces)

### Admin Authentication

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `ADMIN_KEY` | Admin API key for protected endpoints | [OK] Yes | - | `your-secure-random-string-min-32-chars` |

**[WARNING] Security:**
- Generate a secure random string: `openssl rand -hex 32`
- Never commit this to version control
- Rotate periodically (every 90 days recommended)
- Use your secrets manager in production (AWS Secrets Manager, HashiCorp Vault, etc.)

**Used for:**
- `/admin/*` endpoints
- Health dashboard
- Email queue status
- System metrics

## Multi-Tenancy

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `MULTI_TENANT_MODE` | Enable multi-tenant subdomain routing | No | `false` | `true` or `false` |
| `BASE_DOMAIN` | Base domain for tenant resolution | [WARNING] Required if `MULTI_TENANT_MODE=true` | - | `pulsestage.com` |
| `TENANT_HEADER` | Header name for tenant override | No | `x-tenant-id` | `x-tenant-slug` |

**Single-tenant mode** (`MULTI_TENANT_MODE=false`):
- One organization per deployment
- Simpler setup, perfect for most use cases
- Default tenant automatically created on first startup

**Multi-tenant mode** (`MULTI_TENANT_MODE=true`):
- Multiple organizations on one deployment
- Subdomain-based routing: `acme.pulsestage.com` → ACME tenant
- Requires `BASE_DOMAIN` to be set
- See [Multi-Tenancy Architecture](../architecture/multi-tenancy.md) for details

**Tenant resolution order** (when `MULTI_TENANT_MODE=true`):
1. `x-tenant-id` or `x-tenant-slug` header (if present)
2. Subdomain extraction from `Host` header
3. Falls back to default tenant

## Email Configuration

See [Email Configuration Guide](./email-configuration.md) for complete setup instructions.

### Core Email Settings

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `EMAIL_PROVIDER` | Email service to use | [OK] Yes | - | `smtp` or `resend` |
| `EMAIL_FROM` | Sender email address | [OK] Yes | - | `noreply@yourdomain.com` |
| `EMAIL_FROM_NAME` | Sender display name | No | `PulseStage` | `Your Company AMA` |
| `FRONTEND_URL` | Frontend URL for email links | [OK] Yes | - | `https://yourdomain.com` |

### SMTP Configuration

Only required when `EMAIL_PROVIDER=smtp`.

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `SMTP_HOST` | SMTP server hostname | [OK] Yes | - | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | [OK] Yes | - | `587` |
| `SMTP_SECURE` | Use TLS (true for 465, false for 587) | [OK] Yes | - | `true` or `false` |
| `SMTP_USER` | SMTP username | [WARNING] Usually required | - | `apikey` |
| `SMTP_PASS` | SMTP password | [WARNING] Usually required | - | `SG.xxxxx` |

**Common SMTP providers:**
- **SendGrid**: `smtp.sendgrid.net:587`, user=`apikey`, pass=`SG.xxxxx`
- **AWS SES**: `email-smtp.us-east-1.amazonaws.com:587`, SMTP credentials from IAM
- **Mailgun**: `smtp.mailgun.org:587`, username/password from Mailgun
- **Gmail** (dev only): `smtp.gmail.com:587`, use App Password

### Resend Configuration

Only required when `EMAIL_PROVIDER=resend`.

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `RESEND_API_KEY` | Resend API key | [OK] Yes | - | `re_xxxxxxxxxxxxx` |

**Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain
3. Generate API key (starts with `re_`)

## Server-Sent Events (SSE)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `SSE_HEARTBEAT_INTERVAL` | Heartbeat interval in milliseconds | No | `30000` (30s) | `15000` |

**Purpose:** Keep SSE connections alive through proxies/load balancers.

**Recommendations:**
- Default (30s) works for most deployments
- Lower (15s) if connections drop frequently
- Higher (60s) to reduce server load (if stable network)

## Frontend Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `WEBSITE_TITLE` | Browser tab title | No | `PulseStage` | `Your Company AMA` |

**Note:** Frontend-specific variables are configured in `web/.env` (not shown here). See `web/README.md`.

## Development-Only Variables

These are used for local development and testing. **Do not use in production.**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MOCK_AUTH` | Enable mock SSO authentication | `false` | `true` |
| `LOG_LEVEL` | Logging verbosity | `info` | `debug` |

## Example Configurations

### Local Development (docker-compose.override.yaml)

```yaml
environment:
  DATABASE_URL: postgresql://app:app@db:5432/ama
  REDIS_URL: redis://redis:6379
  CORS_ORIGIN: http://localhost:5173
  NODE_ENV: development
  ADMIN_KEY: dev-admin-key
  
  # Email (Mailpit)
  EMAIL_PROVIDER: smtp
  SMTP_HOST: mailpit
  SMTP_PORT: 1025
  SMTP_SECURE: false
  EMAIL_FROM: noreply@pulsestage.local
  FRONTEND_URL: http://localhost:5173
  
  # Single-tenant mode
  MULTI_TENANT_MODE: false
```

### Production (AWS/DigitalOcean/etc.)

```bash
# Database
DATABASE_URL=postgresql://pulsestage:SECURE_PASSWORD@db.internal:5432/pulsestage?sslmode=require

# Redis
REDIS_URL=redis://:SECURE_REDIS_PASSWORD@redis.internal:6379

# API
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://ama.yourcompany.com
ADMIN_KEY=<generated-with-openssl-rand-hex-32>

# Email (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourcompany.com
EMAIL_FROM_NAME=Company AMA
FRONTEND_URL=https://ama.yourcompany.com

# Single-tenant
MULTI_TENANT_MODE=false
```

### Production Multi-Tenant (SaaS)

```bash
# Database
DATABASE_URL=postgresql://pulsestage:SECURE_PASSWORD@db.internal:5432/pulsestage?sslmode=require

# Redis
REDIS_URL=redis://:SECURE_REDIS_PASSWORD@redis.internal:6379

# API
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://*.pulsestage.com
ADMIN_KEY=<generated-with-openssl-rand-hex-32>

# Email (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@pulsestage.com
EMAIL_FROM_NAME=PulseStage
FRONTEND_URL=https://pulsestage.com

# Multi-tenant
MULTI_TENANT_MODE=true
BASE_DOMAIN=pulsestage.com
```

## Security Best Practices

### 1. Never Commit Secrets
```bash
# [ERROR] Bad: Committed .env file
git add .env
git commit -m "Add config"

# [OK] Good: .env is in .gitignore
git add env.example
git commit -m "Add example config"
```

### 2. Use Secrets Management

**Development:**
- Store in `.env` file (already ignored by git)
- Share securely via 1Password, LastPass, etc.

**Production:**
- AWS: Secrets Manager, Systems Manager Parameter Store
- Kubernetes: Secrets, External Secrets Operator
- Docker Swarm: Docker Secrets
- Ansible: Ansible Vault

### 3. Rotate Credentials Regularly

| Credential | Rotation Frequency |
|------------|-------------------|
| `ADMIN_KEY` | Every 90 days |
| Database password | Every 180 days |
| Redis password | Every 180 days |
| Email API keys | Every 180 days or on compromise |

### 4. Principle of Least Privilege

- Database user: Only `SELECT`, `INSERT`, `UPDATE`, `DELETE` (no `DROP`, `ALTER`)
- Redis: Use ACLs if available (Redis 6+)
- Email API keys: Restricted to "Mail Send" permission only

## Validation

Check your configuration is correct:

```bash
# Check API starts without errors
docker compose up -d api
docker compose logs api --tail 50

# Verify database connection
docker compose exec api npx prisma db pull

# Verify Redis connection
docker compose exec api node -e "const Redis = require('ioredis'); const r = new Redis({host:'redis'}); r.ping().then(console.log)"

# Verify email configuration
curl http://localhost:3000/admin/email-queue \
  -H "X-Admin-Key: your-admin-key"
```

## Troubleshooting

### API won't start

**Check logs:**
```bash
docker compose logs api --tail 100
```

**Common issues:**
- `DATABASE_URL` malformed → Check syntax
- Can't connect to Redis → Verify `REDIS_URL` and Redis is running
- `ADMIN_KEY` not set → Add to environment variables

### CORS errors in browser

**Symptom:** Console shows "CORS policy: No 'Access-Control-Allow-Origin' header"

**Fix:** Ensure `CORS_ORIGIN` matches your frontend URL exactly.

```bash
# Development
CORS_ORIGIN=http://localhost:5173

# Production
CORS_ORIGIN=https://ama.yourcompany.com
```

### Emails not sending

See [Email Configuration Guide](./email-configuration.md#troubleshooting).

## Reference

For more information:
- [Production Deployment Guide](./production.md)
- [Email Configuration](./email-configuration.md)
- [Multi-Tenancy Architecture](../architecture/multi-tenancy.md)
- [Security Overview](../security/overview.md)
