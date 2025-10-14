# PulseStage Demo Deployment to Render

**Target URL**: `https://demo.pulsestage.app`  
**Date**: October 14, 2025  
**Status**: Pre-deployment checklist

---

## 📋 Pre-Deployment Checklist

### ✅ Generate Secrets

**Run this command to generate secure secrets:**

```bash
cd api
npx tsx scripts/generate-secrets.ts
```

**Also generate:**
```bash
node -e "console.log('ADMIN_SESSION_SECRET=' + require('crypto').randomBytes(64).toString('base64').replace(/[+\/=]/g, m => ({'+':'-','/':'_','=':''}[m])))"
```

**You'll get values like:**
```bash
# Session Management
SESSION_SECRET=[64-character random string]
ADMIN_SESSION_SECRET=[64-character random string]
CSRF_SECRET=[64-character random string]

# Admin API Key
ADMIN_KEY=[32-character random string]
```

⚠️ **SECURITY**: 
- Store these in a password manager
- Never commit to git
- Use different secrets for each environment
- Copy these to your local `RENDER_DEPLOYMENT.md` (git-ignored)

---

## 🎯 Deployment Steps

### Step 1: GitHub OAuth Setup (OPTIONAL)

**Action**: Create GitHub OAuth App

**Note**: This is **optional** for the demo instance. With `AUTH_MODE_DEMO=true`, users can log in as demo users without GitHub. You can skip this step and add OAuth later if desired.

**If you want to enable OAuth**:

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `PulseStage Demo`
   - **Homepage URL**: `https://demo.pulsestage.app`
   - **Authorization callback URL**: `https://api-demo.pulsestage.app/auth/github/callback`
4. Click "Register application"
5. **Save**:
   ```
   GITHUB_CLIENT_ID=[Copy this]
   GITHUB_CLIENT_SECRET=[Generate and copy this]
   ```
6. Add to API environment variables (uncommenting the lines)

**Status**: ⬜ Skipped (using demo mode only)

---

### Step 2: Create PostgreSQL Database

**Action**: Set up database on Render

1. In Render Dashboard → "New +" → "PostgreSQL"
2. **Configuration**:
   - **Name**: `pulsestage-demo-db`
   - **Database**: `pulsestage_demo`
   - **User**: `pulsestage_demo_user`
   - **Region**: `Oregon (US West)` (or preferred)
   - **Plan**: `Starter` ($7/month)
3. **After creation**, copy:
   ```
   DATABASE_URL=[Internal Database URL]
   ```
   (Format: `postgresql://user:pass@host:5432/dbname`)

**Status**: ⬜ Not started

---

### Step 3: Create Redis Instance

**Action**: Set up Redis on Render

1. In Render Dashboard → "New +" → "Redis"
2. **Configuration**:
   - **Name**: `pulsestage-demo-redis`
   - **Region**: Same as database
   - **Plan**: `Starter` ($10/month)
   - **Maxmemory Policy**: `allkeys-lru`
3. **After creation**, copy:
   ```
   REDIS_URL=[Internal Redis URL]
   ```
   (Format: `redis://host:6379`)

**Status**: ⬜ Not started

---

### Step 4: Deploy API Service

**Action**: Create and configure API web service

1. In Render Dashboard → "New +" → "Web Service"
2. **Connect Repository**: `seanmdalton/pulsestage`
3. **Configuration**:
   - **Name**: `pulsestage-demo-api`
   - **Region**: Same as DB/Redis
   - **Branch**: `main`
   - **Root Directory**: `api`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `api/Dockerfile`
   - **Plan**: `Starter` ($7/month)

4. **Environment Variables**:

```bash
# Node Environment
NODE_ENV=production

# Demo Mode (ENABLE for demo instance!)
AUTH_MODE_DEMO=true

# Database (from Step 2)
DATABASE_URL=[Paste Internal Database URL]

# Redis (from Step 3)
REDIS_URL=[Paste Internal Redis URL]

# Security Secrets (from above)
SESSION_SECRET=jRYqgPug5unoN4-WOi0sD3egl_lqRdN1I7H5dhuk6DDVk9cAIWaAmLNG_xvp61_o
ADMIN_SESSION_SECRET=hRS0fV1AxL2c5k0EpCdWKxuc_BwwZjU7ssGogzmyG0dDVmjbZeeziSkIJ-WLtn4i0xvyqU3pu1wUprM_I43chQ
CSRF_SECRET=1DclOUtGUWs7kC4kkt73tt0m8Ktvl7CVT5cfc6XFmr9TO73koIknRG32rVy2AtHP
ADMIN_KEY=8V8xEHT8qVg9yZRP6jTCtMdSGlERI7if

# CORS (update after Step 5)
CORS_ORIGIN=https://demo.pulsestage.app
CORS_ORIGINS=https://demo.pulsestage.app

# GitHub OAuth (OPTIONAL for demo - can enable later)
# GITHUB_CLIENT_ID=[Paste from Step 1]
# GITHUB_CLIENT_SECRET=[Paste from Step 1]

# Email (Optional - can add later)
# EMAIL_FROM=noreply@pulsestage.app
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=[sendgrid-username]
# SMTP_PASSWORD=[sendgrid-password]

# OpenAI Moderation (Optional - can add later)
# OPENAI_API_KEY=[your-key]
```

