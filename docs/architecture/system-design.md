# System Design

This document provides a comprehensive overview of PulseStage's architecture, design decisions, and technical implementation.

## Overview

PulseStage is a production-ready, multi-tenant Q&A platform designed for organizational town halls and all-hands meetings. It follows a **three-tier architecture** with modern best practices for security, scalability, and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                        Users/Clients                         │
│              (Browsers, Mobile, Integrations)                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│                  React 19 + TypeScript + Vite                │
│     • Real-time SSE • Dark Mode • Responsive Design         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                 Node.js 24 + Express + TypeScript            │
│   • RBAC Middleware • Multi-tenant Context • Rate Limiting   │
│   • CSRF Protection • Audit Logging • SSE Broadcasting       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌─────────────────────┐
│      Data Layer          │  │    Cache Layer      │
│  PostgreSQL 16 + Prisma  │  │      Redis 7        │
│  • Multi-tenant          │  │  • Rate Limits      │
│  • Full-text Search      │  │  • Sessions         │
│  • Audit Logs            │  │                     │
└──────────────────────────┘  └─────────────────────┘
```

## Core Design Principles

### 1. **Security First**
Every layer implements defense-in-depth:
- Authentication & authorization at multiple layers
- CSRF protection on all state-changing operations
- Comprehensive audit logging
- Security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting per tenant and per IP

### 2. **Multi-Tenancy by Default**
Complete tenant isolation:
- Automatic tenant context injection via middleware
- Prisma middleware enforces tenant filtering on all queries
- No cross-tenant data leakage
- Per-tenant configuration and settings

### 3. **Real-Time First**
Built for live collaboration:
- Server-Sent Events (SSE) for instant updates
- Per-tenant event broadcasting
- Automatic connection management and cleanup
- Heartbeat mechanism for connection health

### 4. **Developer Experience**
Optimized for maintainability:
- Type safety throughout (TypeScript strict mode)
- Comprehensive test coverage (243+ tests)
- Automated CI/CD with security scanning
- Docker-based development workflow

## System Components

### Frontend (React Application)

**Technology Stack:**
- React 19 with Hooks and Context API
- TypeScript 5.9 (strict mode)
- Tailwind CSS for styling
- Vite 7 for build tooling
- React Router 7 for navigation

**Key Features:**
- Component-based architecture with reusable UI components
- Context providers for state management (Auth, Team, Theme, SSE)
- Real-time updates via EventSource (SSE)
- Dark mode with system preference detection
- Responsive design (mobile-first)

**State Management:**
```
AuthContext → User authentication state
TeamContext → Current team and available teams
ThemeContext → Dark/light mode preference
SSEContext → Real-time event connection
```

### Backend (API Server)

**Technology Stack:**
- Node.js 24 LTS
- Express 4 web framework
- TypeScript 5.9 (strict mode)
- Prisma ORM for database access
- Redis for caching and sessions

**Middleware Stack:**
```
Request Flow:
  ┌─────────────────────────────────────────┐
  │  1. CORS & Security Headers (Helmet)   │
  │  2. Body Parser & Cookie Parser         │
  │  3. Tenant Resolver                     │
  │  4. Session Management                  │
  │  5. Mock Auth (dev) / SSO (prod)       │
  │  6. CSRF Token Validation              │
  │  7. Rate Limiting                       │
  │  8. Permission Check (RBAC)            │
  │  9. Team Scoping (for moderators)      │
  │  10. Route Handler                      │
  │  11. Audit Logging (on write ops)      │
  │  12. SSE Event Broadcasting            │
  └─────────────────────────────────────────┘
```

### Database (PostgreSQL)

**Schema Design:**
- Normalized schema with proper foreign keys
- Tenant-scoped data model (all tables include `tenantId`)
- Full-text search with GIN indexes and tsvector
- Audit log as append-only table
- Cascading deletes for data integrity

**Key Tables:**
- `Tenant` - Organization/tenant isolation
- `Team` - Departments or groups within a tenant
- `Question` - User-submitted questions
- `User` - User accounts (linked to SSO)
- `TeamMembership` - User roles per team
- `Tag` - Question categorization
- `Upvote` - Individual upvote tracking (not just counts)
- `AuditLog` - Immutable log of all admin actions

**Indexing Strategy:**
- Primary keys (UUID)
- Foreign key indexes (automatic cascades)
- Composite indexes: `(tenantId, status)`, `(tenantId, teamId)`
- Full-text search: GIN index on `search_vector` column
- Audit log: Descending index on `(tenantId, createdAt)`

### Cache Layer (Redis)

**Usage:**
- **Rate Limiting**: Sliding window counters per tenant+IP
- **Session Storage**: Server-side session data
- **Future**: Cache frequently accessed data (teams, tags)

**Configuration:**
- Graceful degradation (memory fallback if Redis unavailable)
- TTL-based expiration
- Connection pooling

## Key Architectural Patterns

### 1. Multi-Tenant Context Pattern

Every request carries a tenant context:

```typescript
// Tenant resolution (from subdomain, header, or session)
Request → Tenant Resolver Middleware → AsyncLocalStorage

