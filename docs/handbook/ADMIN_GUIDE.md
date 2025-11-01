# Administrator Guide

**Audience:** Administrators and owners managing PulseStage deployments.

**Prerequisites:** `admin.access` permission (admin or owner role).

---

## Admin Panel Access

**URL:** `/admin` (relative to your deployment)

**Permission Required:** `admin.access`

**Roles with Access:**
- **Admin:** Full admin panel access
- **Owner:** Full admin panel access
- **Moderator:** Limited access (moderation queue only)

---

## Tenant Settings Management

**Endpoint:** `GET/POST /admin/tenant-settings`

### Settings Structure

#### 1. Questions Configuration

```javascript
questions: {
  minLength: 10,     // Minimum question length (characters)
  maxLength: 2000    // Maximum question length (characters)
}
```

**Use Cases:**
- Prevent spam (too short)
- Prevent essays (too long)
- Encourage concise questions

#### 2. Users Configuration

```javascript
users: {
  defaultRole: 'member'  // 'viewer' | 'member' | 'moderator' | 'admin' | 'owner'
}
```

**Use Cases:**
- Set default role for new OAuth users
- Restrict new users to viewer-only
- Auto-promote to member

#### 3. Security Configuration

```javascript
security: {
  sessionTimeout: 8,          // Hours (user sessions)
  adminSessionTimeout: 8,     // Hours (admin sessions)
  rateLimits: {
    questionsPerHour: 10,     // Max questions user can submit
    upvotesPerMinute: 20,     // Max upvotes per minute
    responsesPerHour: 5,      // Max answers per hour
    searchPerMinute: 30       // Max searches per minute
  }
}
```

**Use Cases:**
- Increase timeout for trusted environments
- Tighten rate limits if abuse detected
- Balance UX vs security

#### 4. Branding Configuration

```javascript
branding: {
  theme: 'refined-teal',         // 'executive-blue' | 'modern-purple' | 'refined-teal'
  primaryColor: '#14B8A6',       // Override theme primary (optional)
  accentColor: '#FB923C',        // Override theme accent (optional)
  logoUrl: 'https://...',        // Custom logo URL
  faviconUrl: 'https://...'      // Custom favicon URL
}
```

**Use Cases:**
- White-label deployment
- Match company branding
- A/B test themes

**See:** `/handbook/INTEGRATIONS/THEMES.md` (to be created) for theme details

#### 5. Features Configuration

```javascript
features: {
  allowAnonymousQuestions: true,      // Let users submit without login
  requireQuestionApproval: false,     // All questions go to moderation queue
  enableEmailNotifications: false     // Send email notifications
}
```

**Use Cases:**
- Disable anonymous for sensitive topics
- Enable approval for new deployments
- Turn on notifications when email configured

#### 6. Pulse Configuration

```javascript
pulse: {
  enabled: false,               // Feature flag
  anonThreshold: 5,             // Min responses to show aggregates
  defaultCadence: 'weekly',     // 'weekly' | 'biweekly' | 'monthly'
  defaultTime: '09:00',         // HH:mm format
  rotatingCohorts: true,        // Enable cohort rotation
  channelSlack: false,          // Slack DM delivery (future)
  channelEmail: true            // Email delivery
}
```

**See:** `/handbook/PULSE_SYSTEM.md` for full pulse documentation

---

## Email Queue Monitoring

**Endpoint:** `GET /admin/email-queue`

**Permission:** `admin.access`

### Queue Metrics

```json
{
  "metrics": {
    "active": 2,        // Currently processing
    "waiting": 15,      // Queued
    "completed": 342,   // Successfully sent
    "failed": 3         // Failed (check errors)
  }
}
```

### Recent Jobs

**Active Jobs:**
- Currently being processed
- Shows attempt number

**Waiting Jobs:**
- Queued for processing
- Shows timestamp queued

**Completed Jobs:**
- Last 20 successful sends
- Shows completion timestamp
- Includes message ID (for tracking)

**Failed Jobs:**
- Last 20 failures
- **Critical:** Shows failure reason
- Shows number of attempts

### Common Failure Reasons

| Error | Cause | Fix |
|-------|-------|-----|
| `SMTP connection timeout` | Network/firewall issue | Check SMTP host accessibility |
| `Authentication failed` | Invalid credentials | Verify SMTP_USER/SMTP_PASS |
| `Invalid API key` | Resend key wrong | Check RESEND_API_KEY |
| `Recipient rejected` | Invalid email address | Clean up user email data |
| `Rate limit exceeded` | Too many emails | Slow down sending or upgrade plan |

### Troubleshooting

**No emails sending:**
1. Check Redis connection (required for queue)
2. Check email worker started (logs: "Email worker started")
3. Check provider credentials
4. Review failed jobs for errors

**Emails stuck in queue:**
1. Check `waiting` count
2. Verify worker is processing (check `active`)
3. Restart email worker if stuck