5. **Health Check Path**: `/health/ready`
6. Click "Create Web Service"
7. **Wait for deployment** (first deploy takes ~5-10 minutes)

**After deployment**, save:
```
API_INTERNAL_URL=[Copy from Render, e.g., https://pulsestage-demo-api.onrender.com]
```

**Status**: ⬜ Not started

---

### Step 5: Deploy Web Service

**Action**: Create and configure web frontend

1. In Render Dashboard → "New +" → "Web Service"
2. **Connect Repository**: `seanmdalton/pulsestage`
3. **Configuration**:
   - **Name**: `pulsestage-demo-web`
   - **Region**: Same as API
   - **Branch**: `main`
   - **Root Directory**: `web`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `web/Dockerfile`
   - **Plan**: `Starter` ($7/month)

4. **Environment Variables**:

```bash
# API URL (temporarily use internal URL from Step 4)
VITE_API_URL=[Paste API_INTERNAL_URL from Step 4]
```

5. Click "Create Web Service"
6. **Wait for deployment**

**Status**: ⬜ Not started

---

### Step 6: Configure Custom Domains

**Action**: Set up custom domains in Render

#### 6.1: Configure Web Domain

1. Go to `pulsestage-demo-web` service → Settings → Custom Domains
2. Add domain: `demo.pulsestage.app`
3. Copy the **CNAME target** (e.g., `pulsestage-demo-web.onrender.com`)

#### 6.2: Configure API Domain

1. Go to `pulsestage-demo-api` service → Settings → Custom Domains
2. Add domain: `api-demo.pulsestage.app`
3. Copy the **CNAME target** (e.g., `pulsestage-demo-api.onrender.com`)

**Status**: ⬜ Not started

---

### Step 7: Configure DNS in Cloudflare

**Action**: Point domains to Render

1. Log in to **Cloudflare**
2. Select domain: `pulsestage.app`
3. Go to **DNS** → **Records**

#### 7.1: Add Web DNS Record

```
Type: CNAME
Name: demo
Target: [CNAME from Step 6.1]
Proxy status: Proxied (🟠 orange cloud)
TTL: Auto
```

#### 7.2: Add API DNS Record

```
Type: CNAME
Name: api-demo
Target: [CNAME from Step 6.2]
Proxy status: Proxied (🟠 orange cloud)
TTL: Auto
```

4. **Wait for DNS propagation** (usually 2-5 minutes with Cloudflare)

**Status**: ⬜ Not started

---

### Step 8: Update Environment Variables

**Action**: Update URLs now that domains are configured

#### 8.1: Update API Service

Go to `pulsestage-demo-api` → Settings → Environment → Edit

**Update these variables**:
```bash
CORS_ORIGIN=https://demo.pulsestage.app
CORS_ORIGINS=https://demo.pulsestage.app
```

Click "Save Changes" (will trigger redeploy)

#### 8.2: Update Web Service

Go to `pulsestage-demo-web` → Settings → Environment → Edit

**Update**:
```bash
VITE_API_URL=https://api-demo.pulsestage.app
```

Click "Save Changes" (will trigger redeploy)

**Status**: ⬜ Not started

---

### Step 9: Update GitHub OAuth Callback (OPTIONAL)

**Action**: Update callback URL to use custom domain

**Note**: Only needed if you enabled GitHub OAuth in Step 1. Skip if using demo mode only.

**If OAuth is enabled**:

1. Go to GitHub OAuth App settings
2. Update **Authorization callback URL** to:
   ```
   https://api-demo.pulsestage.app/auth/github/callback
   ```
3. Save changes

**Status**: ⬜ Skipped (demo mode only)

---

### Step 10: Run Database Migrations

**Action**: Initialize database schema

1. Go to Render Dashboard → `pulsestage-demo-api` → "Shell"
2. Run:
   ```bash
   npx prisma migrate deploy
   ```
3. Wait for completion (should show "All migrations applied")

**Status**: ⬜ Not started

---

### Step 11: Seed Demo Data

**Action**: Load demo users, teams, tags, and sample questions

1. In the same Shell (or open new one):

```bash
# Seed demo users (alice, bob, moderator, admin)
node dist/seed-test-users.js

# Seed teams (General, Engineering, Product, People)
node dist/seed-teams.js

# Seed tags
node dist/seed-tags.js

# Seed demo questions and data
node dist/seed-multi-tenant-data.js
```

**Expected output**:
- ✅ 4 demo users created
- ✅ 4 teams created
- ✅ Multiple tags created
- ✅ ~12 sample questions created (open, answered, under review)

