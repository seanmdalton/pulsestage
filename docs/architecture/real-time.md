# Real-Time Architecture

PulseStage uses **Server-Sent Events (SSE)** to provide real-time updates for questions, answers, and moderation actions. This document explains the implementation, design decisions, and best practices.

## Why Server-Sent Events?

We chose SSE over WebSockets for several reasons:

| Feature | SSE | WebSockets |
|---------|-----|------------|
| **Direction** | Server → Client (one-way) | Bidirectional |
| **Protocol** | HTTP | TCP (with HTTP upgrade) |
| **Reconnection** | Automatic | Manual implementation |
| **Browser Support** | Excellent | Excellent |
| **Firewall/Proxy** | Works everywhere | Sometimes blocked |
| **Complexity** | Simple | More complex |
| **Use Case** | Push updates | Chat, real-time bidirectional |

**Perfect for PulseStage:**
- We only need server→client updates (questions, upvotes, answers)
- Automatic reconnection is built-in
- Simpler implementation and debugging
- Better compatibility with corporate firewalls
- HTTP-based = works with existing infrastructure

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  EventSource('/sse?tenantId=acme')                     │
│    ↓                                                    │
│  • Auto-reconnect on disconnect                        │
│  • Receives events: question:created, upvoted, etc.    │
│  • Updates React state → UI re-renders                 │
└─────────────────────┬──────────────────────────────────┘
                      │ HTTP GET /sse
                      │ (Long-lived connection)
                      ▼
┌────────────────────────────────────────────────────────┐
│                   API Server (Express)                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │          SSE Endpoint (/sse)                    │  │
│  │  • Resolve tenant (from query param)           │  │
│  │  • Register client with EventBus               │  │
│  │  • Keep connection open                        │  │
│  │  • Send heartbeat every 30s                    │  │
│  └─────────────────────────────────────────────────┘  │
│                      │                                  │
│                      ▼                                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │           EventBus (Singleton)                  │  │
│  │  • Map<tenantId, SSEClient[]>                  │  │
│  │  • addClient(tenantId, response)               │  │
│  │  • removeClient(tenantId, clientId)            │  │
│  │  • publish(SSEEvent) → all tenant clients      │  │
│  │  • sendHeartbeat() every 30s                   │  │
│  └─────────────────────────────────────────────────┘  │
│                      ▲                                  │
│                      │ eventBus.publish()              │
│  ┌─────────────────────────────────────────────────┐  │
│  │        API Route Handlers                       │  │
│  │  • POST /questions → publish('question:created')│  │
│  │  • POST /upvote → publish('question:upvoted')  │  │
│  │  • POST /answer → publish('question:answered') │  │
│  │  • POST /tag → publish('question:tagged')      │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## Implementation Details

### Server-Side: EventBus

Central singleton that manages SSE connections and broadcasts events.

**File:** `api/src/lib/eventBus.ts`

```typescript
import { Response } from 'express';

export type SSEEventType =
  | 'question:created'
  | 'question:upvoted'
  | 'question:answered'
  | 'question:tagged'
  | 'question:untagged'
  | 'question:pinned'
  | 'question:frozen'
  | 'heartbeat';

export interface SSEEvent {
  type: SSEEventType;
  tenantId: string;
  data: any;
  timestamp: number;
}

export interface SSEClient {
  id: string;
  tenantId: string;
  res: Response;
  connectedAt: number;
}

class EventBus {
  // Per-tenant client tracking
  private clients: Map<string, SSEClient[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionCounter = 0;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Add a client connection for a specific tenant
   */
  addClient(tenantId: string, res: Response): string {
    const clientId = `client-${++this.connectionCounter}-${Date.now()}`;
    const client: SSEClient = {
      id: clientId,
      tenantId,
      res,
      connectedAt: Date.now(),
    };

    if (!this.clients.has(tenantId)) {
      this.clients.set(tenantId, []);
    }

    this.clients.get(tenantId)!.push(client);

    console.log(`📡 SSE: Client ${clientId} connected to tenant ${tenantId}`);
    return clientId;
  }

  /**
   * Remove a client connection
   */
  removeClient(tenantId: string, clientId: string) {
    const tenantClients = this.clients.get(tenantId);
    if (!tenantClients) return;

    const index = tenantClients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      tenantClients.splice(index, 1);

      if (tenantClients.length === 0) {
        this.clients.delete(tenantId);
      }

      console.log(`📡 SSE: Client ${clientId} disconnected from tenant ${tenantId}`);
    }
  }

  /**
   * Publish an event to all clients in a specific tenant
   */
  publish(event: SSEEvent) {
    const tenantClients = this.clients.get(event.tenantId);
    if (!tenantClients || tenantClients.length === 0) {
      return; // No clients to send to
    }

    const eventData = `data: ${JSON.stringify(event)}\n\n`;
    const deadClients: string[] = [];

    for (const client of tenantClients) {
      try {
        client.res.write(eventData);
      } catch (error) {
        // Connection is dead, mark for removal
        deadClients.push(client.id);
      }
    }

    // Clean up dead connections
    for (const clientId of deadClients) {
      this.removeClient(event.tenantId, clientId);
    }
  }

  /**
   * Send heartbeat to all connected clients
   */
  private sendHeartbeat() {
    const now = Date.now();

    for (const [tenantId, tenantClients] of this.clients.entries()) {
      const heartbeatEvent: SSEEvent = {
        type: 'heartbeat',
        tenantId,
        data: { timestamp: now },
        timestamp: now,
      };

      this.publish(heartbeatEvent);
    }
  }

  /**
   * Start periodic heartbeat
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 30 seconds
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    const tenantMetrics: Record<string, number> = {};
    for (const [tenantId, clients] of this.clients.entries()) {
      tenantMetrics[tenantId] = clients.length;
    }

    return {
      totalConnections: this.getTotalClientCount(),
      tenantConnections: tenantMetrics,
      tenantCount: this.clients.size,
    };
  }
}

// Singleton instance
export const eventBus = new EventBus();
```

