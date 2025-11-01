# Configuration

PulseStage is configured via environment variables.

## Core Settings

### Required

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Sessions (generate with: openssl rand -hex 32)
SESSION_SECRET=your_session_secret
ADMIN_SESSION_SECRET=your_admin_session_secret

# CSRF Protection (generate with: openssl rand -base64 32)
CSRF_SECRET=your_csrf_secret

# Redis
REDIS_URL=redis://localhost:6379
```

### Optional

```bash
# Server
PORT=3000
NODE_ENV=development  # or production

# Frontend
CORS_ORIGIN=http://localhost:5173

# Tenant (multi-tenancy)
DEFAULT_TENANT=default
```

## Authentication

### Demo Mode (Development)

```bash
AUTH_MODE_DEMO=true  # Auto-enabled when NODE_ENV=development
```

Provides 4 pre-seeded demo users. Not for production.

### OAuth (Production)

#### GitHub OAuth

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

#### Google OAuth

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

See [handbook/AUTHENTICATION.md](../handbook/AUTHENTICATION.md) for OAuth setup.

## Email

### SMTP

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@example.com
```

### Resend

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=noreply@example.com
```

### Disable Email (Development)

```bash
EMAIL_ENABLED=false
```

See [handbook/INTEGRATIONS/EMAIL.md](../handbook/INTEGRATIONS/EMAIL.md).

## Content Moderation

### OpenAI Moderation (Optional)

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODERATION_ENABLED=true
```

Enables AI-powered content moderation alongside local filters.

See [handbook/TRUST_AND_SAFETY.md](../handbook/TRUST_AND_SAFETY.md).

## Pulse System

```bash
# Pulse invitations (requires email)
PULSE_INVITES_ENABLED=true

# Cohort size (users per cohort)
PULSE_COHORT_SIZE=20

# Invitation schedule (cron format: daily at 9 AM)
PULSE_INVITE_CRON=0 9 * * *
```

See [handbook/PULSE_SYSTEM.md](../handbook/PULSE_SYSTEM.md).

## Rate Limiting

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true  # Auto-disabled when NODE_ENV=development

# Redis required for rate limiting
REDIS_URL=redis://localhost:6379
```

Rate limiting is disabled in development by default.

See [handbook/SECURITY_MODEL.md](../handbook/SECURITY_MODEL.md#rate-limiting).

## Feature Flags

```bash
# Presentation mode
PRESENTATION_MODE_ENABLED=true

# Data exports
EXPORTS_ENABLED=true

# Audit logging
AUDIT_LOG_ENABLED=true
```

## Branding

```bash
# Website title
WEBSITE_TITLE=PulseStage

# Welcome message (markdown supported)
WELCOME_MESSAGE=Welcome to PulseStage!

# Logo URL (optional)
LOGO_URL=https://example.com/logo.png
```

## Development

```bash
# Mock SSO for testing
MOCK_SSO=true
SSO_PROVIDER=mock

# Mailpit (local email testing)
SMTP_HOST=mailpit
SMTP_PORT=1025
```

## Environment Files

- `.env` - API configuration
- `web/.env` - Frontend configuration

Example `.env`:
```bash
DATABASE_URL=postgresql://app:app@localhost:5432/ama
SESSION_SECRET=generated_by_setup_script
ADMIN_SESSION_SECRET=generated_by_setup_script
CSRF_SECRET=generated_by_setup_script
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

Example `web/.env`:
```bash
VITE_API_URL=http://localhost:3000
VITE_WEBSITE_TITLE=PulseStage
```

## Generate Secrets

```bash
# Session secrets
openssl rand -hex 32

# CSRF secret
openssl rand -base64 32
```

Or use `./setup.sh` which auto-generates all secrets.

## Next Steps

- [First Steps](first-steps.md) - Initial setup
- [Production Deployment](../deployment/production.md) - Production configuration
- [handbook/OPERATIONS.md](../handbook/OPERATIONS.md) - Operational details
