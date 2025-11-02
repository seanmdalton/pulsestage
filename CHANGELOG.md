# Changelog

All notable changes to PulseStage will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### In Progress
- Documentation reorganization and rewrite

---

## [0.1.1] - 2025-11-02

### Fixed
- Fixed TypeScript build configuration for Render deployment (changed `moduleResolution` from "Bundler" to "Node")
- Fixed Docker cache busting to ensure configuration changes are picked up in deployments
- Aligned `/admin/reset-demo` endpoint with local seed process (now uses 2 teams instead of 4, includes pulse data)

### Changed
- Updated documentation links in README to point to published MkDocs site

---

## [0.1.0] - 2025-11-01

Initial pre-stable release of PulseStage.

### Added

#### Q&A System
- Anonymous question submission with team assignment
- Upvoting system with self-upvote protection
- Question answering by moderators
- Full-text search with PostgreSQL GIN indexes
- Advanced filtering (tags, date ranges, status, team)
- Bulk operations (tag, pin, freeze, delete)
- Question pinning and freezing
- Tag management system

#### Weekly Pulse System
- Pulse question creation and scheduling
- Cohort-based rotation (Weekday/Weekend)
- Email invitations via BullMQ queue
- One-tap response links with 7-day expiration
- Anonymous response collection
- Historical trend analysis (12 weeks)
- Team-scoped pulse analytics
- 81.6% participation rate in demo data

#### Team Organization
- Multi-team structure (Engineering, Product)
- Team-scoped content and permissions
- Team switching with question counts
- Shareable team URLs (e.g., `/engineering/open`)
- Primary team assignment for users

#### Access Control
- Role-based access control (RBAC) with 5 roles:
  - Viewer: Browse and upvote
  - Member: Submit and upvote questions
  - Moderator: Answer, tag, pin, freeze (team-scoped)
  - Admin: Full access, exports, audit logs (global)
  - Owner: Complete system control (global)
- Team-scoped moderator permissions
- Tenant isolation for multi-tenancy

#### Moderation Tools
- Dedicated moderation queue interface
- Content moderation with cascading filters (local + OpenAI)
- Auto-reject for toxic content
- Review queue for flagged content
- Moderation analytics dashboard
- Quick actions (pin, freeze, answer)

#### Presentation Mode
- Full-screen presentation view for all-hands
- Live tag filtering during presentations
- Keyboard shortcuts (arrow keys, Esc)
- Auto-tagging workflow
- Permission-gated access (moderators+)

#### Authentication
- Multi-mode authentication system:
  - Demo mode (4 pre-seeded users)
  - GitHub OAuth
  - Google OAuth
- Session-based authentication with Redis
- HttpOnly cookies for security
- CSRF protection on state-changing endpoints

#### Email System
- BullMQ queue for reliable delivery
- Redis-backed job processing
- SMTP and Resend provider support
- React-email templates
- Mailpit integration for local testing
- Admin email queue monitoring

#### Security
- Comprehensive audit logging (append-only)
- Rate limiting with Redis (per-tenant, per-IP)
- Security headers (Helmet, CSP, HSTS, X-Frame-Options)
- Content Security Policy (CSP)
- CSRF protection (csrf-csrf)
- Tenant isolation enforcement
- Anonymity guarantees (no userId in PulseResponse)

#### User Experience
- Responsive design with dark mode
- Real-time updates via Server-Sent Events (SSE)
- Debounced search with instant feedback
- Profile management with favorite teams
- Persistent state across browser windows
- Beautiful Tailwind CSS design

#### Admin Features
- Tenant settings management
- Team management (create, edit, delete)
- User role management
- Email queue monitoring
- Audit log querying
- Data export (CSV/JSON)
- Tag management

#### Search & Filtering
- PostgreSQL full-text search
- Prefix/substring matching
- Tag filtering
- Date range filtering
- Status filtering (open, answered)
- Team filtering

#### Developer Experience
- Comprehensive test suite (336 API tests)
- Playwright E2E tests
- Pre-flight validation system (`make preflight`)
- Complete CI validation (`make validate-ci`)
- Hot reload for API and frontend
- Idempotent seed data system (50 users, 2 teams, 36 questions)
- Time-relative historical data (always "now - 12 weeks")

### Infrastructure

#### Backend
- Node.js 24 LTS runtime
- Express.js REST API
- TypeScript with strict mode
- Prisma ORM for database access
- PostgreSQL 16 with GIN indexes
- Redis 7 for caching and sessions
- BullMQ for background jobs

#### Frontend
- React 19
- TypeScript with strict mode
- Tailwind CSS for styling
- Vite for build tooling
- Server-Sent Events for real-time updates

#### Deployment
- Docker Compose orchestration
- Multi-stage Docker builds
- PostgreSQL, Redis, Mailpit services
- Local Docker build system for security scanning
- Environment variable configuration

#### CI/CD
- GitHub Actions workflows
- Automated testing (API + E2E)
- Linting (ESLint + Prettier)
- Security scanning (Trivy, Semgrep)
- SBOM generation
- Dependabot auto-merge

#### Security Scanning
- Trivy for container vulnerability scanning
- Semgrep for static analysis (SAST)
- Dependency vulnerability checks
- OS-level vulnerability scanning

### Documentation

#### Handbook (Product & Architecture)
- Product vision and key features
- Data model and invariants
- Security model (RBAC, rate limiting, audit logging)
- Authentication system (multi-mode)
- Operations guide (dev vs production)
- Development workflow
- Pulse system architecture
- Email system integration
- Trust and safety (content moderation)
- Admin guide
- API contracts (OpenAPI, SSE events)
- Architecture Decision Records (ADRs)
- Tenancy model
- UX contracts
- Personas and use cases

#### User Guides
- Getting started (installation, configuration, quick start)
- User guide (submitting questions, upvoting, search)
- Moderator guide (answering, moderation queue, presentation mode)
- Admin guide (roles, teams, audit logging, exports)
- Deployment guides (production, environment, monitoring)

#### Technical Documentation
- Development setup and workflow
- Testing strategy
- Code style and patterns
- Pre-flight validation system
- Three-tier rule system (handbook, .cursorrules, .cursor/rules)

### Seed Data

Demo environment includes:
- 50 users (4 login users + 46 realistic dummy users)
- 2 teams (Engineering, Product)
- 36 Q&A questions (10 open + 10 answered per team)
- 10 active pulse questions
- 12 weeks of historical pulse data (≥800 responses)
- Team-specific trends (Engineering improving, Product stable)
- 81.6% pulse participation rate
- 2 pulse cohorts (Weekday, Weekend)
- Tenant: `default`

---

## Version History

- **[0.1.0]** - 2025-11-01 - Initial pre-stable release

---

## Upgrading

See [docs/handbook/DEVELOPMENT.md](docs/handbook/DEVELOPMENT.md) for development guidelines.

For production deployments, see [docs/deployment/production.md](docs/deployment/production.md).

---

## Support

- Documentation: https://seanmdalton.github.io/pulsestage/
- Issue Tracker: https://github.com/seanmdalton/pulsestage/issues
- Discussions: https://github.com/seanmdalton/pulsestage/discussions
