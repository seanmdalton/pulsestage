# PulseStage

[![CI](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Coverage](https://img.shields.io/badge/Coverage-22%25-orange.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

<div align="left" style="margin:10px 0 10px 0">
  <img src="web/public/pulsestage-wordmark-light.svg" alt="PulseStage">
</div>

**Open-source Q&A platform for town halls and all-hands meetings.** Capture questions, surface priorities through upvoting, and present answers live. Built for transparency and employee engagement.

🎯 **[Try the Live Demo](https://demo.pulsestage.app)** | 📖 **[Documentation](https://seanmdalton.github.io/pulsestage/)**

## Why PulseStage?

- **📊 Upvote-based** - Let the crowd decide what matters most
- **🏢 Multi-team** - Organize by department or forum
- **👥 Role-based access** - Fine-grained permissions (viewer → owner)
- **🎥 Presenter mode** - Optimized for live events
- **🔍 Smart search** - Full-text with filters and date ranges
- **📌 Moderation tools** - Pin, freeze, tag, and bulk operations
- **🔄 Real-time updates** - See changes instantly via SSE
- **🐳 Self-hostable** - Deploy with Docker, 100% open source

## Quick Start

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
make setup && make start
```

Visit [http://localhost:5173](http://localhost:5173) and follow the setup wizard.

**Demo users** (development mode):
- `alice` (admin) - Full access
- `bob` (member) - Regular user  
- `moderator` - Team moderator
- `admin` - Administrator

📚 **[Full Installation Guide](https://seanmdalton.github.io/pulsestage/getting-started/installation/)**

## Live Demo

**🎯 [demo.pulsestage.app](https://demo.pulsestage.app)** - Fully functional demo instance

- Pre-loaded with sample teams, questions, and users
- Automatically resets daily (3 AM UTC)
- Demo login available - no OAuth required

Try different roles to see how permissions work!

## Key Features

### 🎯 Built for Engagement
- **Upvote-only system** reduces noise
- **Pin important questions** for visibility
- **Tag and categorize** for better organization
- **Export to CSV/JSON** for follow-ups

### 🏢 Enterprise-Ready
- **Multi-team workspaces** with isolated permissions
- **Comprehensive audit logging** for compliance
- **Session-based authentication** with OAuth support
- **Rate limiting** and content moderation
- **Email notifications** when questions are answered

### 🔒 Security First
- RBAC with 5 permission levels
- CSRF protection and security headers
- Content moderation (profanity, spam, hate speech)
- Tenant isolation for multi-tenancy

### 🚀 Developer-Friendly
- Modern React 19 + TypeScript frontend
- Node.js 24 + Express backend
- PostgreSQL 16 with Prisma ORM
- Docker Compose for easy deployment
- 310+ automated tests

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite |
| **Backend** | Node.js 24 LTS, Express, TypeScript |
| **Database** | PostgreSQL 16 (Prisma ORM) |
| **Cache** | Redis 7 (sessions & rate limiting) |
| **Testing** | Vitest (310 tests), Playwright E2E |
| **Deployment** | Docker, Docker Compose |

## Documentation

- 🚀 **[Quick Start](https://seanmdalton.github.io/pulsestage/getting-started/quick-start/)** - 5-minute setup
- 💻 **[Installation Guide](https://seanmdalton.github.io/pulsestage/getting-started/installation/)** - Detailed setup
- 🏗️ **[Architecture](https://seanmdalton.github.io/pulsestage/architecture/system-design/)** - System design
- 👥 **[User Guide](https://seanmdalton.github.io/pulsestage/user-guide/overview/)** - Using PulseStage
- 👮 **[Moderator Guide](https://seanmdalton.github.io/pulsestage/moderator-guide/overview/)** - Moderation tools
- 🔐 **[Admin Guide](https://seanmdalton.github.io/pulsestage/admin-guide/overview/)** - Administration
- 🔒 **[Security](https://seanmdalton.github.io/pulsestage/security/overview/)** - Security features
- 🛠️ **[Development](https://seanmdalton.github.io/pulsestage/development/setup/)** - Contributing guide
- 🌐 **[API Reference](https://seanmdalton.github.io/pulsestage/api/overview/)** - REST API docs

## Development

**Hot reload** for instant feedback:

```bash
make dev        # Web changes apply instantly
make test       # Run all tests
make lint-fix   # Fix code style issues
```

**Development benefits:**
- ⚡ Edit React components → see changes instantly
- 🔄 Vite dev server with volume mounting
- 🎯 Demo data automatically seeds
- 🔧 API restart: `docker compose restart api`

**[Complete Development Guide →](https://seanmdalton.github.io/pulsestage/development/setup/)**

## Deployment

Deploy to production with Docker Compose or Render:

```bash
# Docker Compose (recommended)
make setup
make start

# Or use Render (cloud hosting)
# See docs/deployment/ for platform-specific guides
```

**Deployment guides:**
- **[Docker Compose](https://seanmdalton.github.io/pulsestage/deployment/docker-compose/)** - Self-hosted
- **[Production Checklist](https://seanmdalton.github.io/pulsestage/deployment/production-checklist/)** - Pre-launch guide
- **[Environment Variables](https://seanmdalton.github.io/pulsestage/deployment/environment/)** - Configuration reference
- **[Demo Mode](https://seanmdalton.github.io/pulsestage/deployment/demo-mode-guide/)** - Public demo setup

## Contributing

We welcome contributions! Check out our **[Contributing Guide](https://seanmdalton.github.io/pulsestage/development/contributing/)** to get started.

**Quick start for contributors:**
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed guidelines.

## Community

- 🐛 **[Issue Tracker](https://github.com/seanmdalton/pulsestage/issues)** - Report bugs
- 💬 **[Discussions](https://github.com/seanmdalton/pulsestage/discussions)** - Ask questions
- 📧 **Email**: [seanmdalton@pm.me](mailto:seanmdalton@pm.me)

## License

Licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for details.

## Contributors

Thank you to everyone who has contributed! 🎉

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

---

<div align="center">
  <strong>Built with ❤️ for transparent communication</strong>
  <br />
  <a href="https://demo.pulsestage.app">Try Demo</a> •
  <a href="https://seanmdalton.github.io/pulsestage/">Documentation</a> •
  <a href="https://github.com/seanmdalton/pulsestage/issues">Report Bug</a>
</div>
