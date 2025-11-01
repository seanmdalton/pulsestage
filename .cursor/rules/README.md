# PulseStage Cursor Rules Organization

This directory contains **technical implementation rules** for AI-assisted development in Cursor. These rules complement the handbook and `.cursorrules` file.

## Three-Tier Rule System

### 1. `docs/handbook/` - WHAT and WHY
**Purpose:** Product vision, architecture decisions, and contracts
- Product vision and personas
- Architecture Decision Records (ADRs)
- API contracts (OpenAPI, SSE events)
- Data model and security model
- Non-functional requirements

**When to reference:** Understanding product intent, architectural constraints, or API contracts.

### 2. `/.cursorrules` - HOW to Develop
**Purpose:** Development workflow and validation requirements
- Pre-flight checks (MANDATORY before user testing)
- Make commands and development process
- Seed data expectations
- Common fixes and troubleshooting
- Validation requirements (lint, test, security)

**When to reference:** Development workflow, user testing, or pushing to git.

### 3. `.cursor/rules/` - TECHNICAL Details
**Purpose:** Implementation patterns, code style, and technical boundaries
- TypeScript and React patterns
- API layering and data flow
- Multi-tenancy and RBAC implementation
- Testing strategies
- Build and deployment details

**When to reference:** Writing code, refactoring, or implementing features.

---

## Rule Files in This Directory

### Foundation
- **00-base.md** - Core priorities, tech stack, boundaries, naming conventions
- **05-runtime-modes.md** - Auth modes (Demo vs OAuth), environment switches

### Technical Implementation
- **10-typescript.md** - TypeScript patterns and best practices
- **20-react-web.md** - React/Vite frontend patterns
- **30-api-express.md** - Express API layering and structure

### Core Architecture
- **32-multi-tenancy.md** - Tenant isolation, team-scoping, RBAC (5 roles)
- **35-validation-and-errors.md** - Input validation and error handling
- **50-security.md** - Security enforcement and reviews

### Data & State
- **15-build-and-seed.md** - Docker builds, seed data (2 teams, 50 users, 12 weeks pulse)
- **45-email-and-queues.md** - Email templates and background jobs
- **75-sse-and-moderation.md** - Server-Sent Events and moderation queue

### Quality & Deployment
- **40-testing.md** - Test strategies and coverage
- **60-ci-and-quality.md** - CI pipeline and quality gates
- **70-docs-sync.md** - Documentation maintenance
- **90-git-and-pr.md** - Git workflow and PR requirements
- **99-working-docs.md** - Working documents directory (temporary analysis/reports)

---

## Alignment Principle

All three rule systems must stay aligned:

```
Handbook defines:          .cursorrules enforces:      .cursor/rules/ implements:
"Team-first architecture"  "Run make preflight"        "Users have primaryTeamId"
"5 roles (viewer...owner)" "RBAC enforcement"          "Role checks at handler level"
"Anonymity by default"     "No userId in responses"    "PulseResponse schema"
```

### When You Find Conflicts
1. **Code is current state** - It may have evolved beyond docs
2. **Propose updates** - Update handbook, .cursorrules, or .cursor/rules/
3. **Ask for approval** - Don't silently resolve conflicts
4. **Update all three** - Keep everything in sync

---

## Quick Reference

| Need to... | Check... |
|------------|----------|
| Understand product vision | `docs/handbook/PRODUCT_VISION.md` |
| Know user roles | `docs/handbook/DECISIONS/ADR-0003-roles.md` |
| Learn data model | `docs/handbook/DATA_MODEL_SNAPSHOT.md` |
| Start development | `/.cursorrules` |
| Run tests before push | `/.cursorrules` (make validate-ci) |
| Implement RBAC | `.cursor/rules/32-multi-tenancy.md` |
| Add SSE event | `.cursor/rules/75-sse-and-moderation.md` |
| Update seed data | `.cursor/rules/15-build-and-seed.md` |
| Write React component | `.cursor/rules/20-react-web.md` |
| Create analysis/report | `/working-docs/` (see `.cursor/rules/99-working-docs.md`) |

---

## For AI Assistants

When working on PulseStage:

1. **Start with handbook** for architectural constraints
2. **Follow .cursorrules** for workflow (preflight, validation, etc.)
3. **Use .cursor/rules/** for implementation patterns
4. **Cross-check all three** before major changes
5. **Propose updates** when you find inconsistencies
6. **Ask for clarity** rather than guessing

**Never:**
- Violate tenant isolation (missing tenantId filters)
- Store userId in PulseResponse (breaks anonymity)
- Change RBAC without handbook update
- Skip pre-flight checks before user testing
- Make breaking API changes without versioning

---

**Remember:** Handbook = WHY, .cursorrules = WORKFLOW, .cursor/rules/ = HOW

