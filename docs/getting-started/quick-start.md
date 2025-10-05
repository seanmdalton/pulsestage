# Quick Start

Get PulseStage up and running in under 5 minutes!

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Git** for cloning the repository
- At least **2GB RAM** available

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
```

### 2. Run Setup Script

The setup script creates your environment configuration with secure secrets:

```bash
./setup.sh
```

This will:
- Create `.env` file with all required configuration
- Generate secure random secrets for sessions and CSRF
- Set up database and Redis connection strings
- Configure default ports and CORS settings

**Note**: The generated admin key is `dev-admin-key-change-me`. Change this in production!

### 3. Start the Services

```bash
docker compose up -d
```

This will:
- Pull the latest published container images from GitHub Container Registry
- Start all services in the background

Services started:
- **PostgreSQL** database on port 5432
- **Redis** cache on port 6379
- **API** server on port 3000 ([ghcr.io/seanmdalton/pulsestage-api:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-api))
- **Web** frontend on port 5173 ([ghcr.io/seanmdalton/pulsestage-web:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-web))

The database is automatically initialized with:
- Default tenant and teams
- Test users with different roles
- Sample data for testing

### 4. (Optional) Load Additional Test Data

For a more comprehensive test environment, execute commands in the API container:

```bash
docker compose exec api npm run db:seed:full
```

This loads realistic questions, answers, and tags across all teams.

**Note**: The seed scripts use compiled JS from the published image's `dist` folder.

### 5. Access PulseStage

Open your browser and navigate to:

```
http://localhost:5173
```

## First Steps

### Select a Tenant

PulseStage supports multi-tenancy. The default tenant is available at:

```
http://localhost:5173/
```

Or to see the SSO test page with all users:

```
http://localhost:5173/sso-test.html
```

### Choose a Test User

Access the SSO test page to see all available users:

```
http://localhost:5173/sso-test.html
```

**Default Tenant:**
- **John Doe** (john.doe@company.com) - Owner (full access)
- **Mike Chen** (mike.chen@company.com) - Moderator (People team)
- **Sarah Wilson** (sarah.wilson@company.com) - Moderator (Engineering team)
- **Emily Rodriguez** (emily.rodriguez@company.com) - Moderator (multiple teams)
- **Alex Kim** (alex.kim@company.com) - Member
- **Anonymous** - View without logging in

**Acme Corp Tenant:**
- **Alice Johnson** (alice@acme.corp) - Admin role
- **Bob Wilson** (bob@acme.corp) - Moderator
- **Charlie Davis** (charlie@acme.corp) - Member

### Submit Your First Question

1. Click on a user to log in
2. Navigate to any team page
3. Click "Submit Question"
4. Enter your question and submit!

## What's Next?

- [Installation Guide](installation.md) - Detailed setup instructions
- [Configuration](configuration.md) - Environment variables and settings
- [First Steps](first-steps.md) - Guided tour of PulseStage

## Troubleshooting

### Services Won't Start

Check if ports are already in use:

```bash
# Check port 5173 (web)
lsof -i :5173

# Check port 3000 (api)
lsof -i :3000

# Check port 5432 (database)
lsof -i :5432
```

### Database Connection Issues

Ensure PostgreSQL is running:

```bash
docker compose ps
```

All services should show "Up" status.

### Need Help?

- Check the [Installation Guide](installation.md) for detailed troubleshooting
- Visit our [GitHub Issues](https://github.com/seanmdalton/pulsestage/issues)

