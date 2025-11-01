# SSE Events (Server-Sent Events)

PulseStage uses **Server-Sent Events (SSE)** for real-time push updates. See `/docs/architecture/real-time.md` for full architecture.

## Connection
- **Endpoint:** `GET /events?tenant={tenantSlug}`
- **Auth:** Requires session authentication
- **Tenant:** Resolved from query parameter (SSE can't send custom headers)
- **Format:** `text/event-stream`
- **Heartbeat:** Every 30 seconds to prevent timeout

## Event Types

### Q&A Events (Currently Implemented)

#### `question:created`
Emitted when a participant submits a question.
```json
{
  "type": "question:created",
  "tenantId": "uuid",
  "data": {
    "id": "uuid",
    "body": "Question text",
    "teamId": "uuid",
    "status": "OPEN",
    "upvoteCount": 0,
    "submittedAt": "2025-01-01T00:00:00Z"
  },
  "timestamp": 1234567890
}
```

#### `question:upvoted`
Emitted when a user upvotes a question.
```json
{
  "type": "question:upvoted",
  "tenantId": "uuid",
  "data": {
    "questionId": "uuid",
    "upvoteCount": 5
  },
  "timestamp": 1234567890
}
```

#### `question:answered`
Emitted when a moderator/admin answers a question.
```json
{
  "type": "question:answered",
  "tenantId": "uuid",
  "data": {
    "id": "uuid",
    "status": "ANSWERED",
    "responseText": "Here's the answer..."
  },
  "timestamp": 1234567890
}
```

#### `question:tagged`, `question:untagged`
Emitted when tags are added/removed from a question.

#### `question:pinned`
Emitted when a question is pinned for presenter mode.

#### `question:frozen`
Emitted when the queue is frozen (no new questions accepted).

#### `heartbeat`
Keepalive ping sent every 30 seconds.
```json
{
  "type": "heartbeat",
  "tenantId": "uuid",
  "data": { "timestamp": 1234567890 },
  "timestamp": 1234567890
}
```

## Pulse Events (Not Currently Implemented)

Future consideration: Should pulse responses trigger SSE events for real-time dashboard updates?

Proposed schema for reference (from `pulse.response.recorded.v1.json`):
```json
{
  "event": "pulse.response.recorded.v1",
  "tenantId": "uuid",
  "questionId": "uuid",
  "teamId": "uuid",
  "score": 8,
  "cohortName": "Weekday",
  "submittedAt": "2025-01-01T00:00:00Z"
}
```

## Implementation Reference
- **EventBus:** `/api/src/lib/eventBus.ts`
- **Endpoint:** `/api/src/app.ts` (line ~1947)
- **Client Hook:** `/web/src/hooks/useSSE.ts`

## Versioning
When adding/removing fields, use semver versioning in event type names. Do not break existing consumers.
