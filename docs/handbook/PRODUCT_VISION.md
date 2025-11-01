# PulseStage — Product Vision (1-pager)

## Problem
Town halls and engagement surveys are noisy, infrequent, and slow to close the loop. Leaders need a clear way to hear questions, respond live, and track sentiment continuously—without heavy process or vendor lock-in.

## What PulseStage Is
- Open-source, tenant-aware Q&A + weekly micro-pulse listening
- **Team-first architecture** with organizational rollup views
- Real-time presenter UX; anonymous, up-vote–only questions
- Lightweight pulse signals integrated with all-hands follow-through

## Key Features

### 1. Presentation Mode
- **Full-screen display** for team meetings and all-hands
- **Keyboard-driven navigation** (Space/Enter=next, H=highest upvoted, Esc=exit)
- **Auto-tagging** questions as "Currently Presenting"
- **Real-time updates** via Server-Sent Events (SSE)
- **Team-scoped** questions for focused discussions
- **Permission-gated** (moderators and admins only)

**Use Case:** Project on screen during meetings, navigate through questions live, team sees answers in real-time.

### 2. Powerful Search & Filtering
- **Full-text search** with PostgreSQL (stemming + prefix matching)
- **Tag filtering** (custom tags + defaults: Feature Request, Bug, Question, etc.)
- **Date range filtering** for historical analysis
- **Team filtering** for scoped views
- **Ranked results** by relevance

**Use Case:** Find related questions quickly, filter by topic/team/timeframe.

### 3. Customizable Theming & Branding
- **3 professionally designed themes**:
  - **Executive Blue**: Corporate, trustworthy
  - **Modern Purple**: Creative, innovative
  - **Refined Teal**: Balanced, modern (default)
- **Light/Dark mode** toggle (per-user preference)
- **System theme detection** (respects OS preference)
- **Custom branding**:
  - Logo URL
  - Favicon URL
  - Primary/accent color overrides
  - Welcome message
- **Live preview** of theme changes

**Use Case:** White-label deployment, match company branding, A/B test themes.

### 4. Content Moderation
- **Cascading filters** (local + optional OpenAI)
- **Tiered response**: Auto-reject (high confidence) or review queue (medium/low)
- **Team-scoped moderation** queue for moderators
- **Comprehensive audit trail** of all moderation actions

**See:** `/handbook/TRUST_AND_SAFETY.md`

### 5. Multi-Mode Authentication
- **GitHub OAuth** (production-ready)
- **Google OAuth** (production-ready)
- **Demo mode** (development only)
- **Session management** with Redis (production) or memory (development)

**See:** `/handbook/AUTHENTICATION.md`

### 6. Email Notifications
- **BullMQ queue** with Redis backend
- **Multiple providers** (SMTP, Resend)
- **React-email templates** for beautiful emails
- **Admin monitoring** (queue metrics, failed jobs)
- **Development testing** with Mailpit (local email capture)

**See:** `/handbook/INTEGRATIONS/EMAIL.md`

### 7. Weekly Pulse System
- **Rotating cohorts** for distributed survey load
- **One-tap email responses** (no login required)
- **Anonymity-first** design (no userId in responses)
- **Threshold enforcement** (only show aggregates when n ≥ 5)
- **Team-scoped** with organizational rollups

**See:** `/handbook/PULSE_SYSTEM.md`

## Principles (Truths & Invariants)
- Tenant isolation is absolute (data, auth, search, metrics).
- Anonymous by default; only aggregates above threshold are shown.
- Contracts > code: OpenAPI, event schemas, and DB invariants are source of truth.
- Accessibility & performance are features, not afterthoughts.

## Out of Scope (for now)
- HRIS/SCIM deep integrations, advanced analytics modeling, custom role builders.
