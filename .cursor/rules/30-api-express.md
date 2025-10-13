# API + Express

## Structure
- router → handler → service → repository (Prisma).

## Validation and types
- Zod per route for request/response. Do not leak ORM entities directly.

## AuthN/Z
- Enforce tenant isolation on every repo call. Pass `tenantId` explicitly.
- Roles enforced server-side. Client only hides affordances.

## Security
- Keep Helmet, CSRF, rate-limit, CSP. Changes require CODEOWNERS review.

## Errors and observability
- Convert thrown errors to `DomainError` in a single error middleware.
- Structured logs with request/correlation IDs. Emit counters for moderation actions, rate-limit hits, auth failures.

## DB
- Use transactions for multi-table mutations. Prefer `findFirst({ where: { id, tenantId }})` to prevent leakage.