**Status**: ⬜ Not started

---

### Step 12: Testing & Verification

**Action**: Verify deployment works

#### 12.1: Test API Health

```bash
# Basic health check
curl https://api-demo.pulsestage.app/health

# Ready check (includes DB/Redis)
curl https://api-demo.pulsestage.app/health/ready
```

Expected: `200 OK` with JSON response

#### 12.2: Test Web Frontend

1. Visit: `https://demo.pulsestage.app`
2. Should load and redirect to login
3. Should see "Try Demo" section with user dropdown

#### 12.3: Test Demo Login

1. Select a demo user:
   - **Alice (Demo)** - Regular member
   - **Bob (Demo)** - Regular member
   - **Moderator (Demo)** - Team moderator
   - **Admin (Demo)** - Full admin access
2. Click "Continue as [user]"
3. Should redirect to main app
4. Should see demo data banner at top

#### 12.4: Test Core Features

**As Alice**:
- ✅ View questions by team (General, Engineering, Product, People)
- ✅ Submit a question to Engineering team
- ✅ Upvote existing questions
- ✅ Search questions
- ✅ View question details

**As Moderator**:
- ✅ Access moderation queue
- ✅ Review questions
- ✅ Answer questions
- ✅ Pin/freeze questions
- ✅ Tag questions

**As Admin**:
- ✅ Access admin panel
- ✅ Manage users
- ✅ Manage teams
- ✅ View health dashboard
- ✅ Export data
- ✅ View audit logs

#### 12.5: Test Different Users

1. Log out (user menu → Sign Out)
2. Log back in as different demo user
3. Verify different permissions/access

**Status**: ⬜ Not started

---

## 📊 Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| PostgreSQL | Starter | $7 |
| Redis | Starter | $10 |
| API Service | Starter | $7 |
| Web Service | Starter | $7 |
| **Total** | | **$31/month** |

---

## 🔍 Monitoring & Maintenance

### Daily Checks (Automated)

Render automatically monitors:
- Service health
- CPU/Memory usage
- Disk usage (PostgreSQL)
- Response times

### Weekly Checks (Manual)

- [ ] Review error logs in Render Dashboard
- [ ] Check database size (should stay under plan limits)
- [ ] Verify backups are running (auto in Render)

### Monthly Tasks

- [ ] Review Render bill
- [ ] Check for GitHub dependency updates (Dependabot)
- [ ] Review performance metrics

### Security Maintenance

- [ ] Rotate secrets every 90 days
- [ ] Review GitHub OAuth app access
- [ ] Check for security updates

---

## 🆘 Troubleshooting

### API Won't Start

1. Check Render logs: Dashboard → API Service → Logs
2. Common issues:
   - Missing environment variables
   - Database connection failed
   - Redis connection failed
3. Verify `DATABASE_URL` and `REDIS_URL` are correct

### Web Frontend Shows Errors

1. Check if API is healthy: `curl https://api-demo.pulsestage.app/health`
2. Verify `VITE_API_URL` is set correctly
3. Check CORS settings in API
4. Clear browser cache and try again

### GitHub OAuth Fails

1. Verify callback URL matches exactly in GitHub app settings
2. Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
3. Ensure domains are properly configured in Cloudflare
4. Check API logs for specific error

### Database Migration Fails

1. Check if database is accessible: `psql $DATABASE_URL`
2. Review migration files in `api/prisma/migrations/`
3. Try manual migration:
   ```bash
   npx prisma migrate resolve --applied [migration-name]
   ```

### SSL Certificate Issues

Render auto-provisions SSL via Let's Encrypt:
- Usually takes 2-10 minutes after domain is added
- If stuck, remove and re-add custom domain
- Ensure DNS is properly configured in Cloudflare

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Render Support**: https://render.com/support
- **Cloudflare Docs**: https://developers.cloudflare.com
- **GitHub OAuth**: https://docs.github.com/en/developers/apps/building-oauth-apps

---

## ✅ Post-Deployment

After successful deployment:

- [ ] Add email notification settings (SMTP)
- [ ] Configure OpenAI moderation (optional)
- [ ] Set up monitoring alerts in Render
- [ ] Document admin credentials securely
- [ ] Share demo URL with team
- [ ] Monitor first few days for issues
- [ ] Consider enabling Render's automatic scaling if traffic grows

---

## 🎯 Next Steps

Future enhancements:
1. Set up custom domain for production: `<tenant>.pulsestage.app`
2. Create marketing website at `pulsestage.app`
3. Add analytics (e.g., Plausible, Google Analytics)
4. Set up error tracking (e.g., Sentry)
5. Configure CDN for static assets
6. Add backup/restore procedures

---

**Deployment Started**: [Date]  
**Deployment Completed**: [Date]  
**Deployed By**: [Name]  
**Production URL**: https://demo.pulsestage.app