// Automatic tenant filtering in Prisma
Prisma Middleware → Inject tenantId in all queries → Database
```

**Benefits:**
- No manual tenant filtering in application code
- Impossible to forget tenant checks
- Centralized tenant context management

### 2. Role-Based Access Control (RBAC)

Five-role hierarchy with permissions:

```
Viewer → Member → Moderator → Admin → Owner
  ↓        ↓          ↓          ↓       ↓
 Read    Submit    Answer+    Global   Full
         Upvote    Tag+Pin     Admin   Control
                   (Team-
                   Scoped)
```

**Permission Enforcement:**
- Middleware: `requirePermission('question.answer')`
- Route-level: `requireRole('admin')`
- Frontend: Conditional UI rendering based on role

**Team Scoping:**
- Moderators limited to assigned teams
- Admins and Owners have global access
- Team membership tracked in `TeamMembership` table

### 3. Event-Driven Real-Time Updates

Server-Sent Events (SSE) for push updates:

```typescript
// Event flow
User Action → API Handler → Database Update → 
  → eventBus.publish() → All Connected Clients (per tenant)

// Event types
- question:created
- question:upvoted  
- question:answered
- question:tagged
- question:pinned
- question:frozen
- heartbeat (keepalive)
```

**Connection Management:**
- Per-tenant client tracking
- Automatic dead connection cleanup
- Periodic heartbeat (30s default)
- Reconnection handling on client side

### 4. Audit Logging Pattern

Immutable audit trail for compliance:

```typescript
// Logged on every admin/moderator action
{
  actor: userId,
  action: "question.answer",
  entityType: "Question",
  entityId: "uuid",
  before: { status: "OPEN", responseText: null },
  after: { status: "ANSWERED", responseText: "Here's the answer..." },
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  metadata: { teamName: "Engineering", questionPreview: "..." }
}
```

**Audit Log Uses:**
- Compliance and security tracking
- Debug and troubleshooting
- Moderation analytics
- User activity reports

### 5. Input Validation Pattern

Zod schemas for type-safe validation:

```typescript
// Shared validation schemas
const QuestionSchema = z.object({
  body: z.string().min(3).max(2000),
  teamId: z.string().uuid().optional()
});

// Runtime validation + TypeScript types
const validatedData = QuestionSchema.parse(req.body);
```

## Scalability Considerations

### Current Capacity

**Designed for:**
- 1,000+ concurrent users per tenant
- 10,000+ questions per tenant
- 100+ teams per tenant
- 10+ tenants on shared infrastructure

### Horizontal Scaling

**What scales:**
- ✅ API servers (stateless, no shared memory)
- ✅ Database read replicas (PostgreSQL streaming replication)
- ✅ Redis cluster (distributed caching)

**What doesn't scale (yet):**
- ⚠️ SSE connections (in-memory per API instance)
  - **Solution**: Redis Pub/Sub for multi-instance broadcasting
- ⚠️ File uploads (if added in future)
  - **Solution**: Object storage (S3, MinIO)

### Performance Optimizations

**Current:**
- Database connection pooling
- Prepared statements via Prisma
- Indexed queries (all tenant-scoped queries use indexes)
- Debounced search (client-side)

**Future:**
- Redis caching for read-heavy data (teams, tags)
- CDN for static assets
- Database query optimization (EXPLAIN ANALYZE)
- Response compression (gzip/brotli)

## Security Architecture

### Defense in Depth

**Layer 1: Network**
- HTTPS-only in production (HSTS header)
- CORS restrictions
- Rate limiting (per-tenant + per-IP)

**Layer 2: Application**
- Session-based authentication
- CSRF token validation
- Input validation (Zod schemas)
- Output encoding (React XSS protection)

**Layer 3: Authorization**
- Role-based access control
- Team-scoped permissions for moderators
- Tenant isolation (automatic Prisma middleware)

**Layer 4: Data**
- Parameterized queries (Prisma ORM)
- Audit logging (immutable records)
- Database encryption at rest (hosting-dependent)

### Threat Model

**Mitigated Threats:**
- ✅ SQL Injection (Prisma ORM)
- ✅ XSS (React escaping + CSP headers)
- ✅ CSRF (Double-submit cookie pattern)
- ✅ Clickjacking (X-Frame-Options: DENY)
- ✅ MIME sniffing (X-Content-Type-Options: nosniff)
- ✅ Privilege escalation (RBAC enforcement)
- ✅ Data leakage (tenant isolation)
- ✅ Brute force (rate limiting)

**Out of Scope:**
- DDoS protection (use CDN/load balancer)
- Physical security (hosting provider responsibility)
- Insider threats (organizational policies)

## Deployment Architecture

### Development

```
Docker Compose (docker-compose.override.yaml):
  - PostgreSQL (local)
  - Redis (local)
  - API (local build, restart required for changes)
  - Web (local build with volume mounting, instant hot reload via Vite)
