# Email System

**Purpose:** Send transactional emails for notifications and pulse invites.

**Architecture:** BullMQ job queue with multiple provider support (SMTP, Resend).

---

## Development vs Production

### Development Configuration

**Email Testing with Mailpit:**
- Mailpit provides a local SMTP server and web UI for email testing
- Web UI: `http://localhost:8025`
- SMTP server: `localhost:1025`
- No authentication required
- All emails captured locally (nothing sent externally)

**Default Development Settings:**
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM_EMAIL=noreply@pulsestage.app
SMTP_FROM_NAME=PulseStage
```

**Email Worker:**
- Email worker does NOT start in development (no Redis requirement)
- Emails are queued but not processed automatically
- To test email sending, configure `REDIS_URL` to enable worker

**Testing Emails:**
1. Trigger an email action (e.g., answer a question)
2. Open Mailpit UI at `http://localhost:8025`
3. View rendered email with full HTML/text

---

### Production Configuration

**Provider Options:**

#### Option 1: SMTP (Self-Hosted)
Best for organizations with existing mail infrastructure.

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=noreply@yourcompany.com
SMTP_FROM_NAME=Your Company Name
```

#### Option 2: Resend (Recommended)
Cloud email service with better deliverability.

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourcompany.com
RESEND_FROM_NAME=Your Company Name
```

**Requirements:**
- Redis must be configured (`REDIS_URL`)
- Email worker starts automatically
- Queue processes emails in background

---

## Email Queue System

**Technology:** BullMQ (Redis-backed job queue)

**Configuration:**
- **Retry Attempts:** 3 with exponential backoff (2s, 4s, 8s)
- **Retention (Completed):** 24 hours, max 1,000 jobs
- **Retention (Failed):** 7 days
- **Concurrency:** 5 emails processed simultaneously

**Queue Behavior:**
- Development: Queue created, worker does NOT start (no Redis)
- Production: Queue created, worker starts automatically (requires Redis)

---

## Email Types

### 1. Question Answered Notification

**Trigger:** Moderator/admin answers a question

**Sent To:** Question author

**Template:** React-email based HTML template

**Content:**
- User's name
- Original question body
- Answer text
- Responder name
- Link to question
- Unsubscribe link

**Example:**
```
Subject: Your question was answered!

Hi Alice,

Your question "What is our remote work policy?" 
was answered by Bob (Admin).

[View full answer: http://...]

[Unsubscribe from notifications]
```

### 2. Pulse Invite

**Trigger:** Daily pulse scheduler (cron)

**Sent To:** Users in today's cohort

**Content:**
- Personalized greeting
- Pulse question text
- One-tap response links (scores 1-5)
- Unique token for anonymity
- 7-day expiration

**Example:**
```
Subject: Weekly Pulse - How are you feeling?

Hi Alice,

Quick check-in for this week:
"How satisfied are you with work-life balance?"

[1] [2] [3] [4] [5]
(one-tap response)

Link expires in 7 days.
```

### 3. Direct Email (Admin)

**Trigger:** Admin sends custom email

**Sent To:** Specified recipient(s)

**Content:** Customizable

---

## Admin Monitoring

**Endpoint:** `GET /admin/email-queue`

**Permission:** `admin.access`

**Metrics:**
- Active jobs (currently processing)
- Waiting jobs (queued)
- Completed jobs (last 20)
- Failed jobs (last 20 with error details)

**Use Cases:**
- Debug email delivery issues
- Monitor queue health
- View failed job reasons

**Example Response:**
```json
{
  "metrics": {
    "active": 2,
    "waiting": 15,
    "completed": 342,
    "failed": 3
  },
  "recentJobs": {
    "active": [...],
    "waiting": [...],
    "completed": [...],
    "failed": [
      {
        "id": "job-123",
        "name": "email",
        "failedReason": "SMTP connection timeout",
        "attemptsMade": 3,
        "finishedOn": 1234567890
      }
    ]
  }
}
```

---

## Email Templates

**Technology:** React-email (JSX-based email templates)

**Location:** `api/src/lib/email/templates/`

**Benefits:**
- Write emails in React/JSX
- Preview in development
- Automatic HTML + plain text generation
- Type-safe props

**Example Template:**
```tsx
export function QuestionAnsweredEmail({ 
  userName, 
  questionBody, 
  answerBody, 
  responderName, 
  questionUrl, 
  unsubscribeUrl 
}) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Your question was answered!</Heading>
          <Text>Hi {userName},</Text>
          <Text>Your question "{questionBody}" was answered by {responderName}.</Text>
          <Button href={questionUrl}>View Answer</Button>
          <Hr />
          <Link href={unsubscribeUrl}>Unsubscribe</Link>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## Troubleshooting

### Development: Emails Not Appearing in Mailpit

**Check:**
1. Mailpit service is running: `docker ps | grep mailpit`
2. Mailpit UI accessible: `http://localhost:8025`
3. SMTP settings correct in `.env` (host=localhost, port=1025)

**Fix:**
```bash
make down
make up
```

### Production: Emails Not Sending

**Check:**
1. Redis is running and accessible
2. Email worker started (check logs for "Email worker started")
3. Provider credentials correct (SMTP or Resend)
4. Queue metrics: `GET /admin/email-queue`

**Common Errors:**
- `SMTP connection timeout` → Check firewall/network access
- `Authentication failed` → Verify SMTP credentials
- `Invalid API key` → Check Resend API key
- `Redis connection failed` → Ensure REDIS_URL is correct

### Queue Stuck

**Diagnosis:**
```bash
# Check Redis connection
redis-cli ping

# Check queue metrics
curl http://localhost:3000/admin/email-queue \
  -H "Cookie: connect.sid=..." \
  -H "x-tenant-id: default"
```

**Fix:**
```bash
# Restart API service to restart worker
make restart-api
```

---

## Unsubscribe Handling

**Status:** Not yet implemented

**Planned:**
- User preference stored in database
- Email notifications can be disabled per-user
- Unsubscribe link in all emails
- Admin can disable notifications globally (tenant setting)

**Current Behavior:**
- Unsubscribe links included in templates
- Link does not yet function (TODO)

---

## Configuration Summary

| Feature | Development | Production |
|---------|------------|------------|
| **Provider** | SMTP (Mailpit) | SMTP or Resend |
| **Queue** | Created (BullMQ) | Created (BullMQ) |
| **Worker** | Not started | Starts automatically |
| **Redis** | Optional | Required |
| **Testing** | Mailpit UI (port 8025) | Live delivery |
| **Delivery** | Local capture | External send |

---

## Related Documentation

- `/handbook/OPERATIONS.md` - Service configuration
- `/handbook/PULSE_SYSTEM.md` - Pulse invite emails
- `/handbook/ADMIN_GUIDE.md` - Queue monitoring
- `/api/src/lib/email/` - Implementation details

