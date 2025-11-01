# Weekly Pulse System

**Purpose:** Regular, anonymous team pulse checks with rotating questions and cohorts.

**Key Principle:** Anonymity-first design - responses cannot be traced to individuals.

---

## Overview

The Pulse system sends weekly check-in questions to users via email, collecting anonymous sentiment data while respecting privacy.

### Core Guarantees

1. **Anonymity**: Responses stored WITHOUT user ID
2. **Threshold Enforcement**: Aggregates only shown when n ≥ threshold (default: 5)
3. **Team-Scoped**: Questions and responses associated with teams
4. **Rotating Cohorts**: Different users receive different questions
5. **One-Tap Response**: Email links with unique tokens (no login required)

---

## Architecture

```
┌─────────────────┐
│  Pulse Schedule │  (Cron: daily at 9:00 AM)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Cohort Selector │  (Which cohort gets pulse today?)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│Question Rotation│  (Round-robin through active questions)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Invite Generator│  (Create unique tokens, send emails)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Email Delivery  │  (BullMQ queue → user inboxes)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  User Response  │  (One-tap email link)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Store Response  │  (NO user ID, only score + team + question)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Aggregation    │  (Calculate team averages, check threshold)
└─────────────────┘
```

---

## Cohort System

**Purpose:** Distribute questions evenly, avoid survey fatigue.

### What is a Cohort?

A **cohort** is a group of users who receive pulse invites on the same day(s) of the week.

**Example:**
- **Weekday Cohort** (Mon-Fri): 60% of users
- **Weekend Cohort** (Sat-Sun): 40% of users

### Cohort Assignment

**Created during seeding or user onboarding:**
```javascript
// Deterministic assignment based on user ID
const cohortIndex = hashUserId(user.id) % numCohorts
assignUserToCohort(user, `cohort-${cohortIndex}`)
```

**Result:** Each user belongs to exactly one cohort.

### Rotation Schedule

**Daily rotation (default: 9:00 AM):**
```
Day of Week → Cohort Index
──────────────────────────
Monday    (1) → Cohort 0
Tuesday   (2) → Cohort 1
Wednesday (3) → Cohort 2
Thursday  (4) → Cohort 3
Friday    (5) → Cohort 4
Saturday  (6) → Cohort 4 (wrap around)
Sunday    (0) → Cohort 4 (wrap around)
```

**Simplified (2 cohorts):**
```
Weekday  → Cohort 0
Weekend  → Cohort 1
```

### Benefits

1. **Load Distribution**: Not all users get pulse on same day
2. **Question Variety**: Each cohort gets different questions
3. **Participation Boost**: Less survey fatigue
4. **Daily Freshness**: New responses every day

---

## Question Management

### Question Types

**All pulse questions share:**
- Short text (max 200 characters)
- Likert scale response (1-5)
- Active/inactive status
- Team association (optional)

**Example Questions:**
- "How satisfied are you with work-life balance?"
- "Do you have the resources needed to succeed?"
- "How engaged do you feel with your work?"
- "Rate your team collaboration this week"

### Question Rotation

**Round-robin algorithm:**
```javascript
const questions = getActiveQuestions(tenantId)
const cohortIndex = getCohortIndex(cohortName)  // "weekday-0" → 0
const questionIndex = cohortIndex % questions.length
const selectedQuestion = questions[questionIndex]
```

**Result:** Each cohort gets a different question, cycles through all questions over time.

### Admin Management

**Endpoints:**
- `GET /admin/pulse/questions` - List all questions
- `POST /admin/pulse/questions` - Create new question
- `PUT /admin/pulse/questions/:id` - Update question
- `DELETE /admin/pulse/questions/:id` - Deactivate question

**UI:** Admin panel (planned)

---

## Invite System

### Invite Generation

**When cron runs:**
1. Determine today's cohort
2. Select question (round-robin)
3. Get users in cohort
4. For each user:
   - Generate unique token (UUID)
   - Create PulseInvite record
   - Queue email job

**Invite Record:**
```javascript
{
  id: "uuid",
  token: "unique-token-abc123",
  userId: "user-uuid",
  questionId: "question-uuid",
  cohortName: "weekday-0",
  teamId: user.primaryTeamId,  // Associated with user's primary team
  sentAt: "2025-01-15T09:00:00Z",
  expiresAt: "2025-01-22T09:00:00Z",  // 7 days
  respondedAt: null,  // Updated when user responds
  tenantId: "tenant-uuid"
}
```

### Email Template

**Subject:** "Weekly Pulse - How are you feeling?"

**Body:**
```
Hi Alice,

Quick check-in for this week:

"How satisfied are you with work-life balance?"

[1] [2] [3] [4] [5]
(Click a number to respond - no login required!)

Your response is anonymous and helps improve our team.

Link expires in 7 days.

──────────
PulseStage • [Unsubscribe]
```

