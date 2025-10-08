# Database Schema

This document provides a comprehensive overview of PulseStage's PostgreSQL database schema, relationships, and design decisions.

## Entity Relationship Diagram (ERD)

```
┌──────────────┐
│    Tenant    │ (Organization)
├──────────────┤
│ id (PK)      │
│ slug (UQ)    │
│ name         │
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │
       │ 1:N relationships
       ├────────────────────────┬─────────────────────────┐
       │                        │                         │
       ▼                        ▼                         ▼
┌─────────────┐      ┌────────────────┐      ┌──────────────────┐
│    Team     │      │   Question     │      │      Tag         │
├─────────────┤      ├────────────────┤      ├──────────────────┤
│ id (PK)     │      │ id (PK)        │      │ id (PK)          │
│ tenantId(FK)│◄─┐   │ tenantId (FK)  │      │ tenantId (FK)    │
│ name        │  │   │ body           │      │ name (UQ)        │
│ slug (UQ)   │  │   │ upvotes        │      │ description      │
│ description │  │   │ status         │      │ color            │
│ isActive    │  │   │ responseText   │◄──┐  │ createdAt        │
│ createdAt   │  │   │ respondedAt    │   │  │ updatedAt        │
│ updatedAt   │  │   │ teamId (FK)    │   │  └──────────────────┘
└─────┬───────┘  │   │ authorId (FK)  │   │           │
      │          │   │ isPinned       │   │           │
      │ 1:N      │   │ pinnedBy       │   │           │
      │          │   │ pinnedAt       │   │           │
      │          │   │ isFrozen       │   │           │ N:M (via QuestionTag)
      │          │   │ frozenBy       │   │           │
      │          │   │ frozenAt       │   │           │
      │          │   │ reviewedBy     │   │           │
      │          │   │ reviewedAt     │   │           │
      │          │   │ createdAt      │   │           │
      │          │   │ updatedAt      │   │           │
      │          │   └────────┬───────┘   │           │
      │          │            │           │           │
      │          │            │ 1:N       │           │
      │          │            │           │           │
      ▼          │            ▼           │           ▼
┌──────────────┐│   ┌────────────────┐   │  ┌──────────────────┐
│  User        ││   │  Upvote        │   │  │  QuestionTag     │
├──────────────┤│   ├────────────────┤   │  ├──────────────────┤
│ id (PK)      ││   │ id (PK)        │   │  │ id (PK)          │
│ tenantId(FK) ││   │ questionId(FK) │───┘  │ questionId (FK)  │───┐
│ email (UQ)   ││   │ userId (FK)    │      │ tagId (FK)       │───┤
│ name         ││   │ createdAt      │      │ createdAt        │   │
│ ssoId (UQ)   ││   └────────────────┘      └──────────────────┘   │
│ createdAt    ││            │                        │             │
│ updatedAt    ││            │                        └─────────────┤
└──────┬───────┘│            │                                      │
       │        │            └──────────────────────────┐           │
       │ 1:N    │                                       │           │
       │        │                                       │           │
       ▼        │                                       │           │
┌──────────────┐│                                       │           │
│TeamMembership││                                       │           │
├──────────────┤│                                       │           │
│ id (PK)      ││                                       │           │
│ userId (FK)  │────────────────────────────────────────┘           │
│ teamId (FK)  │────────────────────────────────────────────────────┘
│ role         │
│ createdAt    │
└──────────────┘

┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│ UserPreferences  │        │   AuditLog       │        │ TenantSettings   │
├──────────────────┤        ├──────────────────┤        ├──────────────────┤
│ id (PK)          │        │ id (PK)          │        │ id (PK)          │
│ tenantId (FK)    │        │ tenantId (FK)    │        │ tenantId (FK,UQ) │
│ userId (FK,UQ)   │        │ userId (FK)      │        │ settings (JSON)  │
│ favoriteTeams    │        │ action           │        │ createdAt        │
│ defaultTeamId(FK)│        │ entityType       │        │ updatedAt        │
│ createdAt        │        │ entityId         │        └──────────────────┘
│ updatedAt        │        │ before (JSON)    │
└──────────────────┘        │ after (JSON)     │
                            │ ipAddress        │
                            │ userAgent        │
                            │ metadata (JSON)  │
                            │ createdAt        │
                            └──────────────────┘
```

## Core Tables

### Tenant

The root of the multi-tenant hierarchy. Every data entity belongs to a tenant.

