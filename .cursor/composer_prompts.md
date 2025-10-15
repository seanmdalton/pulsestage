# Composer Prompt Pack

## Implement change with preview
Plan a multi-file diff for <goal>. Respect `.cursor/rules`. Output:
1) plan
2) proposed patches
3) updated tests
4) docs/README changes and links
Stop and ask if touching infra/auth/CSRF/CSP/rate-limits.

## Seed data runbook
Adjust seeds or scripts. Ensure:
- published-image path uses **compiled JS** seeds
- dev path uses dev seed scripts
- README + docs updated
Then propose patches.

## Moderation queue edits
Change moderator UI for <change>. Keep filters and statuses intact. Ensure SSE stays consistent and state refreshes after bulk ops. Include tests and docs updates.
