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

### 2. Run Setup

The setup command creates your environment configuration with secure secrets:

```bash
make setup
```

This will:
- Create `.env` file with all required configuration
- Generate secure random secrets for sessions and CSRF
- Set up database and Redis connection strings
- Configure default ports and CORS settings

**Note**: The generated admin key is `dev-admin-key-change-me`. Change this in production!

### 3. Start the Services

```bash
make start
```

This will:
- Pull the latest published container images from GitHub Container Registry
- Start all services in the background

Services started:
- **PostgreSQL** database on port 5432
- **Redis** cache on port 6379
- **API** server on port 3000 ([ghcr.io/seanmdalton/pulsestage-api:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-api))
- **Web** frontend on port 5173 ([ghcr.io/seanmdalton/pulsestage-web:latest](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-web))

The API automatically creates a default tenant on first startup (auto-bootstrap).

### 4. Access PulseStage

Open your browser and navigate to:

```
http://localhost:5173
```

You'll see the **Setup Wizard** which guides you through initial setup.

## Setup Wizard

On first visit, PulseStage presents a setup wizard with two options:

### Option 1: Load Demo Data (Recommended)

Perfect for exploring PulseStage's features:

1. Click **"Load Demo Data"**
2. Click **"Continue"**
3. Wait ~5-10 seconds for the system to:
   - Create Acme Corp tenant
   - Add 3 teams (Engineering, Product, Marketing)
   - Create 4 demo users (Alice, Charlie, David, Emily)
   - Generate 6 sample questions
   - Add default tags
4. **System will restart automatically** to load the new users

Demo includes:
- **Alice Anderson** (alice.admin@acme.com) - Admin, Engineering team
- **Charlie Chen** (charlie.owner@acme.com) - Owner, Product & Marketing teams
- **David Martinez** (david@acme.com) - Moderator, Engineering team
- **Emily Evans** (emily.member@acme.com) - Member, Engineering & Product teams

### Option 2: Create Your Own Organization

For starting fresh with your own setup:

1. Click **"Set up a new team"**
2. **Name your organization** (e.g., "My Company")
3. **Create admin user** with your name and email
4. **Create your first team** (e.g., "Engineering")
5. **System will restart automatically** to create your account
6. Navigate to `/sso-test.html` to sign in with your new account

## Next Steps

### Sign In

After setup completes, navigate to:

```
http://localhost:5173/sso-test.html
```

**For Demo Data:**
- You'll see all 4 demo users listed
- Click any user to sign in
- Try different users to explore different roles

**For Custom Setup:**
- You'll see your admin user
- Click to sign in with your account

### Explore Features

1. **Submit Your First Question**
   - Navigate to any team page
   - Click "Submit Question"
   - Enter your question and submit!

2. **Try Presentation Mode** (Moderator+)
   - Open a team with questions
   - Click "Presentation Mode"
   - Perfect for live town halls

3. **Access Admin Panel** (Admin+)
   - Click your profile → "Admin Panel"
   - Explore team management, user management, analytics
   - View audit logs and exports

4. **Manage Teams** (Admin+)
   - Create additional teams
   - Add/remove members
   - Configure team settings

## Development Mode

For local development with instant feedback via hot reload:

```bash
# Initialize and install dependencies
make setup
make install

# Start development environment
make dev
# Web frontend: Changes reload instantly (hot reload via Vite)
# API backend: Restart with 'docker compose restart api' after changes

# In another terminal, seed demo data
make db-seed
```

**Hot Reload Benefits:**
- Edit React components in `web/src/` - see changes immediately
- No rebuild needed for frontend changes
- Fast iteration cycle for UI development

See **[Development Guide](../development/setup/local-development.md)** for the complete workflow.

## Troubleshooting

### Setup Wizard Doesn't Appear

Clear your browser's localStorage:
1. Open DevTools (F12)
2. Go to **Application** → **Local Storage** → `http://localhost:5173`
3. Click **"Clear All"**
4. Refresh the page

Or use an **incognito/private window**.

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
- See [Troubleshooting Guide](./troubleshooting.md)

## What's Next?

- [Installation Guide](installation.md) - Detailed setup instructions
- [Configuration](configuration.md) - Environment variables and settings
- [First Steps](first-steps.md) - Guided tour of PulseStage features
- [Development Guide](../../DEVELOPMENT.md) - For contributors
