# Weekly Pulse - Phase 2 Implementation

## Overview
Phase 2 implements email invitations, one-tap responses, and automated scheduling for Weekly Pulse. Users receive beautifully formatted emails with inline response buttons that take just 5 seconds to complete.

## What's Included

### 1. Email Invitation Template
Beautiful, responsive email with one-tap response buttons.

**Features:**
- Color-coded emoji buttons for intuitive responses
- Supports both Likert (1-5) and NPS (0-10) scales
- Privacy notice emphasizing anonymity
- 7-day expiration notice
- Mobile-responsive design

**Email Preview:**

```
Your Weekly Pulse 💙

Hi Alice,

Take 5 seconds to share how you're feeling this week. Your
response is completely anonymous and helps us build a better
workplace.

┌─────────────────────────────────────────────────┐
│  How recognized do you feel for your            │
│  contributions this week?                       │
└─────────────────────────────────────────────────┘

Click the number that best represents your answer:

  😞    😕    😐    🙂    😄
  1     2     3     4     5

🔒 Your response is anonymous. Individual responses
are never shared. We only show aggregates when there
are at least 5 responses.
```

### 2. One-Tap Response Endpoint

**GET /pulse/respond?token={token}&score={score}**

Clicking a button in the email submits the response instantly with a single HTTP request.

**Features:**
- Token-based authentication (no login required)
- Automatic expiration handling
- Duplicate submission prevention
- Score validation based on question scale
- Beautiful confirmation pages

**Response Flow:**
1. User clicks button in email (e.g., `...?token=abc123&score=4`)
2. Server validates token (not expired, not already used)
3. Creates anonymous response record
4. Marks invite as completed
5. Shows thank you page

**Example Confirmation Page:**
```html
✅ Thank You!

Your response has been recorded.

┌────────────────────────────────────────┐
│ How recognized do you feel for your    │
│ contributions this week?               │
└────────────────────────────────────────┘

Your feedback helps us build a better workplace. 🙏

You can close this window now.
```

### 3. Invitation Service

**`invitationService.ts`** - Handles sending pulse invitations via email.

**Key Functions:**

```typescript
// Send invitations to specified users
await sendPulseInvitations(prisma, {
  tenantId: 'tenant-123',
  questionId: 'question-456',
  userIds: ['user-1', 'user-2', 'user-3'],
  cohortName: 'weekday-0',
});

// Trigger pulse for a specific cohort
await triggerPulseForCohort(prisma, 'tenant-123', 'weekday-0');

// Select question for cohort (round-robin rotation)
const questionId = await selectQuestionForCohort(
  prisma,
  'tenant-123',
  'weekday-0'
);
```

**What it does:**
- Generates unique tokens for each invite
- Sends personalized emails with user names
- Creates `PulseInvite` records for tracking
- Handles failures gracefully (reports but continues)
- Sets 7-day expiration on invite tokens

### 4. Automated Scheduler

**`scheduler.ts`** - Cron-based automation for daily pulse sends.

**Default Schedule:**
- **Time**: 9:00 AM (configurable via `PULSE_CRON_SCHEDULE`)
- **Frequency**: Weekdays only (Monday-Friday)
- **Cohort**: Rotates based on day of week

**Cohort Rotation Logic:**
```
Monday    -> weekday-0
Tuesday   -> weekday-1
Wednesday -> weekday-2
Thursday  -> weekday-3
Friday    -> weekday-4
Saturday  -> weekday-4 (fallback to Friday)
Sunday    -> weekday-4 (fallback to Friday)
```

**How it works:**
1. Cron job triggers at configured time (default: 9 AM)
2. Fetches all tenants with pulse enabled
3. Determines today's cohort
4. Selects question for cohort (round-robin)
5. Sends invitations to all users in cohort
6. Logs results

**Starting/Stopping:**
```typescript
// Automatically started in server.ts if PULSE_ENABLED=true
startPulseScheduler(prisma);

// Gracefully stopped on shutdown
stopPulseScheduler();
```

### 5. Admin Trigger Endpoint

**POST /admin/pulse/trigger**

Manually trigger pulse send for testing (requires admin permission).

**Request:**
```bash
curl -X POST http://localhost:3000/admin/pulse/trigger \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -H "x-mock-sso-user: admin@demo.pulsestage.dev" \
  -d '{
    "tenantId": "tenant-id-here",
    "cohortName": "weekday-0"
  }'
```

**Options:**
- No params: Send to all tenants' today cohorts
- `tenantId` only: Send to that tenant's today cohort
- `tenantId` + `cohortName`: Send to specific cohort

**Response:**
```json
{
  "success": true,
  "message": "Pulse send triggered successfully",
  "result": {
    "sent": 15,
    "failed": 0,
    "errors": []
  }
}
```

## Testing Locally

### 1. Enable Pulse
Add to your `.env`:
```bash
PULSE_ENABLED=true
PULSE_CRON_SCHEDULE="0 9 * * 1-5"  # 9 AM weekdays
FRONTEND_URL=http://localhost:5173
```

### 2. Rebuild and Restart
```bash
cd api
npm run build
npm run dev
```

You should see:
```
📅 Starting Pulse scheduler (cron: 0 9 * * 1-5)
✅ Pulse scheduler started
```