---

## Moderation Queue

**Endpoint:** `/moderation/queue` (frontend)

**API:** `GET /questions?status=UNDER_REVIEW`

**Permission:** `question.answer` (moderators+)

### Queue Contents

Questions flagged by content moderation system:
- Medium/low confidence violations
- User-reported content (future)
- Manual review requests (future)

### Moderation Actions

**Approve:**
- Changes status from `UNDER_REVIEW` → `OPEN`
- Question becomes visible to all users
- Audit log created

**Reject:**
- Deletes question
- User notified (future)
- Audit log created

**Edit & Approve:**
- Moderator fixes minor issues (typos, formatting)
- Then approves
- Original content preserved in audit log

### Team Scoping

**Moderators:** See questions from their teams only

**Admins:** See questions from all teams in tenant

**Example:**
- Moderator on Engineering team → Only sees Engineering questions
- Admin → Sees all questions across all teams

---

## Audit Logs

**Endpoint:** `GET /admin/audit-logs`

**Permission:** `audit.view` (admin or owner only)

### Query Parameters

```
?userId=<uuid>         Filter by user
?action=<string>       Filter by action type
?entityType=<string>   Filter by entity (question, answer, user, etc.)
?entityId=<uuid>       Filter by specific entity
?startDate=<ISO date>  Filter by date range (start)
?endDate=<ISO date>    Filter by date range (end)
?limit=50              Results per page
?offset=0              Pagination offset
```

### Logged Actions

**Questions:**
- `question.create`
- `question.update`
- `question.delete`
- `question.answer`
- `question.pin`
- `question.freeze`
- `question.moderation.flagged`
- `question.auto_reject`
- `question.approve`
- `question.reject`

**Upvotes:**
- `upvote.add`
- `upvote.remove`

**Tags:**
- `tag.create`
- `tag.add`
- `tag.remove`
- `tag.delete`

**Users:**
- `user.create`
- `user.update`
- `user.delete`
- `user.login`
- `user.logout`

**Teams:**
- `team.create`
- `team.update`
- `team.delete`
- `team_member.add`
- `team_member.remove`
- `team_member.role_change`

**Settings:**
- `settings.update`

### Audit Log Entry

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "action": "question.moderation.flagged",
  "entityType": "question",
  "entityId": "uuid",
  "before": { ... },        // State before change
  "after": { ... },         // State after change
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0 ...",
  "metadata": {             // Additional context
    "reasons": ["profanity"],
    "confidence": "high",
    "providers": ["local", "openai"]
  },
  "createdAt": "2025-01-15T14:23:45Z"
}
```

### Use Cases

**Security Investigation:**
```
GET /admin/audit-logs?action=user.login&startDate=2025-01-01
```

**Change Tracking:**
```
GET /admin/audit-logs?entityType=settings&action=settings.update
```

**User Activity:**
```
GET /admin/audit-logs?userId=<uuid>&limit=100
```

**Moderation Review:**
```
GET /admin/audit-logs?action=question.moderation.flagged
```

---

## Data Export

**Permission:** `data.export` (admin or owner only)

**Status:** Partially implemented

### Planned Export Types

1. **Questions Export**
   - All questions (open + answered)
   - CSV or JSON format
   - Includes: body, status, upvotes, responses, timestamps

2. **Pulse Data Export**
   - Aggregate pulse responses
   - **Never includes individual responses** (anonymity)
   - CSV or JSON format
   - Includes: question, team, average score, response count, date range

3. **Audit Logs Export**
   - Full audit trail
   - CSV or JSON format
   - Includes: all audit log fields

4. **Users Export**
   - User directory
   - CSV or JSON format
   - Includes: email, name, role, teams, join date

### Export Workflow (Planned)

1. Admin requests export via UI
2. Background job generates file
3. Email sent with download link
4. Link expires after 24 hours
5. File auto-deleted after 7 days

---

## User Management

### List Users

**Endpoint:** `GET /users`

**Permission:** `member.view.all` (admin or owner)

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Alice Developer",
    "primaryTeamId": "uuid",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### Create User

**Endpoint:** `POST /admin/users`

**Permission:** `member.add` (admin or owner)

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "ssoId": "optional-sso-id"
}
```

### Update User

**Endpoint:** `PUT /admin/users/:id`

**Permission:** `member.edit` (owner only)

**Use Cases:**
- Change primary team
- Update name/email
- Deactivate user

### Delete User

**Endpoint:** `DELETE /admin/users/:id`

**Permission:** `member.remove` (owner only)

**Effect:**
- User deleted
- Questions remain (anonymized)
- Pulse responses remain (already anonymous)
- Audit logs remain

---

## Team Management

### Create Team

**Endpoint:** `POST /admin/teams`

**Permission:** `team.create` (admin or owner)

**Request:**
```json
{
  "name": "Engineering",
  "slug": "engineering",
  "description": "Engineering team questions"
}
```

