# Development Workflow & Testing Protocol

This document outlines the **required workflow** for development and testing to ensure a consistent, functional experience.

## 🎯 Core Principle

**The development environment should ALWAYS be functional and ready for user testing.**

Before asking the user to test ANYTHING, the AI assistant must:
1. Run the pre-flight check
2. Verify all critical systems are operational
3. Confirm the user can log in and access core features

---

## 📦 Versioning

PulseStage follows [Semantic Versioning 2.0.0](https://semver.org/) (semver.org).

### Version Format

`MAJOR.MINOR.PATCH` (e.g., `0.1.0`)

- **MAJOR** (X.0.0) - Breaking changes requiring user action
- **MINOR** (0.X.0) - New features, backward compatible
- **PATCH** (0.0.X) - Bug fixes, security patches, documentation

### When to Increment

#### PATCH (0.0.X) - AI Increments Automatically
- Bug fixes (non-breaking)
- Documentation updates
- Security patches (non-breaking)
- UI tweaks, styling improvements
- Test improvements
- Linting fixes

#### MINOR (0.X.0) - AI Proposes, User Approves
- New features (pulse system, presentation mode)
- New API endpoints (backward compatible)
- New configuration options (with defaults)
- Database migrations (automatic, no data loss)
- Performance improvements
- New integrations (optional)

#### MAJOR (X.0.0) - AI Warns, User Approves Before Implementation
- Breaking API changes (remove/change endpoints)
- Breaking database migrations (data loss, manual steps)
- Breaking authentication changes (re-auth required)
- Removed environment variables (no backward compatibility)
- Removed features (no deprecation period)
- Breaking Docker image changes (docker-compose updates required)

### Pre-1.0.0 Versions

Current version: **0.1.0** (pre-stable)

- Breaking changes may occur in MINOR versions during `0.x.x`
- Version `1.0.0` indicates stable public API
- See [CHANGELOG.md](../../CHANGELOG.md) for version history

### Version Locations

Versions must be synchronized across:
- `api/package.json`
- `web/package.json`
- `CHANGELOG.md`
- `README.md` (badge)
- Git tags (`v0.1.0`)
- Docker images (`ghcr.io/seanmdalton/pulsestage-api:0.1.0`)

### AI Responsibilities

1. **Automatically increment PATCH** for bug fixes, docs, security patches
2. **Propose MINOR** when adding features, wait for user approval
3. **Warn about MAJOR** breaking changes, get approval BEFORE implementing
4. **Update all version locations** when incrementing
5. **Update CHANGELOG.md** with changes under appropriate version

### Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [Unreleased]
### Added
- New feature X
### Fixed
- Bug fix Y

## [0.2.0] - 2025-11-15
### Added
- Pulse analytics dashboard
```

---

##  Pre-Flight Check (REQUIRED)

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
1. [OK] Docker services running (postgres, redis, mailpit)
2. [OK] Database connectivity
3. [OK] API server health (http://localhost:3000/health)
4. [OK] Frontend server (http://localhost:5173)
5. [OK] Authentication flow (E2E demo login)
6. [OK] Seed data validation (users, questions, pulse data)
7. [OK] Core API endpoints responding

### Exit Codes
- `0` - All checks passed, ready for testing
- `1` - Critical checks failed, DO NOT ask user to test

##  Security Scanning (REQUIRED Before Push)

### When to Run
- **ALWAYS** before pushing to git
- After updating dependencies
- After changing Docker images
- Before releasing

### How to Run
```bash
make security        # Run security scans only
make validate-ci     # Run ALL CI checks (includes security)
```

### What It Checks
1. [OK] Trivy Docker image scans (API + Web images)
2. [OK] HIGH/CRITICAL vulnerabilities in base images
3. [OK] Vulnerable dependencies
4. [OK] OS-level vulnerabilities

### Exit Codes
- `0` - No HIGH/CRITICAL vulnerabilities found
- `1` - Security issues found, DO NOT push

### If Security Scans Fail

**DO NOT update `.trivyignore` without user approval!**

Instead:
1. Check if base images can be updated (`node:24-alpine`, `nginx:alpine`)
2. Check if vulnerable npm packages can be updated
3. Research if vulnerabilities are actually exploitable in our context
4. Consult with user if a legitimate false positive

**Example**: Go stdlib vulnerabilities in Alpine base image are often not exploitable via Node.js apps, but still require user approval to ignore.

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

## 🛠 Common Issues & Fixes

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
- [OK] `make db-seed`
- [OK] `make preflight`
- [OK] `make db-test-seed`
- [ERROR] `cd api && npx tsx scripts/...`

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

## 🏗️ Seed Architecture

### Design Principle

**Reusable logic in `src/`, CLI scripts as thin wrappers.**

This architectural decision ensures:
- Seed logic is compiled by TypeScript (`tsconfig.json` includes `src/`)
- Functions can be imported by API endpoints (e.g., `/admin/reset-demo`)
- CLI scripts remain simple entry points for manual execution
- Docker builds include all necessary code in `dist/`

### Directory Structure

```
api/
├── src/
│   ├── seed/                 # Reusable seed modules
│   │   └── pulse-invites.ts  # Pulse invite seeding logic
│   ├── seed-demo-data.ts     # Q&A demo data seeding
│   ├── seed-pulse-data.ts    # Pulse historical data seeding
│   ├── seed-teams.ts         # Team seeding
│   └── app.ts                # API imports from src/
└── scripts/
    ├── reset-and-seed-all.ts # CLI wrapper
    ├── seed-pulse-demo.ts    # CLI wrapper
    └── seed-pulse-invites.ts # CLI wrapper
```

### Rules

1. **`src/` files** contain all business logic and are compiled to `dist/`
2. **`scripts/` files** are thin wrappers that call functions from `src/`
3. **NEVER import from `scripts/` in `src/` files** - breaks compilation
4. **Always test TypeScript builds** before pushing Docker changes

### Example: Pulse Invites

**Reusable Logic** (`src/seed/pulse-invites.ts`):
```typescript
export async function seedPulseInvites(tenantSlug = 'default', userLimit = 10) {
  // Core business logic
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  // ... create invites ...
  return createdCount;
}
```

**CLI Wrapper** (`scripts/seed-pulse-invites.ts`):
```typescript
import { seedPulseInvites } from '../src/seed/pulse-invites.js';

async function main() {
  await seedPulseInvites('default', 10);
}

main();
```

**API Usage** (`src/app.ts`):
```typescript
const { seedPulseInvites } = await import('./seed/pulse-invites.js');
await seedPulseInvites('default', 10);
```

### Why This Matters

**Problem**: Importing from `scripts/` in `src/` files causes `MODULE_NOT_FOUND` errors in production because:
- `tsconfig.json` only compiles `src/` directory (`"include": ["src"]`)
- `scripts/` files are NOT copied to `dist/` in Docker builds
- Runtime imports fail when deployed

**Solution**: Keep all reusable logic in `src/`, use `scripts/` only for CLI entry points.

---

##  Debugging Checklist

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

##  AI Assistant Workflow

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
[OK] Pre-flight check passed! Ready for testing.

Please test the new Pulse Dashboard feature:
1. Log in as admin@demo.pulsestage.dev
2. Navigate to http://localhost:5173/admin/pulse
3. You should see 8 weeks of pulse data with charts

Expected behavior:
- Overall trend chart shows 8 data points
- Participation rate shows ~70%
- Question breakdowns display individual trends
```

##  Quick Reference

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

