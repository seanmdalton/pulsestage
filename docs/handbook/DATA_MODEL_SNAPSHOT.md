# Data Model Snapshot

## Overview
PulseStage is **team-first with organizational rollups**. Every user has a primary team, and both Q&A and Pulse data are scoped to teams, with "All Teams" views available for admins.

## Core Entities

### Tenant
**Purpose:** Absolute isolation boundary for all multi-tenant data.
- Every entity (except Tenant itself) MUST have `tenantId`
- Subdomain-based tenant resolution (per ADR-0001)
- Example: `acme.pulsestage.app` → tenant slug `acme`

### Team
**Purpose:** Primary organizational unit for team-scoped Q&A and Pulse surveys.
- Teams belong to a tenant
- Users have a `primaryTeamId` for main affiliation
- Questions and Pulse data are associated with teams

### User
**Purpose:** Represents participants, moderators, and admins.
- **Key field:** `primaryTeamId` - determines pulse distribution and team affiliation
- **Authentication:** SSO via `ssoId` or demo mode in development
- **Roles:** `admin`, `moderator`, `participant` (per ADR-0003)
- **Email format (demo):** `{username}@pulsestage.app`

### Question (Q&A)
**Purpose:** Anonymous questions submitted for team all-hands/town halls.
- Team-scoped via `teamId`
- Anonymous by default (no `userId` foreign key)
- Status: `OPEN`, `ANSWERED`, `UNDER_REVIEW`
- Supports tags, upvotes, pinning, and moderation

### PulseQuestion
**Purpose:** Template questions for recurring sentiment surveys.
- **Fields:**
  - `text` - Question text (max 200 characters)
  - `active` - Whether question is in rotation
  - `tenantId` - Tenant isolation
- **Example:** "How satisfied are you with work-life balance?"
- **Used by:** Scheduler selects from active questions for daily pulse sends

### PulseCohort
**Purpose:** Groups of users who receive pulse invites on the same schedule.
- **Fields:**
  - `name` - Cohort identifier (e.g., "weekday-0", "weekend-1")
  - `userIds` - JSON array of user IDs in this cohort
  - `tenantId` - Tenant isolation
- **Rotation:** Cohorts receive different questions on different days
- **Assignment:** Users assigned to cohorts during seeding or onboarding
- **Purpose:** Distribute survey load, reduce fatigue, enable question rotation

### PulseSchedule
**Purpose:** Tenant-level configuration for pulse sending.
- **Fields:**
  - `tenantId` - Which tenant this schedule applies to
  - `enabled` - Master on/off switch
  - `cadence` - `WEEKLY`, `BIWEEKLY`, `MONTHLY`
  - `time` - HH:mm format (e.g., "09:00")
  - `timezone` - Timezone for scheduling (e.g., "America/New_York")
  - `rotatingCohorts` - Whether to use cohort rotation
  - `numCohorts` - How many cohorts to rotate through
- **Used by:** Daily cron job to determine if/when to send pulses

### PulseInvite
**Purpose:** Tracks individual pulse invitations sent to users.
- **Fields:**
  - `token` - Unique token for one-tap response (UUID)
  - `userId` - Which user received this invite
  - `questionId` - Which pulse question
  - `teamId` - Copied from `user.primaryTeamId` at creation
  - `cohortName` - Which cohort this user belongs to (optional)
  - `sentAt` - When email was sent
  - `expiresAt` - Token expiration (default: 7 days)
  - `respondedAt` - When user responded (NULL if not yet responded)
  - `tenantId` - Tenant isolation
- **Token security:** Single-use, time-limited, unpredictable (UUID v4)
- **One-tap flow:** Email contains links like `/pulse/respond?token=abc&score=4`

### PulseResponse
**Purpose:** Anonymous sentiment responses (ANONYMITY-CRITICAL).
- **Fields:**
  - `inviteId` - Link to invite (for deduplication)
  - `questionId` - Which question was answered
  - `teamId` - Copied from `invite.teamId` for team-scoped aggregates
  - `score` - Likert scale response (1-5)
  - `respondedAt` - Timestamp
  - `tenantId` - Tenant isolation
