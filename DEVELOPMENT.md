# 🛠️ PulseStage Development Guide

This guide covers the streamlined local development workflow for PulseStage.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Commands](#development-commands)
- [Testing Workflow](#testing-workflow)
- [Pre-Push Validation](#pre-push-validation)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### First Time Setup

1. **Initialize environment:**
   ```bash
   make setup
   # or: bash setup.sh
   ```

2. **Install dependencies:**
   ```bash
   make install
   ```

3. **Start development environment:**
   ```bash
   make dev
   ```

4. **Access the application:**
   - Web: http://localhost:5173
   - API: http://localhost:3000
   - API Docs: http://localhost:3000/docs

5. **Load data** (choose one):
   - **Via Setup Wizard** (recommended): Open http://localhost:5173 and follow the wizard
   - **Via CLI** (development): `make db-seed` (in another terminal)

---

## 🎯 Development Commands

We use a **Makefile** for convenience. All commands can be run with `make <command>`.

### Setup & Environment

```bash
make setup        # Initialize .env file with secure secrets
make install      # Install all dependencies (API + Web)
```

### Development

```bash
make dev          # Start local development (builds from source)
make up           # Start services in background
make down         # Stop all services
make logs         # Follow logs from all services
make clean        # Clean up containers, volumes, and build artifacts
```

### Testing

```bash
make test         # Run all tests
make test-api     # Run API tests only
make test-web     # Run Web E2E tests (requires services running)
make validate-ci  # Run all CI checks locally before pushing
make security     # Run security scans (Trivy)
```

### Code Quality

```bash
make lint         # Run linting (API + Web)
make lint-fix     # Fix linting issues automatically
make format       # Format code (Prettier)
```

### Database

```bash
make db-seed      # Seed database with demo data (development only)
make db-reset     # Reset and reseed database from scratch
```

**Note**: For production/first-time users, use the Setup Wizard instead (opens automatically at http://localhost:5173).

---

## 🧪 Testing Workflow

### Local Testing

PulseStage has comprehensive testing at multiple levels:

1. **Unit/Integration Tests (API)**
   ```bash
   make test-api
   # or: cd api && npm test
   ```

2. **E2E Tests (Web)**
   ```bash
   make up           # Start services first
   make test-web     # Run E2E tests
   ```

3. **Validate All CI Checks**
   ```bash
   make validate-ci  # Runs everything CI will check
   ```

### What Gets Tested

- ✅ **API Tests**: 214 unit/integration tests
- ✅ **API Build**: TypeScript compilation
- ✅ **API Linting**: ESLint + Prettier (0 errors allowed)
- ✅ **Web Linting**: ESLint + Prettier (0 errors allowed)
- ✅ **Security**: Semgrep + Trivy scans (in CI)

---

## 🔒 Pre-Push Validation

We use **Husky hooks** to ensure quality before pushing:

### Pre-Commit Hook
Automatically runs on every commit:
- ✅ Formats code with Prettier
- ✅ Adds formatted files to staging

### Pre-Push Hook
Automatically runs before every push:
- ✅ Runs API tests (214 tests must pass)
- ✅ Builds API (TypeScript compilation)
- ✅ Runs API linting (0 errors)
- ✅ Runs Web linting (0 errors)

**Note:** Warnings are allowed, but errors will block the push.

### Manual Pre-Push Check

Run all validation checks manually before pushing:

```bash
make validate-ci
```

This runs the exact same checks that CI will run, ensuring your push will succeed.

---

## 💼 Common Workflows

### Starting a New Feature

```bash
# 1. Start fresh
make down
make clean

# 2. Pull latest changes
git pull origin main

# 3. Install dependencies
make install

# 4. Start development
make dev

# 5. In another terminal, seed database
make db-seed

# 6. Start coding!
```

### Before Committing

```bash
# Format and lint your code
make lint-fix
make format

# Run tests
make test-api

# The pre-commit hook will auto-format on commit
git add .
git commit -m "your message"
```

### Before Pushing

```bash
# Validate everything locally
make validate-ci

# If all checks pass, push!
git push origin your-branch

# The pre-push hook will run automatically
```

### Testing UI Changes

```bash
# 1. Start with local builds
make dev

# 2. Make your changes to web/src/...

# 3. Vite will hot-reload automatically

# 4. For API changes, restart the service
docker compose restart api
```

### Database Changes

```bash
# After changing prisma/schema.prisma

# 1. Update the schema in Docker
docker compose exec api npx prisma db push

# 2. Regenerate Prisma client
docker compose exec api npx prisma generate

# 3. Restart API
docker compose restart api

# 4. Reseed if needed
make db-seed
```

### Running Security Scans

```bash
# Run the same security scans as CI
make security
```

This will:
- Build fresh Docker images
- Run Trivy scans for vulnerabilities
- Test service health
- Report any HIGH/CRITICAL issues

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs
make logs

# Clean and restart
make clean
make dev
```

### Database Connection Issues

```bash
# Reset database
make db-reset
```

### Tests Failing

```bash
# Make sure you're using the test database
cd api && npm test

# The tests use a separate test database automatically
```

### Port Already in Use

```bash
# Stop all services
make down

# If that doesn't work, find and kill the process
lsof -ti:3000 | xargs kill -9  # API port
lsof -ti:5173 | xargs kill -9  # Web port
```

### Linting Errors

```bash
# Auto-fix most issues
make lint-fix

# Format code
make format

# Check what's wrong
make lint
```

### Pre-Push Hook Failing

```bash
# Run the checks manually to see details
make validate-ci

# Fix any issues, then try pushing again
```

### Docker Build Issues

```bash
# Clean everything and rebuild
make clean
docker system prune -af
make dev
```

---

## 📚 Additional Resources

- **Setup Guide**: `docs/getting-started/quick-start.md`
- **Testing Guide**: `docs/development/testing.md`
- **API Documentation**: http://localhost:3000/docs (when running)
- **Contributing Guide**: `CONTRIBUTING.md`

---

## 🎯 Key Principles

1. **Local-First Development**: Use `make dev` to build from local source
2. **Test Before Push**: Use `make validate-ci` to catch issues early
3. **Automated Validation**: Pre-push hooks ensure code quality
4. **Docker for Consistency**: All services run in Docker for consistency
5. **Simple Commands**: Use `make` for common tasks

---

## 🤝 Getting Help

If you run into issues:

1. Check the logs: `make logs`
2. Try a clean restart: `make clean && make dev`
3. Check `TROUBLESHOOTING.md` for common issues
4. Ask in the team channel

Happy coding! 🚀

