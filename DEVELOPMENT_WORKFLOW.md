# Development Workflow & Testing Protocol

This document outlines the **required workflow** for development and testing to ensure a consistent, functional experience.

## 🎯 Core Principle

**The development environment should ALWAYS be functional and ready for user testing.**

Before asking the user to test ANYTHING, the AI assistant must:
1. Run the pre-flight check
2. Verify all critical systems are operational
3. Confirm the user can log in and access core features

## 📋 Pre-Flight Check (REQUIRED)

### When to Run
- **ALWAYS** before asking the user to test
- After major changes (database schema, authentication, seeding)
- After restarting services
- When debugging "it's not working" issues

### How to Run
```bash
make preflight
```

### What It Checks
1. ✅ Docker services running (postgres, redis, mailpit)
2. ✅ Database connectivity
3. ✅ API server health (http://localhost:3000/health)
4. ✅ Frontend server (http://localhost:5173)
5. ✅ Authentication flow (E2E demo login)
6. ✅ Seed data validation (users, questions, pulse data)
7. ✅ Core API endpoints responding

### Exit Codes
- `0` - All checks passed, ready for testing
- `1` - Critical checks failed, DO NOT ask user to test

## 🔄 Standard Development Workflow

### 1. Initial Setup (One-time)
```bash
make setup      # Generate .env file
make install    # Install dependencies
docker-compose up -d  # Start services
```

### 2. Seed Database
```bash
make db-seed    # Reset & seed all data (idempotent)
```

This command:
- Resets the entire database
- Creates tenant, users, teams, tags
- Seeds Q&A questions (5 open + 5 answered per team)
- Seeds 8 weeks of pulse responses
- Creates pending pulse invites
- Runs 20 validation tests

### 3. Start Development Servers

**Option A: Separate terminals (recommended)**
```bash
# Terminal 1 - API
cd api && npm run dev

# Terminal 2 - Frontend
cd web && npm run dev
```

**Option B: Background processes**
```bash
cd api && npm run dev > /tmp/api.log 2>&1 &
cd web && npm run dev > /tmp/web.log 2>&1 &
```

### 4. Run Pre-Flight Check
```bash
make preflight
```

### 5. User Testing
Only proceed to user testing if pre-flight check passes with exit code 0.

## 🚨 Critical Requirements

### Before Asking User to Test
- [ ] Pre-flight check passes
- [ ] Both API and frontend servers are running
- [ ] No console errors in API logs
- [ ] User can log in (validated by pre-flight)
- [ ] Seed data is valid (validated by pre-flight)

### After Making Changes
- [ ] Restart affected services
- [ ] Run pre-flight check again
- [ ] Test the specific change manually
- [ ] Check for console errors
- [ ] Verify no regressions in related features

## 🛠️ Common Issues & Fixes

### "Site isn't running"
```bash
# Check processes
ps aux | grep -E "(tsx|vite|node)"

# Restart API
cd api && npm run dev

# Restart Frontend
cd web && npm run dev

# Verify
make preflight
```

### "Can't log in"
```bash
# Re-seed database
make db-seed

# Check seed data
make db-test-seed

# Verify SSO IDs match
cd api && npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({ where: { tenantId: (await prisma.tenant.findUnique({ where: { slug: 'default' } })).id }, select: { email: true, ssoId: true } }).then(console.log);
"
```

### "No data in UI"
```bash
# Check if seed ran successfully
make db-test-seed

# Check data in database
cd api && npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
console.log({
  users: await prisma.user.count({ where: { tenantId: tenant.id } }),
  questions: await prisma.question.count({ where: { tenantId: tenant.id } }),
  pulseResponses: await prisma.pulseResponse.count({ where: { tenantId: tenant.id } })
});
"

# Re-seed if needed
make db-seed
```

## 📊 Seed Data Expectations

After running `make db-seed`, the system should have:

### Users (5)
- `admin@demo.pulsestage.dev` (admin role)
- `alice@demo.pulsestage.dev` (moderator)
- `bob@demo.pulsestage.dev` (member)
- `diana@demo.pulsestage.dev` (member)
- `charlie@demo.pulsestage.dev` (member)

All users have SSO IDs matching their email prefix (e.g., `admin`, `alice`, etc.)

### Teams (4)
- General (all users)
- Engineering (5 open + 5 answered questions)
- People (5 open + 5 answered questions)
- Product (5 open + 5 answered questions)

### Q&A Questions (36 total)
- At least 20 questions across all teams
- Mix of open and answered status
- Mix of priorities and tags

### Pulse Data
- 10 active pulse questions
- 8 weeks of historical responses (≥50 total)
- ~70% participation rate
- 5-35 pending invites for users
- 2 cohorts with user assignments

### Tenant
- Slug: `default`
- Name: "Default Organization"
- Pulse feature enabled

## 🎓 Best Practices

### 1. Always Use `make` Commands
Don't run scripts directly. Use the Makefile commands:
- ✅ `make db-seed`
- ✅ `make preflight`
- ✅ `make db-test-seed`
- ❌ `cd api && npx tsx scripts/...`

### 2. Validate Before Requesting User Testing
```bash
# Good workflow
make db-seed
make preflight  # ← REQUIRED
# [only if exit code 0] "Please test feature X at URL Y"

# Bad workflow
make db-seed
# "Please test feature X" ← Missing pre-flight!
```

### 3. Check Logs When Debugging
```bash
# API logs (if running in background)
tail -f /tmp/api.log

# Frontend logs
tail -f /tmp/web.log

# Docker services
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 4. Restart Services After Code Changes
Code changes requiring restart:
- Authentication logic
- Database queries
- Environment variables
- Session management

Code changes NOT requiring restart (hot reload):
- React components (frontend)
- API route handlers (with tsx watch)
- Styles

## 🔍 Debugging Checklist

When something isn't working:

1. **Check Services**
   ```bash
   docker-compose ps
   ps aux | grep -E "(tsx|vite)"
   ```

2. **Check Connectivity**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:5173
   ```

3. **Check Database**
   ```bash
   make db-test-seed
   ```

4. **Check Logs**
   - Look for errors in API logs
   - Check browser console for frontend errors
   - Check Docker logs for service issues

5. **Run Pre-Flight**
   ```bash
   make preflight
   ```

6. **If All Else Fails - Full Reset**
   ```bash
   # Kill all processes
   sudo killall -9 node tsx

   # Restart services
   docker-compose restart

   # Re-seed
   make db-seed

   # Start servers
   cd api && npm run dev > /tmp/api.log 2>&1 &
   cd web && npm run dev > /tmp/web.log 2>&1 &

   # Validate
   sleep 10 && make preflight
   ```

## 📝 AI Assistant Workflow

### Required Steps Before Requesting User Testing

1. **Make Changes**
   - Implement feature
   - Update seed data if needed
   - Update tests if needed

2. **Restart Affected Services**
   ```bash
   # If API changes
   cd api && npm run dev

   # If Frontend changes (usually not needed due to hot reload)
   cd web && npm run dev
   ```

3. **Run Pre-Flight Check**
   ```bash
   make preflight
   ```

4. **Check Exit Code**
   - If `0`: Proceed to step 5
   - If `1`: Debug issues, fix, repeat from step 2

5. **Request User Testing**
   - Provide specific URL to test
   - Describe what to look for
   - Mention any known limitations

### Example Output

```
✅ Pre-flight check passed! Ready for testing.

Please test the new Pulse Dashboard feature:
1. Log in as admin@demo.pulsestage.dev
2. Navigate to http://localhost:5173/admin/pulse
3. You should see 8 weeks of pulse data with charts

Expected behavior:
- Overall trend chart shows 8 data points
- Participation rate shows ~70%
- Question breakdowns display individual trends
```

## 🚀 Quick Reference

### Daily Development Start
```bash
docker-compose up -d    # Start Docker services
make db-seed           # Ensure fresh data
cd api && npm run dev  # Terminal 1
cd web && npm run dev  # Terminal 2
make preflight         # Validate
```

### After Making Changes
```bash
# [restart services if needed]
make preflight         # Always validate
```

### Troubleshooting
```bash
make preflight         # See what's broken
make db-seed          # Fix seed data issues
docker-compose restart # Fix Docker issues
```

---

**Remember:** The pre-flight check is not optional. It's a required step before every user testing request.

