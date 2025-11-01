# SSE and Moderator Queue

## SSE (Server-Sent Events)
- **Architecture**: See `docs/handbook/API_CONTRACTS/events.md` and `/docs/architecture/real-time.md`
- **Endpoint**: `GET /events?tenant={tenantSlug}` (requires auth)
- **Event types**: question:created, question:upvoted, question:answered, question:tagged, question:untagged, question:pinned, question:frozen, heartbeat
- **Implementation**: EventBus singleton in `/api/src/lib/eventBus.ts`
- **Client**: Single subscription hook `/web/src/hooks/useSSE.ts`
- Keep types shared between API and UI. Clean up listeners on unmount.
- Heartbeat every 30 seconds to prevent timeout.

## Queue UX contract
- **Team-scoped**: `/:teamSlug/questions` or `/all/questions` (org rollup)
- Lists **open/answered/archived** with filters for team, pinned, frozen, tags, and status.
- Moderators see only their assigned teams; admins see all teams.
- Bulk actions must refresh state after success. Approve removes from list; reject deletes with confirm.
- SSE updates reflect real-time changes to question state.
