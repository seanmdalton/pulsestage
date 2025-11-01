# ADR-0002 — Realtime via SSE
- Decision: Use SSE for live updates; WebSocket reserved for future bi-directional moderation.
- Consequences: Simpler infra and proxies; heartbeat every 20–30s.