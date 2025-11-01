# Quick Start

Get PulseStage running in 5 minutes.

## Install

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
./setup.sh
docker compose up -d
```

## Access

Visit `http://localhost:5173`

## Log In

Click any demo user:
- **admin** - Full access
- **alice** - Member (Engineering team)
- **bob** - Member (Product team)
- **moderator** - Moderator (Product team)

## Try It Out

### As a User (alice or bob)

1. Navigate to your team (Engineering or Product)
2. Click "Submit Question"
3. Enter a question (anonymous by default)
4. Upvote other questions

### As a Moderator (moderator)

1. Navigate to Product team
2. Click "Moderation Queue"
3. Answer questions
4. Tag, pin, or freeze questions

### As an Admin (admin)

1. Click "Admin" in navigation
2. View audit logs
3. Manage teams and users
4. Monitor email queue

## What's Included

Demo data includes:
- 50 users (4 login + 46 dummy users)
- 2 teams (Engineering, Product)
- 36 Q&A questions (10 open + 10 answered per team)
- 12 weeks of pulse historical data
- 800+ pulse responses

## Stop Services

```bash
docker compose down
```

## Reset Data

```bash
make db-seed
```

## Next Steps

- [Configuration](configuration.md) - Customize settings
- [First Steps](first-steps.md) - Set up for your organization
- [User Guide](../guides/user/overview.md) - Learn features
