# Tenancy Model — Invariants

- Every entity includes `tenantId`. **All** queries must filter by `tenantId`.
- Subdomain → `tenantId` is canonical for web; API auth includes tenant claims.
- No cross-tenant joins or searches. Aggregations are per-tenant.
- Migrations must preserve `tenantId` and isolation.
- Logs/metrics include `tenantId` and `requestId`.