### 3. Manually Trigger a Test Send
```bash
# Get your tenant ID
TENANT_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM \"Tenant\" WHERE slug='default';" | xargs)

# Trigger pulse for today's cohort
curl -X POST http://localhost:3000/admin/pulse/trigger \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -H "x-mock-sso-user: admin@demo.pulsestage.dev" \
  -d "{\"tenantId\": \"$TENANT_ID\"}"
```

### 4. Check Mailpit
Open http://localhost:8025 to see the email:
- Beautiful formatted HTML
- One-tap response buttons
- Privacy notice

### 5. Test One-Tap Response
1. Click any score button in the email
2. Should see "Thank You!" confirmation page
3. Verify response in database:
```sql
SELECT * FROM "PulseResponse" ORDER BY "submittedAt" DESC LIMIT 1;
```

### 6. Run Tests
```bash
cd api
npm test -- pulse
```

Should see:
```
✓ Pulse Service tests (Phase 1)
✓ Pulse Response Service tests (Phase 2)
  ✓ should successfully submit response with valid token
  ✓ should reject invalid token
  ✓ should reject expired token
  ✓ should reject already completed token
  ✓ should accept optional comment
  ... 10+ more tests
```

## Question Rotation Strategy

Each cohort receives a different question using round-robin rotation:

**Example with 10 questions:**
```
weekday-0 (Monday)    -> Question 0 (recognition)
weekday-1 (Tuesday)   -> Question 1 (alignment)
weekday-2 (Wednesday) -> Question 2 (support)
weekday-3 (Thursday)  -> Question 3 (wellbeing)
weekday-4 (Friday)    -> Question 4 (confidence)
```

Next week, rotation continues:
```
weekday-0 (Monday)    -> Question 5 (growth)
...
```

This ensures:
- Users see different questions over time
- No question is oversampled
- Balanced coverage across categories

## Environment Variables

### Required for Phase 2
```bash
# Enable Weekly Pulse feature
PULSE_ENABLED=true

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Email configuration (use existing email setup)
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM=pulse@pulsestage.dev
```

### Optional
```bash
# Custom cron schedule (default: "0 9 * * 1-5")
# Format: minute hour day month weekday
PULSE_CRON_SCHEDULE="0 9 * * 1-5"

# Timezone for scheduler (default: UTC)
TZ=America/New_York

# Anonymity threshold (default: 5)
PULSE_ANON_THRESHOLD=5
```

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/pulse/summary` | GET | Required | Aggregated data with anonymity |
| `/pulse/respond` | GET | None (token) | One-tap response page |
| `/pulse/respond` | POST | None (token) | Submit response (form) |
| `/admin/pulse/trigger` | POST | Admin | Manual pulse send |

## Database Records

### PulseInvite
Tracks sent invitations:
```sql
SELECT 
  token, 
  status, 
  "sentAt", 
  "completedAt",
  "expiresAt"
FROM "PulseInvite"
WHERE "tenantId" = 'your-tenant-id'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Statuses:**
- `PENDING`: Created but not yet sent
- `SENT`: Email successfully delivered
- `COMPLETED`: User responded
- `EXPIRED`: Token expired before response

### PulseResponse
Anonymous responses:
```sql
SELECT 
  "questionId", 
  score, 
  comment, 
  "cohortName",
  "submittedAt"
FROM "PulseResponse"
WHERE "tenantId" = 'your-tenant-id'
ORDER BY "submittedAt" DESC
LIMIT 10;
```

Note: **No userId field** - responses are completely anonymous!

## Troubleshooting

### Emails Not Sending
1. Check Mailpit is running: `docker ps | grep mailpit`
2. Verify email config in `.env`
3. Check API logs for email errors
4. Test with manual trigger: `POST /admin/pulse/trigger`

### Scheduler Not Running
1. Verify `PULSE_ENABLED=true` in `.env`
2. Check logs for "Starting Pulse scheduler"
3. Verify cron syntax: https://crontab.guru/
4. Test manual trigger to isolate scheduler issue

### Token Invalid/Expired
1. Tokens expire after 7 days
2. Tokens can only be used once
3. Check `PulseInvite` table for status
4. Manually trigger new pulse to get fresh tokens

### No Responses Showing in Summary
1. Need at least 5 responses for anonymity
2. Check `PulseResponse` table for raw data
3. Use `threshold` query param to override: `?threshold=1`
4. Verify tenant ID matches

## Security Considerations

### Token Security
- Tokens are UUIDs (cryptographically random)
- Single-use only (marked COMPLETED after use)
- 7-day expiration
- No user authentication required (by design)

### Anonymity Guarantees
- **No userId in PulseResponse table** (enforced by schema)
- Individual responses never exposed via API
- Aggregates only shown when >= threshold
- Tokens cannot be reverse-engineered to user

### Rate Limiting
Response endpoint is intentionally **not rate limited** to support:
- Email client pre-fetching (common with modern clients)
- Retry attempts if user's connection drops
- Accessibility tools that may make multiple requests

However, duplicate submissions are prevented via:
- Token marked as COMPLETED after first use
- Database constraint ensures one response per invite

## What's Next (Phase 3)

Phase 3 will add Slack integration:
- Slack Bot setup instructions
- Direct message delivery
- Interactive Slack buttons
- Slack workspace integration

---

**Status:** ✅ Phase 2 Complete
**Next:** Phase 3 - Slack Integration (Optional)