### Server-Side: SSE Endpoint

Handles client connections and maintains open connections.

**File:** `api/src/app.ts` (excerpt)

```typescript
import { eventBus } from './lib/eventBus.js';
import { createTenantResolverMiddleware } from './middleware/tenantResolver.js';

// SSE endpoint for real-time updates
app.get('/sse', async (req: Request, res: Response) => {
  // Resolve tenant (from query parameter)
  let tenantSlug = req.query.tenantId as string || 'default';

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }
  });

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Register client with EventBus
  const clientId = eventBus.addClient(tenant.id, res);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    tenantId: tenant.id,
    timestamp: Date.now()
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    eventBus.removeClient(tenant.id, clientId);
  });
});
```

### Server-Side: Publishing Events

Route handlers publish events after database updates.

```typescript
// Example: Question creation
app.post('/questions', async (req: Request, res: Response) => {
  // ... validate input ...

  const question = await prisma.question.create({
    data: {
      body: req.body.body,
      status: 'OPEN',
      teamId: req.body.teamId
    }
  });

  // Broadcast event to all connected clients
  eventBus.publish({
    type: 'question:created',
    tenantId: getTenantContext().tenantId,
    data: question,
    timestamp: Date.now()
  });

  res.json(question);
});

// Example: Upvote
app.post('/questions/:id/upvote', async (req: Request, res: Response) => {
  // ... validate and create upvote ...

  const question = await prisma.question.update({
    where: { id: req.params.id },
    data: { upvotes: { increment: 1 } }
  });

  eventBus.publish({
    type: 'question:upvoted',
    tenantId: getTenantContext().tenantId,
    data: { questionId: question.id, upvotes: question.upvotes },
    timestamp: Date.now()
  });

  res.json(question);
});
```

### Client-Side: SSEContext

React context that manages SSE connection and distributes events.

**File:** `web/src/contexts/SSEContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState, useRef } from 'react';

interface SSEContextType {
  connected: boolean;
  lastEvent: SSEEvent | null;
}

const SSEContext = createContext<SSEContextType>({
  connected: false,
  lastEvent: null
});

export function SSEProvider({ children, tenantId }: { 
  children: React.ReactNode; 
  tenantId: string;
}) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource(
      `${API_URL}/sse?tenantId=${tenantId}`
    );

    eventSource.onopen = () => {
      console.log('📡 SSE: Connected');
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Ignore heartbeats (handled internally)
        if (data.type === 'heartbeat') {
          return;
        }

        console.log('📡 SSE: Event received', data.type);
        setLastEvent(data);
      } catch (error) {
        console.error('📡 SSE: Failed to parse event', error);
      }
    };

    eventSource.onerror = () => {
      console.log('📡 SSE: Disconnected, will reconnect...');
      setConnected(false);
      // EventSource automatically reconnects
    };

    eventSourceRef.current = eventSource;

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [tenantId]);

  return (
    <SSEContext.Provider value={{ connected, lastEvent }}>
      {children}
    </SSEContext.Provider>
  );
}

export const useSSE = () => useContext(SSEContext);
```

### Client-Side: Using SSE Events

Components subscribe to SSE events and update state.

