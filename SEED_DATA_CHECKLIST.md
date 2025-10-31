# 🌱 Seed Data Guide

**ONE command for everything:** `make db-seed`

This command is **idempotent** - run it anytime you need a clean, working environment.

---

## 🚀 Quick Start

```bash
# Reset database and seed all data
make db-seed

# That's it! Environment is ready.
```

**What gets seeded:**
- ✅ 5 demo users with proper team memberships
- ✅ 4 teams (General, Engineering, Product, People)
- ✅ Tags for categorization
- ✅ 10 active pulse questions
- ✅ 8 weeks of pulse historical data (~70% participation)
- ✅ 5 pending pulse invites for testing
- ✅ Pulse feature enabled and configured
- ✅ **Automatic validation** of all seed data

---

## 🧪 Validation

Seed data is **automatically validated** after seeding. If validation fails, the command will exit with an error.

**Manual validation:**
```bash
make db-test-seed
```

**What's validated:**
- Users exist and have team memberships
- Admin user has admin role
- Teams and tags are created
- Pulse questions and schedule configured
- Historical pulse data exists
- Pending invites exist with valid tokens
- All users can log in

---

## 👥 Demo Users

All users can log in using **demo mode** (no password needed):

| Email | SSO ID | Role | Teams |
|-------|--------|------|-------|
| admin@demo.pulsestage.dev | `admin` | Admin | General |
| moderator@demo.pulsestage.dev | `moderator` | Moderator | General |
| alice@demo.pulsestage.dev | `alice` | Member | General, Engineering |
| bob@demo.pulsestage.dev | `bob` | Member | General, Engineering |
| charlie@demo.pulsestage.dev | `charlie` | Member | General |

---

## 📊 What You Can Test

### 1. User Dashboard
**URL:** http://localhost:5173/all/dashboard

**Features:**
- "Weekly Pulse" card with pending invite badge
- "Your Activity" section (questions asked/upvoted)
- "Your Pulse History" (participation tracking)
- Q&A Activity stats

### 2. Pulse Dashboard (Admin)
**URL:** http://localhost:5173/admin/pulse

**Features:**
- 8 weeks of historical data with trends
- Question breakdowns with charts
- Participation rates and analytics
- Time range filtering (4w, 8w, 12w)

### 3. Questions Page
**URL:** http://localhost:5173/all/questions

**Features:**
- Browse open/answered questions
- Filter by team
- Search functionality
- Upvote and submit questions

### 4. Admin Panel
**URL:** http://localhost:5173/admin

**Features:**
- Team management
- User management
- Tag management
- Pulse settings configuration
- Theme customization

---

## 🔄 When to Re-seed

**Run `make db-seed` when:**
- ❌ Tests are failing due to missing/bad data
- ❌ Users can't log in
- ❌ Pulse dashboard shows weird numbers
- ❌ You've manually modified data and want to start fresh
- ❌ After pulling changes that modify database schema

**You can run it as many times as you want** - it's safe and idempotent.

---

## 🛠️ Development Workflow

### Normal Development
```bash
# Start services
make dev

# If data gets messy, reset
make db-seed

# Continue testing
```

### After Schema Changes
```bash
# Update schema
vi api/prisma/schema.prisma

# Seed will push schema and seed data
make db-seed
```

### Testing Different Scenarios
```bash
# Clean slate
make db-seed

# Test feature
# ...

# Clean slate again
make db-seed

# Test another scenario
```

---

## 🚨 Troubleshooting

### "Users can't log in"
```bash
make db-seed
```
Clear browser cookies/cache if still failing.

### "Pulse dashboard shows no data"
```bash
make db-seed
```
Historical data will be regenerated.

### "Validation fails"
The seed script will show which tests failed. Read the output and:
1. Fix the issue in `api/scripts/reset-and-seed-all.ts`
2. Run `make db-seed` again
3. Tests should pass

### "Permission denied" or database errors
```bash
# Ensure database is running
docker compose ps

# If db container is down:
docker compose up -d db

# Then seed
make db-seed
```

---

## 📝 Notes

- **Idempotent:** Safe to run multiple times
- **Fast:** Completes in ~10-15 seconds
- **Validated:** Automatic tests ensure data integrity
- **Comprehensive:** Everything you need for testing
- **Documented:** Each user, team, and data point is intentional

---

## 🎯 Philosophy

**One command. Always works. No surprises.**

We don't have separate commands for different scenarios. We don't have partial seeding. We have ONE command that gives you a complete, validated, working environment.

If something's wrong with seed data → Fix the seed script → Everyone benefits.

No more:
- "Did you run `db-seed-pulse`?"
- "Oh you need to run `db-seed-pulse-demo` first"
- "Try `db-reset-demo` instead"

Just: **`make db-seed`**