- **CRITICAL INVARIANT:** NO `userId` field - responses cannot be traced to individuals
- **Schema enforcement:** `userId` column does not exist
- **Anonymity guarantee:** Even admins cannot link responses to users
- **Aggregates:** Only shown when `COUNT(*) >= threshold` (default: 5)

## Entity Relationships

```
Tenant (1) ─────────────┬─────────── (n) Team
                        │
                        ├─────────── (n) User
                        │                 └── primaryTeamId → Team
                        │
                        ├─────────── (n) Question
                        │                 └── teamId → Team
                        │
                        ├─────────── (n) PulseQuestion
                        │
                        ├─────────── (n) PulseCohort
                        │                 └── userIds (JSON array)
                        │
                        ├─────────── (1) PulseSchedule
                        │
                        ├─────────── (n) PulseInvite
                        │                 ├── userId → User
                        │                 ├── questionId → PulseQuestion
                        │                 └── teamId → Team (from user.primaryTeamId)
                        │
                        └─────────── (n) PulseResponse
                                          ├── inviteId → PulseInvite
                                          ├── questionId → PulseQuestion
                                          └── teamId → Team (from invite.teamId)
                                          (NO userId - anonymity preserved)

Team (1) ───────────────┬─────────── (n) User (as primaryTeam)
                        │
                        ├─────────── (n) TeamMembership
                        │
                        ├─────────── (n) Question
                        │
                        └─────────── (n) PulseInvite/PulseResponse
```

## Critical Invariants

### Tenant Isolation (MUST NEVER VIOLATE)
1. Every entity MUST have `tenantId` (except Tenant model)
2. ALL queries MUST filter by `tenantId`
3. NO cross-tenant joins or searches
4. Aggregations are per-tenant only
5. Logs/metrics MUST include `tenantId` and `requestId`

### Anonymity (MUST PRESERVE)
1. `PulseResponse` MUST NOT have `userId` field
2. `Question` submissions are anonymous (no `userId`)
3. Aggregates only shown when `n >= threshold` (typically 5)
4. Audit logs MUST NOT log PII from anonymous responses

### Team Scoping (PRIMARY ARCHITECTURE)
1. Users MUST have `primaryTeamId` for pulse distribution
2. `PulseInvite.teamId` is set from `user.primaryTeamId` at creation
3. `PulseResponse.teamId` is copied from `invite.teamId` at submission
4. Questions are team-scoped via `question.teamId`
5. "All Teams" views are aggregations, not a separate data store

### Data Integrity
1. User's `primaryTeamId` can be NULL during setup/migration
2. Team `isActive` flag controls visibility, not hard deletes
3. Soft deletes preserve audit trail for questions
4. Migrations MUST preserve `tenantId` isolation

## Authorization Model

### Roles (per tenant, per ADR-0003)
- **viewer**: Read-only access to questions and pulse data
- **member**: Can submit questions, respond to pulse, upvote
- **moderator**: Team-scoped moderation (via TeamMembership)
- **admin**: Tenant-wide administration and moderation
- **owner**: Full tenant control including settings and user management

### Permission Checks
- Server-side enforcement on EVERY write and sensitive read
- Middleware: `requireAuth`, `requireRole`, `requirePermission`
- Frontend: Conditional UI rendering (not security boundary)

## Current Scale (Demo Data)
- **50 users**: 4 login users (admin, alice, bob, moderator) + 46 dummy users
- **2 teams**: Engineering, Product
- **36 Q&A questions**: 10 open + 10 answered per team
- **12 weeks pulse data**: ~800 responses with team-specific trends
- **81.6% participation rate**: Realistic demo engagement

## Full Schema Reference
**Canonical source of truth:** `/api/prisma/schema.prisma`

Run `npx prisma studio` to explore the database interactively.
