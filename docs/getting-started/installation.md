# Installation

Install PulseStage using Docker Compose.

## Prerequisites

- Docker and Docker Compose
- Git

## Installation

1. **Clone repository**:
```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
```

2. **Run setup script**:
```bash
./setup.sh
```

This creates `.env` files with generated secrets for:
- `SESSION_SECRET`
- `ADMIN_SESSION_SECRET`
- `CSRF_SECRET`

3. **Start services**:
```bash
docker compose up -d
```

Services start:
- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Mailpit: `http://localhost:8025` (email testing)

4. **Verify installation**:
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

## Demo Mode

Default configuration uses demo mode with 4 pre-seeded users:
- admin@pulsestage.app
- alice@pulsestage.app
- bob@pulsestage.app
- moderator@pulsestage.app

Visit `http://localhost:5173` and click any demo user to log in.

## Production Setup

For production deployment:

1. **Disable demo mode** (`.env`):
```bash
NODE_ENV=production
AUTH_MODE_DEMO=false
```

2. **Configure OAuth** (required when demo mode disabled):
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

See [Configuration](configuration.md) for all environment variables.

See [Production Deployment](../deployment/production.md) for complete production setup.

## Next Steps

- [Configuration](configuration.md) - Environment variables
- [First Steps](first-steps.md) - Create teams and invite users
- [Troubleshooting](troubleshooting.md) - Common issues
