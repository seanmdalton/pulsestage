# 📸 Manual Screenshot Guide - Quick & Easy

Your local environment is running and ready. Just follow these steps to capture professional screenshots in about 15 minutes.

## 🎯 Quick Setup

### Browser Setup (Do Once)
1. Open **Chrome** or **Firefox**
2. Open a **new incognito/private window** (to avoid extensions)
3. Go to: `http://localhost:5173/login`
4. Set window size: **1920x1080** (or fullscreen then resize)
5. Zoom: **100%** (Cmd+0 / Ctrl+0)

### Screenshot Tool
- **macOS**: `Cmd + Shift + 4` (then press Space to capture window, or drag to select area)
- **Linux**: `Shift + PrtScn` (select area) or use Screenshot app
- **Or use browser**: Right-click → "Take Screenshot" (Firefox) or DevTools → Cmd/Ctrl+Shift+P → "Capture screenshot"

---

## 📷 Capture These Screenshots (15 total)

Save all screenshots to: `/home/klitz/Development/ama-app/screenshots/`

### **1. Login Page** → `01-login-demo.png`
1. Go to: `http://localhost:5173/login`
2. Wait for page to fully load (you should see "Try Demo" section)
3. **Screenshot entire page**

---

### **2. Open Questions** → `02-open-questions.png`
1. From login page, select **"User (Demo)"** from dropdown
2. Click **"Continue as User"**
3. You should see the main questions page with upvotes
4. Wait 2 seconds for everything to load
5. **Screenshot entire page**

---

### **3. Submit Question** → `03-submit-question.png`
1. Click **"Submit Question"** button (top right)
2. Wait for form to appear
3. **Screenshot entire page**

---

### **4. Question Detail (Answered)** → `04-question-detail-answered.png`
1. Click browser back button (or go to main page)
2. Click on **"Answered"** in the nav bar
3. Click on **any answered question** to open detail view
4. **Screenshot entire page**

---

### **5. Moderator Dashboard** → `05-moderator-dashboard.png`
1. Click profile icon (top right) → **Logout**
2. Go back to login page
3. Select **"Admin (Demo)"** from dropdown
4. Click **"Continue as Admin"**
5. Go to: `http://localhost:5173/moderator`
6. Wait for dashboard to load
7. **Screenshot entire page**

---

### **6. Moderation Queue** → `06-moderation-queue.png`
1. From moderator dashboard, click **"Moderation Queue"**
2. (If empty, that's fine - still screenshot it)
3. **Screenshot entire page**

---

### **7. Answered Timeline** → `07-answered-timeline.png`
1. Click **"Answered"** in nav bar
2. Wait for grouped questions to load
3. **Screenshot entire page**

---

### **8. Admin Panel** → `08-admin-panel.png`
1. Click profile icon → **"Admin Panel"**
2. Wait for settings page to load
3. **Screenshot entire page**

---

### **9. Tag Management** → `09-tag-management.png`
1. On Admin Panel page, click **"Tags"** tab
2. Wait for tags list to appear
3. **Screenshot entire page**

---

### **10. Team Management** → `10-team-management.png`
1. On Admin Panel page, click **"Teams"** tab
2. Wait for teams list to appear
3. **Screenshot entire page**

---

### **11. User Profile** → `11-user-profile.png`
1. Click profile icon → **"Profile"**
2. Make sure you see "My Questions" section
3. **Screenshot entire page**

---

### **12. Presentation Mode** → `12-presentation-mode.png`
1. Go to: `http://localhost:5173/presentation`
2. Wait 2 seconds for questions to load
3. **Screenshot entire viewport** (not full page - just visible area)

---

### **13. Search Results** → `13-search-results.png`
1. Go to main page: `http://localhost:5173/`
2. Type **"roadmap"** in the search box
3. Wait for results to filter
4. **Screenshot entire page**

---

### **14. Dark Mode** → `14-dark-mode.png`
1. On any page, click the **theme toggle** button (moon/sun icon in nav)
2. Wait for theme to transition
3. **Screenshot entire page**

---

### **15. Mobile View** → `15-mobile-view.png`
1. Open **Chrome DevTools** (F12 or Cmd/Opt+I)
2. Click **"Toggle device toolbar"** icon (or Cmd/Ctrl+Shift+M)
3. Select **"iPhone 13 Pro"** or **"Pixel 5"** from dropdown
4. Go to main questions page
5. **Screenshot the mobile viewport**

---

## ✅ Quick Checklist

After capturing all screenshots:

```bash
cd /home/klitz/Development/ama-app/screenshots
ls -lh
```

You should see:
- `01-login-demo.png`
- `02-open-questions.png`
- `03-submit-question.png`
- `04-question-detail-answered.png`
- `05-moderator-dashboard.png`
- `06-moderation-queue.png`
- `07-answered-timeline.png`
- `08-admin-panel.png`
- `09-tag-management.png`
- `10-team-management.png`
- `11-user-profile.png`
- `12-presentation-mode.png`
- `13-search-results.png`
- `14-dark-mode.png`
- `15-mobile-view.png`

## 🎨 Optional: Optimize Images

After capturing, compress them:

```bash
# If you have ImageMagick installed:
cd screenshots
for file in *.png; do
  convert "$file" -quality 85 -strip "$file"
done

# Or use online tools:
# - tinypng.com
# - squoosh.app
```

---

## 💡 Pro Tips

1. **Clean look**: Close dev tools before screenshotting (except mobile view)
2. **Consistency**: Use the same window size for all screenshots
3. **Wait**: Always wait 1-2 seconds after navigating to let animations complete
4. **Retry**: If something looks off, just retake that one screenshot
5. **Full page**: Most screenshots should show the entire page, except presentation mode

---

## 🆘 Troubleshooting

**Page not loading?**
```bash
docker compose ps  # Check services are running
```

**Can't login?**
- Make sure you select the user from dropdown first
- Try refreshing the page

**Screenshots too large?**
- That's fine! They'll be compressed later
- Or use your screenshot tool's compression settings

---

## 🎬 Next Steps

Once you have all 15 screenshots:

1. Review the [README-SCREENSHOT-TEMPLATE.md](README-SCREENSHOT-TEMPLATE.md) to see how they'll be displayed
2. Update your actual README.md with the screenshots
3. Commit everything:
   ```bash
   git add screenshots/
   git commit -m "docs: add screenshots for README showcase"
   ```

---

**Estimated time: 15-20 minutes** ⏱️

Good luck! The screenshots will look great. 📸✨

