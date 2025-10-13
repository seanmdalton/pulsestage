# Runtime Modes

## Auth and modes
- Dev: prefer **Demo Mode** users. Remove mock SSO unless strictly needed.
- Prod-like: OAuth (e.g., GitHub/Google) via env. Never hardcode provider secrets.

## Env switches
- `NODE_ENV=development`: demo users, local email sink.
- `NODE_ENV=production`: OAuth configured, SMTP provider required.

## Docs hygiene
- When toggling auth paths, update README and docs nav. Link Security + Development pages.
