# Non-Functional Requirements

## SLOs (demo)
- API p95 latency < 400 ms
- SSE reconnect < 3 s
- Error rate < 0.5% on happy paths

## Rate Limits
- Per-tenant & per-IP to prevent noisy neighbors

## Retention
- Pulse invites: 90 days
- Pulse aggregates & AMA content: configurable per-tenant
