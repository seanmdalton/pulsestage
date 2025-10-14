# 🚀 Render Deployment Quick Checklist

**Target**: `demo.pulsestage.app`  
**Status**: Ready to deploy

---

## Pre-Flight ✈️

- [ ] Secrets generated ✓ (see RENDER_DEPLOYMENT.md)
- [ ] Render account ready
- [ ] Cloudflare account for `pulsestage.app` ready
- [ ] GitHub account ready

---

## Phase 1: GitHub OAuth Setup (OPTIONAL - Skip for Demo Mode)

**Note**: For demo instance with `AUTH_MODE_DEMO=true`, OAuth is optional. You can skip this phase and users will log in as demo users (alice, bob, moderator, admin).

- [ ] **SKIP** (using demo mode only)

**OR if you want OAuth**:
- [ ] Create OAuth app at https://github.com/settings/developers
  - Name: `PulseStage Demo`
  - Homepage: `https://demo.pulsestage.app`
  - Callback: `https://api-demo.pulsestage.app/auth/github/callback`
- [ ] Save `GITHUB_CLIENT_ID`
- [ ] Save `GITHUB_CLIENT_SECRET`

---

## Phase 2: Render Services (15 min)

### PostgreSQL
- [ ] Create database: `pulsestage-demo-db`
- [ ] Plan: Starter ($7/mo)
- [ ] Region: Oregon (US West)
- [ ] Copy `DATABASE_URL`

### Redis
- [ ] Create Redis: `pulsestage-demo-redis`
- [ ] Plan: Starter ($10/mo)
- [ ] Same region as database
- [ ] Copy `REDIS_URL`

---

## Phase 3: Deploy API (10 min)

- [ ] Create web service: `pulsestage-demo-api`
- [ ] Connect repo: `seanmdalton/pulsestage`
- [ ] Root directory: `api`
- [ ] Runtime: Docker
- [ ] Plan: Starter ($7/mo)
- [ ] Add environment variables:
  - `NODE_ENV=production`
  - `AUTH_MODE_DEMO=true` ⭐ (enables demo login!)
  - `DATABASE_URL` (from Phase 2)
  - `REDIS_URL` (from Phase 2)
  - All secrets (see RENDER_DEPLOYMENT.md)
  - CORS settings
  - **Skip GitHub OAuth vars** (optional)
- [ ] Health check: `/health/ready`
- [ ] Deploy and wait (~5-10 min)
- [ ] Copy internal URL

---

## Phase 4: Deploy Web (10 min)

- [ ] Create web service: `pulsestage-demo-web`
- [ ] Connect repo: `seanmdalton/pulsestage`
- [ ] Root directory: `web`
- [ ] Runtime: Docker
- [ ] Plan: Starter ($7/mo)
- [ ] Add `VITE_API_URL` (use internal API URL for now)
- [ ] Deploy and wait (~5-10 min)

---

## Phase 5: Custom Domains (10 min)

### Render Configuration
- [ ] Add domain to web service: `demo.pulsestage.app`
- [ ] Copy web CNAME target
- [ ] Add domain to API service: `api-demo.pulsestage.app`
- [ ] Copy API CNAME target

### Cloudflare DNS
- [ ] Add CNAME record: `demo` → [web CNAME] (proxied)
- [ ] Add CNAME record: `api-demo` → [API CNAME] (proxied)
- [ ] Wait for DNS propagation (~2-5 min)

---

## Phase 6: Update Configuration (5 min)

### API Service
- [ ] Update `CORS_ORIGIN=https://demo.pulsestage.app`
- [ ] Update `CORS_ORIGINS=https://demo.pulsestage.app`
- [ ] Save (auto redeploy)

### Web Service
- [ ] Update `VITE_API_URL=https://api-demo.pulsestage.app`
- [ ] Save (auto redeploy)

### GitHub OAuth (Optional)
- [ ] **SKIP** if using demo mode only
- [ ] **OR** Update callback URL to `https://api-demo.pulsestage.app/auth/github/callback`

---

## Phase 7: Database Setup (5 min)

- [ ] Open API Shell in Render
- [ ] Run: `npx prisma migrate deploy`
- [ ] Run: `node dist/seed-test-users.js` ⭐ (demo users!)
- [ ] Run: `node dist/seed-teams.js`
- [ ] Run: `node dist/seed-tags.js`
- [ ] Run: `node dist/seed-multi-tenant-data.js` ⭐ (sample questions!)

---

## Phase 8: Testing (10 min)

### API Health
- [ ] Test: `curl https://api-demo.pulsestage.app/health`
- [ ] Test: `curl https://api-demo.pulsestage.app/health/ready`

### Web Frontend
- [ ] Visit: `https://demo.pulsestage.app`
- [ ] Should redirect to login
- [ ] Should see "Try Demo" section

### Demo Login
- [ ] Select demo user (Alice, Bob, Moderator, or Admin)
- [ ] Click "Continue as [user]"
- [ ] Should see demo data banner

### Test as Alice (Regular User)
- [ ] View questions by team
- [ ] Submit a question to Engineering
- [ ] Upvote a question
- [ ] Search questions

### Test as Moderator
- [ ] Access moderation queue
- [ ] Review/answer questions
- [ ] Pin or tag a question

### Test as Admin
- [ ] Access admin panel
- [ ] View health dashboard
- [ ] Manage teams/users

---

## Post-Deployment

- [ ] Monitor logs for 24 hours
- [ ] Share URL with team
- [ ] Document any issues
- [ ] Set up monitoring alerts

---

## Monthly Cost: $31

- PostgreSQL: $7
- Redis: $10
- API Service: $7
- Web Service: $7

---

**Started**: ___________  
**Completed**: ___________  
**Issues**: ___________

