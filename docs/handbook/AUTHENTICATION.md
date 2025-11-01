# Authentication System

**Purpose:** Secure user authentication with multiple methods for development and production.

**Architecture:** Multi-mode system supporting Demo, GitHub OAuth, and Google OAuth.

---

## Authentication Modes

PulseStage supports **3 authentication modes**:

1. **Demo Mode** - Development only, no credentials required
2. **GitHub OAuth** - Production-ready, social login
3. **Google OAuth** - Production-ready, social login

**Multiple modes can be enabled simultaneously.** Users see available options on the login page.

---

## Mode Selection & Priority

### Automatic Mode Detection

The system automatically enables modes based on configuration:

```javascript
// Demo mode
if (AUTH_MODE_DEMO=true || NODE_ENV=development) {
  enableDemoMode()
}

// OAuth modes
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  enableGitHubOAuth()
}

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  enableGoogleOAuth()
}
```

### API Endpoint

**GET /auth/modes** - Returns available authentication modes

**Response:**
```json
{
  "modes": ["demo", "oauth"],
  "demo": {
    "enabled": true,
    "users": ["admin", "alice", "bob", "moderator"]
  },
  "oauth": {
    "github": true,
    "google": true
  }
}
```

Frontend uses this to render appropriate login buttons.

---

## Demo Mode (Development Only)

**Purpose:** Quick testing without OAuth setup

**Security:** Only enabled in development or with `AUTH_MODE_DEMO=true`

**Users:** Predefined demo users (admin, alice, bob, moderator)

### Configuration

```bash
# Auto-enabled in development
NODE_ENV=development

# Or explicitly enable
AUTH_MODE_DEMO=true
```

### Flow

1. User clicks demo login button
2. Frontend redirects to `GET /auth/demo?user=alice&tenant=default`
3. Backend validates user exists in seed data
4. Session created with user info
5. Redirect back to frontend with `?demo=true`

### Seed Data Integration

Demo users MUST exist in seed data:
- **Email format:** `{username}@pulsestage.app`
- **SSO ID:** Same as username (e.g., `admin`, not `demo-admin`)
- **Primary teams:** Assigned via seed script

### Limitations

- No password validation
- No real SSO provider
- Bypasses security checks
- **NEVER use in production**

---

## GitHub OAuth (Production)

**Purpose:** Let users authenticate with GitHub accounts

**Provider:** GitHub OAuth 2.0

### Configuration

```bash
# Required environment variables
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback

# Development
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

### Setup Steps

1. **Create GitHub OAuth App:**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - Application name: `PulseStage - Your Company`
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://yourdomain.com/auth/github/callback`
   - Register application
   - Copy Client ID and Client Secret

2. **Configure Environment:**
   ```bash
   GITHUB_CLIENT_ID=abc123...
   GITHUB_CLIENT_SECRET=secret123...
   GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback
   ```

3. **Test:**
   - Restart API server
   - Check `/auth/modes` includes GitHub
   - Click "Sign in with GitHub" on login page

### OAuth Flow

```
User clicks "Sign in with GitHub"
  ↓
Redirect to GitHub authorization page
  ↓
User approves (or already authorized)
  ↓
GitHub redirects to callback URL with code
  ↓
Backend exchanges code for access token
  ↓
Backend fetches user profile from GitHub API
  ↓
Backend creates or updates user in database
  ↓
Session created
  ↓
Redirect to frontend
```

### User Provisioning

**On first login:**
- Create user in database
- Email from GitHub profile
- Name from GitHub profile
- Avatar URL from GitHub profile
- Assign to default team (if configured)
- Default role: `member` (or tenant setting)

**On subsequent logins:**
- Update name/avatar if changed
- Session refreshed

### GitHub API Scopes

**Requested scopes:**
- `user:email` - Read email address (required)

**Not requested:**
- Repo access
- Organization access
- Private data

---

## Google OAuth (Production)

**Purpose:** Let users authenticate with Google accounts

**Provider:** Google OAuth 2.0

### Configuration

```bash
# Required environment variables
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# Development
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Setup Steps

1. **Create Google OAuth Client:**
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Create credentials > OAuth client ID
   - Application type: Web application
   - Name: `PulseStage - Your Company`
   - Authorized redirect URIs: `https://yourdomain.com/auth/google/callback`
   - Create
   - Copy Client ID and Client Secret

2. **Configure Environment:**
   ```bash
   GOOGLE_CLIENT_ID=123-abc.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=secret123...
   GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
   ```

3. **Test:**
   - Restart API server
   - Check `/auth/modes` includes Google
   - Click "Sign in with Google" on login page

### OAuth Flow

(Same as GitHub, different provider)

### User Provisioning

**On first login:**
- Create user in database
- Email from Google profile
- Name from Google profile
- Avatar URL from Google profile (optional)
- Assign to default team (if configured)
- Default role: `member` (or tenant setting)

**On subsequent logins:**
- Update name/avatar if changed
- Session refreshed

### Google API Scopes

**Requested scopes:**
- `profile` - Read basic profile info
- `email` - Read email address

