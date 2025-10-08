# Troubleshooting Guide

## API Connection Refused (ERR_CONNECTION_REFUSED)

If you see errors like:
```
GET http://localhost:3000/teams net::ERR_CONNECTION_REFUSED
GET http://localhost:3000/admin/status net::ERR_CONNECTION_REFUSED
```

The API server is not running. Follow these steps:

### 1. Check if Docker services are running

```bash
docker compose ps
```

Expected output - all services should show "Up":
```
NAME                IMAGE                                      STATUS
ama-app-api-1       ghcr.io/seanmdalton/pulsestage-api:latest  Up
ama-app-db-1        postgres:16-alpine                         Up
ama-app-redis-1     redis:7-alpine                             Up
ama-app-web-1       ghcr.io/seanmdalton/pulsestage-web:latest  Up
```

### 2. If services are not running, start them

```bash
docker compose up -d
```

### 3. Check API logs for errors

```bash
docker compose logs api
```

Common issues:
- Database connection errors (check if PostgreSQL is running)
- Missing environment variables (check your `.env` file)
- Port already in use (another service using port 3000)

### 4. Check if API is healthy

```bash
curl http://localhost:3000/health
```

Should return: `{"ok":true,"service":"ama-api"}`

### 5. Verify database is initialized

```bash
docker compose exec api npm run db:seed
```

### 6. Complete restart

If nothing works, try a complete restart:

```bash
docker compose down
docker compose up -d
docker compose logs -f api
```

Watch the logs to see if the API starts successfully.

## Port Conflicts

If port 3000 or 5173 is already in use:

```bash
# Find what's using the port
lsof -i :3000
lsof -i :5173

# Or on Linux:
ss -tulpn | grep :3000
ss -tulpn | grep :5173
```

Then either:
1. Stop the conflicting service
2. Change ports in `docker-compose.yaml` and update `.env`

## Database Issues

### Reset database completely

```bash
docker compose down -v  # Warning: This deletes all data!
docker compose up -d
docker compose exec api npm run db:seed:full
```

### Check database connection

```bash
docker compose exec db psql -U app -d ama -c "SELECT COUNT(*) FROM \"Question\";"
```

## Web Container Issues

If web is running but API isn't, the web container might be trying to connect to the wrong API URL.

Check the web container environment:
```bash
docker compose exec web env | grep VITE_API_URL
```

Should show: `VITE_API_URL=http://localhost:3000`

## Still Not Working?

1. Check all environment variables are set:
   ```bash
   cat .env
   ```

2. Ensure `.env` has all required variables:
   - `SESSION_SECRET`
   - `ADMIN_SESSION_SECRET`
   - `CSRF_SECRET`
   - `ADMIN_KEY`

3. Regenerate secrets:
   ```bash
   ./setup.sh
   ```

4. View all service logs:
   ```bash
   docker compose logs
   ```

