# PulseStage

[![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)](CHANGELOG.md)
[![CI](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-336-brightgreen.svg)]()

**Employee engagement platform combining Q&A and pulse surveys.**

Anonymous question submission, upvoting, team-scoped organization, and weekly sentiment tracking with role-based access control.

---

## Features

### Q&A System
- Anonymous question submission
- Upvoting to surface priorities
- Full-text search (PostgreSQL GIN indexes)
- Moderator workflow (answer, tag, pin, freeze)
- Presentation mode for all-hands meetings
- Team-scoped organization

### Weekly Pulse
- Anonymous sentiment surveys (1-5 scale)
- Email invitations via BullMQ queue
- Team-scoped analytics with 12-week history
- Cohort rotation for fair sampling
- One-tap response links

### Access Control
Five roles with team-scoped permissions:
- Viewer - Browse and upvote
- Member - Submit questions
- Moderator - Answer and moderate (team-scoped)
- Admin - Full access (global)
- Owner - Complete control

### Security
- Multi-tenancy with tenant isolation
- Role-based access control
- Content moderation (local + OpenAI)
- Rate limiting (Redis-based)
- Audit logging (append-only)
- CSRF protection and security headers

---

## Quick Start

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
./setup.sh
docker compose up -d
```

Visit `http://localhost:5173` and log in with demo credentials (admin, alice, bob, or moderator).

See [Installation Guide](https://seanmdalton.github.io/pulsestage/getting-started/installation/) for details.

---

## Technology

- **Backend**: Node.js 24, Express, TypeScript, Prisma
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Database**: PostgreSQL 16 with full-text search
- **Cache**: Redis 7 for sessions and rate limiting
- **Queue**: BullMQ for email delivery
- **Tests**: 336 API tests (Vitest) + E2E (Playwright)
- **Deployment**: Docker Compose

---

## Project Structure

```
pulsestage/
├── api/                    # Node.js Express API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── lib/           # Business logic
│   │   └── scripts/       # Seeding, migrations
│   └── prisma/            # Database schema
│
├── web/                    # React frontend
│   ├── src/
│   │   ├── pages/         # Route components
│   │   ├── components/    # Reusable components
│   │   └── lib/           # API client, utilities
│   └── e2e/               # Playwright tests
│
├── docs/                   # Documentation
│   ├── handbook/          # Product vision, architecture
│   ├── guides/            # User/moderator/admin guides
│   ├── getting-started/   # Installation and setup
│   └── deployment/        # Production deployment
│
├── .cursorrules           # AI development workflow
├── docker-compose.yaml    # Local services
└── Makefile               # Development commands
```

---

## Documentation

### Getting Started
- [Installation](https://seanmdalton.github.io/pulsestage/getting-started/installation/) - Docker Compose setup
- [Configuration](https://seanmdalton.github.io/pulsestage/getting-started/configuration/) - Environment variables
- [Quick Start](https://seanmdalton.github.io/pulsestage/getting-started/quick-start/) - 5-minute setup
- [Troubleshooting](https://seanmdalton.github.io/pulsestage/getting-started/troubleshooting/) - Common issues

### User Guides
- [User Guide](https://seanmdalton.github.io/pulsestage/guides/user/submitting-questions/) - Submit questions, upvote, search
- [Moderator Guide](https://seanmdalton.github.io/pulsestage/guides/moderator/moderation-queue/) - Answer, moderate, present
- [Admin Guide](https://seanmdalton.github.io/pulsestage/guides/admin/roles-permissions/) - Manage teams, users, settings

### Handbook (Architecture & Operations)
- [Product Vision](https://seanmdalton.github.io/pulsestage/handbook/PRODUCT_VISION/) - Features and design philosophy
- [Data Model](https://seanmdalton.github.io/pulsestage/handbook/DATA_MODEL_SNAPSHOT/) - Database schema
- [Security Model](https://seanmdalton.github.io/pulsestage/handbook/SECURITY_MODEL/) - RBAC, rate limiting, audit logging
- [Authentication](https://seanmdalton.github.io/pulsestage/handbook/AUTHENTICATION/) - Multi-mode auth (Demo, OAuth)
- [Development](https://seanmdalton.github.io/pulsestage/handbook/DEVELOPMENT/) - Workflow, testing, versioning
- [Operations](https://seanmdalton.github.io/pulsestage/handbook/OPERATIONS/) - Deployment, monitoring
- [API Contracts](https://seanmdalton.github.io/pulsestage/handbook/API_CONTRACTS/events/) - OpenAPI spec, SSE events

### Deployment
- [Production Deployment](https://seanmdalton.github.io/pulsestage/deployment/production/) - Self-hosting guide
- [Environment Variables](https://seanmdalton.github.io/pulsestage/deployment/environment/) - Configuration reference
- [Monitoring](https://seanmdalton.github.io/pulsestage/deployment/monitoring/) - Health checks and observability

---

## Development

### Prerequisites
- Docker and Docker Compose
- Node.js 24 LTS

### Setup

```bash
# Clone repository
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage

# Generate secrets and start services
./setup.sh
docker compose up -d

# Seed demo data
make db-seed

# Verify
make preflight
```

### Key Commands

**Development:**
- `make dev` - Start development (foreground, hot reload)
- `make up` - Start services (background)
- `make down` - Stop all services

**Database:**
- `make db-seed` - Reset and seed demo data
- `make db-test-seed` - Validate seed data integrity

**Testing:**
- `make test` - Run all tests (API + E2E)
- `make test-api` - API tests only
- `make test-web` - E2E tests only

**Validation:**
- `make preflight` - Pre-test validation (REQUIRED before user testing)
- `make validate-ci` - Run all CI checks (REQUIRED before git push)
- `make security` - Security scans (Trivy)

See [Development Guide](https://seanmdalton.github.io/pulsestage/handbook/DEVELOPMENT/) for complete workflow.

### Demo Data

After `make db-seed`:
- 50 users (4 login users + 46 dummy users)
- 2 teams (Engineering, Product)
- 36 Q&A questions
- 12 weeks of pulse historical data
- 800+ pulse responses

**Login users:** admin, alice, bob, moderator (all @pulsestage.app)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Run `make validate-ci` (must pass)
5. Submit pull request

See [Development Guide](https://seanmdalton.github.io/pulsestage/handbook/DEVELOPMENT/) for details.

---

## Versioning

PulseStage follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **Current version:** `0.1.0` (pre-stable)
- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes, security patches

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

## Support

- **Documentation**: [https://seanmdalton.github.io/pulsestage/](https://seanmdalton.github.io/pulsestage/)
- **Issues**: [https://github.com/seanmdalton/pulsestage/issues](https://github.com/seanmdalton/pulsestage/issues)
- **Discussions**: [https://github.com/seanmdalton/pulsestage/discussions](https://github.com/seanmdalton/pulsestage/discussions)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
