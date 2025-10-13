# Build, Seed, and Containers

## Golden paths
- **Prod-like / published images**: `docker compose up -d` → `docker compose exec api npm run db:seed:full`.
  - Seeds run **compiled JS** from `dist`. Do not require `ts-node` inside runtime containers.
- **Local dev**: `docker compose -f docker-compose.dev.yaml up -d` → `... exec api npm run db:seed:dev && npm run db:seed:tags:dev`.

## Scripts contract (api/package.json)
- `db:seed`, `db:seed:tags`: compiled JS only.
- `db:seed:dev`, `db:seed:tags:dev`: dev-only.

## Makefile
- Keep `make setup|install|dev|db-seed|validate-ci|lint-fix` aligned with docs. If targets change, update Quick Start + Development docs.
