# Validation and Errors

## Zod at boundaries
- Validate HTTP, env, and background job inputs. Keep schemas near boundaries.
- Prefer `.nullable()` for DB `NULL`. Add regression tests for schema changes.

## Error mapping
- Normalize to `DomainError { code, message, details? }`.
- Map to HTTP in centralized middleware. No prod stacks in responses.
