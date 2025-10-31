# Login Diagnostic Guide

## Current Status
✅ **All 20 automated tests PASS** (including E2E login test)
✅ **API Server Running** on http://localhost:3000
✅ **Frontend Running** on http://localhost:5173
✅ **Database** has 5 users with valid SSO IDs and team memberships

## Quick Diagnostic Steps

### 1. Open Browser Console (F12)
Navigate to: http://localhost:5173/login

### 2. Run This In Console:
```javascript
// Test 1: Check if API is reachable
fetch('http://localhost:3000/auth/modes', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('✅ API Auth Modes:', d))
  .catch(e => console.error('❌ API Auth Error:', e));

// Test 2: Try demo login
fetch('http://localhost:3000/auth/demo?user=admin&tenant=demo', { 
  credentials: 'include',
  redirect: 'manual'
})
  .then(r => {
    console.log('Login Status:', r.status);
    console.log('Headers:', Array.from(r.headers.entries()));
  })
  .catch(e => console.error('❌ Login Error:', e));

// Test 3: Check if logged in
fetch('http://localhost:3000/api/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('✅ Current User:', d))
  .catch(e => console.error('❌ Not logged in:', e));
```

### 3. Check For Common Issues:

#### Issue: CORS / Cookie Blocked
**Symptoms:** Cookies not being set, 401 errors
**Fix:** Check browser console for CORS errors

#### Issue: Wrong Port
**Symptoms:** Cannot reach API
**Check:** 
- API running on :3000? `curl http://localhost:3000/health`
- Frontend on :5173? Open http://localhost:5173

#### Issue: Session Store
**Symptoms:** Login succeeds but immediately logged out
**Check:** Redis running? `docker ps | grep redis`

## Manual Test (Terminal)
```bash
# This should work:
curl -v "http://localhost:3000/auth/demo?user=admin&tenant=demo" 2>&1 | grep -E "(HTTP|Set-Cookie|Location)"

# Expected output:
# < HTTP/1.1 302 Found
# < Location: http://localhost:5173?demo=true
# < Set-Cookie: connect.sid=...
```

## If Still Failing

### Option 1: Check Browser
- Try a different browser (Chrome, Firefox)
- Try incognito/private mode
- Clear all cookies for localhost

### Option 2: Restart Everything
```bash
# In one terminal:
cd /home/seandalton0/Development/pulsestage && make dev-api

# In another terminal:
cd /home/seandalton0/Development/pulsestage && make dev-web
```

### Option 3: Check Logs
Look for errors in:
- API terminal (where `make dev-api` is running)
- Frontend terminal (where `make dev-web` is running)
- Browser console (F12)

## Expected Working Flow

1. Go to http://localhost:5173/login
2. See "PulseStage" login page with demo users dropdown
3. Select "Admin (Demo)"
4. Click "Continue as admin"
5. Redirected to http://localhost:5173?demo=true
6. Should see dashboard

## Contact Points
If none of this works, provide:
1. Browser console output (from step 2 above)
2. Any errors in API terminal
3. Browser name/version
4. Output of: `curl -v "http://localhost:3000/auth/modes"`

