# Troubleshooting

Common issues and solutions.

## Services Not Starting

### Check Docker Services

```bash
docker compose ps
```

All services should show "Up":
- api
- web
- db (PostgreSQL)
- redis
- mailpit

### Restart Services

```bash
docker compose down
docker compose up -d
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
```

## Cannot Log In

### Demo Mode Not Working

1. **Verify demo mode enabled**:
```bash
# Check .env
grep AUTH_MODE_DEMO .env
```

Should show: `AUTH_MODE_DEMO=true` (or empty in development)

2. **Check API logs**:
```bash
docker compose logs -f api | grep -i auth
```

3. **Verify database seeded**:
```bash
docker compose exec db psql -U app -d ama -c "SELECT email FROM \"User\" WHERE email LIKE '%@pulsestage.app';"
```

Should show 4 demo users.

### OAuth Not Working

1. **Verify OAuth configuration** in `.env`:
```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

2. **Check OAuth callback URL** matches GitHub/Google OAuth app settings

3. **Verify environment** is production:
```bash
NODE_ENV=production
AUTH_MODE_DEMO=false
```

## No Data / Empty Dashboard

### Reseed Database

```bash
make db-seed
```

This creates:
- 50 users
- 2 teams
- 36 questions
- 12 weeks of pulse data

### Verify Seed Data

```bash
make db-test-seed
```

Expected output:
- Users: 50
- Teams: 2
- Questions: 36
- Pulse responses: 800+

## Database Connection Errors

### PostgreSQL Not Accessible

1. **Check PostgreSQL running**:
```bash
docker compose ps db
```

2. **Test connection**:
```bash
docker compose exec db psql -U app -d ama -c "SELECT 1;"
```

3. **Verify DATABASE_URL** in `.env`:
```bash
DATABASE_URL=postgresql://app:app@db:5432/ama
```

### Run Migrations

```bash
docker compose exec api npx prisma migrate deploy
```

## Redis Connection Errors

1. **Check Redis running**:
```bash
docker compose ps redis
```

2. **Test connection**:
```bash
docker compose exec redis redis-cli ping
```

Expected: `PONG`

3. **Verify REDIS_URL** in `.env`:
```bash
REDIS_URL=redis://redis:6379
```

## Port Conflicts

### Port Already in Use

If ports 3000, 5173, 5432, 6379, or 8025 are in use:

1. **Find process using port**:
```bash
sudo lsof -i :3000
```

2. **Kill process**:
```bash
sudo kill -9 <PID>
```

3. **Or change ports** in `docker-compose.yaml`:
```yaml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

## Email Not Sending

### Check Email Configuration

```bash
# Verify email provider in .env
grep EMAIL_PROVIDER .env
```

### Test with Mailpit (Development)

1. **Access Mailpit**: `http://localhost:8025`
2. **Check emails** in Mailpit inbox
3. **Verify SMTP settings**:
```bash
SMTP_HOST=mailpit
SMTP_PORT=1025
```

### Production Email Issues

1. **Verify credentials** for SMTP or Resend
2. **Check email queue**:
   - Admin → Email Queue
3. **View logs**:
```bash
docker compose logs -f api | grep -i email
```

## Permission Errors

### Cannot Answer Questions

1. **Verify role**:
   - Admin → Users → [Your User]
   - Check team memberships and roles

2. **Required role**: Moderator, Admin, or Owner

### Cannot Access Admin Panel

1. **Required role**: Admin or Owner
2. **Verify in database**:
```bash
docker compose exec db psql -U app -d ama -c "SELECT email, role FROM \"User\" WHERE email = 'your@email.com';"
```

## Performance Issues

### Slow Search

Full-text search requires GIN indexes:

```bash
docker compose exec api npx prisma migrate deploy
```

Verify indexes:
```bash
docker compose exec db psql -U app -d ama -c "\d \"Question\";"
```

Should show `question_search_idx` (GIN index).

### High Memory Usage

1. **Check Docker resource limits**:
```bash
docker stats
```

2. **Increase Docker memory** (Docker Desktop → Settings → Resources)

3. **Reduce worker processes** in production

## Frontend Not Loading

### White Screen / Blank Page

1. **Check frontend logs**:
```bash
docker compose logs -f web
```

2. **Verify API accessible**:
```bash
curl http://localhost:3000/health
```

3. **Check CORS settings** in `.env`:
```bash
CORS_ORIGIN=http://localhost:5173
```

### 401 Unauthorized Errors

1. **Clear cookies**: Browser DevTools → Application → Cookies → Clear
2. **Log out and back in**
3. **Verify session secrets** in `.env` are set

## Pre-Flight Check Failures

Run diagnostics:

```bash
make preflight
```

This checks:
- Docker services
- Database connectivity
- API health
- Frontend accessibility
- Authentication flow
- Seed data integrity

Exit code 0 = all checks passed

Exit code 1 = see output for failed checks

## Still Having Issues?

1. **Check logs**:
```bash
docker compose logs -f
```

2. **Verify environment variables**:
```bash
cat .env
cat web/.env
```

3. **Reset everything**:
```bash
docker compose down -v  # WARNING: Deletes all data
./setup.sh
docker compose up -d
make db-seed
```

4. **Open an issue**: [GitHub Issues](https://github.com/seanmdalton/pulsestage/issues)

Include:
- Error messages
- Docker logs
- Environment (OS, Docker version)
- Steps to reproduce