```typescript
import { useSSE } from '../contexts/SSEContext';
import { useEffect } from 'react';

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const { lastEvent } = useSSE();

  // Load initial questions
  useEffect(() => {
    fetchQuestions().then(setQuestions);
  }, []);

  // Handle SSE events
  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case 'question:created':
        // Add new question to list
        setQuestions(prev => [lastEvent.data, ...prev]);
        break;

      case 'question:upvoted':
        // Update upvote count
        setQuestions(prev => prev.map(q => 
          q.id === lastEvent.data.questionId
            ? { ...q, upvotes: lastEvent.data.upvotes }
            : q
        ));
        break;

      case 'question:answered':
        // Move to answered list or update status
        setQuestions(prev => prev.map(q =>
          q.id === lastEvent.data.id
            ? { ...q, status: 'ANSWERED', responseText: lastEvent.data.responseText }
            : q
        ));
        break;

      case 'question:tagged':
        // Update tags
        setQuestions(prev => prev.map(q =>
          q.id === lastEvent.data.questionId
            ? { ...q, tags: lastEvent.data.tags }
            : q
        ));
        break;
    }
  }, [lastEvent]);

  return (
    <div>
      {questions.map(q => <QuestionCard key={q.id} question={q} />)}
    </div>
  );
}
```

## Event Types

### question:created

New question submitted.

```json
{
  "type": "question:created",
  "tenantId": "acme-tenant-id",
  "data": {
    "id": "question-uuid",
    "body": "What is the roadmap for Q2?",
    "upvotes": 0,
    "status": "OPEN",
    "teamId": "engineering-uuid",
    "createdAt": "2025-10-08T10:30:00Z"
  },
  "timestamp": 1696765800000
}
```

### question:upvoted

Question received an upvote.

```json
{
  "type": "question:upvoted",
  "tenantId": "acme-tenant-id",
  "data": {
    "questionId": "question-uuid",
    "upvotes": 15
  },
  "timestamp": 1696765800000
}
```

### question:answered

Moderator answered a question.

```json
{
  "type": "question:answered",
  "tenantId": "acme-tenant-id",
  "data": {
    "id": "question-uuid",
    "responseText": "We're planning to launch feature X in Q2.",
    "respondedAt": "2025-10-08T10:35:00Z",
    "status": "ANSWERED"
  },
  "timestamp": 1696766100000
}
```

### question:tagged

Tag added to question.

```json
{
  "type": "question:tagged",
  "tenantId": "acme-tenant-id",
  "data": {
    "questionId": "question-uuid",
    "tags": [
      { "id": "tag-1", "name": "Product", "color": "#3B82F6" },
      { "id": "tag-2", "name": "Roadmap", "color": "#10B981" }
    ]
  },
  "timestamp": 1696766200000
}
```

### question:pinned

Question pinned by moderator.

```json
{
  "type": "question:pinned",
  "tenantId": "acme-tenant-id",
  "data": {
    "questionId": "question-uuid",
    "isPinned": true,
    "pinnedBy": "user-uuid",
    "pinnedAt": "2025-10-08T10:40:00Z"
  },
  "timestamp": 1696766400000
}
```

### question:frozen

Question frozen (no more upvotes/responses).

```json
{
  "type": "question:frozen",
  "tenantId": "acme-tenant-id",
  "data": {
    "questionId": "question-uuid",
    "isFrozen": true,
    "frozenBy": "user-uuid",
    "frozenAt": "2025-10-08T10:45:00Z"
  },
  "timestamp": 1696766700000
}
```

### heartbeat

Keepalive signal (sent every 30 seconds).

```json
{
  "type": "heartbeat",
  "tenantId": "acme-tenant-id",
  "data": {
    "timestamp": 1696766900000
  },
  "timestamp": 1696766900000
}
```

## Connection Management

### Automatic Reconnection

EventSource automatically reconnects on disconnect:

```typescript
// Browser's EventSource handles reconnection
const eventSource = new EventSource('/sse?tenantId=acme');

eventSource.onerror = () => {
  console.log('Disconnected, will reconnect automatically...');
  // EventSource retries with exponential backoff
};
```

**Retry Behavior:**
- Retry 1: 1 second
- Retry 2: 2 seconds
- Retry 3: 4 seconds
- Max: 10 seconds

### Dead Connection Cleanup

Server detects and removes dead connections:

```typescript
publish(event: SSEEvent) {
  const deadClients: string[] = [];

  for (const client of tenantClients) {
    try {
      client.res.write(eventData);
    } catch (error) {
      // Connection is dead
      deadClients.push(client.id);
    }
  }

  // Clean up dead connections
  for (const clientId of deadClients) {
    this.removeClient(event.tenantId, clientId);
  }
}
```

### Heartbeat Mechanism

Server sends heartbeat every 30 seconds:

- Keeps connection alive through proxies/firewalls
- Helps detect dead connections
- Client can ignore heartbeat events

```typescript
setInterval(() => {
  eventBus.publish({
    type: 'heartbeat',
    tenantId: tenantId,
    data: { timestamp: Date.now() },
    timestamp: Date.now()
  });
}, 30000); // 30 seconds
```

## Tenant Isolation

SSE connections are tenant-scoped:

