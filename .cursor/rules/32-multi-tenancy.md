# Multi-Tenancy and RBAC

## Tenant isolation
- Every query includes `tenantId` constraint at repository boundary.
- Deny-by-default when `tenantId` is missing or mismatched.

## Roles
- viewer/member/moderator/admin/owner enforced on server.
- Moderator queue actions require moderator/admin for the question’s team.

## Tests
- For each route: 200 + 4xx validation + 403/404 + cross-tenant leakage tests.
