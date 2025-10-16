# PulseStage Screenshot Guide

This guide will help you capture professional screenshots for the README showcasing all key features.

## 📸 Recommended Screenshots

### 1. **Landing Page / Login** (Demo Mode)
**URL:** `http://localhost:5173/login`

**What to show:**
- Clean login interface
- Demo mode user selection
- "Deploy PulseStage for your team" CTA button

**Screenshot name:** `01-login-demo.png`

---

### 2. **Open Questions View** (Main User Experience)
**URL:** `http://localhost:5173/` (after logging in as demo user)

**What to show:**
- List of open questions with upvote counts
- Team selector dropdown
- Search functionality
- Question filters
- Submit question button

**Screenshot name:** `02-open-questions.png`

**Tips:**
- Make sure there are several questions visible
- Show different upvote counts
- Include the team name in view

---

### 3. **Submit Question** (User Interaction)
**URL:** `http://localhost:5173/submit`

**What to show:**
- Question submission form
- Team selection
- Character count
- Submit button

**Screenshot name:** `03-submit-question.png`

---

### 4. **Question Detail View** (with Answer)
**URL:** Click on any answered question from the main view

**What to show:**
- Question body
- Answer/response
- Upvote functionality
- Timestamp
- Responder name
- Tags (if any)

**Screenshot name:** `04-question-detail-answered.png`

---

### 5. **Moderator Dashboard** (Power User View)
**URL:** `http://localhost:5173/moderator` (login as Admin (Demo))

**What to show:**
- Quick stats (open, answered, under review)
- Quick actions grid
- Moderation queue access
- Presentation mode button
- Answer questions button

**Screenshot name:** `05-moderator-dashboard.png`

---

### 6. **Moderation Queue** (Content Review)
**URL:** `http://localhost:5173/moderation-queue`

**What to show:**
- Questions pending review
- Approve/Reject actions
- Moderation reasons
- Bulk actions

**Screenshot name:** `06-moderation-queue.png`

**Note:** If queue is empty, submit a question with profanity to trigger moderation

---

### 7. **Answered Questions by Week** (Timeline View)
**URL:** `http://localhost:5173/answered`

**What to show:**
- Questions grouped by week
- "This Week", "Last Week" labels
- Multiple answered questions
- Team context

**Screenshot name:** `07-answered-timeline.png`

---

### 8. **Admin Panel** (Administration)
**URL:** `http://localhost:5173/admin` (login as Admin (Demo))

**What to show:**
- Settings management
- Tag management
- Team management  
- User management
- System information

**Screenshot name:** `08-admin-panel.png`

---

### 9. **Tag Management** (Organization)
**URL:** `http://localhost:5173/admin` → Tags tab

**What to show:**
- List of tags with colors
- Add new tag form
- Edit/delete actions
- Tag descriptions

**Screenshot name:** `09-tag-management.png`

---

### 10. **Team Management** (Multi-tenant)
**URL:** `http://localhost:5173/admin` → Teams tab

**What to show:**
- Multiple teams listed
- Team descriptions
- Active/inactive status
- Add team button

**Screenshot name:** `10-team-management.png`

---

### 11. **User Profile** (Personal View)
**URL:** Click on user profile icon → Profile

**What to show:**
- User information
- "My Questions" tab
- Questions submitted by user
- Question status badges (Open, Answered, Under Review)

**Screenshot name:** `11-user-profile.png`

---

### 12. **Presentation Mode** (Live AMA)
**URL:** `http://localhost:5173/presentation`

**What to show:**
- Full-screen presentation view
- Large text for readability
- Auto-refresh indicator
- Current questions
- Perfect for town halls

**Screenshot name:** `12-presentation-mode.png`

**Tips:**
- Make window full screen
- Show the clean, minimal UI
- Capture the auto-refresh indicator

---

### 13. **Search Results** (Discovery)
**URL:** Use search bar on main page

**What to show:**
- Search functionality working
- Filtered results
- Highlighting (if implemented)
- No results state (optional)

**Screenshot name:** `13-search-results.png`

---

### 14. **Dark Mode** (Accessibility)
**URL:** Any page with dark mode toggle activated

**What to show:**
- Dark theme aesthetics
- Good contrast
- Toggle button visible

**Screenshot name:** `14-dark-mode.png`

---

