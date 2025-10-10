# Authentication System

PulseStage implements a flexible, multi-mode authentication system designed to support different deployment scenarios: demo environments, self-hosted installations, and production deployments.

## Overview

The authentication system supports multiple auth modes that can be enabled simultaneously:

1. **Demo Mode**: Instant access with pre-configured demo users (no password required)
2. **GitHub OAuth**: Social authentication for self-hosted and cloud deployments  
3. **Google OAuth**: Social authentication for enterprise environments
4. **Mock SSO** (Development): Simulates enterprise SSO for local development

## Architecture

### Backend Components

```
api/src/lib/auth/
├── types.ts        # TypeScript interfaces and types
├── demoMode.ts     # Demo mode implementation  
├── oauth.ts        # OAuth 2.0 flows (GitHub, Google)
└── index.ts        # AuthManager (orchestration layer)
```

#### AuthManager

The `AuthManager` class orchestrates all authentication modes:

```typescript
import { AuthManager } from './lib/auth'

const authManager = new AuthManager(prisma)

// Check available modes
const modes = authManager.getEnabledModes()
// Returns: ['demo', 'oauth']

// Check if specific mode is enabled
const isDemoEnabled = authManager.isModeEnabled('demo')

// Authenticate with demo mode
const user = await authManager.authenticateDemo(req, res)

// Handle OAuth callbacks
const user = await authManager.handleGitHubCallback(req, res)
const user = await authManager.handleGoogleCallback(req, res)
```

### Frontend Components

```
web/src/
├── components/
│   ├── AuthSelector.tsx      # Landing page auth UI
│   └── DemoModeBanner.tsx    # Banner for demo users
└── pages/
    └── LoginPage.tsx          # Standalone login page
```

#### AuthSelector

Responsive authentication UI that:
- Auto-detects available auth modes from backend API (`/auth/modes`)
- Displays demo user dropdown if demo mode is enabled
- Shows OAuth buttons (GitHub, Google) if configured
- Adapts to mobile and desktop layouts
- Supports dark mode

#### DemoModeBanner

Persistent banner that:
- Detects demo users by email domain (`@demo.pulsestage.dev`)
- Displays "data resets daily" warning
- Encourages upgrade to OAuth for permanent accounts
- Dismissible per session

## Configuration

### Environment Variables

#### Demo Mode (Always Enabled by Default)

No configuration needed. To disable:

```bash
# .env
AUTH_MODE_DEMO=false  # Disabled
# Or omit variable (defaults to true)
```

Demo users are pre-configured in `seed-test-users.ts`:
- `alice@demo.pulsestage.dev` (Admin)
- `bob@demo.pulsestage.dev` (Moderator)
- `moderator@demo.pulsestage.dev` (Moderator)
- `admin@demo.pulsestage.dev` (Admin)

#### GitHub OAuth

**Setup Steps:**

1. Create a GitHub OAuth App:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Fill in:
     - **Application name**: PulseStage (Your Org)
     - **Homepage URL**: `https://your-domain.com`
     - **Authorization callback URL**: `https://your-domain.com/api/auth/github/callback`
   - Click "Register application"
   - Copy **Client ID** and **Client Secret**

2. Configure environment variables:

```bash
# .env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=https://your-domain.com/api/auth/github/callback

# Frontend URL (for redirects after auth)
FRONTEND_URL=https://your-domain.com
```

#### Google OAuth

**Setup Steps:**

1. Create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback`
   - Copy **Client ID** and **Client Secret**

2. Configure environment variables:

```bash
# .env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback

# Frontend URL (for redirects after auth)
FRONTEND_URL=https://your-domain.com
```

### Multi-Mode Configuration

You can enable multiple auth modes simultaneously:

```bash
# .env - Production Example
# Demo mode disabled for production
AUTH_MODE_DEMO=false

# GitHub OAuth for public-facing instance
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://app.example.com/api/auth/github/callback

# Google OAuth for enterprise SSO
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://app.example.com/api/auth/google/callback

FRONTEND_URL=https://app.example.com
```

```bash
# .env - Self-Hosted Example
# Enable demo mode for quick testing
# (Demo users use @demo.pulsestage.dev emails)

# GitHub OAuth for real users
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Authentication Modes Endpoint

**GET /auth/modes**

Returns available authentication modes and configuration:

