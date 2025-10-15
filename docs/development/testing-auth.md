# Authentication Testing Guide

This guide explains how to test the authentication system in different environments.

## Overview

PulseStage uses a simplified two-mode authentication system based on `NODE_ENV`:

- **Development Mode** (`NODE_ENV=development`): Demo users + optional OAuth
- **Production Mode** (`NODE_ENV=production`): OAuth only + setup wizard

## Development Mode

### Prerequisites

```bash
# Ensure NODE_ENV is set to development (default in docker-compose.override.yaml)
NODE_ENV=development
```

### What's Included

- **Auto-seeded demo users**: alice, bob, moderator, admin
- **No setup wizard**: Database is automatically populated
- **Demo mode login**: Quick-access buttons for instant login
- **Optional OAuth**: GitHub and Google OAuth work if credentials are provided

### Testing Demo Mode

1. **Start the development environment**:
   ```bash
   make dev
   ```

2. **Verify demo users are seeded**:
   Look for this in the API logs:
   ```
   🌱 Development mode: Seeding demo users...
     ✅ Alice (Demo User)
     ✅ Bob (Demo User)
     ✅ Moderator (Demo)
     ✅ Admin (Demo)
   ✅ Demo users ready! Login at: http://localhost:5173/login
   ```

3. **Open the login page**:
   ```bash
   open http://localhost:5173/login
   ```

4. **Test demo login**:
   - Select a user from the dropdown (alice, bob, moderator, admin)
   - Click "Continue as [user]"
   - Should be redirected to `/all` with authentication

5. **Verify authentication**:
   ```bash
   # Test API with demo user session
   curl -i -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
     http://localhost:3000/profile
   ```

### Testing OAuth in Development (Optional)

OAuth credentials are **optional** in development. To test OAuth:

1. **Set up GitHub OAuth**:
   ```bash
   # Get credentials from https://github.com/settings/developers
   # Add to your .env file:
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
   ```

2. **Set up Google OAuth**:
   ```bash
   # Get credentials from https://console.cloud.google.com/apis/credentials
   # Add to your .env file:
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```

3. **Restart the containers**:
   ```bash
   docker compose down
   make dev
   ```

4. **Verify OAuth is enabled**:
   Look for this in the API logs:
   ```
   🔐 Auth modes enabled: demo, oauth
   ```

5. **Test OAuth login**:
   - Go to http://localhost:5173/login
   - Click "Sign in with GitHub" or "Sign in with Google"
   - Complete the OAuth flow
   - Should be redirected back to the app with authentication

## Production Mode

### Prerequisites

```bash
# Ensure NODE_ENV is set to production
NODE_ENV=production

# OAuth credentials are REQUIRED in production
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback

# And/or
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
```

### What's Included

- **No demo users**: Database starts empty
- **Setup wizard**: First launch shows tenant setup wizard
- **OAuth only**: Only GitHub/Google OAuth buttons appear on login
- **Production security**: Rate limiting, secure cookies, CSRF protection

### Testing Production Mode Locally

1. **Update docker-compose.override.yaml**:
   ```yaml
   services:
     api:
       environment:
         NODE_ENV: production  # Change from development
         # Add OAuth credentials
         GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
         GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
         # ... other production settings ...
   ```

2. **Start with a fresh database**:
   ```bash
   docker compose down -v
   make dev
   ```

3. **First launch - Setup Wizard**:
   - Navigate to http://localhost:5173/
   - Should see the setup wizard
   - Complete tenant setup
   - Create first admin user

4. **Test OAuth login**:
   - After setup, go to http://localhost:5173/login
   - Should only see OAuth buttons (no demo mode)
   - Click "Sign in with GitHub" or "Sign in with Google"
   - Complete OAuth flow

5. **Verify no demo users exist**:
   ```bash
   # Should return empty or only OAuth-created users
   docker exec -it ama-app-api-1 npx prisma studio
   # Navigate to User model and verify no demo users
   ```

## Common Testing Scenarios

### Scenario 1: Clean Start in Development

```bash
# Reset everything
docker compose down -v
rm -rf api/dist web/dist

# Start fresh
make dev

# Verify demo users are auto-seeded
docker compose logs api | grep "Demo users ready"

# Test login
open http://localhost:5173/login
```

