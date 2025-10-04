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

The setup script creates your environment configuration:

```bash
./setup.sh
```

This will:
- Copy `env.example` to `.env`
- Generate secure session secrets
- Set up default configuration

### 3. Start the Services

```bash
docker compose up
```

This will start:
- **PostgreSQL** database on port 5432
- **Redis** cache on port 6379
- **API** server on port 5001
- **Web** frontend on port 3000

### 4. Access PulseStage

Open your browser and navigate to:

```
http://localhost:3000
```

## First Steps

### Select a Tenant

PulseStage supports multi-tenancy. The default tenant is available at:

```
http://localhost:3000/sso-test.html
```

### Choose a Test User

You'll see several test users with different roles:

- **Alice Anderson** (admin@example.com) - Admin role
- **Bob Smith** (bob@example.com) - Member role
- **Charlie Davis** (charlie@example.com) - Member role
- **Mike Chen** (mike@example.com) - Moderator of People team
- **Sarah Miller** (sarah@example.com) - Moderator of Engineering team

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
# Check port 3000 (web)
lsof -i :3000

# Check port 5001 (api)
lsof -i :5001
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