**One-Tap Links:**
```
https://yourcompany.com/pulse/respond?token=abc123&score=1
https://yourcompany.com/pulse/respond?token=abc123&score=2
https://yourcompany.com/pulse/respond?token=abc123&score=3
https://yourcompany.com/pulse/respond?token=abc123&score=4
https://yourcompany.com/pulse/respond?token=abc123&score=5
```

### Token Security

- **Unique per invite:** Cannot reuse tokens
- **Single-use:** Token invalidated after response
- **Time-limited:** 7-day expiration
- **Unpredictable:** UUID v4 (122 bits of entropy)
- **HTTPS-only:** Tokens transmitted securely (production)

---

## Response Flow

### User Experience

1. User receives email (9:00 AM on their cohort day)
2. Clicks a score button (1-5)
3. Redirected to confirmation page
4. Response stored anonymously
5. Thank you message displayed

**No login required.** Token authenticates the invite.

### Backend Processing

**Endpoint:** `GET /pulse/respond?token=abc123&score=4`

**Flow:**
```javascript
// 1. Validate token
const invite = await prisma.pulseInvite.findUnique({ where: { token } })
if (!invite || invite.respondedAt || invite.expiresAt < now) {
  return error("Invalid or expired invite")
}

// 2. Create response (NO userId!)
await prisma.pulseResponse.create({
  data: {
    inviteId: invite.id,
    questionId: invite.questionId,
    teamId: invite.teamId,
    score: score,
    respondedAt: now,
    tenantId: invite.tenantId
    // NOTE: NO userId field!
  }
})

// 3. Mark invite as responded
await prisma.pulseInvite.update({
  where: { id: invite.id },
  data: { respondedAt: now }
})

// 4. Show confirmation page
return "Thank you! Your response has been recorded."
```

### Anonymity Enforcement

**Critical:** `PulseResponse` table has NO `userId` field.

**Schema:**
```prisma
model PulseResponse {
  id          String   @id @default(uuid())
  inviteId    String   // Link to invite (for deduplication)
  questionId  String   // Which question
  teamId      String?  // Which team (for team-scoped aggregates)
  score       Int      // 1-5
  respondedAt DateTime
  tenantId    String   // Tenant isolation
  
  // NO userId field!
  // NO email field!
  // NO IP address field!
}
```

**Result:** Responses cannot be traced to individuals, even by admins.

---

## Aggregation & Display

### Threshold Enforcement

**Default threshold:** 5 responses

**Rule:** Only show aggregates when `count(responses) >= threshold`

**Example:**
```javascript
// Team A: 12 responses → Show average
// Team B: 3 responses → Show "Insufficient responses"
```

### Aggregate Calculation

**Endpoint:** `GET /pulse/summary?range=12w&team=team-id`

**Query:**
```sql
SELECT 
  questionId,
  teamId,
  COUNT(*) as responseCount,
  AVG(score) as averageScore,
  STDDEV(score) as stdDev,
  MIN(respondedAt) as firstResponse,
  MAX(respondedAt) as lastResponse
FROM PulseResponse
WHERE tenantId = :tenantId
  AND respondedAt >= :startDate
  AND respondedAt <= :endDate
  AND (teamId = :teamId OR :teamId IS NULL)
GROUP BY questionId, teamId
HAVING COUNT(*) >= :threshold  -- CRITICAL: Enforces threshold
```

### Response Format

```json
{
  "summary": {
    "totalResponses": 847,
    "totalInvites": 1040,
    "participationRate": 81.4,
    "dateRange": {
      "start": "2024-10-15",
      "end": "2025-01-15"
    }
  },
  "questions": [
    {
      "id": "question-uuid",
      "text": "How satisfied are you with work-life balance?",
      "responseCount": 156,
      "averageScore": 3.8,
      "trend": {
        "weekly": [
          { "week": "2024-W42", "avg": 3.6, "count": 12 },
          { "week": "2024-W43", "avg": 3.9, "count": 14 },
          ...
        ]
      },
      "byTeam": [
        {
          "teamId": "team-uuid",
          "teamName": "Engineering",
          "responseCount": 67,  // ≥ 5, show data
          "averageScore": 3.7
        },
        {
          "teamId": "team-uuid-2",
          "teamName": "Product",
          "responseCount": 3,   // < 5, suppress
          "averageScore": null,
          "message": "Insufficient responses to protect anonymity"
        }
      ]
    }
  ]
}
```

### Visualization

**Dashboard displays:**
- Line charts (weekly trends)
- Bar charts (team comparisons, only if ≥ threshold)
- Participation rate
- Top/bottom questions

---

## Scheduler

**Technology:** node-cron

**Schedule:** Daily at 9:00 AM (configurable)

**Script:** `api/scripts/cron/send-pulse-invites.ts`

### Cron Configuration

```javascript
// Runs every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  await processPulseSends(prisma)
})
```

### Processing Logic