### Add Team Member

**Endpoint:** `POST /admin/teams/:teamId/members`

**Permission:** `member.add` (admin or owner)

**Request:**
```json
{
  "userId": "uuid",
  "role": "member"  // 'viewer' | 'member' | 'moderator' | 'admin' | 'owner'
}
```

### Change Member Role

**Endpoint:** `PUT /admin/teams/:teamId/members/:userId`

**Permission:** `member.edit` (owner only)

**Request:**
```json
{
  "role": "moderator"
}
```

---

## Presentation Mode

**URL:** `/:teamSlug/open/present`

**Permission:** `presentation.access` (moderator+ only)

**Features:**
- Full-screen display for meetings
- Keyboard shortcuts (Space=next, H=highest, Esc=exit)
- Auto-tags questions with "Currently Presenting"
- Real-time updates via SSE

**Use Cases:**
- All-hands meetings
- Town halls
- Q&A sessions

**See:** `/handbook/PRODUCT_VISION.md` for details

---

## Search & Tags

### Full-Text Search

**Endpoint:** `GET /questions?search=<term>`

**Technology:** PostgreSQL full-text search with prefix matching

**Features:**
- Stemming (e.g., "working" matches "work")
- Prefix matching (e.g., "polic" matches "policy")
- Ranked results

### Tag Management

**Endpoints:**
- `GET /tags` - List all tags
- `POST /admin/tags` - Create tag (admin)
- `PUT /admin/tags/:id` - Update tag (admin)
- `DELETE /admin/tags/:id` - Delete tag (admin)

**Default Tags:**
- Currently Presenting
- Feature Request
- Bug
- Question
- Process
- Technical

**Custom Tags:**
- Admins can create custom tags
- Color-coded for visual organization

---

## Monitoring & Diagnostics

### Health Checks

**Endpoints:**
- `GET /health` - Basic health (always 200 if process alive)
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /health/ready` - Readiness probe (DB + Redis healthy)

### Service Status

**Check:**
- API server: `curl http://localhost:3000/health`
- Database: `GET /health/ready` (includes DB check)
- Redis: `GET /health/ready` (includes Redis check)
- Email queue: `GET /admin/email-queue`

### Logs

**Development:**
- Console output
- Debug logs enabled

**Production:**
- Structured JSON logs (recommended)
- Log aggregation (Datadog, CloudWatch, etc.)
- Error tracking (Sentry, etc.)

---

## Backup & Recovery

**Status:** Deployment-specific

### Recommended Practices

1. **Database Backups:**
   - Nightly pg_dump
   - Weekly role backups
   - 7-14 day retention
   - Monthly restore tests

2. **Audit Log Retention:**
   - Keep indefinitely (or per compliance requirements)
   - Archive older logs to cold storage

3. **Disaster Recovery:**
   - Document restore procedures
   - Test recovery quarterly
   - Keep backups in separate region

**See:** `/handbook/OPERATIONS.md` for deployment details

---

## Security Best Practices

### Production Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Redis configured (rate limiting + sessions)
- [ ] Strong SESSION_SECRET (32+ random characters)
- [ ] OAuth configured (no demo mode in production)
- [ ] Rate limiting active (verify `/health/ready` shows Redis)
- [ ] Email configured (SMTP or Resend)
- [ ] Audit logs enabled (default)
- [ ] Regular backups (database + audit logs)
- [ ] Security scans (`make security` before deploy)
- [ ] Environment variables secured (not in code)

### Monitoring Alerts (Recommended)

- Database connection failures
- Redis connection failures
- Email queue failures (>10 failed jobs)
- Rate limit exceeded events (spike detection)
- Moderation queue size (>50 items)
- Failed login attempts (>20/hour)

---

## Troubleshooting

### Users Can't Login

**Check:**
1. OAuth configured (`/auth/modes` endpoint)
2. Callback URLs correct
3. Session store working (Redis in production)
4. No rate limiting errors (429 responses)

### Questions Not Appearing

**Check:**
1. Question status (OPEN vs UNDER_REVIEW)
2. Team scoping (user in correct team?)
3. Tenant isolation (correct tenant header?)

### Pulse Not Sending

**Check:**
1. Pulse enabled in tenant settings
2. Pulse schedule exists and enabled
3. Cohorts exist with users
4. Active questions exist
5. Email worker running (requires Redis)
6. Cron scheduler running

**See:** `/handbook/PULSE_SYSTEM.md` for full troubleshooting

---

## Related Documentation

- `/handbook/SECURITY_MODEL.md` - Security architecture
- `/handbook/OPERATIONS.md` - Deployment & operations
- `/handbook/TRUST_AND_SAFETY.md` - Content moderation
- `/handbook/PULSE_SYSTEM.md` - Pulse configuration
- `/handbook/INTEGRATIONS/EMAIL.md` - Email setup
- `/handbook/AUTHENTICATION.md` - Auth configuration