```json
{
  "modes": ["demo", "oauth"],
  "demo": {
    "enabled": true,
    "users": ["alice", "bob", "moderator", "admin"]
  },
  "oauth": {
    "github": true,
    "google": false
  }
}
```

### Demo Mode Endpoints

**GET /auth/demo**

Auto-login with demo user:

Query Parameters:
- `user` (required): Demo user identifier (`alice`, `bob`, `moderator`, `admin`)
- `tenant` (optional): Tenant slug (defaults to `demo`)

```bash
curl "http://localhost:3000/auth/demo?user=alice&tenant=demo"
```

Response: Redirects to `FRONTEND_URL` with session cookie

### OAuth Endpoints

**GET /auth/github**

Initiates GitHub OAuth flow:

```bash
# Browser navigates to:
https://your-domain.com/api/auth/github
```

Response: Redirects to GitHub authorization page

**GET /auth/github/callback**

Handles GitHub OAuth callback:

```bash
# GitHub redirects to:
https://your-domain.com/api/auth/github/callback?code=...&state=...
```

Response: Redirects to `FRONTEND_URL` with session cookie

**GET /auth/google**

Initiates Google OAuth flow:

```bash
# Browser navigates to:
https://your-domain.com/api/auth/google
```

Response: Redirects to Google authorization page

**GET /auth/google/callback**

Handles Google OAuth callback:

```bash
# Google redirects to:
https://your-domain.com/api/auth/google/callback?code=...&state=...
```

Response: Redirects to `FRONTEND_URL` with session cookie

### Session Management

Sessions are stored in Express session with the following structure:

```typescript
req.session.user = {
  id: string           // User UUID
  email: string        // User email  
  name: string         // Display name
}

req.session.tenantSlug = string  // Current tenant context
```

## Security Considerations

### OAuth Security

1. **State Parameter**: CSRF protection via random state tokens
2. **HTTPS Only**: OAuth callbacks must use HTTPS in production
3. **Redirect URI Validation**: Exact match required by OAuth providers
4. **Token Storage**: Access tokens are not persisted (only used during auth flow)

### Session Security

Sessions are configured with secure defaults:

```typescript
{
  secret: process.env.SESSION_SECRET,  // Strong random secret required
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    httpOnly: true,                                  // No JavaScript access
    sameSite: 'lax',                                 // CSRF protection
    maxAge: 30 * 24 * 60 * 60 * 1000                // 30 days
  }
}
```

### Demo Mode Security

**⚠️ Demo mode should NEVER be enabled in production!**

Demo mode bypasses all authentication checks. Only use for:
- Local development
- Public demos (read-only or ephemeral data)
- CI/CD testing

To disable demo mode:

```bash
# .env
AUTH_MODE_DEMO=false
```

## User Experience

### First-Time Login Flow

1. User visits application
2. AuthSelector component detects available auth modes
3. User chooses auth method:
   - **Demo**: Select demo user from dropdown → instant access
   - **GitHub**: Click "Sign in with GitHub" → OAuth flow → redirect back
   - **Google**: Click "Sign in with Google" → OAuth flow → redirect back
4. Session is created with user context
5. User is redirected to application home page

### Demo User Experience

Demo users see a persistent banner on all pages:

```
ℹ️  You're in demo mode. Data resets daily.
    [Sign up to save your work]  [✕]
```

Banner characteristics:
- Gradient blue background for visibility
- Call-to-action button links to GitHub OAuth
- Dismissible per session (not persisted)
- Detects demo users by email domain

### OAuth Error Handling

If OAuth fails, users are redirected to `/login?error=<message>`:

```typescript
// Example error scenarios:
- Missing authorization code
- Invalid state parameter
- OAuth provider API error
- User account creation failure
```

The `LoginPage` component displays error messages in a prominent alert banner.

## Testing

### Manual Testing (Local Development)

1. **Demo Mode**:
   ```bash
   # Visit login page
   http://localhost:5173/login
   
   # Select demo user and click "Continue"
   # Should redirect to home page with demo banner
   ```

2. **GitHub OAuth**:
   ```bash
   # Set environment variables
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
   FRONTEND_URL=http://localhost:5173
   
   # Visit login page and click "Sign in with GitHub"
   # Complete OAuth flow on GitHub
   # Should redirect back to http://localhost:5173
   ```