```javascript
async function processPulseSends(prisma) {
  // 1. Get all tenants
  const tenants = await prisma.tenant.findMany()
  
  for (const tenant of tenants) {
    // 2. Check if pulse enabled
    const settings = tenant.settings?.settings
    if (!settings?.pulse?.enabled) continue
    
    // 3. Get schedule
    const schedule = await prisma.pulseSchedule.findUnique({
      where: { tenantId: tenant.id }
    })
    if (!schedule || !schedule.rotatingCohorts) continue
    
    // 4. Determine today's cohort
    const cohortName = getTodaysCohort()
    
    // 5. Send invites
    await triggerPulseForCohort(prisma, tenant.id, cohortName)
  }
}
```

### Deployment

**Development:**
- Cron runs in API process
- Can trigger manually: `npm run cron:pulse`

**Production:**
- Cron runs in API process (always-on server)
- OR external cron (crontab, Kubernetes CronJob)
- Recommend: Kubernetes CronJob for reliability

---

## Configuration

### Tenant Settings

```javascript
{
  pulse: {
    enabled: false,            // Feature flag
    anonThreshold: 5,          // Min responses to show aggregates
    defaultCadence: 'weekly',  // 'weekly' | 'biweekly' | 'monthly'
    defaultTime: '09:00',      // HH:mm format
    rotatingCohorts: true,     // Enable cohort rotation
    channelSlack: false,       // Future: Slack DM delivery
    channelEmail: true         // Email delivery (default)
  }
}
```

### Pulse Schedule (Per Tenant)

```javascript
{
  tenantId: "tenant-uuid",
  enabled: true,
  cadence: "weekly",
  time: "09:00",
  timezone: "America/New_York",
  rotatingCohorts: true,
  numCohorts: 5
}
```

---

## Privacy & Compliance

### GDPR Considerations

**Right to Access:**
- Users can request their invite history
- Cannot retrieve responses (no userId link)

**Right to Erasure:**
- Delete user → delete invites
- Responses remain (anonymized)

**Data Minimization:**
- Only store essential data
- No IP addresses, user agents, or other tracking

### Anonymity Verification

**Audit query (admins can run):**
```sql
-- Verify NO userId in responses
SELECT COUNT(*) FROM PulseResponse WHERE userId IS NOT NULL;
-- Expected: 0 (column doesn't exist)

-- Verify threshold enforcement
SELECT questionId, teamId, COUNT(*)
FROM PulseResponse
GROUP BY questionId, teamId
HAVING COUNT(*) < 5;
-- Should NOT appear in dashboards
```

---

## Development vs Production

| Feature | Development | Production |
|---------|------------|------------|
| **Cron Scheduler** | Runs in API process | Kubernetes CronJob (recommended) |
| **Email Delivery** | Mailpit (local testing) | SMTP or Resend |
| **Redis** | Optional | Required (for email queue) |
| **Anonymity** | Enforced | Enforced |
| **Threshold** | Configurable (default: 5) | Configurable (default: 5) |

---

## Troubleshooting

### Invites Not Sending

**Check:**
1. Pulse enabled in tenant settings
2. PulseSchedule exists and enabled
3. Cohorts exist with users assigned
4. Active questions exist
5. Email worker running (requires Redis)
6. Cron scheduler running

**Debug:**
```bash
# Check tenant settings
psql -c "SELECT settings FROM TenantSettings WHERE tenantId='...'"

# Check schedule
psql -c "SELECT * FROM PulseSchedule WHERE tenantId='...'"

# Check cohorts
psql -c "SELECT name, jsonb_array_length(userIds::jsonb) as userCount FROM PulseCohort"

# Manually trigger
npm run cron:pulse
```

### Responses Not Appearing

**Check:**
1. Token valid (not expired, not already used)
2. Response saved to database
3. Aggregates meet threshold (≥ 5)

**Debug:**
```sql
-- Check invite status
SELECT * FROM PulseInvite WHERE token = 'abc123';

-- Check response count
SELECT questionId, teamId, COUNT(*) 
FROM PulseResponse 
GROUP BY questionId, teamId;
```

### Threshold Not Enforced

**Symptom:** Small teams seeing individual scores

**Fix:**
1. Check query includes `HAVING COUNT(*) >= :threshold`
2. Verify frontend suppresses low-count teams
3. Audit query logic

---

## Future Enhancements

### Planned Features

1. **Slack Integration** - Send invites via Slack DM
2. **Custom Cadences** - Biweekly, monthly, custom schedules
3. **Question Library** - Pre-built questions by category
4. **Benchmarking** - Compare to industry averages
5. **Alerts** - Notify admins of score drops
6. **Comments** - Optional anonymous feedback text
7. **Multi-Question Pulses** - Multiple questions per invite

---

## Related Documentation

- `/handbook/INTEGRATIONS/EMAIL.md` - Email delivery
- `/handbook/DATA_MODEL_SNAPSHOT.md` - Pulse table schemas
- `/handbook/SECURITY_MODEL.md` - Anonymity guarantees
- `/api/src/pulse/` - Implementation details

