# PulseStage Handbook

This handbook is the **source of truth** for product vision, architecture decisions, and operational contracts. It guides both human developers and AI assistants working on PulseStage.

## Purpose

The handbook ensures:
1. **Consistency** - All code aligns with documented architecture
2. **Clarity** - Decisions are documented with context (ADRs)
3. **Contracts** - APIs, events, and UX are stable and predictable
4. **Onboarding** - New contributors understand "why" and "how"

## Structure

### Core Documents
- **PRODUCT_VISION.md** - 1-page problem/solution/principles
- **PERSONAS.md** - 4 key user types and their needs
- **USE-CASES.md** - Critical user flows with success metrics
- **DATA_MODEL_SNAPSHOT.md** - Entity relationships, invariants, and schema reference
- **TENANCY_MODEL.md** - Multi-tenant isolation rules (absolute)
- **SECURITY_MODEL.md** - Auth, roles, anonymity, audit

### Technical Contracts
- **API_CONTRACTS/** - OpenAPI spec, SSE events, versioning
- **UX_CONTRACTS.md** - Key screens, states, URLs, accessibility
- **NONFUNCTIONAL.md** - SLOs, rate limits, retention policies
- **TEST_STRATEGY.md** - Coverage targets, test types

### Operations
- **OPERATIONS.md** - Runbook, probes, backups, dev environment
- **RELEASE_CHECKLIST.md** - Pre-deployment validation

### Decisions
- **DECISIONS/** - Architecture Decision Records (ADRs)
  - ADR-0001: Subdomain-per-tenant routing
  - ADR-0002: SSE for realtime (not WebSockets)
  - ADR-0003: Fixed role model (admin/moderator/participant)

## Key Principles

### 1. Team-First Architecture
PulseStage is **team-first with organizational rollups**:
- Users have a `primaryTeamId`
- Pulse surveys and Q&A are team-scoped
- "All Teams" views aggregate across teams
- Moderators have team-scoped access

### 2. Tenant Isolation (Absolute)
- Every entity has `tenantId`
- ALL queries filter by `tenantId`
- No cross-tenant joins or searches
- Migrations preserve isolation

### 3. Anonymity by Default
- Pulse responses have NO `userId` field
- Q&A questions are anonymous
- Aggregates only shown when `n >= threshold`

### 4. Contracts > Code
- OpenAPI spec is canonical for API
- Event schemas are versioned (semver)
- Database invariants are enforced
- UX contracts define URLs and states

## Alignment with .cursorrules

The handbook defines **what and why**. The `.cursorrules` file defines **how to develop**:
- Handbook: "Tenant isolation is absolute"
- Rules: "Run `make preflight` before user testing"

Both must stay in sync. Conflicts should be resolved by discussing with the project maintainer.

## Usage Guidelines

### For Human Developers
1. Read PRODUCT_VISION and PERSONAS first
2. Check DATA_MODEL_SNAPSHOT before schema changes
3. Review ADRs when making architectural decisions
4. Update handbook when adding features

### For AI Assistants
1. Reference handbook for intent and constraints
2. Follow .cursorrules for development workflow
3. Propose handbook updates when finding inconsistencies
4. Ask user to resolve conflicts between handbook and code

### When Code Diverges from Handbook
1. Determine which is correct (usually code wins for current state)
2. Update handbook to reflect reality
3. Document the change in relevant ADR or commit message
4. Notify maintainer if it represents an architectural shift

## Maintenance

- **Update frequency**: With every significant feature or architectural change
- **Owner**: Project maintainer approves all handbook changes
- **Format**: Markdown, concise, no fluff
- **Versioning**: Track in git alongside code

## Quick Reference

- **Full API docs**: `/api/openapi.yaml` (served at `GET /docs` in dev)
- **Database schema**: `/api/prisma/schema.prisma`
- **SSE implementation**: `/api/src/lib/eventBus.ts`
- **Development rules**: `/.cursorrules`
- **Architecture docs**: `/docs/architecture/`

