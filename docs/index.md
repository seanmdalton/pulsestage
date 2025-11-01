# PulseStage

**Employee engagement platform combining Q&A and pulse surveys.**

Anonymous question submission, upvoting, team-scoped organization, and weekly sentiment tracking with role-based access control.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/seanmdalton/pulsestage/blob/main/CHANGELOG.md)
[![CI](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## Quick Start

```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
./setup.sh
docker compose up
```

Visit `http://localhost:5173` and log in with demo credentials (admin, alice, bob, or moderator).

See [Installation Guide](getting-started/installation.md) for production deployment.

---

## Core Features

### Q&A System
- Anonymous question submission with team assignment
- Upvoting to surface priorities
- Full-text search (PostgreSQL GIN indexes)
- Moderator workflow (answer, tag, pin, freeze)
- Bulk operations and moderation queue
- Presentation mode for all-hands meetings

### Weekly Pulse
- Anonymous sentiment surveys with cohort rotation
- Email invitations via BullMQ queue
- One-tap response links (7-day expiration)
- Team-scoped analytics with 12-week history
- Anonymity enforcement (no userId in responses)

### Access Control
Five roles with team-scoped permissions:
- **Viewer** - Browse and upvote
- **Member** - Submit questions and upvote
- **Moderator** - Answer, tag, pin, freeze (team-scoped)
- **Admin** - Full access, exports, audit logs (global)
- **Owner** - Complete control (global)

See [handbook/SECURITY_MODEL.md](handbook/SECURITY_MODEL.md) for details.

### Team Organization
- Multi-team structure (e.g., Engineering, Product)
- Team-scoped questions and pulse data
- Org-level rollups for leadership
- Primary team assignment for users

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

## Documentation

### Getting Started
- [Installation](getting-started/installation.md) - Docker Compose setup
- [Configuration](getting-started/configuration.md) - Environment variables
- [Quick Start](getting-started/quick-start.md) - 5-minute setup
- [Troubleshooting](getting-started/troubleshooting.md) - Common issues

### User Guides
- [User Guide](guides/user/overview.md) - Submit questions, upvote, search
- [Moderator Guide](guides/moderator/overview.md) - Answer, moderate, present
- [Admin Guide](guides/admin/overview.md) - Manage teams, users, settings

### Handbook (Architecture & Operations)
- [Product Vision](handbook/PRODUCT_VISION.md) - Features and design philosophy
- [Data Model](handbook/DATA_MODEL_SNAPSHOT.md) - Database schema and invariants
- [Security Model](handbook/SECURITY_MODEL.md) - RBAC, rate limiting, audit logging
- [Authentication](handbook/AUTHENTICATION.md) - Multi-mode auth (Demo, OAuth)
- [Development](handbook/DEVELOPMENT.md) - Workflow, testing, versioning
- [Operations](handbook/OPERATIONS.md) - Deployment, monitoring, runbooks
- [API Contracts](handbook/API_CONTRACTS/events.md) - OpenAPI spec, SSE events
- [Architecture Decisions](handbook/DECISIONS/) - ADRs

### Deployment
- [Production Deployment](deployment/production.md) - Self-hosting guide
- [Environment Variables](deployment/environment.md) - Configuration reference
- [Monitoring](deployment/monitoring.md) - Health checks and observability

---

## Security

- Multi-tenancy with tenant isolation
- Role-based access control (5 roles)
- Content moderation (local + OpenAI)
- Rate limiting (Redis-based, per-tenant)
- Audit logging (append-only)
- CSRF protection and security headers
- Anonymous pulse responses

See [handbook/SECURITY_MODEL.md](handbook/SECURITY_MODEL.md).

---

## Development

Requires: Docker, Node.js 24, PostgreSQL 16, Redis 7

```bash
# Start services
make up

# Seed demo data
make db-seed

# Run tests
make test

# Validate before push
make validate-ci
```

See [handbook/DEVELOPMENT.md](handbook/DEVELOPMENT.md) for complete workflow.

---

## License

Apache License 2.0 - See [LICENSE](../LICENSE)

---

## Support

- **Documentation**: [https://seanmdalton.github.io/pulsestage/](https://seanmdalton.github.io/pulsestage/)
- **Issues**: [https://github.com/seanmdalton/pulsestage/issues](https://github.com/seanmdalton/pulsestage/issues)
- **Discussions**: [https://github.com/seanmdalton/pulsestage/discussions](https://github.com/seanmdalton/pulsestage/discussions)
- **Changelog**: [CHANGELOG.md](https://github.com/seanmdalton/pulsestage/blob/main/CHANGELOG.md)
