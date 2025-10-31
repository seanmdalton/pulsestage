# Changelog

All notable changes to PulseStage will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2025-10-31

### 🎉 Major Release - Complete Platform Overhaul

This release represents a comprehensive redesign of both the Q&A and Pulse modules with significant UX improvements, team-scoped architecture, and doubled demo data.

---

### ✨ Added

#### Q&A Platform
- **Unified Questions Interface**: Consolidated Open/Answered/All questions into a single page with tabs
- **Intelligent Action Bar**: All controls (search, filters, presentation mode, submit) in one compact, aligned bar
- **Smart Upvoting**: Visual feedback with filled (▲) vs hollow (△) triangles, distinct orange/blue styling
- **Instant Upvote Updates**: Real-time UI feedback without page refresh
- **Presentation Mode Icon**: Cleaner icon-only button for moderators/admins
- **Moderation Queue Improvements**: Consistent spacing and layout with other pages

#### Weekly Pulse
- **Primary Team Architecture**: Users have a primary team, pulse data is team-scoped
- **Team-Scoped Dashboards**: View pulse trends by Engineering, Product, or organization-wide
- **12 Weeks Historical Data**: Expanded from 8 weeks, always relative to "now"
- **Team-Specific Trends**: Realistic data showing Engineering improving (+0.6), Product stable
- **Auto-Advance Pulse Responses**: Seamlessly move through multiple pending pulses
- **Pulse Settings Page**: Configure questions, schedule, and cohorts from admin panel
- **Automated Scheduling**: `node-cron` powered pulse distribution

#### User Experience
- **Team Context Bar**: Sticky banner showing current team with description
- **Consistent Page Spacing**: Standardized layouts across all pages (`px-4 py-8`, `mb-8` headers)
- **Smart Navigation**: Team selector updates URL and context automatically
- **Submit Question Fixed**: Corrected navigation from broken `/submit` route

#### Demo Data
- **50 Users**: 4 login users + 46 dummy users with realistic names
- **2 Teams**: Simplified from 3 teams to Engineering and Product only
- **1,300+ Pulse Responses**: Doubled from ~600 with team-specific patterns
- **36 Q&A Questions**: Distributed across both teams
- **Realistic Trends**: Engineering sentiment improving, Product stable

---

### 🔧 Changed

#### Architecture
- **Removed General Team**: Streamlined to Engineering and Product only
- **Team-Scoped Pulse**: All pulse invites and responses associated with user's primary team
- **Relative Timestamps**: All seed data timestamps are relative to "now" for perpetually fresh demo

#### UI/UX
- **Compact Action Bar**: Reduced padding (`p-3` → `p-2`), smaller icons (`w-5` → `w-4`)
- **Unified Search & Filters**: Moved from separate section into action bar
- **Advanced Filters Dropdown**: Appears as overlay instead of inline
- **Borderless Search Input**: Blends seamlessly with action bar background
- **Icon Consistency**: All icons standardized to `w-4 h-4` for alignment

#### Data & Seeds
- **User Count**: 25 → 50 users (doubled)
- **Pulse History**: 8 weeks → 12 weeks
- **Team Count**: 3 teams → 2 teams
- **Demo User Emails**: All use `@pulsestage.app` domain
- **Pulse Participation**: Increased to ~82% in demo data

---

### 🐛 Fixed

#### Critical Fixes
- **Submit Question Button**: Fixed broken navigation (`/:teamSlug/submit` → `/:teamSlug`)
- **Login Flow**: Session persistence issues resolved
- **Moderation Queue Spacing**: Added missing padding (`px-4 py-8`) and header margin (`mb-8`)

#### UI Fixes
- **Upvote Button**: Dynamic state changes now reflect immediately
- **Team Selector**: Dashboard page now properly syncs with URL changes
- **Action Bar Alignment**: All elements (search, filters, buttons) perfectly aligned
- **Team Context Bar**: Fixed dark mode transparency issues (solid backgrounds)
- **Presentation Mode**: Correct visibility logic for "All Teams" view

#### Data Fixes
- **Pulse Response Dates**: Fixed future-dated responses in seed data
- **Question Duplication**: Added cleanup to prevent double seeding
- **Primary Team Assignment**: All users now have primary teams for pulse distribution
- **Team-Specific Responses**: Pulse responses correctly associated with teams

---

### 🔒 Security

- All existing security measures maintained (CSRF, rate limiting, secure headers)
- Session management improvements for demo login flow
- No new vulnerabilities introduced

---

### 🧪 Testing

#### Test Updates
- **User Count Test**: 5 → 50 users expected
- **Team Count Test**: 3 → 2 teams expected  
- **Pulse Response Test**: 400 → 800 responses expected
- **Removed People Team Tests**: No longer applicable
- All 19 validation tests passing

#### Pre-Flight Validation
- ✅ 50 users with proper team assignments
- ✅ 2 teams with active members
- ✅ 1,306 pulse responses with team-specific trends
- ✅ All login users have valid SSO IDs
- ✅ Pulse cohorts created
- ✅ API login endpoint works E2E

---

### 📚 Documentation

#### Updated Files
- **README.md**: Complete rewrite with new features, stats, and architecture
- **.cursorrules**: Updated seed data expectations and team structure
- **CHANGELOG.md**: New file documenting all changes

#### Documentation Improvements
- Expanded feature list with new capabilities
- Updated architecture diagram with current stack
- Revised demo user information (50 users, 2 teams)
- Updated project stats (1,300+ responses, 12 weeks, 81.6% participation)
- Comprehensive roadmap with v1.0 features checked off

---

### 🚀 Performance

- No significant performance changes
- Larger seed data set (50 users vs 25) with no noticeable impact
- SSE connections remain efficient
- API response times stable

---

### ⚠️ Breaking Changes

#### Configuration
- **Team Structure**: Existing deployments with General/People/Product teams need migration
- **Seed Data**: Existing databases should be reset (`make db-seed`) for consistency
- **User Primary Teams**: All users must have a `primaryTeamId` for pulse to work

#### API
- No breaking API changes
- All existing endpoints maintain backward compatibility
- New optional `teamId` parameter on pulse endpoints

---

### 🔜 Upcoming (v1.1)

- SSO Integration (Okta, Auth0)
- Slack/Teams Integration for pulse notifications
- Mobile-responsive improvements
- Advanced analytics dashboards
- CSV/PDF report exports

---

### 📊 Metrics

**Before → After**:
- Users: 25 → 50 (2x)
- Teams: 3 → 2 (focused)
- Pulse Responses: ~600 → 1,300+ (2x)
- Pulse History: 8 weeks → 12 weeks (1.5x)
- Test Coverage: 313/329 tests (95.1%)

---

### 🙏 Contributors

- Core development and UX overhaul by the PulseStage team
- Special thanks to user feedback driving the action bar redesign

---

[1.0.0]: https://github.com/seanmdalton/pulsestage/releases/tag/v1.0.0

