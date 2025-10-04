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
- **Role-based admin & moderation** (submit, review, respond, publish)  
- **Presenter mode** for leadership meetings and all-hands  
- **Search & tags** for quick discovery of related topics  
- **Exports** for follow-ups and accountability  
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
- Real-time search with fuzzy matching
- Upvote system with localStorage protection
- Full-screen viewing for long questions and answers
- Status tracking (Open and Answered)

### 👥 Role-Based Access Control
- **Viewer**: Browse questions anonymously
- **Member**: Submit and upvote questions
- **Moderator**: Answer questions, tag, present (team-scoped)
- **Admin**: Full access including exports and audit logs
- **Owner**: Complete control including team management

### 🎨 Modern User Experience
- Beautiful, responsive design with dark mode
- Real-time updates via Server-Sent Events (SSE)
- Presentation mode optimized for large displays
- Search results with live typing feedback
- Profile management with favorite teams

### 🔒 Security & Compliance
- Comprehensive audit logging
- Team-scoped permissions
- Tenant isolation for multi-tenancy
- Session-based authentication
- Rate limiting on all endpoints

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js 20, Express, TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7 for rate limiting
- **Testing**: Vitest, Playwright E2E
- **Deployment**: Docker Compose

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

