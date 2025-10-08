# Multi-Tenancy Architecture

PulseStage is built as a **multi-tenant application** from the ground up. This document explains the design, implementation, and best practices for tenant isolation.

## What is Multi-Tenancy?

Multi-tenancy allows a single application instance to serve multiple customers (tenants) with complete data isolation. Each tenant has:

- **Separate data**: Questions, teams, users, tags
- **Separate configuration**: Tenant-specific settings
- **Isolated access**: No cross-tenant data visibility
- **Shared infrastructure**: Single database, single application

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Users/Requests                       │
│        (Tenant A: acme.com, Tenant B: widgets.io)        │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│              Tenant Resolver Middleware                   │
│   • Resolve tenant from: subdomain, header, or session   │
│   • Store tenant context in AsyncLocalStorage            │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                 Application Middleware                    │
│      • Auth • RBAC • CSRF • Rate Limiting • Audit        │
│         (All tenant-aware via context)                    │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                  Prisma ORM Middleware                    │
│    • Automatically inject tenantId in all queries        │
│    • Prevent cross-tenant data access                    │
│    • Enforce tenant filtering at ORM level               │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                      │
│        • All tables have tenantId column                 │
│        • Indexes include tenantId for performance        │
│        • No foreign keys across tenants                  │
└──────────────────────────────────────────────────────────┘
```

## Tenant Data Model

Every tenant-scoped table includes a `tenantId` foreign key:

```prisma
model Tenant {
  id        String   @id @default(uuid())
  slug      String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships (all tenant-scoped)
  teams             Team[]
  questions         Question[]
  tags              Tag[]
  users             User[]
  userPreferences   UserPreferences[]
  auditLogs         AuditLog[]
  settings          TenantSettings?
}

model Question {
  id        String   @id @default(uuid())
  tenantId  String   // 👈 Tenant isolation
  body      String
  // ... other fields
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])          // 👈 Performance
  @@index([tenantId, status])  // 👈 Composite index
}
```

## Tenant Resolution Strategy

PulseStage resolves tenants using multiple strategies (in priority order):

### 1. **Query Parameter** (Highest Priority)
Used for SSE connections where headers can't be modified:
```
GET /sse?tenantId=acme
```

### 2. **Request Header** (Medium Priority)
Used by the frontend for all API requests:
```
X-Tenant-Id: acme
```

### 3. **Admin Session** (Low Priority)
Admins authenticated via session have tenant stored in session data:
```typescript
req.session.tenantId = 'acme'
```

### 4. **Default Tenant** (Fallback)
If no tenant specified, use default:
```typescript
tenantId = 'default'
```

## Implementation Details

### Tenant Context Storage

We use Node.js **AsyncLocalStorage** to maintain tenant context throughout the request lifecycle:

```typescript
// tenantContext.ts
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}

const asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext {
  const context = asyncLocalStorage.getStore();
  if (!context) {
    throw new Error('Tenant context not set');
  }
  return context;
}

