# PulseStage

<div align="center">
  <img src="assets/pulsestage-wordmark-light.svg" alt="PulseStage" width="400">
  <p><strong>Open-source Q&A Platform for Town Halls and All-Hands</strong></p>
</div>

[![CI](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)

PulseStage helps teams capture questions, surface what matters with up-votes, and publish clear answers—then present it all live. Built as a full-stack AMA-style app with **multi-team spaces** and **role-based controls**, it's designed to increase employee engagement and organizational transparency.

## Why PulseStage?

- **Up-vote–only questions** to reduce noise and highlight priorities  
- **Team-based organization** for different departments or forums  
- **Role-based moderation** (viewer, member, moderator, admin, owner)  
- **Advanced search** with full-text search, filters, and date ranges
- **Moderation tools** - Pin, freeze, bulk operations, and analytics
- **Presenter mode** for leadership meetings and all-hands  
- **Tagging system** for organizing and categorizing questions
- **Real-time updates** via Server-Sent Events (SSE)
- **Audit logging** for compliance and security
- **Exports** (CSV/JSON) for follow-ups and accountability  
- **Self-hostable** with Docker (Postgres + Redis), open source (Apache-2.0)

## Quick Start

Get PulseStage running in under 5 minutes:

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
./setup.sh
docker compose up
```

Visit [http://localhost:3000](http://localhost:3000) to start using PulseStage!

For detailed setup instructions, see the [Installation Guide](getting-started/installation.md).

## Key Features

### 🏢 Multi-Team Organization
- Organize questions by Engineering, Product, People, General teams
- Easy team switching with question counts
- Team management through Admin panel
- Shareable URLs like `/engineering/open` or `/product/answered`

### ❓ Question Management
- Anonymous question submission with team assignment
- Full-text search with prefix matching (e.g., "mob" finds "mobile")
- Advanced filters: tags, date ranges, status, team
- Upvote system with protection against self-upvoting
- Full-screen viewing for long questions and answers
- Status tracking (Open and Answered)
- Tag-based organization

### 👥 Role-Based Access Control
- **Viewer**: Browse questions anonymously, upvote
- **Member**: Submit and upvote questions
- **Moderator**: Answer questions, tag, pin, freeze, present (team-scoped)
- **Admin**: Full access including exports, audit logs, and team management
- **Owner**: Complete control including user management

### 📌 Moderation Tools
- **Pin questions** to highlight important topics
- **Freeze questions** to lock them from further interaction
- **Bulk operations** - Tag, pin, freeze, or delete multiple questions at once
- **Moderation queue** - Dedicated interface with comprehensive filters
- **Analytics dashboard** - Track moderator performance and activity
- **Quick actions** - Pin 📌, Freeze ❄️, Answer 💬 buttons on each question

### 🎨 Modern User Experience
- Beautiful, responsive design with dark mode
- Real-time updates via Server-Sent Events (SSE)
- Presentation mode optimized for large displays with live tag updates
- Debounced search with instant feedback
- Profile management with favorite teams
- Persistent state across browser windows

### 🔒 Security & Compliance
- Comprehensive audit logging (all admin/mod actions tracked)
- Team-scoped permissions with RBAC enforcement
- Tenant isolation for multi-tenancy
- Session-based authentication with HttpOnly cookies
- CSRF protection on all state-changing endpoints
- Security headers (Helmet, CSP, HSTS, X-Frame-Options)
- Rate limiting on all endpoints
- MDN HTTP Observatory integration for security validation

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js 24 LTS, Express, TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM, full-text search (GIN indexes)
- **Cache**: Redis 7 for rate limiting and session storage
- **Testing**: Vitest (208 tests), Playwright E2E, MDN HTTP Observatory
- **Security**: Helmet, CSRF protection (csrf-csrf), Content Security Policy
- **Deployment**: Docker Compose with multi-stage builds
- **CI/CD**: GitHub Actions with Semgrep (SAST), Trivy (security scanning), SBOM generation

## Documentation

- [Getting Started](getting-started/quick-start.md) - Installation and first steps
- [User Guide](user-guide/overview.md) - How to use PulseStage
- [Admin Guide](admin-guide/overview.md) - Managing teams, users, and settings
- [Architecture](architecture/system-design.md) - Technical design and decisions
- [Security](security/overview.md) - Security features and best practices
- [API Reference](api/overview.md) - REST API documentation
- [Development](development/setup.md) - Contributing and local development

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](../LICENSE) for details.

## Support

- 📖 [Documentation](https://seanmdalton.github.io/pulsestage/)
- 🐛 [Issue Tracker](https://github.com/seanmdalton/pulsestage/issues)
- 💬 [Discussions](https://github.com/seanmdalton/pulsestage/discussions)

