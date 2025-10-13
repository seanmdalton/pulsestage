# CI, Tests, and Quality Gates

## Local parity
- `make validate-ci` must pass before proposing large diffs.

## Seeds in CI
- Use compiled seeds for fixtures to mirror published-image flow.

## Lint/format
- ESLint + Prettier are non-optional. Block red merges.