### Scenario 2: Switch from Development to Production

```bash
# Stop development mode
docker compose down

# Update NODE_ENV in docker-compose.override.yaml
sed -i 's/NODE_ENV: development/NODE_ENV: production/g' docker-compose.override.yaml

# Clear database and restart
docker compose down -v
make dev

# Should see setup wizard
open http://localhost:5173/
```

### Scenario 3: Test OAuth Error Handling

```bash
# Start in development mode
make dev

# Set invalid OAuth credentials
export GITHUB_CLIENT_ID=invalid
export GITHUB_CLIENT_SECRET=invalid

# Restart
docker compose restart api

# Try GitHub login - should redirect back with error
open http://localhost:5173/login
# Click "Sign in with GitHub"
# Should redirect to /login?error=...
```

## Troubleshooting

### Demo users not appearing

**Problem**: Login page doesn't show demo user dropdown.

**Solution**:
1. Check NODE_ENV is set to `development`:
   ```bash
   docker compose logs api | grep "Auth modes enabled"
   # Should show: 🔐 Auth modes enabled: demo
   ```

2. Check demo user seeding succeeded:
   ```bash
   docker compose logs api | grep "Demo users ready"
   ```

3. Verify frontend can fetch auth modes:
   ```bash
   curl http://localhost:3000/auth/modes
   # Should return: {"modes":["demo"],"demo":{"enabled":true,"users":["alice","bob","moderator","admin"]},...}
   ```

### OAuth buttons not showing

**Problem**: OAuth buttons don't appear even with credentials set.

**Solution**:
1. Verify credentials are set:
   ```bash
   docker compose logs api | grep "Auth modes enabled"
   # Should include "oauth" if credentials are valid
   ```

2. Check environment variables are passed to container:
   ```bash
   docker exec ama-app-api-1 env | grep GITHUB
   docker exec ama-app-api-1 env | grep GOOGLE
   ```

3. Restart after setting credentials:
   ```bash
   docker compose restart api
   ```

### Session not persisting

**Problem**: User gets logged out immediately or on refresh.

**Solution**:
1. Check Redis is running:
   ```bash
   docker compose ps redis
   ```

2. Verify session secret is set:
   ```bash
   grep SESSION_SECRET env.example
   # Ensure it's not the default value
   ```

3. Check browser cookies are enabled and not blocked

### Setup wizard appears in development

**Problem**: Setup wizard shows up even in development mode.

**Solution**:
This shouldn't happen. If it does:
1. Verify NODE_ENV:
   ```bash
   docker exec ama-app-api-1 env | grep NODE_ENV
   # Should return: NODE_ENV=development
   ```

2. Check if demo users were seeded:
   ```bash
   docker compose logs api | grep "Demo users"
   ```

3. If still having issues, check the tenant exists:
   ```bash
   curl http://localhost:3000/health
   # Check "tenants" count
   ```

## API Endpoints for Testing

### Check authentication modes
```bash
curl http://localhost:3000/auth/modes
```

### Check current session
```bash
curl -H "Cookie: connect.sid=YOUR_SESSION" http://localhost:3000/profile
```

### Health check (includes tenant count)
```bash
curl http://localhost:3000/health
```

### Demo login (development only)
```bash
curl -i http://localhost:3000/auth/demo?user=alice&tenant=demo
```

## Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Determines auth mode |
| `GITHUB_CLIENT_ID` | Optional | **Required*** | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Optional | **Required*** | GitHub OAuth client secret |
| `GOOGLE_CLIENT_ID` | Optional | **Required*** | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | **Required*** | Google OAuth client secret |
| `SESSION_SECRET` | Required | Required | Session encryption key |
| `FRONTEND_URL` | `http://localhost:5173` | Your domain | OAuth redirect URL |

\* At least one OAuth provider (GitHub or Google) is required in production.

## Next Steps

After testing authentication:
1. Configure OAuth for your production deployment
2. Set strong session secrets
3. Enable HTTPS for production
4. Configure rate limiting
5. Review audit logs for authentication events

## Additional Resources

- [GitHub OAuth Apps](https://github.com/settings/developers)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [Session Configuration](./docs/security/sessions.md)
- [Deployment Guide](./docs/deployment/production.md)
