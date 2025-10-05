# PulseStage

[![CI](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Coverage](https://img.shields.io/badge/Coverage-22%25-orange.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org/)

<div align="left" style="margin:10px 0 10px 0">
  <img src="web/public/pulsestage-wordmark-light.svg" alt="PulseStage">
</div>

**Open-source Q&A Platform for town halls and all-hands.** PulseStage helps teams capture questions, surface what matters with up-votes, and publish clear answers—then present it all live. Built as a full-stack AMA-style app with **multi-team spaces** and **role-based controls**, it's designed to increase employee engagement and organizational transparency.

## Why PulseStage

- 📊 **Up-vote–only** questions to reduce noise and highlight priorities  
- 🏢 **Team-based organization** for different departments or forums  
- 👥 **Role-based moderation** (viewer, member, moderator, admin, owner)  
- 🎥 **Presenter mode** for leadership meetings and all-hands  
- 🔍 **Advanced search** with full-text search, filters, and date ranges
- 🏷️ **Tagging system** for organizing and categorizing questions
- 📌 **Moderation tools** - Pin, freeze, and bulk operations
- 📊 **Analytics dashboard** for moderation metrics and performance
- 📤 **Exports** (CSV/JSON) for follow-ups and accountability  
- 🔒 **Audit logging** for compliance and security
- 🔄 **Real-time updates** via Server-Sent Events (SSE)
- 🐳 **Self-hostable** with Docker, open source (Apache-2.0)

## Quick Start

> [!WARNING]
> ⚠️ PulseStage is under heavy development!
> 

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
./setup.sh
docker compose up -d

# Optional: Load comprehensive test data
docker compose exec api npm run db:seed:full
```

Visit [http://localhost:5173](http://localhost:5173) and you're ready to go!

Uses published container images from GitHub Container Registry ([API](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-api) | [Web](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-web)).

📖 **[Full Documentation](https://seanmdalton.github.io/pulsestage/)** | 🚀 **[Quick Start Guide](https://seanmdalton.github.io/pulsestage/getting-started/quick-start/)**

## Key Features

### 🏢 Multi-Team Organization
Organize questions by Engineering, Product, People, or any custom teams. Each team has its own space with isolated questions and dedicated moderators.

### 👥 Role-Based Access Control  
Five roles (viewer, member, moderator, admin, owner) with team-scoped permissions. Moderators can only manage questions in their assigned teams.

### 🎨 Modern User Experience
Beautiful responsive design with dark mode, real-time updates via SSE, and presentation mode optimized for large displays.

### 🔒 Security & Compliance
Comprehensive audit logging, tenant isolation, session-based auth, CSRF protection, security headers (Helmet), and rate limiting on all endpoints.

### 🔍 Advanced Search & Filtering
Full-text search with PostgreSQL GIN indexes, prefix matching for substrings, filter by tags, date ranges, and team. Works on both open and answered questions.

### 📌 Moderation Queue & Tools
Dedicated moderation interface with bulk operations (pin, freeze, tag, delete), quick actions, comprehensive filters, and real-time updates. Track moderation activity with detailed analytics per moderator.

## Documentation

- 📚 **[Full Documentation](https://seanmdalton.github.io/pulsestage/)** - Complete guides and API reference
- 🚀 **[Quick Start](https://seanmdalton.github.io/pulsestage/getting-started/quick-start/)** - Get running in 5 minutes
- 💻 **[Installation](https://seanmdalton.github.io/pulsestage/getting-started/installation/)** - Detailed setup instructions
- 🏗️ **[Architecture](https://seanmdalton.github.io/pulsestage/architecture/system-design/)** - System design and technical decisions
- 🔒 **[Security](https://seanmdalton.github.io/pulsestage/security/overview/)** - Security features and RBAC
- 🛠️ **[Development](https://seanmdalton.github.io/pulsestage/development/setup/)** - Contributing guide

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js 24 LTS, Express, TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7 for rate limiting
- **Testing**: Vitest (208 tests), Playwright E2E
- **Deployment**: Docker Compose
- **Security**: Helmet, CSRF protection, Content Security Policy, Audit logging

## Development

```bash
# Install dependencies
npm install

# Start development environment
docker compose up -d db redis
cd api && npm run dev &
cd web && npm run dev

# Run tests
npm test

# Run E2E tests
cd web && npx playwright test
```

See the [Development Guide](https://seanmdalton.github.io/pulsestage/development/setup/) for detailed instructions.

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://seanmdalton.github.io/pulsestage/development/contributing/) for details.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

## Support

- 📖 [Documentation](https://seanmdalton.github.io/pulsestage/)
- 🐛 [Issue Tracker](https://github.com/seanmdalton/pulsestage/issues)
- 💬 [Discussions](https://github.com/seanmdalton/pulsestage/discussions)

---

<div align="center">
  Made with ❤️ by the PulseStage community
</div>
