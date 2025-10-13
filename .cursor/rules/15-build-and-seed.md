# Build, Seed, and Containers

## Golden paths
- **Local dev (`NODE_ENV=development`)**: `docker compose up -d` → demo data **auto-seeds on API startup**
  - Users: alice, bob, moderator, admin
  - Teams: General, Engineering, Product, People
  - Tags: Multiple tags for organization
  - Questions: 8 sample questions (mix of open/answered)
  - **No manual seeding required!**
- **Production**: Use setup wizard on first launch (creates tenant + teams via UI)
- **Testing/CI**: `docker compose exec api npm run db:seed:full` for multi-tenant test data
  - Seeds run **compiled JS** from `dist`. Do not require `ts-node` inside runtime containers.

## Scripts contract (api/package.json)
- `db:seed`, `db:seed:tags`, `db:seed:full`: compiled JS only, used for testing/CI
- Development mode: Auto-seeding in `server.ts` (no manual scripts needed)

## Seeding logic
- **Development**: `server.ts` automatically seeds demo data on startup (idempotent)
- **Production**: Setup wizard creates first tenant and teams
- **Testing**: Manual seed scripts for multi-tenant test scenarios

## Makefile
- Keep `make setup|install|dev|db-seed|validate-ci|lint-fix` aligned with docs. If targets change, update Quick Start + Development docs.
