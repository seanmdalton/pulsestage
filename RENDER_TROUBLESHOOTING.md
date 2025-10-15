# 🔍 Render Deployment Troubleshooting Guide

## Current Issue: Session Not Persisting After Login

### Problem
After logging in via demo mode, the user is redirected but the session cookie doesn't persist, resulting in 401 errors.

### Root Cause
**Cross-domain cookie issue**: Cookies set during a redirect from one domain to another are not preserved by browsers for security reasons.

- Cookie is set on: `pulsestage-demo-api.onrender.com`
- Redirect goes to: `demo.pulsestage.app`
- Result: Browser doesn't send the cookie back to the API

---

## 🔧 Troubleshooting Steps

### 1. Check Browser Developer Tools

Open DevTools → **Application** → **Cookies**

**For `https://demo.pulsestage.app`:**
- Should see: `connect.sid` cookie
- Domain should be: `.onrender.com` or similar
- If you DON'T see it: Cookie wasn't set or was blocked

**For `https://pulsestage-demo-api.onrender.com`:**
- Check if cookie exists here
- Check `Secure`, `HttpOnly`, `SameSite` attributes

### 2. Check Network Tab

Open DevTools → **Network** → Filter to API calls

**Look at the redirect response:**
```
Request: GET https://pulsestage-demo-api.onrender.com/auth/demo?user=alice
Response: 302 Redirect
Headers: Look for "Set-Cookie" header
```

**Check subsequent API calls:**
```
Request: GET https://pulsestage-demo-api.onrender.com/users/me
Request Headers: Look for "Cookie: connect.sid=..."
Response: 401 if cookie is missing
```

### 3. Check API Logs on Render

**View logs:**
1. Go to https://dashboard.render.com
2. Click on **pulsestage-demo-api** service
3. Go to **Logs** tab

**Look for:**
```
🍪 Session config: secure=true, sameSite=lax, httpOnly=true
✅ Redis session store connected
```

**During login attempt, look for:**
```
Demo auth error: ...
Session save error: ...
```

### 4. Test the API Directly

**Test 1: Check demo mode is enabled**
```bash
curl https://pulsestage-demo-api.onrender.com/auth/modes
```
Expected: `{"modes": ["demo"]}`

**Test 2: Try demo login with cookie capture**
```bash
curl -v -c cookies.txt 'https://pulsestage-demo-api.onrender.com/auth/demo?user=alice'
```
- Look for `Set-Cookie` header in response
- Check `cookies.txt` file for the cookie

**Test 3: Use the cookie in a subsequent request**
```bash
curl -v -b cookies.txt https://pulsestage-demo-api.onrender.com/users/me
```
Expected: User data (not 401)

### 5. Check Environment Variables

**In Render Dashboard → pulsestage-demo-api → Environment:**

Verify these are set:
- ✅ `NODE_ENV` = `production`
- ✅ `FRONTEND_URL` = `https://demo.pulsestage.app`
- ✅ `CORS_ORIGINS` = `https://demo.pulsestage.app`
- ✅ `AUTH_MODE_DEMO` = `true`
- ✅ `SESSION_SECRET` = (some value)
- ✅ `REDIS_URL` = (should be set if you have Redis)
- ✅ `DATABASE_URL` = (should be set)

### 6. Check Redis Connection

**In API logs, look for:**
```
✅ Redis session store connected
```

**If you see:**
```
❌ Failed to connect to Redis for session storage
🚨 CRITICAL: Redis connection failed in production!
```

Then Redis is not configured! Add Redis:
1. Dashboard → New + → Redis
2. Copy the Internal Redis URL
3. Add to API service as `REDIS_URL` environment variable

---

## 🐛 Common Issues & Solutions

### Issue 1: Cookies Blocked by Browser

**Symptoms:**
- Cookie never appears in DevTools
- All API requests get 401

**Causes:**
- Browser privacy settings (Safari, Firefox with strict tracking protection)
- Missing `SameSite` attribute
- Missing `Secure` flag in production

**Solution:**
- Use Chrome/Firefox with default settings for testing
- Ensure `secure: true` in production (already configured)

