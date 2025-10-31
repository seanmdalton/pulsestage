# Weekly Pulse - Phase 1 Implementation

## Overview
Phase 1 implements the data model, aggregation logic, and summary API for Weekly Pulse. This provides the foundation for capturing and analyzing anonymous employee pulse surveys.

## What's Included

### 1. Database Schema
New Prisma models:
- **PulseQuestion**: Survey questions with category and scale (Likert 1-5 or NPS 0-10)
- **PulseSchedule**: Per-tenant scheduling configuration (cadence, time, cohorts)
- **PulseCohort**: User groupings for rotating daily questions
- **PulseInvite**: Tracking of sent invitations and responses
- **PulseResponse**: Anonymous response storage (no user linkage!)

### 2. Tenant Settings
New `pulse` configuration section in TenantSettings:
```typescript
pulse: {
  enabled: false,              // Feature flag
  anonThreshold: 5,            // Min responses to show aggregates
  defaultCadence: 'weekly',    // Sending frequency
  defaultTime: '09:00',        // Daily send time
  rotatingCohorts: true,       // Enable cohort rotation
  channelSlack: false,         // Slack DM delivery
  channelEmail: true,          // Email delivery (fallback)
}
```

### 3. Summary API Endpoint

**GET /pulse/summary**

Returns aggregated Pulse data with strict anonymity enforcement.

**Query Parameters:**
- `range` (string, optional): Time range (e.g., `4w`, `8w`, `12w`). Default: `8w`
- `team` (string, optional): Filter by team (future feature)
- `threshold` (number, optional): Override anonymity threshold

**Response Structure:**
```typescript
{
  tenantId: string
  anonThreshold: number
  summary: {
    overallTrend: Array<{
      weekStart: string          // ISO date (YYYY-MM-DD)
      average: number | null     // null if below threshold
      participation: number      // percentage
      responseCount: number
      insufficient: boolean      // true if < threshold
    }>
    participationRate: number
    totalResponses: number
    totalInvites: number
  }
  questions: Array<{
    questionId: string
    questionText: string
    category: string | null
    scale: 'LIKERT_1_5' | 'NPS_0_10'
    trend: Array<TrendDataPoint>
    overallAverage: number | null
    insufficient: boolean
  }>
  heatmap: {
    [category: string]: {
      [weekStart: string]: {
        average: number | null
        insufficient: boolean
      }
    }
  }
}
```

**Anonymity Enforcement:**
- If a week/category has fewer than `anonThreshold` responses, `average` is `null`
- The `insufficient` flag indicates when data is hidden for privacy
- This prevents identifying individuals from small sample sizes

**Example Request:**
```bash
curl "http://localhost:3000/pulse/summary?range=8w" \
  -H "x-tenant-id: default" \
  -H "x-mock-sso-user: admin@demo.pulsestage.dev"
```

### 4. Seed Data
Run the seed script to populate test data:

```bash
# Build first
cd api && npm run build

# Seed Pulse data for a tenant
node dist/seed-pulse-data.js default

# Or use the environment variable
PULSE_ENABLED=true node dist/seed-pulse-data.js
```

**What it seeds:**
- 10 Pulse questions across key categories (recognition, alignment, wellbeing, etc.)
- 5 cohorts for rotating daily sends
- 8 weeks of synthetic response history with realistic trends
- Scheduling configuration

## Environment Variables

Add to your `.env` file:

```bash
# Enable/disable Weekly Pulse feature
PULSE_ENABLED=false

# Anonymity threshold (minimum responses to show averages)
PULSE_ANON_THRESHOLD=5

# Slack integration (optional)
# SLACK_BOT_TOKEN=xoxb-your-bot-token
# SLACK_SIGNING_SECRET=your-signing-secret
```

## Testing

Run unit tests:
```bash
cd api && npm test -- pulse
```

Tests cover:
- ✅ Anonymity threshold enforcement (default and custom)
- ✅ Tenant isolation (cross-tenant data leakage prevention)
- ✅ Correct aggregation and averaging

## Cohort Strategy

The implementation uses **deterministic hash-based rotation** as specified:

1. **5 cohorts** are created (named `weekday-0` through `weekday-4`)
2. Users are distributed evenly across cohorts
3. Each weekday, a different cohort receives the pulse
4. Rotation is deterministic: `cohort_index = hash(week_number) % 5`
5. This ensures:
   - No user gets a pulse every day (avoids fatigue)
   - Different users each day (prevents "always the same people")
   - Consistent rotation schedule

## Security & Privacy

**Critical: No User Linkage**
- `PulseResponse` has **no userId field** - responses are completely anonymous
- One-tap response tokens expire after use
- Aggregation enforces minimum thresholds to prevent individual identification
- Tenant isolation prevents cross-tenant data access

## What's Next

✅ **Phase 2 Complete** - Email invitations, one-tap responses, automated scheduling
- See `weekly-pulse-phase2.md` for details

🔜 **Phase 3** - Slack integration (optional)
- Slack Bot setup
- Direct message delivery  
- Interactive Slack buttons

## API Documentation

The endpoint is documented in Swagger UI when running in development:
- http://localhost:3000/docs

## Database Schema Diagram

```
Tenant (1) ──< PulseQuestion (many)
Tenant (1) ──< PulseSchedule (1)
Tenant (1) ──< PulseCohort (many)
Tenant (1) ──< PulseInvite (many)
Tenant (1) ──< PulseResponse (many)

User (1) ──< PulseInvite (many)

PulseQuestion (1) ──< PulseInvite (many)
PulseQuestion (1) ──< PulseResponse (many)

Note: PulseResponse intentionally has NO link to User
```

## Support

For questions or issues:
1. Check existing seed data: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"PulseResponse\";"`
2. Verify tenant settings: `curl http://localhost:3000/admin/settings` (requires auth)
3. Review logs for anonymity enforcement warnings

---

**Status:** ✅ Phase 1 Complete
**Next:** Phase 2 - Email Invitations & Scheduled Sending