```sql
CREATE TABLE "Tenant" (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "slug"      TEXT NOT NULL UNIQUE,
    "name"      TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- One-to-many with: Team, Question, Tag, User, AuditLog
- One-to-one with: TenantSettings

**Key Fields:**
- `slug`: URL-safe identifier (e.g., "acme", "default")
- `name`: Display name (e.g., "Acme Corp")

**Indexes:**
- Primary key on `id`
- Unique constraint on `slug`

---

### Team

Organizational units within a tenant (e.g., Engineering, Product, Marketing).

```sql
CREATE TABLE "Team" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"    TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "isActive"    BOOLEAN DEFAULT true,
    "createdAt"   TIMESTAMP DEFAULT NOW(),
    "updatedAt"   TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT "Team_tenantId_slug_unique" UNIQUE ("tenantId", "slug")
);

CREATE INDEX "Team_tenantId_idx" ON "Team"("tenantId");
```

**Relationships:**
- Belongs to: Tenant
- Has many: Questions, TeamMemberships, UserPreferences

**Key Fields:**
- `slug`: URL-safe team identifier (unique per tenant)
- `isActive`: Soft delete / archive teams

**Indexes:**
- Composite unique: `(tenantId, slug)`
- Index on `tenantId` for queries

---

### Question

User-submitted questions with voting, answers, and moderation features.

```sql
CREATE TABLE "Question" (
    "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"     TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "body"         TEXT NOT NULL,
    "upvotes"      INTEGER DEFAULT 0,
    "status"       TEXT NOT NULL DEFAULT 'OPEN',
    "responseText" TEXT,
    "respondedAt"  TIMESTAMP,
    "createdAt"    TIMESTAMP DEFAULT NOW(),
    "updatedAt"    TIMESTAMP DEFAULT NOW(),
    "teamId"       TEXT REFERENCES "Team"("id") ON DELETE SET NULL,
    "authorId"     TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    
    -- Moderation fields
    "isPinned"     BOOLEAN DEFAULT false,
    "pinnedBy"     TEXT,
    "pinnedAt"     TIMESTAMP,
    "isFrozen"     BOOLEAN DEFAULT false,
    "frozenBy"     TEXT,
    "frozenAt"     TIMESTAMP,
    "reviewedBy"   TEXT,
    "reviewedAt"   TIMESTAMP,
    
    CONSTRAINT "Question_status_check" CHECK ("status" IN ('OPEN', 'ANSWERED'))
);

CREATE INDEX "Question_tenantId_idx" ON "Question"("tenantId");
CREATE INDEX "Question_tenantId_status_idx" ON "Question"("tenantId", "status");
CREATE INDEX "Question_tenantId_teamId_idx" ON "Question"("tenantId", "teamId");
CREATE INDEX "Question_isPinned_idx" ON "Question"("isPinned");
CREATE INDEX "Question_reviewedBy_idx" ON "Question"("reviewedBy");
```

**Relationships:**
- Belongs to: Tenant, Team (optional), User (author, optional)
- Has many: QuestionTags, Upvotes

**Key Fields:**
- `status`: Enum of `OPEN` or `ANSWERED`
- `upvotes`: Cached count (source of truth is `Upvote` records)
- `isPinned`, `isFrozen`: Moderation flags
- `reviewedBy`: Last moderator who reviewed

**Indexes:**
- Composite: `(tenantId, status)` for filtered queries
- Composite: `(tenantId, teamId)` for team-specific views
- Single: `isPinned` for quick pinned question queries

**Full-Text Search:**
- `search_vector` column (tsvector, managed by PostgreSQL trigger)
- GIN index on `search_vector` for fast text search

---

### Tag

Categorization and labeling system for questions.

```sql
CREATE TABLE "Tag" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"    TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "color"       TEXT DEFAULT '#3B82F6',
    "createdAt"   TIMESTAMP DEFAULT NOW(),
    "updatedAt"   TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT "Tag_tenantId_name_unique" UNIQUE ("tenantId", "name")
);

CREATE INDEX "Tag_tenantId_idx" ON "Tag"("tenantId");
```

**Relationships:**
- Belongs to: Tenant
- Many-to-many with: Questions (via QuestionTag)

**Key Fields:**
- `name`: Unique per tenant
- `color`: Hex color code for UI display

**Indexes:**
- Composite unique: `(tenantId, name)`

---

### QuestionTag

Junction table for many-to-many relationship between Questions and Tags.

```sql
CREATE TABLE "QuestionTag" (
    "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "tagId"      TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
    "createdAt"  TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT "QuestionTag_questionId_tagId_unique" UNIQUE ("questionId", "tagId")
);
```

**Relationships:**
- Belongs to: Question, Tag

**Indexes:**
- Composite unique: `(questionId, tagId)` prevents duplicate tags

---

### User

User accounts linked to SSO providers.

```sql
CREATE TABLE "User" (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"  TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "email"     TEXT NOT NULL,
    "name"      TEXT,
    "ssoId"     TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT "User_tenantId_email_unique" UNIQUE ("tenantId", "email"),
    CONSTRAINT "User_tenantId_ssoId_unique" UNIQUE ("tenantId", "ssoId")
);

CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
```

**Relationships:**
- Belongs to: Tenant
- Has many: TeamMemberships, Questions (authored), Upvotes, AuditLogs
- Has one: UserPreferences

**Key Fields:**
- `email`: Unique per tenant
- `ssoId`: External SSO provider user ID (unique per tenant)

**Indexes:**
- Composite unique: `(tenantId, email)`
- Composite unique: `(tenantId, ssoId)`

---

### TeamMembership

User roles and permissions within teams.

```sql
CREATE TABLE "TeamMembership" (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "teamId"    TEXT NOT NULL REFERENCES "Team"("id") ON DELETE CASCADE,
    "role"      TEXT DEFAULT 'member',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT "TeamMembership_userId_teamId_unique" UNIQUE ("userId", "teamId")
);
```

**Relationships:**
- Belongs to: User, Team

**Key Fields:**
- `role`: One of: `viewer`, `member`, `moderator`, `admin`, `owner`

**Indexes:**
- Composite unique: `(userId, teamId)` ensures one role per team

---

### UserPreferences

User-specific settings and preferences.

```sql
CREATE TABLE "UserPreferences" (
    "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"      TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "userId"        TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "favoriteTeams" JSONB DEFAULT '[]',
    "defaultTeamId" TEXT REFERENCES "Team"("id") ON DELETE SET NULL,
    "createdAt"     TIMESTAMP DEFAULT NOW(),
    "updatedAt"     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "UserPreferences_tenantId_idx" ON "UserPreferences"("tenantId");
```

**Relationships:**
- Belongs to: Tenant, User (one-to-one), Team (default team, optional)

**Key Fields:**
- `favoriteTeams`: JSON array of team slugs
- `defaultTeamId`: Team to show by default

---

### Upvote

Individual upvote tracking (not just counters).

```sql
CREATE TABLE "Upvote" (
    "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "userId"     TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "createdAt"  TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT "Upvote_questionId_userId_unique" UNIQUE ("questionId", "userId")
);

CREATE INDEX "Upvote_questionId_idx" ON "Upvote"("questionId");
```

**Relationships:**
- Belongs to: Question, User (optional)

**Key Fields:**
- `userId`: Nullable to support anonymous upvotes (future feature)

**Indexes:**
- Composite unique: `(questionId, userId)` prevents duplicate upvotes
- Index on `questionId` for counting votes

---

### AuditLog

Immutable audit trail of all administrative actions.

```sql
CREATE TABLE "AuditLog" (
    "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"   TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "userId"     TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "action"     TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId"   TEXT,
    "before"     JSONB,
    "after"      JSONB,
    "ipAddress"  TEXT,
    "userAgent"  TEXT,
    "metadata"   JSONB,
    "createdAt"  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt" DESC);
CREATE INDEX "AuditLog_tenantId_userId_idx" ON "AuditLog"("tenantId", "userId");
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");
CREATE INDEX "AuditLog_tenantId_entityType_entityId_idx" ON "AuditLog"("tenantId", "entityType", "entityId");
```

**Relationships:**
- Belongs to: Tenant, User (actor, optional)

**Key Fields:**
- `action`: Action performed (e.g., "question.answer", "team.create")
- `entityType`: Type of entity affected
- `before`, `after`: State before/after (JSON)
- `metadata`: Additional context (JSON)

**Indexes:**
- Composite: `(tenantId, createdAt DESC)` for recent logs
- Composite: `(tenantId, userId)` for per-user audit trails
- Composite: `(tenantId, entityType, entityId)` for entity history

---

### TenantSettings

Per-tenant configuration stored as JSON.

```sql
CREATE TABLE "TenantSettings" (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"  TEXT NOT NULL UNIQUE REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "settings"  JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "TenantSettings_tenantId_idx" ON "TenantSettings"("tenantId");
```

**Relationships:**
- Belongs to: Tenant (one-to-one)

**Key Fields:**
- `settings`: JSON object with per-tenant configuration

---

## Data Types

### Enums

**QuestionStatus:**
- `OPEN` - Question has not been answered
- `ANSWERED` - Question has been answered by a moderator

**UserRole (not in database, enforced in application):**
- `viewer` - Read-only access
- `member` - Can submit and upvote
- `moderator` - Can answer, tag, pin, freeze (team-scoped)
- `admin` - Full access (global)
- `owner` - Complete control (global)

### UUIDs

All primary keys use UUIDs (v4) for:
- Globally unique identifiers
- No sequential patterns (security)
- Easier distributed systems (future)

### Timestamps

All timestamps use `TIMESTAMP WITHOUT TIME ZONE`:
- Stored in UTC
- Application handles timezone conversions

---

## Indexes and Performance

### Composite Indexes

All tenant-scoped queries benefit from composite indexes:

```sql
-- Most common query pattern
WHERE tenantId = $1 AND status = $2
↓
INDEX ON (tenantId, status)

-- Team-specific queries
WHERE tenantId = $1 AND teamId = $2
↓
INDEX ON (tenantId, teamId)
```

### Full-Text Search

PostgreSQL's built-in full-text search with GIN indexes:

```sql
-- Managed by database trigger (not in Prisma schema)
ALTER TABLE "Question" ADD COLUMN "search_vector" tsvector;

UPDATE "Question" SET "search_vector" = 
  to_tsvector('english', COALESCE(body, ''));

CREATE INDEX "Question_search_vector_idx" ON "Question" 
  USING GIN("search_vector");

-- Trigger to auto-update search_vector
CREATE TRIGGER question_search_vector_update 
  BEFORE INSERT OR UPDATE ON "Question"
  FOR EACH ROW EXECUTE FUNCTION 
    tsvector_update_trigger(search_vector, 'pg_catalog.english', body);
```

**Query Pattern:**
```sql
SELECT * FROM "Question"
WHERE search_vector @@ plainto_tsquery('english', 'mobile app')
AND tenantId = $1;
```

---

## Migrations

Migrations are managed by Prisma:

```bash
# Generate migration
npx prisma migrate dev --name add_feature

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

**Migration Files:**
- Located in `api/prisma/migrations/`
- Each migration has timestamp + description
- SQL files for each migration step

---

## Data Integrity

### Foreign Keys

All relationships use foreign keys with appropriate actions:

**CASCADE DELETE:**
- Tenant deletion cascades to all tenant data
- Team deletion cascades to memberships
- Question deletion cascades to upvotes, tags

**SET NULL:**
- User deletion sets `authorId` to NULL (preserve questions)
- Team deletion sets `teamId` to NULL (preserve questions)

### Constraints

**Unique Constraints:**
- `(tenantId, email)` - Email unique per tenant
- `(tenantId, slug)` - Slug unique per tenant
- `(questionId, userId)` - One upvote per user per question

**Check Constraints:**
- `status IN ('OPEN', 'ANSWERED')` - Valid question status

---

## Backup and Recovery

### Backup Strategy

```bash
# Full database backup
pg_dump -U app -d ama > backup_$(date +%Y%m%d).sql

# Tenant-specific backup
pg_dump -U app -d ama --table=Question --where="tenantId='acme'" > acme_questions.sql
```

### Point-in-Time Recovery

PostgreSQL WAL (Write-Ahead Logging) enabled for PITR:
- Continuous archiving
- Recovery to specific timestamp

---

## Security

### Row-Level Security (Future)

Consider PostgreSQL RLS for additional tenant isolation:

```sql
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Question"
  USING (tenantId = current_setting('app.current_tenant')::text);
```

Currently using application-level enforcement (Prisma middleware).

---

## Query Patterns

### Common Queries

**Get open questions for a team:**
```sql
SELECT * FROM "Question"
WHERE "tenantId" = $1 
  AND "teamId" = $2 
  AND "status" = 'OPEN'
ORDER BY "upvotes" DESC, "createdAt" DESC;
```

**Search questions:**
```sql
SELECT * FROM "Question"
WHERE "tenantId" = $1
  AND "search_vector" @@ plainto_tsquery('english', $2)
ORDER BY ts_rank("search_vector", plainto_tsquery('english', $2)) DESC;
```

**Get user's team memberships:**
```sql
SELECT t.*, tm."role"
FROM "Team" t
INNER JOIN "TeamMembership" tm ON tm."teamId" = t."id"
WHERE tm."userId" = $1 AND t."tenantId" = $2;
```

---

## Related Documentation

- [System Design](system-design.md) - Overall architecture
- [Multi-Tenancy Architecture](multi-tenancy.md) - Tenant isolation details
- [API Reference](../api/overview.md) - API endpoints and usage

---

## Schema Visualization Tools

To generate visual ERDs:

```bash
# Using Prisma
npx prisma generate

# Using SchemaSpy
java -jar schemaspy.jar -t pgsql -db ama -u app -p app

# Using DBeaver (GUI)
# File → Export → ERD
```
