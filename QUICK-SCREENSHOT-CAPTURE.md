# 📸 Quick Screenshot Capture Guide

## 🚀 Automated Capture (Recommended)

### Prerequisites
Make sure your local development environment is running:
```bash
# In terminal 1: Start services
docker-compose up

# Wait for services to be ready (~30 seconds)
```

### Capture All Screenshots
```bash
cd web
npm run test:e2e -- screenshots.spec.ts --headed
```

This will:
- Open a browser window
- Navigate through all key views
- Capture 17+ screenshots automatically
- Save them to `/screenshots/` directory

### Capture Specific Screenshots
```bash
# Just the main views (login, questions, dashboard)
npm run test:e2e -- screenshots.spec.ts --headed --grep "01|02|05"

# Just admin screenshots
npm run test:e2e -- screenshots.spec.ts --headed --grep "admin"

# Just mobile view
npm run test:e2e -- screenshots.spec.ts --headed --grep "Mobile"
```

---

## 📷 Manual Capture

### Browser Setup
1. Open Chrome or Firefox
2. Press F11 for full screen (then exit to remove browser chrome)
3. Set window size: 1920x1080
4. Zoom: 100%

### Navigate and Capture

#### 1. Login Page
1. Go to `http://localhost:5173/login`
2. Wait for demo users to load
3. Screenshot: `screenshots/01-login-demo.png`

#### 2. Open Questions (Main View)
1. Click on `user@demo.pulsestage.dev`
2. Wait for questions to load
3. Screenshot: `screenshots/02-open-questions.png`

#### 3. Submit Question
1. Click "Submit Question" button
2. Screenshot: `screenshots/03-submit-question.png`

#### 4. Question Detail
1. Click on any answered question
2. Screenshot: `screenshots/04-question-detail-answered.png`

#### 5. Moderator Dashboard
1. Logout (click profile → Logout)
2. Login as `admin@demo.pulsestage.dev`
3. Go to `/moderator`
4. Screenshot: `screenshots/05-moderator-dashboard.png`

#### 6. Moderation Queue
1. Click "Moderation Queue"
2. Screenshot: `screenshots/06-moderation-queue.png`

#### 7. Answered Timeline
1. Click "Answered" in navbar
2. Screenshot: `screenshots/07-answered-timeline.png`

#### 8. Admin Panel
1. Click profile icon → Admin Panel
2. Screenshot: `screenshots/08-admin-panel.png`

#### 9. Tag Management
1. In Admin Panel, click "Tags" tab
2. Screenshot: `screenshots/09-tag-management.png`

#### 10. Team Management
1. In Admin Panel, click "Teams" tab
2. Screenshot: `screenshots/10-team-management.png`

#### 11. User Profile
1. Click profile icon → Profile
2. Screenshot: `screenshots/11-user-profile.png`

#### 12. Presentation Mode
1. Go to `/presentation`
2. Wait for auto-refresh
3. Screenshot: `screenshots/12-presentation-mode.png`

#### 13. Search Results
1. Go to main page
2. Type "roadmap" in search box
3. Wait for results
4. Screenshot: `screenshots/13-search-results.png`

#### 14. Dark Mode
1. Click theme toggle (moon/sun icon)
2. Wait for transition
3. Screenshot: `screenshots/14-dark-mode.png`

#### 15. Mobile View
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Cmd+Shift+M / Ctrl+Shift+M)
3. Select "iPhone X" or "Pixel 5"
4. Navigate to main page
5. Screenshot: `screenshots/15-mobile-view.png`

---

## 🎨 Post-Processing

### Compress Images
```bash
# Using ImageMagick
for file in screenshots/*.png; do
  convert "$file" -quality 85 -strip "$file"
done

# Or use online tools:
# - tinypng.com
# - squoosh.app
```

### Resize (if needed)
```bash
# All images to 1200px width
for file in screenshots/*.png; do
  convert "$file" -resize 1200x "$file"
done
```

---

## ✅ Verification Checklist

Before committing screenshots:
- [ ] All 15+ screenshots captured
- [ ] Images are 1920x1080 or consistent size
- [ ] No personal information visible
- [ ] No console errors visible
- [ ] Dark mode captured
- [ ] Mobile view captured
- [ ] Images compressed (<500KB each)
- [ ] File names match convention
- [ ] Screenshots look professional

---

## 🔄 Quick Reset (if needed)

If you need to reset demo data before capturing:
```bash
# Reset database
curl -X POST http://localhost:3000/admin/reset-demo \
  -H "x-admin-key: dev-admin-key-change-me"

# Refresh browser
```

---

## 🎬 Recording Video (Bonus)

Want a video demo instead?
```bash
# Using Playwright
cd web
npm run test:e2e -- screenshots.spec.ts --headed --video=on

# Videos saved to: web/test-results/
```

Or use screen recording:
- **macOS**: Cmd+Shift+5
- **Linux**: SimpleScreenRecorder / OBS
- **Windows**: Windows+G (Game Bar)

---

## 🆘 Troubleshooting

### Services not running
```bash
# Check status
docker-compose ps

# Restart
docker-compose restart

# Full restart
docker-compose down && docker-compose up
```

### Screenshots not saving
```bash
# Create directory
mkdir -p screenshots

# Check permissions
chmod 755 screenshots
```

### Playwright issues
```bash
# Install browsers
cd web
npx playwright install chromium

# Run in debug mode
npm run test:e2e -- screenshots.spec.ts --debug
```

---

## 📚 Related Files

- [SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md) - Detailed guide with best practices
- [README-SCREENSHOT-TEMPLATE.md](README-SCREENSHOT-TEMPLATE.md) - README template with screenshot layout
- [web/e2e/screenshots.spec.ts](web/e2e/screenshots.spec.ts) - Automated capture script

---

Happy screenshot capturing! 📸

