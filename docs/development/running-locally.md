# Running Locally

This guide covers different ways to run PulseStage locally for development.

## Option 1: Pure Local Development (Recommended for Daily Work)

Run only infrastructure in Docker, services on your host machine.

### Advantages
- ⚡ Fastest iteration cycle
- 🔧 Easy debugging with breakpoints
- 🔄 Instant hot reload (TypeScript + Vite)
- 🛠️ Native dev tools work perfectly

### Setup

```bash
# Start only database and Redis
docker compose up db redis -d

# Terminal 1: API
cd api
npm install
npx prisma db push
npm run db:seed:dev
npm run dev              # Hot reload with ts-node-dev

# Terminal 2: Web
cd web
npm install
npm run dev              # Hot reload with Vite HMR
```

**Access:**
- Web: http://localhost:5173
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

---

## Option 2: Docker with Local Builds (Recommended Before Pushing)

Test the actual containerized environment before pushing changes.

### Advantages
- 🐳 Tests real Docker environment
- 🔒 Run security scans locally
- ✅ Catch Docker-specific issues
- 📦 Validate complete build process

### Setup

```bash
# Build and run locally
docker compose up --build -d

# Run validation
./run-tests.sh                    # Tests + Trivy scans
./test-security.sh                # Security headers

# Load demo data
docker compose exec api npm run db:seed:full

# View logs
docker compose logs -f api
```

**How it works:**
- `docker-compose.yaml`: Published images (for end users)
- `docker-compose.override.yaml`: Local builds (for developers)
- Docker Compose automatically merges both files
- `up --build` rebuilds images from local source

---

## Option 3: Published Images (Testing User Experience)

Test exactly what end users will experience.

### Setup

```bash
# Temporarily disable local builds
mv docker-compose.override.yaml docker-compose.override.yaml.bak

# Pull and run published images
docker compose pull
docker compose up -d
docker compose exec api npm run db:seed:full

# Restore local builds
mv docker-compose.override.yaml.bak docker-compose.override.yaml
```

---

## Recommended Workflow

1. **Daily development**: Use Option 1 (pure local, fastest)
2. **Before committing**: Use Option 2 (Docker builds, run security scans)
3. **Testing UX**: Use Option 3 (published images, validate end-user experience)

## Database Management

### Reset Database (Local)
```bash
cd api
npx prisma db push --force-reset
npm run db:seed:dev
```

### Reset Database (Docker)
```bash
docker compose down -v
docker compose up -d
docker compose exec api npm run db:seed:full
```

### View Database
```bash
cd api
npx prisma studio    # Opens GUI at http://localhost:5555
```

## Troubleshooting

### Port Conflicts
If ports 3000, 5173, or 5432 are in use:

```bash
# Find what's using the port
lsof -i :3000
lsof -i :5173
lsof -i :5432
```

### TypeScript Errors
```bash
cd api
npm run build        # Should complete without errors
```

### Database Connection Issues
```bash
docker compose logs db
docker compose ps db
```

## Next Steps

- [Testing Guide](testing.md) - Run tests and validate changes
- [Contributing Guide](contributing.md) - Submit pull requests
- [Code Style](code-style.md) - Coding standards