```

### Production

```
Docker Compose (docker-compose.yaml):
  - PostgreSQL (persistent volume)
  - Redis (persistent volume)
  - API (ghcr.io/seanmdalton/pulsestage-api:latest)
  - Web (ghcr.io/seanmdalton/pulsestage-web:latest)
```

**Container Images:**
- Published to GitHub Container Registry
- Multi-stage builds for minimal image size
- Security scanning in CI (Trivy)
- SBOM generation (SPDX + CycloneDX)

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SESSION_SECRET` - Session encryption key
- `ADMIN_KEY` - Admin authentication key
- `CORS_ORIGIN` - Frontend URL

**Optional:**
- `NODE_ENV` - Environment (development/production)
- `PORT` - API server port (default: 3000)
- `SSE_HEARTBEAT_INTERVAL` - SSE heartbeat interval (ms)

## Monitoring & Observability

### Current Capabilities

**Health Checks:**
- `/health` - Basic liveness probe
- Future: `/admin/health` - Detailed metrics

**Logging:**
- Console logging (structured)
- Audit logs in database
- Future: OpenTelemetry tracing

**Metrics:**
- SSE connection counts
- Rate limit hits
- Database query performance
- Future: Prometheus metrics

## Future Architecture Enhancements

### Short-Term (1-3 months)

1. **Redis Pub/Sub for SSE** - Multi-instance SSE support
2. **Database Read Replicas** - Scale read-heavy workloads
3. **Caching Layer** - Redis cache for teams, tags, user data
4. **Health Dashboard** - Real-time system metrics UI

### Medium-Term (3-6 months)

5. **OpenTelemetry Tracing** - Distributed tracing and metrics
6. **Webhook System** - Event-driven integrations
7. **Background Job Queue** - Email, notifications, exports
8. **CDN Integration** - Static asset distribution

### Long-Term (6-12 months)

9. **Microservices Split** - Separate auth, notifications, exports
10. **Multi-Region Deployment** - Global edge presence
11. **GraphQL API** - Flexible querying for integrations
12. **Event Sourcing** - Complete audit trail with replay

## Technology Choices & Rationale

| Technology | Why We Chose It |
|------------|----------------|
| **TypeScript** | Type safety, better DX, catch bugs at compile time |
| **React 19** | Component model, hooks, large ecosystem |
| **Node.js 24 LTS** | JavaScript everywhere, non-blocking I/O, active LTS |
| **Express** | Mature, flexible, large middleware ecosystem |
| **Prisma** | Type-safe ORM, migrations, great DX |
| **PostgreSQL 16** | Robust, full-text search, JSON support, mature |
| **Redis** | Fast in-memory cache, pub/sub, session storage |
| **Tailwind CSS** | Utility-first, fast development, consistent design |
| **Vite** | Fast HMR, modern build tool, great DX |
| **Docker Compose** | Simple orchestration, reproducible environments |

## Related Documentation

- [Multi-Tenancy Architecture](multi-tenancy.md) - Detailed multi-tenant implementation
- [Database Schema](database-schema.md) - ERD and schema details
- [Real-Time Architecture](real-time.md) - SSE implementation details
- [Security Overview](../security/overview.md) - Comprehensive security guide
- [API Reference](../api/overview.md) - REST API documentation

## Questions?

For technical questions or suggestions, please:
- Open a [GitHub Issue](https://github.com/seanmdalton/pulsestage/issues)
- Start a [Discussion](https://github.com/seanmdalton/pulsestage/discussions)
- Check our [Development Guide](../development/setup.md)
