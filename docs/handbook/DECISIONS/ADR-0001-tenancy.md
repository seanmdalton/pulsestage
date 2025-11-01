# ADR-0001 — Subdomain-per-tenant routing
- Decision: Subdomain is canonical for tenant resolution; every entity carries tenantId.
- Consequences: Simpler isolation, clear CORS rules, easy custom domains later.
