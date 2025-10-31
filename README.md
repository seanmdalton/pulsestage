# PulseStage

[![CI](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-313%2F329-brightgreen.svg)]()

<div align="left" style="margin:10px 0 10px 0">
  <img src="web/public/pulsestage-wordmark-light.svg" alt="PulseStage" width="400">
</div>

**Open-source employee engagement platform combining Q&A and pulse surveys.** Built for transparency, psychological safety, and data-driven insights with team-scoped analytics.

🎯 **[Try the Live Demo](https://demo.pulsestage.app)** | 📖 **[Documentation](./DEVELOPMENT_WORKFLOW.md)** | 🚦 **Always run `make preflight` before testing!**

---

## 🚀 What is PulseStage?

PulseStage is a dual-purpose platform that helps organizations:

1. **📊 Crowdsource Questions** - Let employees submit, upvote, and answer questions for town halls and all-hands meetings
2. **💙 Track Team Pulse** - Weekly sentiment surveys with anonymity-protected insights

**Perfect for**: All-hands meetings, team retrospectives, leadership Q&As, and continuous employee feedback.

---

## ✨ Features

### 📊 Q&A Platform
- **Unified Question View** - Consolidated interface with Open/Answered/All tabs
- **Anonymous Question Submission** - Safe space for honest questions
- **Smart Upvoting System** - Visual feedback with filled/hollow triangles, instant updates
- **Intelligent Action Bar** - Search, filters, and submit all in one compact bar
- **Moderator Workflow** - Review, approve, and manage questions efficiently
- **Moderation Queue** - Dedicated page with bulk actions and filtering
- **Rich Text Answers** - Support for formatting and links
- **Team-Scoped Organization** - Questions organized by Engineering/Product teams
- **Team Context Bar** - Always know which team you're viewing
- **Tag System** - Categorize questions (Benefits, Culture, Strategy, etc.)
- **Presentation Mode** - Clean, distraction-free interface for live meetings (moderators only)
- **Real-time Updates** - See changes instantly via Server-Sent Events (SSE)

### 💙 Weekly Pulse
- **Quick Check-ins** - 5-second pulse questions (1-5 scale)
- **Primary Team Architecture** - Users belong to a primary team, pulse data is team-scoped
- **Team-Scoped Dashboards** - View pulse trends for Engineering, Product, or organization-wide
- **Anonymity Protection** - Individual responses hidden until 5+ responses
- **Multi-Channel Distribution** - Email one-tap responses or in-app dashboard
- **Auto-Advance Responses** - Seamlessly move through multiple pending pulses
- **12 Weeks Historical Data** - Always relative to "now" for fresh insights
- **Team-Specific Trends** - Track sentiment improvements or declines per team
- **Cohort Rotation** - Fair sampling across weekday/weekend groups
- **Admin Configuration** - Manage questions, schedule, and cohorts
- **Question Library** - 10 research-backed questions (recognition, alignment, support, growth)
- **Automated Scheduling** - `node-cron` powered pulse distribution

### 🔐 Enterprise-Ready
- **Multi-Tenancy** - Isolated data per organization
- **Role-Based Access** - Admin, Moderator, Member permissions
- **SSO Integration** - Demo mode included, SSO ready
- **Audit Logs** - Track all sensitive operations
- **Security Hardened** - CSRF protection, rate limiting, secure headers
- **MDN Observatory Compliant** - Passes security best practices

### 🎨 Customization & UX
- **6 Built-in Themes** - Ocean Blue, Forest Green, Sunset Orange, Lavender, Ruby, Refined Teal
- **Light/Dark Mode** - Per-user preference with smooth transitions
- **Branded Experience** - Custom colors, logos, and theme configuration
- **Team Context Bar** - Sticky banner with team description and quick actions
- **Consistent Spacing** - Standardized page layouts across all pages
- **Smart Navigation** - Team selector automatically updates URL and context
- **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🎬 Quick Start

### Prerequisites
- **Node.js** 20+
- **Docker** & Docker Compose
- **OpenSSL** (for key generation)

### 1. Clone & Setup
```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
make setup    # Generates .env file
make install  # Installs dependencies
```

### 2. Start Services
```bash
docker-compose up -d              # Start PostgreSQL, Redis, Mailpit
cd api && npm run dev &           # Start API server
cd web && npm run dev &           # Start frontend
```

### 3. Seed Demo Data
```bash
make db-seed  # Creates users, teams, questions, pulse data
```

### 4. Validate Environment
```bash
make preflight  # ⭐ Validates everything is working
```

### 5. Open the App
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **Mailpit**: http://localhost:8025 (email testing)

**Demo Users** (Demo Mode - 50 total users):
- `admin@pulsestage.app` - Full admin access (Engineering team)
- `alice@pulsestage.app` - Member (Engineering team)
- `bob@pulsestage.app` - Member (Product team)
- `moderator@pulsestage.app` - Moderator (Product team)
- + 46 additional dummy users with realistic names for rich demo data

---

## 📊 Usage Examples

### Submit a Question
1. Navigate to **Questions** page
2. Click **"Submit Question"** button in the action bar
3. Type your question and select team (Engineering or Product)
4. Add optional tags for categorization
5. Submit (anonymous by default)
6. Moderators review in the **Moderation Queue**
7. Approved questions appear in the team's Open Questions

### Respond to a Pulse
**Via Email**:
1. Receive pulse invite email
2. Click emoji to respond (one-tap)
3. Done! Response is anonymous

**Via Dashboard**:
1. Log in to http://localhost:5173
2. See "Pending Pulse" card on dashboard
3. Click to respond
4. Auto-advances to next pending pulse

### View Pulse Trends
1. Go to **Pulse** in the navigation bar
2. Select a team (Engineering, Product) or view organization-wide
3. View **12 weeks of historical data** with charts
4. See participation rates and average scores
5. Drill down by question category
6. Identify improving or declining trends
7. **Admin**: Configure questions, schedule, and cohorts in **Pulse Settings**

### Moderate Questions
1. Click **Admin Panel** in user menu
2. Navigate to **Moderation Queue**
3. Filter by status (Under Review, Open, Answered)
4. Filter by team or use bulk actions
5. Review flagged questions
6. Approve, pin, freeze, or tag questions
7. Approved questions appear in the team's Open Questions feed

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  - Dashboard  - Questions  - Pulse  - Admin  - Moderation   │
│  - Team Context  - Real-time SSE  - Theming                 │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST API + SSE
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              API Server (Express + TypeScript)               │
│  - Multi-tenant Context  - RBAC  - CSRF Protection           │
│  - Q&A Module  - Pulse Module  - Scheduler (node-cron)      │
│  - Team Management  - Settings  - Audit Logs                │
└───────────────────────────┬──────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
     ┌──────────┐     ┌──────────┐    ┌────────────┐
     │PostgreSQL│     │  Redis   │    │  Mailpit   │
     │ (Prisma) │     │(Sessions)│    │ (Dev SMTP) │
     │ 50 users │     │Rate Limit│    │            │
     │ 2 teams  │     │          │    │            │
     └──────────┘     └──────────┘    └────────────┘
```

### Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (sessions, rate limiting)
- **Email**: SMTP (Mailpit for dev, configurable for prod)
- **Security**: CSRF tokens, rate limiting, security headers

---

## 🧪 Testing

### Run All Tests
```bash
cd api && npm test          # 313 tests passing
cd web && npm run test:e2e  # E2E tests (requires services running)
```

### Pre-Flight Check (Recommended)
```bash
make preflight  # Validates entire environment
```

**What it checks**:
- ✅ Docker services running
- ✅ Database connectivity
- ✅ API server health
- ✅ Frontend accessibility
- ✅ Authentication working
- ✅ Seed data valid
- ✅ Core endpoints responding

### Test Coverage
- **API Tests**: 313/329 passing (95.1%)
- **Frontend Tests**: E2E happy path + unit tests
- **Security**: CSRF, rate limiting, headers, observatory compliance

---

## 📁 Project Structure

```
pulsestage/
├── api/                    # Backend API
│   ├── src/
│   │   ├── app.ts          # Express app & routes
│   │   ├── server.ts       # Server entry point
│   │   ├── lib/            # Core services
│   │   ├── middleware/     # Auth, security, tenant context
│   │   └── pulse/          # Pulse feature module
│   ├── prisma/             # Database schema & migrations
│   └── scripts/            # Seed & utility scripts
├── web/                    # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (auth, theme, team)
│   │   ├── lib/            # API client & utilities
│   │   └── hooks/          # Custom React hooks
│   └── e2e/                # Playwright E2E tests
├── docker-compose.yaml     # Local development services
├── Makefile                # Development commands
├── DEVELOPMENT_WORKFLOW.md # ⭐ Comprehensive dev guide
├── QUICK_START.md          # Quick reference card
└── FEATURE_AUDIT.md        # Feature status & test coverage
```

---

## 🔧 Development Workflow

### Daily Development
```bash
docker-compose up -d        # Start services
make db-seed               # Fresh data
cd api && npm run dev      # Terminal 1
cd web && npm run dev      # Terminal 2
make preflight            # ✅ Validate
```

### After Making Changes
```bash
# [restart services if needed]
make preflight            # ✅ Always validate before testing
```

### Key Commands
```bash
make help          # Show all commands
make preflight     # ⭐ Validate environment
make db-seed       # Reset & seed all data
make db-test-seed  # Validate seed data integrity
make test          # Run all tests
make validate-ci   # Run CI checks locally
```

**⭐ Golden Rule**: Always run `make preflight` before requesting user testing!

---

## 🌍 Deployment

### Production Checklist
- [ ] Configure SSO (currently demo mode only)
- [ ] Set up production email provider (replace Mailpit)
- [ ] Configure environment variables
- [ ] Set secure session secret
- [ ] Enable HTTPS
- [ ] Configure rate limiting for production
- [ ] Set up monitoring and alerts

### Environment Variables
See `.env.example` for all required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SESSION_SECRET` - Secure random string (generate with `openssl rand -base64 32`)
- `ADMIN_KEY` - Admin panel access key
- `SMTP_*` - Email configuration
- `NODE_ENV` - `development` or `production`

### Docker Deployment
```bash
docker-compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d
```

---

## 📖 Documentation

- **[Development Workflow](./DEVELOPMENT_WORKFLOW.md)** - Comprehensive guide for contributors
- **[Quick Start](./QUICK_START.md)** - Quick reference card
- **[Feature Audit](./FEATURE_AUDIT.md)** - Feature status & test coverage
- **[Seed Data Checklist](./SEED_DATA_CHECKLIST.md)** - Testing scenarios

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repo** and create a feature branch
2. **Run tests**: `make test`
3. **Follow the workflow**: See `DEVELOPMENT_WORKFLOW.md`
4. **Run pre-flight check**: `make preflight` before submitting PR
5. **Submit a PR** with a clear description

### Code Style
- TypeScript for all code
- ESLint + Prettier for formatting
- Run `make lint` before committing

---

## 📜 License

Apache 2.0 - See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/), [Express](https://expressjs.com/), and [Prisma](https://www.prisma.io/)
- Inspired by employee engagement best practices
- Security headers validated by [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory)

---

## 📊 Project Stats

- **313 API tests** passing (95.1% coverage)
- **50 demo users** (4 login + 46 dummy users with realistic names)
- **2 teams** (Engineering, Product) for focused demo experience
- **36 Q&A questions** (20 Engineering, 16 Product)
- **1,300+ pulse responses** with team-specific trends
- **12 weeks** of historical pulse data (always relative to "now")
- **10 pulse questions** in research-backed library
- **6 built-in themes** with light/dark mode
- **81.6% pulse participation** in demo data

---

## 🚀 Roadmap

### v1.0 (Current - November 2025)
- ✅ **Q&A Platform** with unified interface and smart action bar
- ✅ **Weekly Pulse** with team-scoped analytics and 12 weeks history
- ✅ **Primary Team Architecture** for pulse distribution
- ✅ **Moderation Queue** with bulk actions
- ✅ **Admin Panel** with comprehensive settings
- ✅ **6 Theme System** with light/dark mode
- ✅ **Team Context Navigation** with sticky bar
- ✅ **Real-time Updates** via SSE
- ✅ **Pre-flight Validation** system
- ✅ **50-user Demo Mode** with realistic data

### v1.1 (Planned)
- [ ] SSO Integration (Okta, Auth0)
- [ ] Slack/Teams Integration
- [ ] Mobile-responsive improvements
- [ ] Advanced analytics
- [ ] Export reports (CSV, PDF)

### v2.0 (Future)
- [ ] AI-powered question clustering
- [ ] Sentiment analysis
- [ ] Multi-language support
- [ ] Advanced permissions (custom roles)
- [ ] API webhooks

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/seanmdalton/pulsestage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/seanmdalton/pulsestage/discussions)
- **Email**: sean@pulsestage.dev

---

**Made with ❤️ by the PulseStage team**