- Each client connects to specific tenant
- EventBus maintains per-tenant connection lists
- Events only sent to clients in same tenant
- No cross-tenant event leakage

```typescript
// Client specifies tenant in connection
GET /sse?tenantId=acme

// Server stores tenant with connection
eventBus.addClient('acme-tenant-id', response);

// Events filtered by tenant
eventBus.publish({
  tenantId: 'acme-tenant-id', // Only sent to acme clients
  type: 'question:created',
  data: question
});
```

## Performance Considerations

### Connection Limits

Each SSE connection holds one HTTP connection open:

- Modern browsers: 6-8 connections per domain
- Server: Depends on Node.js ulimit (default: 1024)
- Recommendation: Use HTTP/2 for multiplexing

### Memory Usage

Each client connection consumes:
- ~50KB per connection (HTTP overhead)
- ~10KB per client object (JavaScript)
- **Total**: ~60KB per connection

**For 1,000 concurrent clients:**
- Memory: ~60MB (negligible)
- File descriptors: 1,000 (monitor ulimit)

### Scaling Beyond Single Instance

**Current limitation**: SSE connections are in-memory per API instance.

**Solution**: Use Redis Pub/Sub for multi-instance broadcasting:

```typescript
// Publisher (any API instance)
await redis.publish('sse-events', JSON.stringify(event));

// Subscriber (all API instances)
redis.subscribe('sse-events');
redis.on('message', (channel, message) => {
  const event = JSON.parse(message);
  eventBus.publish(event); // Broadcast to local clients
});
```

This allows horizontal scaling with load balancer.

## Security Considerations

### Authentication

SSE endpoint validates tenant but doesn't require authentication:
- Read-only events (safe to broadcast)
- No sensitive data in events
- Tenant isolation prevents cross-tenant access

**Future**: Add authentication if needed:
```typescript
app.get('/sse', requireAuth, async (req, res) => {
  // Only authenticated users can connect
});
```

### Rate Limiting

SSE connections are exempt from rate limiting:
- Long-lived connections
- Not counted as separate requests
- Heartbeats don't count towards rate limit

### CORS

SSE respects CORS headers:
```typescript
res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

## Monitoring & Debugging

### Connection Metrics

```typescript
// Get current metrics
const metrics = eventBus.getMetrics();

console.log({
  totalConnections: metrics.totalConnections,
  tenantConnections: metrics.tenantConnections,
  tenantCount: metrics.tenantCount
});

// Example output:
// {
//   totalConnections: 156,
//   tenantConnections: {
//     'acme-tenant-id': 89,
//     'widgets-tenant-id': 67
//   },
//   tenantCount: 2
// }
```

### Health Dashboard (Future)

Add SSE metrics to health dashboard:
- Active connections per tenant
- Connection duration
- Event publishing rate
- Heartbeat health

### Logging

Development logs for debugging:

```typescript
console.log('📡 SSE: Client connected', clientId);
console.log('📡 SSE: Event published', event.type);
console.log('📡 SSE: Client disconnected', clientId);
```

Production: Use structured logging (JSON).

## Troubleshooting

### "EventSource failed" Error

**Cause**: CORS or network issue

**Solution**:
1. Check CORS headers on `/sse` endpoint
2. Verify tenant exists
3. Check network tab for HTTP errors

### Events Not Received

**Cause**: Client not subscribed to events

**Solution**:
1. Verify SSE connection is established (check `connected` state)
2. Check browser console for event logs
3. Verify event type matches handler

### Connection Drops Frequently

**Cause**: Proxy/firewall closing idle connections

**Solution**:
1. Reduce heartbeat interval (currently 30s)
2. Add proxy configuration for long-lived connections
3. Use HTTP/2 (better at keeping connections alive)

### High Memory Usage

**Cause**: Too many SSE connections

**Solution**:
1. Check `eventBus.getMetrics()` for connection count
2. Implement connection limits per tenant
3. Monitor Node.js memory usage
4. Scale horizontally with Redis Pub/Sub

## Future Enhancements

### 1. Redis Pub/Sub for Multi-Instance

Enable horizontal scaling:
- Broadcast events via Redis
- All API instances subscribe
- Each instance handles own SSE clients

### 2. Binary Protocol

Consider using WebSocket for efficiency:
- Smaller payload size
- Lower latency
- Bidirectional (for future features)

### 3. Event Filtering

Allow clients to subscribe to specific events:
```typescript
GET /sse?tenantId=acme&events=question:created,question:upvoted
```

### 4. Compression

Compress SSE payloads for bandwidth savings:
```typescript
res.setHeader('Content-Encoding', 'gzip');
```

## Related Documentation

- [System Design](system-design.md) - Overall architecture
- [Multi-Tenancy Architecture](multi-tenancy.md) - Tenant isolation
- [API Reference](../api/overview.md) - API endpoints

## References

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [SSE Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
