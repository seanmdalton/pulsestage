# 🚀 PulseStage Render Demo Deployment - Interactive Walkthrough

**Goal:** Deploy PulseStage demo to `demo.pulsestage.app` and `api-demo.pulsestage.app`

---

## 📋 **Generated Secrets** (from previous step)

```bash
SESSION_SECRET=EhiH9YQpeu4_b5hDXpGjqK6Z4jLfrXqropnP8lOpnjga-QIZwVGGxxEBD0I-wzu8
CSRF_SECRET=QoLuL3YnUS8TRLteZtYTqA08LGeRCU9k5LHtbO616bWdSwBevHVH2Ez533TBMyu8
ADMIN_KEY=7KxZJaIWjWql9B3p96OZK6_oAoEiNYNK
```

**⚠️ KEEP THIS FILE LOCAL - It's in .gitignore**

---

## **Step 1: Create PostgreSQL Database** 🗄️

### 1.1 Go to Render Dashboard
- Visit: https://dashboard.render.com
- Click **"New +"** → **"PostgreSQL"**

### 1.2 Configure Database
```
Name:                 pulsestage-demo-db
Database:             pulsestage_demo
User:                 pulsestage_demo_user
Region:               Oregon (US West) - or closest to you
Plan:                 Free
```

### 1.3 Click "Create Database"
- ⏳ Wait 2-3 minutes for provisioning
- ✅ Status shows "Available"

### 1.4 Copy Connection Strings
Once available, copy these from the database page:

**Internal Database URL** (for API service):
```
postgres://pulsestage_demo_user:XXXXX@dpg-XXXXX/pulsestage_demo
```

**External Database URL** (for local testing - optional):
```
postgres://pulsestage_demo_user:XXXXX@dpg-XXXXX-a.oregon-postgres.render.com/pulsestage_demo
```

📝 **Save these!** You'll need the Internal URL for the API service.

---

## **Step 2: Create Redis Instance** 🔴

### 2.1 Go to Render Dashboard
- Click **"New +"** → **"Redis"**

### 2.2 Configure Redis
```
Name:                 pulsestage-demo-redis
Region:               Oregon (US West) - MUST match database region
Plan:                 Free
Maxmemory Policy:     allkeys-lru (default)
```

### 2.3 Click "Create Redis"
- ⏳ Wait 1-2 minutes for provisioning
- ✅ Status shows "Available"

### 2.4 Copy Connection String
Once available, copy the **Internal Redis URL**:
```
redis://red-XXXXX:6379
```

📝 **Save this!** You'll need it for rate limiting and sessions.

---

## **Step 3: Create API Service** 🔧

### 3.1 Go to Render Dashboard
- Click **"New +"** → **"Web Service"**

### 3.2 Connect GitHub Repository
- Select **"Build and deploy from a Git repository"**
- Click **"Connect account"** (if not already connected)
- Find and select: `seanmdalton/pulsestage`
- Click **"Connect"**

### 3.3 Configure API Service
```
Name:                 pulsestage-demo-api
Region:               Oregon (US West) - MUST match database/redis
Branch:               main
Root Directory:       api
Runtime:              Docker
Plan:                 Free ($0/month)
```

### 3.4 Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these **ONE BY ONE**:

```bash
# Node Environment
NODE_ENV=production

# Database (from Step 1.4 - Internal URL)
DATABASE_URL=postgres://pulsestage_demo_user:XXXXX@dpg-XXXXX/pulsestage_demo

# Redis (from Step 2.4 - Internal URL) ⚠️ REQUIRED!
REDIS_URL=redis://red-XXXXX:6379

# Demo Mode
AUTH_MODE_DEMO=true

# Session Secrets (generated earlier)
SESSION_SECRET=EhiH9YQpeu4_b5hDXpGjqK6Z4jLfrXqropnP8lOpnjga-QIZwVGGxxEBD0I-wzu8
CSRF_SECRET=QoLuL3YnUS8TRLteZtYTqA08LGeRCU9k5LHtbO616bWdSwBevHVH2Ez533TBMyu8
ADMIN_KEY=7KxZJaIWjWql9B3p96OZK6_oAoEiNYNK

# Admin Session (reuse ADMIN_KEY for simplicity)
ADMIN_SESSION_SECRET=7KxZJaIWjWql9B3p96OZK6_oAoEiNYNK

# CORS (will update after web service is created)
CORS_ORIGIN=https://demo.pulsestage.app
CORS_ORIGINS=https://demo.pulsestage.app

# Port (Render default)
PORT=3000
```