3. **Google OAuth** (similar to GitHub):
   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   ```

### Automated Testing

Unit tests for authentication flows are located in:
- `api/src/lib/auth/demoMode.test.ts`
- `api/src/lib/auth/oauth.test.ts`
- `api/src/lib/auth/index.test.ts`

Run tests:

```bash
cd api
npm test -- auth
```

## Deployment

### Self-Hosted (Docker Compose)

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Configure OAuth credentials in `.env`

3. Start services:
   ```bash
   docker-compose up -d
   ```

4. Visit `http://localhost:5173` to verify login page

### Cloud Deployment (Render, Heroku, etc.)

1. Set environment variables in platform dashboard:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_CALLBACK_URL` (use your production domain)
   - `GOOGLE_CLIENT_ID` (optional)
   - `GOOGLE_CLIENT_SECRET` (optional)
   - `GOOGLE_CALLBACK_URL` (optional)
   - `FRONTEND_URL` (your production frontend URL)
   - `SESSION_SECRET` (generate with `openssl rand -hex 32`)

2. Deploy application

3. Update OAuth app settings:
   - GitHub: Update callback URL to production domain
   - Google: Add production domain to authorized redirect URIs

4. Test login flow on production domain

### HTTPS Requirement

OAuth flows **require HTTPS** in production. Ensure your deployment has:
- Valid TLS/SSL certificate
- HTTPS redirect for HTTP traffic
- Secure cookie flag enabled (`secure: true`)

For local development, OAuth providers typically allow `http://localhost` callbacks.

## Troubleshooting

### "OAuth state mismatch" Error

**Cause**: Session not persisting between OAuth initiation and callback

**Solutions**:
1. Verify `SESSION_SECRET` is set
2. Check session store is configured (Redis recommended for production)
3. Ensure cookies are being set (check browser dev tools)
4. Verify `sameSite` cookie setting is compatible with OAuth flow

### "GitHub/Google OAuth callback error"

**Cause**: Misconfigured callback URL

**Solutions**:
1. Verify `*_CALLBACK_URL` matches OAuth app settings exactly
2. Check for typos (http vs https, trailing slash, etc.)
3. Ensure domain is accessible from OAuth provider
4. Check OAuth app is not restricted to specific organization

### "Demo user not found"

**Cause**: Database not seeded with demo users

**Solutions**:
1. Run seed script: `npm run seed:test-users`
2. Verify `.env` has correct `DATABASE_URL`
3. Check database is running and accessible

### "Cannot read properties of undefined (user.email)"

**Cause**: Session not established or user not authenticated

**Solutions**:
1. Verify OAuth flow completes successfully
2. Check session middleware is configured
3. Ensure user is created in database after OAuth
4. Check for errors in OAuth callback handler

## Migration Guide

### From Mock SSO to OAuth

If you're currently using mock SSO for development:

1. Keep mock SSO for local development:
   ```bash
   # .env.local
   AUTH_MODE=mock
   ```

2. Add OAuth for deployed environments:
   ```bash
   # .env.production
   AUTH_MODE=oauth
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

3. Update deployment scripts to use correct `.env` file

### From Demo Mode to Production OAuth

When moving from demo to production:

1. Disable demo mode:
   ```bash
   # .env
   AUTH_MODE_DEMO=false
   ```

2. Enable OAuth:
   ```bash
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   # and/or
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

3. Update documentation for users
4. Communicate migration timeline if existing demo users need to create real accounts

## Best Practices

1. **Use OAuth for production**: More secure than password-based auth
2. **Disable demo mode in production**: Prevents unauthorized access
3. **Rotate session secrets**: Change `SESSION_SECRET` periodically
4. **Monitor auth failures**: Log OAuth errors for debugging
5. **Test callback URLs**: Verify exact match with OAuth provider settings
6. **Use HTTPS**: Required for OAuth, improves security overall
7. **Implement rate limiting**: Protect against brute force on auth endpoints
8. **Add MFA (future)**: Consider multi-factor authentication for sensitive deployments

## Future Enhancements

- [ ] SAML/Enterprise SSO support
- [ ] Multi-factor authentication (MFA)
- [ ] Magic link authentication (passwordless)
- [ ] Social auth providers (Microsoft, LinkedIn, etc.)
- [ ] API key authentication for programmatic access
- [ ] JWT tokens for stateless authentication
- [ ] Role-based access control (RBAC) integration with OAuth

## Related Documentation

- [Session Management](./sessions.md)
- [Security Overview](../security/overview.md)
- [RBAC & Permissions](../security/rbac.md)
- [Deployment Guide](../deployment/production.md)
