# 🎭 Demo Mode Deployment Guide

**Perfect for**: Public demo at `demo.pulsestage.app`

---

## ✨ What You Get

### **Demo Experience**
- **No GitHub account required** - visitors can explore immediately
- **4 pre-configured users** with different permission levels:
  - 👤 **Alice** - Regular member
  - 👤 **Bob** - Regular member
  - 👨‍💼 **Moderator** - Team moderator with review/answer access
  - 👑 **Admin** - Full administrative access
- **Pre-seeded content**:
  - 4 teams (General, Engineering, Product, People)
  - Multiple tags
  - ~12 sample questions (open, answered, under review)
- **Demo data banner** - Shows at top so users know it's a demo

### **User Journey**
1. Visit `demo.pulsestage.app`
2. Redirected to `/login`
3. See "Try Demo" section with user dropdown
4. Select user → Click "Continue as [user]" → Instant access!
5. Explore features based on role

---

## 🔑 Key Environment Variable

The magic setting that enables demo mode:

```bash
AUTH_MODE_DEMO=true
```

This single variable:
- ✅ Enables demo user login
- ✅ Shows demo users in login dropdown
- ✅ Displays demo banner
- ✅ Auto-seeds demo data on first startup
- ✅ Bypasses GitHub OAuth requirement

---

## 🚀 Simplified Deployment

### **Skip These Steps**
- ❌ GitHub OAuth setup (optional, not required)
- ❌ Setup wizard (data is pre-seeded)
- ❌ First-time admin creation

### **Essential Steps**
1. Create Render services (PostgreSQL, Redis, API, Web)
2. Set `AUTH_MODE_DEMO=true` in API environment
3. Run database migrations
4. Seed demo data
5. Test!

---

## 📊 Demo Users & Permissions

| User | Email | Role | Can Do |
|------|-------|------|--------|
| **Alice** | alice@demo.pulsestage.dev | Member | Submit, upvote, view questions |
| **Bob** | bob@demo.pulsestage.dev | Member | Submit, upvote, view questions |
| **Moderator** | moderator@demo.pulsestage.dev | Moderator | Review queue, answer, pin, tag |
| **Admin** | admin@demo.pulsestage.dev | Admin | Full access, manage users/teams |

---

## 🎯 Perfect For

- **Public demos** - Let anyone try your product
- **Sales presentations** - Quick access to show features
- **User testing** - Different roles without account setup
- **Documentation** - Live examples in docs
- **Conference demos** - No WiFi/auth hassles

---

## 🔒 Production vs Demo

### **Demo Instance** (`demo.pulsestage.app`)
```bash
NODE_ENV=production        # Production security/optimizations
AUTH_MODE_DEMO=true       # Enable demo mode
# No GitHub OAuth required
```

### **Production Instance** (`<tenant>.pulsestage.app`)
```bash
NODE_ENV=production        # Production security/optimizations
# AUTH_MODE_DEMO not set    # Disabled (secure)
GITHUB_CLIENT_ID=xxx      # OAuth required
GITHUB_CLIENT_SECRET=xxx  # OAuth required
```

---

## 💡 Pro Tips

### **Data Management**
- Demo data persists (doesn't auto-reset by default)
- To reset: Re-run seed scripts
- Consider cron job for nightly reset if desired

### **Performance**
- Same performance as production
- Full security (HTTPS, CSRF, session management)
- Rate limiting active
- Redis caching enabled

### **Customization**
- Edit seed scripts to customize demo data
- Adjust user permissions in seed scripts
- Add/remove teams as needed

### **Adding OAuth Later**
If you decide to add GitHub OAuth:
1. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
2. Redeploy API
3. Both demo login AND GitHub OAuth will be available
4. Users can choose their preferred method

---

## 🧪 Testing Script

Quick verification after deployment:

```bash
# 1. Test API health
curl https://api-demo.pulsestage.app/health

# 2. Test auth modes endpoint
curl https://api-demo.pulsestage.app/auth/modes

# Expected response should show:
# {"demo": true, "github": false, "google": false}

# 3. Test demo users endpoint
curl https://api-demo.pulsestage.app/auth/demo

# Should return list of demo users

# 4. Visit web frontend
open https://demo.pulsestage.app

# 5. Test each demo user
# - Login as Alice → Submit question → Logout
# - Login as Moderator → Review queue → Answer → Logout
# - Login as Admin → Admin panel → Check health → Logout
```

---

## 📝 Deployment Checklist

See `DEPLOYMENT_CHECKLIST.md` for step-by-step instructions.

**Key points**:
1. Phase 1 (GitHub OAuth): **SKIP** ⏭️
2. Phase 3 (API deploy): Set `AUTH_MODE_DEMO=true` ⭐
3. Phase 7 (Database): Run ALL seed scripts ⭐
4. Phase 8 (Testing): Test demo login flow ✅

---

## 🎉 Result

A fully functional, publicly accessible demo of PulseStage at:

**https://demo.pulsestage.app**

Where anyone can:
- Try it as different users
- See real features in action
- Submit questions, upvote, search
- Experience moderation workflow
- Test admin features

**No sign-up. No barriers. Just explore.** 🚀

