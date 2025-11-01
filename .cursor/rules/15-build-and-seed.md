# Build, Seed, and Containers

## Golden paths
- **Local dev (`NODE_ENV=development`)**: Use `make db-seed` for clean, comprehensive demo data
  - Users: 50 total (4 login: admin, alice, bob, moderator + 46 dummy users)
  - Teams: Engineering, Product (2 teams, team-first architecture)
  - Questions: 36 total (10 open + 10 answered per team)
  - Pulse: 12 weeks historical data (~800 responses, 81.6% participation)
  - Tags: Multiple tags for organization
  - **Command:** `make db-seed` (idempotent, always relative to "now")
- **Production**: Use setup wizard on first launch (creates tenant + teams via UI)
- **Testing/CI**: `make db-seed` for consistent test data

## Build System
- **Local Docker builds**: `make build` creates `pulsestage-api:latest`, `pulsestage-web:latest`
- **docker-compose.yaml**: References `ghcr.io` images (for open-source users)
- **docker-compose.override.yaml**: Overrides with local tags (for local development)
- **Security scanning**: `make security` runs Trivy on LOCAL builds (not registry images)

## Seeding logic
- **Development**: Use `make db-seed` for clean state (not auto-seeded)
- **Production**: Setup wizard creates first tenant and teams
- **Testing**: `make db-seed` for multi-tenant test scenarios
- **Seed script**: `/api/scripts/reset-and-seed-all.ts` (run via make command)

## Makefile
- Keep `make setup|install|dev|db-seed|validate-ci|lint-fix` aligned with docs. If targets change, update Quick Start + Development docs.
