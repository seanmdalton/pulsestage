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
- 👤 **User management** - Change roles, manage team memberships
- ⚙️ **Admin panel** - Organization settings, team/user management, analytics
- 🎯 **Setup wizard** - First-time installation guide with demo data option
- 📊 **Analytics dashboard** for moderation metrics and performance
- 📤 **Exports** (CSV/JSON) for follow-ups and accountability  
- 📧 **Email notifications** - Notify users when their questions are answered
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
make setup
make start
```

Visit [http://localhost:5173](http://localhost:5173) and follow the **Setup Wizard** to:
- ✨ Load demo data with sample teams, users, and questions
- 🏢 Or create your own organization from scratch

**First-time user experience**: Guided setup wizard automatically appears when no teams exist.  
**Auto-bootstrap**: Default tenant is automatically created on first startup.  
**Published images**: Uses containers from GitHub Registry ([API](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-api) | [Web](https://github.com/seanmdalton/pulsestage/pkgs/container/pulsestage-web)).

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

### 📧 Email Notifications
Automatic email notifications when questions are answered with customizable user preferences. Supports SMTP (SendGrid, AWS SES, etc.) and Resend. Includes Redis-backed queue with retry logic for reliability. Local development uses Mailpit for testing.

## Development

For local development with live code changes:

```bash
make setup      # Initialize environment
make install    # Install dependencies
make dev        # Start with local builds (hot reload)
make db-seed    # Load demo data (development only)
```

See **[DEVELOPMENT.md](DEVELOPMENT.md)** for the complete development workflow guide.

**Quick commands:**
- `make test` - Run all tests
- `make validate-ci` - Run all CI checks locally
- `make lint-fix` - Fix linting issues

## Documentation

- 📚 **[Full Documentation](https://seanmdalton.github.io/pulsestage/)** - Complete guides and API reference
- 🚀 **[Quick Start](https://seanmdalton.github.io/pulsestage/getting-started/quick-start/)** - Get running in 5 minutes
- 💻 **[Installation](https://seanmdalton.github.io/pulsestage/getting-started/installation/)** - Detailed setup instructions
- 🏗️ **[Architecture](https://seanmdalton.github.io/pulsestage/architecture/system-design/)** - System design and technical decisions
- 🔒 **[Security](https://seanmdalton.github.io/pulsestage/security/overview/)** - Security features and RBAC
- 🛠️ **[Development](DEVELOPMENT.md)** - Local development guide (new!)

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js 24 LTS, Express, TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7 for rate limiting
- **Testing**: Vitest (231 tests), Playwright E2E
- **Deployment**: Docker Compose
- **Security**: Helmet, CSRF protection, Content Security Policy, Audit logging

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://seanmdalton.github.io/pulsestage/development/contributing/) for details.

### Contributors

Thank you to all the amazing people who have contributed to PulseStage! 🎉

<!-- readme: contributors -start -->
<table>
	<tbody>
		<tr>
            <td align="center">
                <a href="https://github.com/seanmdalton">
                    <img src="https://avatars.githubusercontent.com/u/16750029?v=4" width="100;" alt="seanmdalton"/>
                    <br />
                    <sub><b>seanmdalton</b></sub>
                </a>
            </td>
		</tr>
	<tbody>
</table>
<!-- readme: contributors -end -->

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
