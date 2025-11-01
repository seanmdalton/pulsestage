# Release Checklist (demo/prod)

- [ ] Migrations applied; backfill scripts run
- [ ] Feature flags set (PULSE_ENABLED, channels)
- [ ] Secrets rotated (ADMIN_KEY, SSO, SMTP)
- [ ] /ready green; SSE heartbeat confirmed
- [ ] CORS/CSP verified for domains
- [ ] Backups enabled; restore tested
- [ ] Docs updated (vision/use-cases/swagger/openapi/events)
