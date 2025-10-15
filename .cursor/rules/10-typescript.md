# TypeScript Rules

## Strictness
- `"strict": true` everywhere. Avoid `any` and non-null `!`. Refine with Zod/guards.

## Data validation
- Validate all external inputs at boundaries with Zod. Export types via `z.infer`.
- Prefer `.nullable()` for DB `NULL` rather than `.optional()` where applicable.

## Async and errors
- No floating promises. Use `Promise.allSettled` for batches.
- Library code returns `Result<T,E>` or throws consistently. HTTP handlers may throw and rely on error middleware to map to `DomainError`.

## Imports and lint
- Absolute imports via tsconfig paths within each package. No deep cross-package imports.
- Use repo ESLint + Prettier. Run `make lint-fix` before large diffs.