### 15. **Mobile Responsive** (Optional)
**URL:** Any key page in mobile view (Chrome DevTools)

**What to show:**
- Responsive design
- Mobile-friendly navigation
- Touch-friendly buttons

**Screenshot name:** `15-mobile-view.png`

---

## 🎨 Screenshot Best Practices

### Before Taking Screenshots:

1. **Browser Setup:**
   - Use Chrome or Firefox
   - Clear browser window (F11 for full screen, then exit to remove browser chrome)
   - Disable all browser extensions
   - Set zoom to 100%
   - Window size: 1920x1080 or 1440x900

2. **Data Preparation:**
   - Ensure there's sample data visible
   - Use realistic question text
   - Make sure timestamps are recent
   - Have varying upvote counts

3. **Clean Up:**
   - Close dev tools
   - Hide any personal information
   - Remove any debug elements
   - Check for console errors

### Taking the Screenshot:

**Option 1: Browser Screenshot (Recommended)**
- **Firefox**: Right-click → "Take Screenshot" → "Save full page" or "Save visible"
- **Chrome**: DevTools (F12) → Cmd/Ctrl+Shift+P → "Capture full size screenshot"

**Option 2: macOS**
```bash
# Full screen
Cmd + Shift + 3

# Selected area
Cmd + Shift + 4
```

**Option 3: Linux**
```bash
# GNOME Screenshot
gnome-screenshot -a  # Area selection
gnome-screenshot -w  # Window
```

**Option 4: Automated (using Playwright)**
```bash
cd web
npm run test:e2e -- --headed
# Add screenshot captures to your test
```

### Editing Screenshots:

- **Crop** to focus on relevant areas
- **Resize** to consistent dimensions (e.g., all 1200px wide)
- **Compress** using tinypng.com or similar
- **Add annotations** (optional) using arrows or highlights
- **Maintain consistent style** across all screenshots

---

## 📂 File Organization

Create a `screenshots/` directory in the repo:

```
ama-app/
├── screenshots/
│   ├── 01-login-demo.png
│   ├── 02-open-questions.png
│   ├── 03-submit-question.png
│   ├── ... (etc)
│   └── README.md  (this file, for reference)
```

---

## 📝 README Integration

### Suggested README Structure:

```markdown
# PulseStage

*Engaging Q&A platform for team all-hands, AMAs, and town halls*

![Open Questions View](screenshots/02-open-questions.png)

## ✨ Features

### 📝 Submit and Vote on Questions
Users can submit questions and upvote the ones they care about most.

![Submit Question](screenshots/03-submit-question.png)

### 👥 Multi-Team Support
Organize questions by team with flexible team management.

![Team Management](screenshots/10-team-management.png)

### 🎯 Moderation & Review
Built-in content moderation with approval workflows.

![Moderation Queue](screenshots/06-moderation-queue.png)

### 📊 Presentation Mode
Full-screen view perfect for live town halls and AMAs.

![Presentation Mode](screenshots/12-presentation-mode.png)

### 🌓 Dark Mode Support
Beautiful dark theme for accessibility and preference.

![Dark Mode](screenshots/14-dark-mode.png)
```

---

## 🚀 Quick Capture Script

Want to automate? Here's a quick Playwright script:

```typescript
// screenshots.spec.ts
import { test } from '@playwright/test';

test('capture all screenshots', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');
  await page.screenshot({ path: 'screenshots/01-login-demo.png', fullPage: true });
  
  // ... continue for each view
});
```

---

## 💡 Pro Tips

1. **Consistency is key** - Use the same browser, zoom level, and window size for all screenshots
2. **Show data** - Empty states are less impressive; have realistic sample data
3. **Highlight features** - Each screenshot should showcase a specific feature
4. **Quality matters** - Use high resolution (2x) for Retina displays
5. **Update regularly** - As UI changes, update screenshots
6. **Alternative text** - Always provide good alt text for accessibility

---

## ✅ Checklist

Before publishing, verify:
- [ ] All screenshots are clear and high resolution
- [ ] No personal/sensitive information visible
- [ ] Consistent sizing and format (PNG recommended)
- [ ] Dark mode and light mode both captured
- [ ] Mobile view included
- [ ] All major features represented
- [ ] Screenshots compressed for web
- [ ] README references correct paths
- [ ] Images render correctly on GitHub

---

Good luck with your screenshots! 📸

