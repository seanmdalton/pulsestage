# PulseStage Base Rules

**See `docs/handbook/` for product vision, architecture decisions, and API/UX contracts.**
**See `/.cursorrules` for development workflow and validation requirements.**

## Priorities
- Correctness > clarity > speed. Small diffs. Always show preview before apply.
- Never change infra/auth/CSRF/CSP/rate-limits without explicit confirmation.
- Use provided scripts: `make setup|dev|lint-fix|validate-ci|db-seed`.

## Local Development Workflow
- **ALWAYS use `make up` or `make dev`** - never manually call `docker compose`
- Both commands use `docker-compose.override.yaml` for local builds (not GitHub images)
- **Web (React/Vite)**: Hot reload enabled via volume mount - changes reflect immediately
- **API (Node/Express)**: Requires restart after code changes: `docker compose restart api`
- Initial startup: Run `make dev` (foreground logs) or `make up` (background)
- Verification checklist after startup:
  1. Wait 10-15 seconds for services to start
  2. Check `docker compose ps` - all services should show "Up"
  3. Test the specific functionality that was changed
  4. Check `make logs` for any startup errors

## Tech stack
- Web: React 19 + TypeScript + Vite + Tailwind.
- API: Node 24 + Express + TypeScript + Prisma + Zod.
- Data: PostgreSQL 16. Cache/queues: Redis 7.
- Tests: Vitest unit/integration; Playwright E2E for critical flows.
- Docs: MkDocs. Update docs when user flows or routes change.

## Boundaries
- `/web` never accesses DB. All I/O via typed API client.
- API layers: router → handler → service → repository (Prisma). No handler→repo shortcuts.
- Pass `tenantId` explicitly at repository boundary. Deny by default if missing.

## Naming
- Files/dirs: kebab-case. Prefer named exports. Default export only for route components.
- Functions `verbNoun`. Booleans `is/has/can`.

## Errors and logging
- Use `DomainError { code, message, details? }`. Centralize HTTP mapping. No prod stack traces.
- Single JSON logger. Never log secrets or PII.

## Security musts (see docs/handbook/SECURITY_MODEL.md)
- Enforce RBAC (viewer/member/moderator/admin/owner) on the server (per ADR-0003).
- Keep CSRF, Helmet, rate-limits, and CSP intact.
- Secrets only from env. Validate env at boot with Zod.
- Preserve anonymity: PulseResponse has NO userId field.

## Tests
- New code includes unit tests. For routes: test 200 + validation 4xx + 403/404 + cross-tenant checks.
- CI gate: block merge on failing tests or lint.

## Git/PR
- Conventional Commits with scope `(web|api|docs|ops)`.
- PR template: Summary, Screenshots, Tests, Risk, Rollback, Docs.
