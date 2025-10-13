# Testing Rules

## Pyramid
- Unit (Vitest) > Integration (API with test DB) > E2E (Playwright).

## API contracts
- For each route: success, validation failure, forbidden/not found, and cross-tenant leakage.

## E2E critical flows
- Sign-in, create question, upvote, answer, present, export, and moderator queue actions.
- Use data-testids. Run headless in CI.

## Perf/limits
- Add tests for pagination and rate-limit behavior where applicable.