### 3.5 Click "Create Web Service"
- ⏳ First deploy takes ~5-8 minutes (building Docker image)
- ✅ Wait for status: "Live"

**⚠️ COMMON ERROR:** If you see `ECONNREFUSED 127.0.0.1:6379`:
- You forgot to add `REDIS_URL` environment variable
- Go back to Step 3.4 and verify `REDIS_URL` is set to your **Internal** Redis URL
- Save changes to redeploy

### 3.6 Note Your API URL
Once deployed, Render assigns a URL like:
```
https://pulsestage-demo-api.onrender.com
```

📝 **Save this!** You'll need it for the web service.

---

## **Step 4: Seed Demo Data** 🌱

### 4.1 Open Render Shell
- Go to API service page
- Click **"Shell"** tab (top right)
- Wait for shell to connect

### 4.2 Run Seed Commands
In the Render shell, run:

```bash
# Seed teams
npm run db:seed:teams

# Seed tags
npm run db:seed:tags

# Seed demo users and questions
npm run db:seed:demo
```

Expected output:
```
✅ Created team: General
✅ Created team: Engineering
✅ Created team: Product
✅ Created team: People
✅ Created 12 demo questions
🎉 Demo data ready!
```

### 4.3 Verify Seeding
In the shell, check the database:
```bash
npx prisma db pull --force
npx prisma db push --accept-data-loss=false
```

Should show: "Your database is in sync"

---

## **Step 5: Create Web Service** 🌐

### 5.1 Go to Render Dashboard
- Click **"New +"** → **"Web Service"**

### 5.2 Connect Same Repository
- Select **"Build and deploy from a Git repository"**
- Select: `seanmdalton/pulsestage` (already connected)

### 5.3 Configure Web Service
```
Name:                 pulsestage-demo-web
Region:               Oregon (US West) - MUST match API
Branch:               main
Root Directory:       web
Runtime:              Docker
Plan:                 Free ($0/month)
```

### 5.4 Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add this **ONE**:

```bash
# API URL (from Step 3.6)
VITE_API_URL=https://api-demo.pulsestage.app
```

### 5.5 Click "Create Web Service"
- ⏳ First deploy takes ~4-6 minutes
- ✅ Wait for status: "Live"

### 5.6 Note Your Web URL
Once deployed, Render assigns a URL like:
```
https://pulsestage-demo-web.onrender.com
```

📝 **Save this!** You'll configure custom domains next.

---

## **Step 6: Configure Custom Domains** 🌍

### 6.1 API Domain (api-demo.pulsestage.app)

**In Render (API Service):**
1. Go to API service page
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter: `api-demo.pulsestage.app`
6. Click **"Save"**

**Copy the CNAME record shown:**
```
api-demo.pulsestage.app → pulsestage-demo-api.onrender.com
```

**In Cloudflare:**
1. Go to https://dash.cloudflare.com
2. Select domain: `pulsestage.app`
3. Click **"DNS"** → **"Records"**
4. Click **"Add record"**
   - Type: `CNAME`
   - Name: `api-demo`
   - Target: `pulsestage-demo-api.onrender.com`
   - Proxy status: ☁️ **Proxied** (orange cloud)
   - TTL: Auto
5. Click **"Save"**

### 6.2 Web Domain (demo.pulsestage.app)

**In Render (Web Service):**
1. Go to Web service page
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter: `demo.pulsestage.app`
6. Click **"Save"**