export function setTenantContext(context: TenantContext) {
  return asyncLocalStorage.enterWith(context);
}
```

**Benefits:**
- No need to pass `tenantId` through function parameters
- Automatic context propagation through async operations
- Thread-safe (each request has isolated context)

### Tenant Resolver Middleware

Resolves tenant and stores in AsyncLocalStorage:

```typescript
// tenantResolver.ts
export function createTenantResolverMiddleware(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let tenantId: string | undefined;

    // Priority 1: Query parameter (for SSE)
    tenantId = req.query.tenantId as string;

    // Priority 2: Header (for API requests)
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] as string;
    }

    // Priority 3: Session (for admin)
    if (!tenantId && req.session?.tenantId) {
      tenantId = req.session.tenantId;
    }

    // Priority 4: Default fallback
    if (!tenantId) {
      tenantId = 'default';
    }

    // Resolve tenant from database
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found' 
      });
    }

    // Store in AsyncLocalStorage
    setTenantContext({
      tenantId: tenant.id,
      tenantSlug: tenant.slug
    });

    next();
  };
}
```

### Prisma Middleware for Automatic Filtering

**Critical**: This middleware automatically injects `tenantId` in all queries:

```typescript
// prismaMiddleware.ts
export function applyTenantMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params, next) => {
    // Get tenant context (throws if not set)
    const tenantContext = tryGetTenantContext();
    
    if (!tenantContext) {
      // No tenant context = likely a setup operation
      return next(params);
    }

    const tenantId = tenantContext.tenantId;

    // Models that require tenant filtering
    const tenantedModels = [
      'Question',
      'Team', 
      'Tag',
      'QuestionTag',
      'User',
      'TeamMembership',
      'UserPreferences',
      'Upvote',
      'AuditLog',
      'TenantSettings'
    ];

    if (!tenantedModels.includes(params.model || '')) {
      return next(params);
    }

    // Inject tenantId into WHERE clause
    if (params.action === 'findUnique' || 
        params.action === 'findFirst' ||
        params.action === 'findMany' ||
        params.action === 'count' ||
        params.action === 'aggregate') {
      params.args = params.args || {};
      params.args.where = params.args.where || {};
      params.args.where.tenantId = tenantId;
    }

    // Inject tenantId into CREATE
    if (params.action === 'create') {
      params.args = params.args || {};
      params.args.data = params.args.data || {};
      params.args.data.tenantId = tenantId;
    }

    // Inject tenantId into UPDATE/DELETE
    if (params.action === 'update' || 
        params.action === 'updateMany' ||
        params.action === 'delete' ||
        params.action === 'deleteMany') {
      params.args = params.args || {};
      params.args.where = params.args.where || {};
      params.args.where.tenantId = tenantId;
    }

    return next(params);
  });
}
```

**This is the magic**: You never need to manually add `tenantId` filters in your application code!

### Example: Creating a Question

Without tenant middleware (manual filtering):
```typescript
// ❌ Manual approach (error-prone)
const question = await prisma.question.create({
  data: {
    body: 'What is your favorite color?',
    tenantId: req.user.tenantId,  // Easy to forget!
    status: 'OPEN'
  }
});
```

With tenant middleware (automatic):
```typescript
// ✅ Automatic tenant injection
const question = await prisma.question.create({
  data: {
    body: 'What is your favorite color?',
    status: 'OPEN'
    // tenantId automatically injected by middleware!
  }
});
```

### Example: Querying Questions

```typescript
// ✅ Automatic tenant filtering
const questions = await prisma.question.findMany({
  where: {
    status: 'OPEN'
    // tenantId automatically added by middleware!
  },
  orderBy: { upvotes: 'desc' }
});

