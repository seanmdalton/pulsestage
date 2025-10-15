# OAuth Setup Guide

This guide walks through setting up OAuth authentication (GitHub and Google) for your PulseStage deployment.

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:

   | Field | Value | Notes |
   |-------|-------|-------|
   | **Application name** | `PulseStage Demo` | Or your organization name |
   | **Homepage URL** | `https://demo.pulsestage.app` | Your frontend URL |
   | **Authorization callback URL** | `https://api-demo.pulsestage.app/auth/github/callback` | Must match API URL + `/auth/github/callback` |
   | **Application description** | `PulseStage Q&A Platform` | Optional |

4. Click **"Register application"**
5. **Copy the Client ID** (displayed immediately)
6. Click **"Generate a new client secret"**
7. **Copy the Client Secret** immediately (you won't see it again!)

### 2. Configure Environment Variables

Add these to your deployment environment:

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=https://api-demo.pulsestage.app/auth/github/callback
```

**For Render:**
1. Go to your API service dashboard
2. Navigate to **Environment** tab
3. Add each variable (Client Secret should be added as a secret)

**For Docker Compose (local testing):**
1. Add to your `.env` file (do NOT commit this!)
2. Callback URL should be `http://localhost:3000/auth/github/callback`

### 3. Test the Integration

1. Visit your frontend login page
2. You should now see a **"Sign in with GitHub"** button
3. Click it to test the OAuth flow
4. Authorize the application
5. You should be redirected back and logged in

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth client ID"**

### 2. Configure OAuth Consent Screen

Before creating credentials, you'll need to configure the consent screen:

1. Click **"Configure Consent Screen"**
2. Select **"External"** (unless you're in Google Workspace)
3. Fill in required fields:
   - **App name**: `PulseStage`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"**
5. Skip "Scopes" (default is fine)
6. Add test users if in testing mode
7. Click **"Save and Continue"**

### 3. Create OAuth Credentials

1. Back in **Credentials**, click **"Create Credentials" → "OAuth client ID"**
2. Select **"Web application"**
3. Fill in details:

   | Field | Value | Notes |
   |-------|-------|-------|
   | **Name** | `PulseStage Web` | Descriptive name |
   | **Authorized JavaScript origins** | `https://demo.pulsestage.app` | Your frontend URL |
   | **Authorized redirect URIs** | `https://api-demo.pulsestage.app/auth/google/callback` | Must match API URL + `/auth/google/callback` |

4. Click **"Create"**
5. **Copy the Client ID and Client Secret**

### 4. Configure Environment Variables

Add these to your deployment environment:

```bash
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=https://api-demo.pulsestage.app/auth/google/callback
```

**For Render:**
1. Go to your API service dashboard
2. Navigate to **Environment** tab
3. Add each variable (Client Secret should be added as a secret)

**For Docker Compose (local testing):**
1. Add to your `.env` file (do NOT commit this!)
2. Callback URL should be `http://localhost:3000/auth/google/callback`

### 5. Test the Integration

1. Visit your frontend login page
2. You should now see a **"Sign in with Google"** button
3. Click it to test the OAuth flow
4. Sign in with your Google account
5. You should be redirected back and logged in

## Render Configuration (render.yaml)

Here's the complete configuration for `render.yaml`:

```yaml
services:
  # API Service
  - type: web
    name: pulsestage-demo-api
    envVars:
      # ... other vars ...
      
      # GitHub OAuth (optional)
      - key: GITHUB_CLIENT_ID
        sync: false
      - key: GITHUB_CLIENT_SECRET
        sync: false
      - key: GITHUB_CALLBACK_URL
        value: https://api-demo.pulsestage.app/auth/github/callback
      
      # Google OAuth (optional)
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: GOOGLE_CALLBACK_URL
        value: https://api-demo.pulsestage.app/auth/google/callback
```

**Notes:**
- `sync: false` means these values must be set manually in Render dashboard
- This prevents secrets from being committed to the repo
- Callback URLs are safe to hardcode (they're not secrets)

## Multi-Mode Authentication

PulseStage supports multiple authentication modes simultaneously:

### Demo + OAuth (Recommended for Public Demos)

```bash
AUTH_MODE_DEMO=true
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

**Result:** Users can choose:
- Quick demo (alice, bob, moderator, admin)
- Create permanent account via GitHub OAuth

### OAuth Only (Production)

```bash
# Don't set AUTH_MODE_DEMO (or set to false)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

**Result:** Only OAuth login options are displayed

### GitHub + Google (Maximum Flexibility)

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Result:** Users can choose either OAuth provider

## Testing OAuth Locally

### 1. Update /etc/hosts (if needed)

If testing with a custom domain locally:

```bash
sudo nano /etc/hosts
```

Add:
```
127.0.0.1 local.pulsestage.app
```

### 2. Configure Local Environment

```bash
# api/.env
GITHUB_CLIENT_ID=your_dev_client_id
GITHUB_CLIENT_SECRET=your_dev_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

GOOGLE_CLIENT_ID=your_dev_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_dev_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Important:** Use separate OAuth apps for development and production!

### 3. Test the Flow

```bash
make dev
# Visit http://localhost:5173
# Click "Sign in with GitHub" or "Sign in with Google"
```

## Troubleshooting

### "OAuth is not enabled" Error

**Cause:** Environment variables not set correctly

**Fix:** Verify all three variables are set:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (or use default)

### "Redirect URI mismatch" Error

**Cause:** Callback URL in GitHub/Google doesn't match the URL being called

**Fix:** Ensure the callback URL in your OAuth app configuration exactly matches:
- Production: `https://api-demo.pulsestage.app/auth/github/callback`
- Local: `http://localhost:3000/auth/github/callback`

### OAuth Button Not Showing

**Cause:** Frontend can't detect OAuth is enabled

**Fix:**
1. Check `/auth/modes` endpoint: `curl https://api-demo.pulsestage.app/auth/modes`
2. Should return: `{ "modes": [...], "oauth": { "github": true } }`
3. Verify API logs show: `🔐 Auth: Enabled modes: demo, oauth`

### Session Not Persisting After OAuth

**Cause:** Cookie domain mismatch or SameSite policy

**Fix:**
1. Ensure `FRONTEND_URL` is set correctly in API
2. Check browser cookies (should see `connect.sid` with `.pulsestage.app` domain)
3. Verify `CORS_ORIGINS` includes both frontend and API URLs

## Security Best Practices

1. ✅ **Use separate OAuth apps** for dev, staging, and production
2. ✅ **Never commit secrets** to git (use `sync: false` in render.yaml)
3. ✅ **Rotate secrets regularly** (GitHub settings → Regenerate)
4. ✅ **Restrict callback URLs** to only your domains
5. ✅ **Monitor OAuth app usage** in GitHub/Google dashboards
6. ✅ **Use organization accounts** for production OAuth apps (not personal)

## Further Reading

- 📖 [Authentication Architecture](../architecture/authentication.md)
- 🔐 [Security Headers](../security/security-headers.md)
- 🚀 [Render Deployment](./render.md)
- 🧪 [Testing OAuth Flows](../development/testing.md#oauth-testing)