**Not requested:**
- Drive access
- Calendar access
- Gmail access

---

## Session Management

**Technology:** express-session with Redis (production) or memory (development)

### Session Configuration

```javascript
{
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',  // HTTPS only in prod
    httpOnly: true,                      // No JavaScript access
    maxAge: 8 hours (users) / 8 hours (admins),
    sameSite: 'lax'
  },
  store: RedisStore (prod) || MemoryStore (dev)
}
```

### Session Contents

```javascript
req.session = {
  user: {
    id: "uuid",
    email: "user@example.com",
    name: "Alice Developer",
    role: "member",
    tenantId: "tenant-uuid"
  },
  tenantSlug: "default"
}
```

### Session Lifetime

- **Users:** 8 hours (configurable via tenant settings)
- **Admins:** 8 hours (configurable via tenant settings)
- **Idle timeout:** None (fixed expiration from creation)
- **Remember me:** Not yet implemented

### Session Storage

**Development:**
- In-memory store (MemoryStore)
- Lost on server restart
- Single-server only

**Production:**
- Redis store (connect-redis)
- Persists across restarts
- Supports multiple servers (load balancing)
- Requires `REDIS_URL`

---

## Multi-Tenancy & Authentication

### Tenant Resolution

**Order of precedence:**
1. `x-tenant-id` header (API requests)
2. Subdomain (e.g., `acme.pulsestage.app` → tenant `acme`)
3. Default tenant (`default`)

### Session & Tenant Binding

- User logs in → tenant determined at login time
- Session stores `tenantSlug`
- All subsequent requests use session tenant
- User cannot switch tenants without re-login

### Cross-Tenant Authentication

**Not supported:**
- Users cannot access multiple tenants with one session
- Each tenant has isolated user base
- Same email can exist in multiple tenants (different users)

---

## Logout

**Endpoint:** `POST /auth/logout`

**Flow:**
1. Destroy session
2. Clear session cookie
3. Return success

**Frontend:**
```javascript
await apiClient.logout()
navigate('/login')
```

---

## Security Considerations

### CSRF Protection

**Enabled:** Yes (via `csurf` middleware)

**Mechanism:**
- CSRF token generated per session
- Token required for state-changing requests (POST, PUT, DELETE)
- Token validated server-side

### Session Hijacking

**Mitigations:**
- `httpOnly` cookies (no JavaScript access)
- `secure` cookies in production (HTTPS only)
- `sameSite: lax` (CSRF protection)
- Session timeout (8 hours)

### Brute Force Protection

**Mechanism:** Rate limiting (see `/handbook/SECURITY_MODEL.md`)

**Limits:**
- 5 login attempts per 5 minutes (per IP + tenant)
- Redis-based (production only)
- Development bypasses rate limiting

---

## Development vs Production

| Feature | Development | Production |
|---------|------------|------------|
| **Demo Mode** | Enabled (default) | Disabled (unless forced) |
| **OAuth** | Optional | Required |
| **Session Store** | Memory | Redis (required) |
| **HTTPS** | Not required | Required |
| **CSRF** | Enabled | Enabled |
| **Rate Limiting** | Disabled | Enabled (required) |

---

## Troubleshooting

### OAuth Callback Error: "Invalid redirect URI"

**Cause:** Callback URL mismatch

**Fix:**
1. Check `GITHUB_CALLBACK_URL` / `GOOGLE_CALLBACK_URL` in `.env`
2. Ensure it matches OAuth app configuration exactly
3. Include protocol (`http://` or `https://`)
4. No trailing slash

### Session Lost on Server Restart (Development)

**Cause:** Memory-based session store

**Fix:**
- Expected behavior in development
- Use Redis for persistent sessions
- Re-login after restart

### OAuth Error: "Invalid client"

**Cause:** Incorrect Client ID or Secret

**Fix:**
1. Regenerate credentials in OAuth provider console
2. Update `.env` with new values
3. Restart API server

### User Created but Not in Database

**Cause:** User provisioning failed

**Fix:**
1. Check logs for database errors
2. Ensure tenant exists
3. Check default role is valid

---

## Future Enhancements

### Planned Features

1. **SAML SSO** - Enterprise single sign-on
2. **OIDC** - OpenID Connect support
3. **Magic Links** - Passwordless email login
4. **Remember Me** - Persistent sessions
5. **2FA** - Two-factor authentication
6. **Session Management UI** - View/revoke active sessions

### Configuration Options (Planned)

```javascript
{
  auth: {
    modes: ['demo', 'github', 'google', 'saml', 'oidc'],
    allowedDomains: ['@company.com'],  // Email domain whitelist
    requireEmailVerification: true,
    session: {
      timeout: 8,         // hours
      remember: 30,       // days (if "remember me" checked)
      maxConcurrent: 3    // Max sessions per user
    }
  }
}
```

---

## Related Documentation

- `/handbook/SECURITY_MODEL.md` - Authentication security
- `/handbook/OPERATIONS.md` - Redis setup for sessions
- `/handbook/DECISIONS/ADR-0003-roles.md` - User roles & permissions
- `/api/src/lib/auth/` - Implementation details

