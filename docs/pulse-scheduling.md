# Pulse Scheduling - Automated Invitations

## Overview

The Pulse Scheduler automatically sends Weekly Pulse invitations to users based on configured schedules. It uses cohort rotation to ensure different users receive invitations each day.

## How It Works

### 1. Schedule Configuration

Each tenant has a `PulseSchedule` that defines:
- **Cadence**: Weekly, Biweekly, or Monthly (currently only WEEKLY is supported)
- **Day of Week**: 0 = Sunday, 1 = Monday, ... 6 = Saturday
- **Time of Day**: HH:mm format (e.g., "09:00")
- **Rotating Cohorts**: Whether to use cohort rotation (recommended: true)
- **Enabled**: Whether the schedule is active

### 2. Cohort Rotation

Users are divided into 5 cohorts (`weekday-0` through `weekday-4`):
- **Monday**: `weekday-0` (cohort 0)
- **Tuesday**: `weekday-1` (cohort 1)
- **Wednesday**: `weekday-2` (cohort 2)
- **Thursday**: `weekday-3` (cohort 3)
- **Friday**: `weekday-4` (cohort 4)
- **Saturday/Sunday**: Maps to `weekday-4`

This ensures:
- No user receives more than 1 invitation per week
- Fresh cohort each day
- Distributed load across the week

### 3. Question Selection

Questions are rotated based on the day of the week:
```typescript
questionIndex = currentDayOfWeek % totalQuestions
```

This ensures varied questions across the week.

### 4. Job Schedule

The pulse invitation job runs **every 15 minutes** and checks:
1. Is today the scheduled day for this tenant?
2. Is the current time within 15 minutes of the scheduled time?
3. Are there users who haven't received an invite this week?

If all conditions are met, it sends invitations.

## Configuration

### Environment Variables

```bash
# Enable Pulse scheduler
PULSE_ENABLED=true

# Timezone for scheduling (optional, defaults to UTC)
TZ=America/New_York
```

### Database Setup

Each tenant needs:

1. **Active Questions**:
```sql
SELECT * FROM "PulseQuestion" WHERE "tenantId" = '<id>' AND active = true;
```

2. **Schedule**:
```sql
SELECT * FROM "PulseSchedule" WHERE "tenantId" = '<id>' AND enabled = true;
```

3. **Cohorts**:
```sql
SELECT * FROM "PulseCohort" WHERE "tenantId" = '<id>';
```

## Testing

### Manual Trigger (Admin Only)

Send invitations immediately via API:

```bash
curl -X POST http://localhost:3000/admin/pulse/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "tenantId": "<tenant-id>",
    "cohortName": "weekday-0"
  }'
```

Parameters:
- `tenantId` (optional): Send to specific tenant, or all tenants if omitted
- `cohortName` (optional): Send to specific cohort, or today's cohort if omitted

### Check Scheduler Status

The scheduler logs its activity in the console:

```
📅 Initializing scheduler...
📅 Registered job: pulse-invitations (*/15 * * * *)
✅ Started job: pulse-invitations
✅ Scheduler started with 1 job(s)
```

When the job runs:
```
⏰ Running scheduled job: pulse-invitations
📊 Checking for scheduled pulse invitations...
Found 1 enabled schedule(s)
✅ Processing pulse for tenant: default
📅 Using rotating cohort: weekday-1 (day 2)
📧 Sending invitations to 1 user(s) for question: How recognized do you feel...
📊 Completed pulse for tenant default: 1 sent, 0 errors
✅ Pulse invitation job completed
✅ Completed job: pulse-invitations
```

## Architecture

### Components

1. **Scheduler** (`src/scheduler/scheduler.ts`):
   - General-purpose cron job manager
   - Handles registration, starting/stopping jobs
   - Can support multiple job types

2. **Pulse Invitation Job** (`src/scheduler/jobs/sendPulseInvitations.ts`):
   - Checks all enabled schedules
   - Determines which cohort should receive invitations
   - Filters users who already have invites this week
   - Sends invitations via `sendPulseInvitations`

3. **Integration** (`src/server.ts`):
   - Initializes scheduler on startup
   - Starts jobs if `PULSE_ENABLED=true`
   - Gracefully stops on shutdown

### Flow Diagram

```
[Scheduler] --every 15 min--> [Pulse Invitation Job]
                                      |
                                      v
                             [Check Enabled Schedules]
                                      |
                                      v
                           [Match Day + Time Window?] --No--> Skip
                                      |
                                     Yes
                                      v
                              [Get Today's Cohort]
                                      |
                                      v
                           [Filter Eligible Users]
                             (no invite this week)
                                      |
                                      v
                              [Select Question]
                           (rotate by day of week)
                                      |
                                      v
                            [Send Pulse Invitations]
                                      |
                                      v
                            [Create PulseInvite records]
                            [Send emails via queue]
```

## Troubleshooting

### No Invitations Being Sent

Check:
1. `PULSE_ENABLED=true` in `.env`
2. `PulseSchedule.enabled = true` for the tenant
3. `PulseSchedule.dayOfWeek` matches current day
4. `PulseSchedule.timeOfDay` is within 15 minutes of current time
5. Active questions exist for the tenant
6. Cohort exists and has users
7. Users haven't already received invite this week

### Duplicate Invitations

The job checks for existing invites from the current week (Sunday to Saturday). If you see duplicates:
- Check for multiple running instances of the API
- Verify database constraints are in place
- Check logs for errors during invite creation

### Wrong Cohort Receiving Invitations

Cohort selection is deterministic based on day of week:
```typescript
const cohortIndex = dayOfWeek === 0 ? 4 : dayOfWeek - 1;
const cohortName = `weekday-${cohortIndex}`;
```

Verify:
- Server timezone is correctly set
- `dayOfWeek` calculation matches your expectations

## Future Enhancements

- [ ] Support for BIWEEKLY and MONTHLY cadence
- [ ] Slack integration (in addition to email)
- [ ] Configurable time windows (not just 15 minutes)
- [ ] Per-user frequency preferences
- [ ] Holiday/blackout date support
- [ ] Retry logic for failed sends
- [ ] Monitoring and alerting dashboard

## API Endpoints

### POST /admin/pulse/trigger

Manually trigger pulse send (admin only).

**Request**:
```json
{
  "tenantId": "uuid",  // optional
  "cohortName": "weekday-0"  // optional
}
```

**Response**:
```json
{
  "success": true,
  "message": "Pulse send triggered successfully",
  "result": {
    "sent": 5,
    "failed": 0,
    "errors": []
  }
}
```

## Monitoring

Key metrics to track:
- Invitations sent per day
- Failure rate
- Response rate (completions per invite)
- Time to complete (from invite to response)
- Participation rate per cohort

These can be queried from:
- `PulseInvite` table (status, sentAt)
- `PulseResponse` table (submittedAt)

