# Multi-Tenancy, Team-Scoping, and RBAC

## Tenant isolation (ABSOLUTE)
- Every query includes `tenantId` constraint at repository boundary.
- Deny-by-default when `tenantId` is missing or mismatched.
- NO cross-tenant joins or searches ever.
- See `docs/handbook/TENANCY_MODEL.md` for invariants.

## Team-scoping (PRIMARY ARCHITECTURE)
- **Team-first with org rollups**: Users have `primaryTeamId`
- Questions are team-scoped via `question.teamId`
- Pulse surveys and responses are team-scoped via `pulseInvite.teamId` and `pulseResponse.teamId`
- "All Teams" views aggregate across teams (not a separate data store)
- See `docs/handbook/DATA_MODEL_SNAPSHOT.md` for data model details.

## Roles (per ADR-0003)
- **viewer**: Read-only access to questions and pulse data
- **member**: Can submit questions, respond to pulse, upvote
- **moderator**: Team-scoped moderation rights (via TeamMembership)
- **admin**: Tenant-wide administration and moderation
- **owner**: Full tenant control including settings and user management
- Moderator queue actions require moderator/admin for the question's team.

## Tests
- For each route: 200 + 4xx validation + 403/404 + cross-tenant leakage tests.
- Test team-scoping: Users should only see data for their team or "All Teams" aggregate.