**Copy the CNAME record shown:**
```
demo.pulsestage.app → pulsestage-demo-web.onrender.com
```

**In Cloudflare:**
1. Still in DNS settings for `pulsestage.app`
2. Click **"Add record"**
   - Type: `CNAME`
   - Name: `demo`
   - Target: `pulsestage-demo-web.onrender.com`
   - Proxy status: ☁️ **Proxied** (orange cloud)
   - TTL: Auto
3. Click **"Save"**

### 6.3 Wait for DNS Propagation
- ⏳ Usually 1-5 minutes with Cloudflare
- ✅ Render shows "Verified" next to custom domains

### 6.4 Enable SSL
**In Render:**
- SSL is automatic once domain is verified
- ✅ Both services should show 🔒 next to custom domains

---

## **Step 7: Update CORS Configuration** 🔄

Now that you have custom domains, update the API CORS settings:

### 7.1 Update API Environment Variables
1. Go to API service in Render
2. Click **"Environment"** tab
3. Update these two variables:

```bash
CORS_ORIGIN=https://demo.pulsestage.app
CORS_ORIGINS=https://demo.pulsestage.app
```

4. Click **"Save Changes"**
5. Render will automatically redeploy (~2 minutes)

---

## **Step 8: Configure GitHub Actions Secret** 🔧

For the demo reset system to work:

### 8.1 Add GitHub Secret
1. Go to: https://github.com/seanmdalton/pulsestage
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"**
4. Name: `ADMIN_KEY`
5. Value: `7KxZJaIWjWql9B3p96OZK6_oAoEiNYNK` (from earlier)
6. Click **"Add secret"**

### 8.2 Test the Workflow
1. Go to **"Actions"** tab
2. Click **"Reset Demo Instance"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait for completion (~30 seconds)
5. ✅ Should see green checkmark

---

## **Step 9: Test the Demo** 🧪

### 9.1 Visit Demo Site
Open: https://demo.pulsestage.app

Expected: Login page with demo users

### 9.2 Test Demo Login
1. Click **"Alice (Demo User)"**
2. Should redirect to: `https://demo.pulsestage.app/general`
3. ✅ You should see the submit question page

### 9.3 Test Question Submission
1. Enter a test question: "Is the demo working?"
2. Click **"Submit Question"**
3. ✅ Question should appear in the open questions list

### 9.4 Test API Health
Visit: https://api-demo.pulsestage.app/health

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-15T01:30:00.000Z",
  "uptime": 12345
}
```

### 9.5 Test Demo Reset
Run this from your terminal:
```bash
curl -X POST https://api-demo.pulsestage.app/admin/reset-demo \
  -H "x-admin-key: 7KxZJaIWjWql9B3p96OZK6_oAoEiNYNK" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Demo instance reset successfully",
  "timestamp": "2025-10-15T01:30:00.000Z",
  "resetItems": {
    "questionsCleared": 1,
    "upvotesCleared": 0,
    "auditLogsCleared": 0,
    "demoDataReseeded": true
  }
}
```

---

## **Step 10: Configure Cloudflare Settings** ☁️

### 10.1 SSL/TLS Settings
1. In Cloudflare dashboard
2. Go to **"SSL/TLS"** → **"Overview"**
3. Set mode to: **"Full (strict)"**
4. This ensures end-to-end encryption

### 10.2 Caching Rules (Optional)
For better performance:

1. Go to **"Caching"** → **"Configuration"**
2. Click **"Create rule"**

**For API:**
```
Rule name: API No Cache
When incoming requests match: Hostname equals api-demo.pulsestage.app
Then: Cache eligibility → Bypass cache
```

**For Web (static assets):**
```
Rule name: Web Asset Cache
When incoming requests match: 
  Hostname equals demo.pulsestage.app AND
  File extension is in {js, css, png, jpg, svg, woff2}
Then: Cache eligibility → Eligible for cache
     Browser Cache TTL → 1 hour
