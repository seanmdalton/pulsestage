# Security Rules

## Musts
- RBAC strictly enforced. Do not broaden scopes.
- CSRF on state-changing routes. Rate-limit auth and posting routes.
- Secure cookies. SameSite Lax/Strict as configured.

## Secrets and config
- Only from env. Validate at boot. No secrets in logs.

## Reviews
- Any change to auth, CSRF, rate-limits, CSP, or mail sending requires CODEOWNERS review.