// Results only include questions from current tenant
```

## Tenant Settings

Per-tenant configuration is stored in the `TenantSettings` model:

```prisma
model TenantSettings {
  id        String   @id @default(uuid())
  tenantId  String   @unique
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  // JSON field for flexibility
  settings  Json     @default("{}")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Settings Schema:**
```json
{
  "questions": {
    "minLength": 10,
    "maxLength": 2000,
    "requireTeam": true,
    "allowAnonymous": false
  },
  "users": {
    "autoApprove": true,
    "defaultRole": "member"
  },
  "security": {
    "requireEmailVerification": false,
    "sessionTimeout": 1800000
  },
  "branding": {
    "primaryColor": "#3B82F6",
    "logoUrl": null
  },
  "features": {
    "enableComments": false,
    "enableVoting": true,
    "enableTags": true
  }
}
```

**Accessing Settings:**
```typescript
import { settingsService } from './lib/settingsService';

// Get tenant settings (with defaults)
const settings = await settingsService.getTenantSettings();

// Get specific setting
const maxLength = settings.questions?.maxLength || 2000;

// Update settings
await settingsService.updateTenantSettings({
  questions: {
    maxLength: 1500
  }
});
```

## Tenant Isolation Guarantees

### 1. **Database Level**
- ✅ All queries automatically filtered by `tenantId`
- ✅ Indexes include `tenantId` for performance
- ✅ Foreign keys prevent cross-tenant references
- ✅ Cascading deletes maintain referential integrity

### 2. **Application Level**
- ✅ Tenant context required for all authenticated routes
- ✅ AsyncLocalStorage ensures context propagation
- ✅ Middleware validates tenant existence
- ✅ Rate limiting is per-tenant

### 3. **API Level**
- ✅ All endpoints validate tenant context
- ✅ SSE connections are tenant-scoped
- ✅ Audit logs include tenant information
- ✅ Exports filtered by tenant

### 4. **Frontend Level**
- ✅ API client sends `X-Tenant-Id` header
- ✅ SSE connections include `tenantId` query param
- ✅ User can only access their tenant's data
- ✅ Team selector shows only tenant's teams

## Security Considerations

### Preventing Tenant Leakage

**✅ Safe Patterns:**
```typescript
// Prisma middleware handles filtering automatically
const questions = await prisma.question.findMany({
  where: { status: 'OPEN' }
});

// Context-aware audit logging
await auditService.log({
  action: 'question.created',
  entityType: 'Question',
  entityId: question.id
  // tenantId automatically added
});
```

**❌ Unsafe Patterns:**
```typescript
// NEVER bypass tenant filtering
const allQuestions = await prisma.$queryRaw`
  SELECT * FROM "Question"
`;  // No tenant filter!

// NEVER use raw queries without tenant filter
const results = await prisma.$executeRaw`
  UPDATE "Question" SET status = 'ANSWERED'
`;  // Updates ALL tenants!
```

### Testing Tenant Isolation

```typescript
// Test: Ensure cross-tenant access is blocked
test('should not return questions from other tenants', async () => {
  // Create question in tenant A
  setTenantContext({ tenantId: 'tenant-a', tenantSlug: 'tenant-a' });
  await prisma.question.create({
    data: { body: 'Tenant A question' }
  });

  // Try to access from tenant B
  setTenantContext({ tenantId: 'tenant-b', tenantSlug: 'tenant-b' });
  const questions = await prisma.question.findMany();

  // Should be empty (no cross-tenant access)
  expect(questions).toHaveLength(0);
});
```

## Tenant Lifecycle

### Creating a Tenant

```typescript
// Auto-bootstrap (on first startup)
const tenant = await prisma.tenant.create({
  data: {
    name: 'Acme Corp',
    slug: 'acme'
  }
});

// Create default settings
await prisma.tenantSettings.create({
  data: {
    tenantId: tenant.id,
    settings: {} // Uses defaults
  }
});
```

### Setup Wizard Flow

1. **User visits app** → No teams exist
2. **Setup wizard displays** → Two options:
   - Load demo data (creates `acme` tenant)
   - Create custom organization (creates tenant with custom name)
3. **Tenant created** → Auto-restart to load new tenant
4. **User navigates to `/sso-test.html`** → Sign in with new account

### Tenant Deletion

```typescript
// Cascade delete (removes all tenant data)
await prisma.tenant.delete({
  where: { id: tenantId }
});

// Automatically deletes:
// - All teams
// - All questions
// - All users
// - All tags
// - All audit logs
// - Tenant settings
```

## Performance Optimizations

### Indexing Strategy

All tenant-scoped tables have composite indexes:

```sql
-- Single-column index
CREATE INDEX "Question_tenantId_idx" ON "Question"("tenantId");

-- Composite indexes (tenant + filter)
CREATE INDEX "Question_tenantId_status_idx" 
  ON "Question"("tenantId", "status");

CREATE INDEX "Question_tenantId_teamId_idx" 
  ON "Question"("tenantId", "teamId");

-- Audit log (descending for recent logs)
CREATE INDEX "AuditLog_tenantId_createdAt_idx" 
  ON "AuditLog"("tenantId", "createdAt" DESC);
```

### Query Optimization

```typescript
// ✅ Efficient: Uses composite index
const openQuestions = await prisma.question.findMany({
  where: {
    // tenantId: auto-injected (uses index)
    status: 'OPEN'
  },
  orderBy: { createdAt: 'desc' }
});

// ✅ Efficient: Prisma generates optimized query
SELECT * FROM "Question" 
WHERE "tenantId" = $1 AND "status" = 'OPEN'
ORDER BY "createdAt" DESC;
```

## Multi-Tenant SSE Broadcasting

Real-time events are tenant-scoped:

```typescript
// EventBus maintains per-tenant connections
class EventBus {
  private clients: Map<string, SSEClient[]> = new Map();
  
  addClient(tenantId: string, res: Response): string {
    if (!this.clients.has(tenantId)) {
      this.clients.set(tenantId, []);
    }
    this.clients.get(tenantId)!.push(client);
  }
  
  publish(event: SSEEvent) {
    const tenantClients = this.clients.get(event.tenantId);
    // Only sends to clients in the same tenant
    for (const client of tenantClients) {
      client.res.write(eventData);
    }
  }
}
```

## Scaling Considerations

### Single-Database Approach (Current)

**Advantages:**
- ✅ Simple deployment
- ✅ Easy backups
- ✅ Cross-tenant reporting possible
- ✅ Lower operational overhead

**Limitations:**
- ⚠️ Noisy neighbor problem (one tenant can impact others)
- ⚠️ Harder to scale beyond ~100 tenants
- ⚠️ Single point of failure

### Database-per-Tenant (Future)

For very large deployments, consider:

```
Tenant Router
    ├── Tenant A → Database A
    ├── Tenant B → Database B
    └── Tenant C → Database C
```

**Advantages:**
- ✅ Complete isolation
- ✅ Per-tenant scaling
- ✅ Better security (physical separation)

**Challenges:**
- ❌ Complex deployment
- ❌ Difficult cross-tenant features
- ❌ Higher operational cost

## Best Practices

### ✅ Do's

1. **Always use Prisma ORM** - Let middleware handle filtering
2. **Test tenant isolation** - Verify no cross-tenant access
3. **Include tenantId in logs** - For debugging and auditing
4. **Monitor per-tenant metrics** - Track usage and performance
5. **Set tenant context early** - In middleware, before any DB access

### ❌ Don'ts

1. **Don't use raw SQL** - Bypasses tenant middleware
2. **Don't hardcode tenant IDs** - Always use context
3. **Don't skip tenant validation** - Always verify tenant exists
4. **Don't share sessions across tenants** - Each tenant = separate context
5. **Don't forget indexes** - All queries should use composite indexes

## Troubleshooting

### "Tenant context not set" Error

**Cause**: Accessing database before tenant context established

**Solution**: Ensure tenant resolver middleware runs first
```typescript
app.use(createTenantResolverMiddleware(prisma));  // Must be early!
app.use('/questions', questionsRouter);
```

### Cross-Tenant Data Visible

**Cause**: Raw query bypassing Prisma middleware

**Solution**: Use Prisma ORM or manually filter
```typescript
// ❌ Bad
const results = await prisma.$queryRaw`SELECT * FROM "Question"`;

// ✅ Good
const results = await prisma.question.findMany();
```

### Slow Queries

**Cause**: Missing composite index on `tenantId`

**Solution**: Add index in Prisma schema
```prisma
@@index([tenantId, status])
```

## Related Documentation

- [System Design](system-design.md) - Overall architecture
- [Database Schema](database-schema.md) - ERD and table details
- [Security Overview](../security/overview.md) - Security features

## References

- [Prisma Middleware Docs](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)
- [AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
- [Multi-Tenant SaaS Patterns](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/multi-tenant-saas-architecture.html)