```

---

## **✅ Deployment Complete!**

Your demo is now live at:
- 🌐 **Web**: https://demo.pulsestage.app
- 🔧 **API**: https://api-demo.pulsestage.app
- 📊 **Health**: https://api-demo.pulsestage.app/health
- 📚 **Swagger**: https://api-demo.pulsestage.app/api-docs

---

## **🔄 Daily Automatic Resets**

The GitHub Actions workflow will automatically reset your demo:
- **Schedule**: Daily at 3 AM UTC (11 PM EST / 8 PM PST)
- **What it does**: Clears user-submitted questions, re-seeds demo data
- **Manual trigger**: Actions tab → "Reset Demo Instance" → Run workflow

---

## **📊 Monitoring**

### Render Dashboard
- **Metrics**: CPU, memory, request volume
- **Logs**: Real-time application logs
- **Alerts**: Email notifications for downtime

### Health Checks
Render automatically pings:
- Web: `https://demo.pulsestage.app/`
- API: `https://api-demo.pulsestage.app/health`

If health check fails, Render will:
1. Restart the service automatically
2. Send email notification
3. Show "Unhealthy" in dashboard

---

## **🛠️ Maintenance**

### Viewing Logs
1. Go to service in Render
2. Click **"Logs"** tab
3. Use filter to search: `ERROR`, `WARN`, etc.

### Redeploying
**Automatic** (on git push):
- Any push to `main` branch triggers redeploy
- ~5 minutes for API, ~4 minutes for Web

**Manual**:
1. Go to service page
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Updating Environment Variables
1. Go to service → **"Environment"** tab
2. Edit value
3. Click **"Save Changes"**
4. Render auto-redeploys (~2-5 minutes)

---

## **🐛 Troubleshooting**

### "Application failed to respond"
**Cause**: Service not healthy
**Fix**:
1. Check logs for errors
2. Verify DATABASE_URL is correct (Internal URL)
3. Check Redis connection
4. Manual deploy latest commit

### "Origin is not allowed by CORS"
**Cause**: CORS misconfiguration
**Fix**:
1. API → Environment
2. Update `CORS_ORIGIN` to `https://demo.pulsestage.app`
3. Update `CORS_ORIGINS` to `https://demo.pulsestage.app`
4. Save (triggers redeploy)

### "Invalid or missing CSRF token"
**Cause**: Missing CSRF_SECRET
**Fix**:
1. Verify CSRF_SECRET is set in API environment
2. Clear browser cookies
3. Try again

### Demo login not working
**Cause**: Demo users not seeded
**Fix**:
1. API service → Shell
2. Run: `npm run db:seed:demo`
3. Verify: Should see "✅ Created 12 demo questions"

### Database connection errors
**Cause**: Wrong DATABASE_URL
**Fix**:
1. Use **Internal** database URL (starts with `postgres://`)
2. Don't use External URL (ends with `-a.oregon-postgres.render.com`)
3. Update API environment variable
4. Save (triggers redeploy)

---

## **💰 Cost Estimate**

**Free Tier:**
- PostgreSQL: Free (1 GB, 90-day limit then deleted)
- Redis: Free (25 MB)
- 2× Web Services: Free (750 hrs/month each)
- **Total: $0/month** (for first 90 days)

**After 90 Days (if you want to keep it):**
- PostgreSQL: $7/month (256 MB)
- Redis: Free (still works)
- 2× Web Services: Free
- **Total: $7/month**

**⚠️ Free tier services sleep after 15 min of inactivity**
- First request takes ~30 seconds to wake up
- Subsequent requests are instant
- GitHub Actions reset keeps services awake

---

## **🎯 Next Steps**

- [ ] Set calendar reminder to upgrade database before 90 days
- [ ] Add uptime monitoring (e.g., UptimeRobot - free)
- [ ] Share demo link: `https://demo.pulsestage.app`
- [ ] Monitor first few automatic resets (3 AM UTC)
- [ ] Consider adding Discord/Slack notifications for health checks

---

**🎉 Congratulations!** Your PulseStage demo is live and will automatically stay fresh with daily resets!

