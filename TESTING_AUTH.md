# Authentication Testing Guide

This guide will walk you through testing all three authentication modes locally.

## Prerequisites

1. **Development environment running**:
   ```bash
   make dev
   ```

2. **Services should be available**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

## Test 1: Demo Mode Authentication (No Setup Required) ✨

Demo mode is enabled by default and requires zero configuration!

### Steps:

1. **Visit the login page**:
   ```
   http://localhost:5173/login
   ```

2. **You should see**:
   - A blue "Try Demo" section with a dropdown
   - Demo users: Alice, Bob, Moderator, Admin
   - (Optionally) GitHub and Google OAuth buttons if configured

3. **Test demo login**:
   - Select "Alice (Demo)" from the dropdown
   - Click "Continue as alice"
   - You should be redirected to the home page
   - A blue banner should appear at the top: "You're in demo mode. Data resets daily."

4. **Verify demo user**:
   - Click on your profile icon (top right)
   - You should see "Alice (Demo)" and email ending in `@demo.pulsestage.dev`
   - Navigate around the app - submit questions, upvote, etc.

5. **Test other demo users**:
   - Log out (if there's a logout option) or clear cookies
   - Repeat with "Bob", "Moderator", and "Admin"
   - Each should have different permissions based on their role

### Expected Behavior:

- ✅ Instant access without password
- ✅ Demo banner visible on all pages
- ✅ User info shows `@demo.pulsestage.dev` email
- ✅ Banner has "Sign up to save your work" button
- ✅ Banner is dismissible (X button)

## Test 2: Check Available Auth Modes (API)

You can see what auth modes are enabled by calling the API directly:

```bash
curl http://localhost:3000/auth/modes
```

**Expected Response**:
```json
{
  "modes": ["demo", "oauth"],
  "demo": {
    "enabled": true,
    "users": ["alice", "bob", "moderator", "admin"]
  },
  "oauth": {
    "github": false,
    "google": false
  }
}
```

If you've configured GitHub/Google OAuth, those will show as `true`.

## Test 3: GitHub OAuth (Optional - Requires Setup)

### Setup GitHub OAuth App:

1. **Create OAuth App**:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Fill in:
     - **Application name**: PulseStage Local Dev
     - **Homepage URL**: `http://localhost:5173`
     - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
   - Click "Register application"
   - Copy the **Client ID**

2. **Generate Client Secret**:
   - Click "Generate a new client secret"
   - Copy the **Client Secret** immediately (you won't see it again)

3. **Configure Environment**:
   Edit your `.env` file (or create one from `env.example`):
   ```bash
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

4. **Restart development environment**:
   ```bash
   make dev
   ```

### Test GitHub OAuth:

1. **Visit login page**: http://localhost:5173/login

2. **You should now see**:
   - "Sign in with GitHub" button (in addition to demo mode)

3. **Click "Sign in with GitHub"**:
   - You'll be redirected to GitHub
   - GitHub will ask you to authorize the app
   - Click "Authorize"
   - You should be redirected back to http://localhost:5173
   - You should be logged in with your GitHub account

4. **Verify OAuth user**:
   - Check profile - should show your GitHub name and email
   - No demo banner should appear (you're a real user!)

5. **Test logout and re-login**:
   - OAuth should remember your previous authorization
   - Subsequent logins should be seamless

### Expected Behavior:

- ✅ GitHub OAuth button appears on login page
- ✅ Redirects to GitHub for authorization
- ✅ Successfully redirects back after authorization
- ✅ User is logged in with GitHub name/email
- ✅ No demo mode banner
- ✅ Session persists across page refreshes

## Test 4: Google OAuth (Optional - Requires Setup)

### Setup Google OAuth:

1. **Create Google OAuth credentials**:
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
   - Copy **Client ID** and **Client Secret**

2. **Configure Environment**:
   Edit your `.env` file:
   ```bash
   # Google OAuth
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

3. **Restart development environment**:
   ```bash
   make dev
   ```

### Test Google OAuth:

Similar to GitHub OAuth:
1. Visit http://localhost:5173/login
2. Click "Sign in with Google"
3. Authorize with Google
4. Should be redirected back and logged in

## Test 5: Multi-Mode Coexistence

If you've configured both GitHub and Google OAuth:

1. **Visit login page**: http://localhost:5173/login

2. **You should see all three options**:
   - Demo mode with dropdown (top)
   - "Or sign in with" divider
   - GitHub OAuth button
   - Google OAuth button

3. **Test switching between modes**:
   - Log in with demo mode
   - Log out
   - Log in with GitHub
   - Log out
   - Log in with Google

4. **All should work independently**

## Test 6: Demo Mode Banner Behavior

1. **Log in with demo mode** (alice, bob, etc.)

2. **The banner should**:
   - Appear on ALL pages (not just login)
   - Show "You're in demo mode. Data resets daily."
   - Have a "Sign up to save your work" button
   - Be dismissible with X button

3. **Test banner dismissal**:
   - Click the X button
   - Banner should disappear
   - Navigate to other pages - banner should stay hidden
   - Refresh the page - banner should reappear (dismissal is per session)

4. **Test banner CTA**:
   - Click "Sign up to save your work"
   - Should redirect to GitHub OAuth (if configured)
   - Or show OAuth options

## Test 7: Session Persistence

1. **Log in with any mode**

2. **Test session persistence**:
   - Refresh the page → should stay logged in
   - Navigate to different pages → should stay logged in
   - Close browser tab, reopen → should stay logged in (for 30 days)

3. **Test session isolation**:
   - Open a private/incognito window
   - Should NOT be logged in
   - Can log in with a different user

## Test 8: Error Handling

### Test 1: Invalid Demo User

Try to access demo mode with an invalid user:
```bash
curl "http://localhost:3000/auth/demo?user=hacker&tenant=demo"
```

**Expected**: Should return error or redirect to login with error

### Test 2: OAuth Callback Errors

If you've configured OAuth, try accessing the callback URL directly:
```bash
# Without code parameter
curl http://localhost:3000/auth/github/callback

# Should redirect to frontend with error
```

## Test 9: API Integration

Test that authenticated API calls work:

```bash
# 1. Log in with demo mode in browser
# 2. Get session cookie from browser dev tools
# 3. Test API call with cookie

curl -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
     -H "x-tenant-slug: demo" \
     http://localhost:3000/questions
```

**Expected**: Should return questions (authenticated)

Without cookie:
```bash
curl -H "x-tenant-slug: demo" \
     http://localhost:3000/questions
```

**Expected**: Should still work (questions are public, but some features require auth)

## Troubleshooting

### Issue: "Demo mode not available"

**Solution**: Check `env.example` - demo mode is enabled by default. If you set `AUTH_MODE_DEMO=false`, change it to `true` or remove the line.

### Issue: "GitHub/Google OAuth button not showing"

**Possible causes**:
1. Environment variables not set correctly
2. Frontend not fetching modes correctly
3. API not returning OAuth modes

**Debug steps**:
```bash
# Check API response
curl http://localhost:3000/auth/modes

# Should show oauth.github or oauth.google as true
```

### Issue: "OAuth callback error: state mismatch"

**Solution**: This is a CSRF protection. Make sure:
1. You're not opening OAuth flow in different browser/session
2. Cookies are enabled
3. `SESSION_SECRET` is set in `.env`

### Issue: "Demo banner not showing"

**Solution**: 
1. Check that you're logged in with a demo user (@demo.pulsestage.dev)
2. Check browser console for errors
3. Try clearing browser cache/cookies

### Issue: "Cannot log in with OAuth"

**Debug steps**:
1. Check browser console for errors
2. Check API logs: `docker logs pulsestage-api`
3. Verify OAuth credentials in `.env`
4. Verify callback URLs match exactly (http vs https, trailing slash, etc.)

## Quick Test Checklist

- [ ] Demo mode: Login with alice
- [ ] Demo mode: Banner appears and is dismissible
- [ ] Demo mode: Can submit questions
- [ ] API: `/auth/modes` returns correct config
- [ ] GitHub OAuth: Button appears (if configured)
- [ ] GitHub OAuth: Can log in (if configured)
- [ ] Google OAuth: Button appears (if configured)
- [ ] Google OAuth: Can log in (if configured)
- [ ] Session: Persists across page refreshes
- [ ] UI: Login page is responsive (mobile/desktop)
- [ ] UI: Dark mode works on login page

## Expected Screenshots

### 1. Login Page (Demo Mode Only)
- Blue "Try Demo" card at top
- Dropdown with 4 demo users
- "Continue as..." button

### 2. Login Page (All Modes)
- Demo mode card at top
- "Or sign in with" divider
- GitHub button
- Google button

### 3. Demo Mode Banner
- Blue gradient banner across top
- Info icon + warning text
- "Sign up" button
- X dismiss button

### 4. Profile Menu
- Shows user name and email
- Demo users have "(Demo)" suffix
- OAuth users show real name/email

## Next Steps After Testing

If everything works:
1. ✅ Authentication system is ready!
2. Consider enabling only the auth modes you need for production
3. Set up proper OAuth apps for your production domain
4. Disable demo mode in production (`AUTH_MODE_DEMO=false`)

If you find issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Check the comprehensive guide: `docs/architecture/authentication.md`
3. Open an issue with steps to reproduce

## Performance Notes

- Demo mode: ~10ms (database lookup)
- OAuth flows: ~500ms (includes external API calls to GitHub/Google)
- Session validation: ~1ms (cached in Redis)

Happy testing! 🎉