### Issue 2: Cross-Domain Cookie Problem

**Symptoms:**
- Cookie appears after login but not sent on subsequent requests
- Different domains for API and frontend

**Causes:**
- API: `pulsestage-demo-api.onrender.com`
- Frontend: `demo.pulsestage.app`
- Cookies don't cross root domains

**Solutions:**

**Option A: Use Same Root Domain (Recommended)**
- API: `api.pulsestage.app` or `api-demo.pulsestage.app`
- Frontend: `demo.pulsestage.app`
- Set cookie domain to `.pulsestage.app` (with leading dot)

**Option B: Popup-Based Login (Current Workaround)**
- Instead of redirect, open login in popup
- Popup closes after setting cookie
- Main window retains the cookie

**Option C: Token-Based Auth**
- Return JWT token in redirect URL
- Frontend stores token in localStorage
- Send as Bearer token (not cookies)

### Issue 3: Redis Not Connected

**Symptoms:**
- Session works for one request, then disappears
- Logs show memory store warning

**Solution:**
Create Redis instance:
```bash
# In Render Dashboard:
New + → Redis
Name: pulsestage-demo-redis
Region: Same as API service
Plan: Free

# Copy "Internal Redis URL"
# Add to API as REDIS_URL environment variable
```

### Issue 4: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Requests fail with network error

**Solution:**
Ensure `CORS_ORIGINS` includes your frontend URL:
```
CORS_ORIGINS=https://demo.pulsestage.app
```

---

## 🎯 Immediate Fix for Cross-Domain Issue

Since `demo.pulsestage.app` and `pulsestage-demo-api.onrender.com` are different root domains, we need to implement one of these solutions:

### Solution 1: Change to Same Root Domain (Best)

**Setup custom domains:**
1. API: `api-demo.pulsestage.app` → points to `pulsestage-demo-api.onrender.com`
2. Frontend: `demo.pulsestage.app` → points to `pulsestage-demo-web.onrender.com`

**Update cookie domain in code:**
```typescript
// api/src/middleware/session.ts
cookie: {
  secure: isProduction,
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: 'lax',
  domain: isProduction ? '.pulsestage.app' : undefined, // Share across subdomains
}
```

### Solution 2: Implement Popup Login Flow (Quick Fix)

Frontend opens login in popup window:
1. User clicks "Login as Alice"
2. Popup opens: `https://pulsestage-demo-api.onrender.com/auth/demo?user=alice&popup=true`
3. API sets cookie and returns HTML that:
   - Notifies parent window via `postMessage`
   - Closes popup
4. Parent window refreshes user state

### Solution 3: Token-Based Auth (Alternative)

Change from session cookies to JWT tokens:
- API returns token in redirect URL: `?token=xxx`
- Frontend stores in localStorage
- Send as `Authorization: Bearer xxx` header

---

## 📊 Expected Behavior

### Successful Login Flow:

1. **Navigate to login URL:**
   ```
   https://pulsestage-demo-api.onrender.com/auth/demo?user=alice
   ```

2. **API Response:**
   ```
   HTTP/1.1 302 Found
   Location: https://demo.pulsestage.app/?demo=true
   Set-Cookie: connect.sid=s%3A...; Path=/; HttpOnly; Secure; SameSite=Lax
   ```

3. **Browser follows redirect:**
   ```
   Navigate to: https://demo.pulsestage.app/?demo=true
   Cookie: connect.sid=s%3A...
   ```

4. **Frontend makes API call:**
   ```
   GET https://pulsestage-demo-api.onrender.com/users/me
   Cookie: connect.sid=s%3A...
   
   Response: { id: "...", email: "alice@demo.com", ... }
   ```

---

## 🚀 Next Steps

1. **Verify the exact error** by checking Network tab and seeing if cookie is being sent
2. **Check API logs** on Render for any session errors
3. **Test API directly** with curl to isolate frontend vs backend issues
4. **Decide on solution**:
   - If you can set up custom domains: Use Solution 1 (same root domain)
   - If not: Implement Solution 2 (popup login) or Solution 3 (token-based auth)

Let me know which approach you'd like to take!

