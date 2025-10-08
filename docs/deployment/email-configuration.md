# Email Configuration

PulseStage includes a flexible email notification system that supports multiple providers. This guide covers production email setup for real deployments.

## Overview

Email notifications are sent when:
- A user's question is answered by a moderator
- Future: Welcome emails, moderator digests, weekly summaries (planned)

Users can opt out of email notifications via their profile settings.

## Email System Architecture

```
Question Answered
       ↓
  Queue Email Job (Redis BullMQ)
       ↓
  Email Worker (Background)
       ↓
  Render React Email Template
       ↓
  Send via Provider (SMTP/Resend)
       ↓
  Audit Log (Success/Failure)
```

**Key Components:**
- **Queue**: Redis BullMQ for reliable background processing
- **Worker**: Processes 5 concurrent emails with 3 retry attempts
- **Templates**: React Email components for type-safe, maintainable emails
- **Providers**: Pluggable abstraction (SMTP, Resend, AWS SES, SendGrid)

## Supported Email Providers

### 1. Resend (Recommended for Production)

**Best for:** Modern SaaS deployments, easy setup, great developer experience

**Pros:**
- Simple API key authentication
- Built-in domain verification
- Excellent deliverability
- Generous free tier (3,000 emails/month)
- React Email native support

**Setup:**

1. **Sign up** at [resend.com](https://resend.com)

2. **Add and verify your domain:**
   - Go to Domains → Add Domain
   - Add DNS records (SPF, DKIM, DMARC) provided by Resend
   - Wait for verification (usually < 5 minutes)

3. **Generate API key:**
   - Go to API Keys → Create API Key
   - Copy the key (starts with `re_`)

4. **Configure environment variables:**

```bash
# Email Provider
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Email Sender (must be from your verified domain)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=PulseStage

# Frontend URL (for email links)
FRONTEND_URL=https://yourdomain.com

# Redis (required for email queue)
REDIS_URL=redis://your-redis-server:6379
```

5. **Test your configuration:**

```bash
# Restart the API service to pick up new environment variables
docker compose restart api

# Check logs to verify email worker started
docker compose logs api | grep "📧 Email worker started"
```

### 2. SMTP (SendGrid, AWS SES, Custom)

**Best for:** Existing email infrastructure, enterprise compliance requirements

**Pros:**
- Works with any SMTP provider
- Enterprise-friendly
- Full control over infrastructure

#### Option A: SendGrid

**Setup:**

1. **Sign up** at [sendgrid.com](https://sendgrid.com)

2. **Verify your sender identity:**
   - Settings → Sender Authentication
   - Either verify a single email address (for testing) or your domain (for production)

3. **Create an API key:**
   - Settings → API Keys → Create API Key
   - Choose "Full Access" or "Restricted Access" with Mail Send permission
   - Copy the API key (starts with `SG.`)

4. **Configure environment variables:**

```bash
# Email Provider
EMAIL_PROVIDER=smtp

# SMTP Configuration (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxx

# Email Sender
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=PulseStage

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Redis
REDIS_URL=redis://your-redis-server:6379
```

#### Option B: AWS SES

**Setup:**

1. **Verify your domain in AWS SES:**
   - AWS Console → SES → Verified Identities → Create Identity
   - Add DNS records (DKIM, SPF) to your domain

2. **Create SMTP credentials:**
   - Account Dashboard → SMTP Settings → Create SMTP Credentials
   - Save the username and password

3. **Request production access** (removes 200 emails/day limit):
   - Account Dashboard → Sending Statistics → Request Production Access

4. **Configure environment variables:**

```bash
# Email Provider
EMAIL_PROVIDER=smtp

# SMTP Configuration (AWS SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Use your region
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=AKIAIOSFODNN7EXAMPLE  # Your SMTP username
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Your SMTP password

# Email Sender (must be verified in SES)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=PulseStage

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Redis
REDIS_URL=redis://your-redis-server:6379
```

#### Option C: Generic SMTP (Gmail, Outlook, etc.)

**⚠️ Not recommended for production** - Use for development/testing only.

```bash
# Email Provider
EMAIL_PROVIDER=smtp

# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Email Sender
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=PulseStage

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Redis
REDIS_URL=redis://your-redis-server:6379
```

**Note:** Gmail requires an "App Password" (not your regular password). Go to Google Account → Security → 2-Step Verification → App Passwords.

## Environment Variables Reference

### Required for All Providers

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_PROVIDER` | Email service to use | `smtp` or `resend` |
| `EMAIL_FROM` | Sender email address | `noreply@yourdomain.com` |
| `EMAIL_FROM_NAME` | Sender display name | `PulseStage` |
| `FRONTEND_URL` | Your frontend URL (for email links) | `https://yourdomain.com` |
| `REDIS_URL` or `REDIS_HOST` | Redis connection for email queue | `redis://redis:6379` |

### SMTP-Specific (when `EMAIL_PROVIDER=smtp`)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server hostname | `smtp.sendgrid.net` | Yes |
| `SMTP_PORT` | SMTP server port | `587` | Yes |
| `SMTP_SECURE` | Use TLS (true for 465, false for 587) | `true` or `false` | Yes |
| `SMTP_USER` | SMTP username | `apikey` | No* |
| `SMTP_PASS` | SMTP password | `SG.xxxxx` | No* |

*Required for authenticated SMTP. Leave empty for local Mailpit testing.

### Resend-Specific (when `EMAIL_PROVIDER=resend`)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RESEND_API_KEY` | Resend API key | `re_xxxxx` | Yes |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | (empty) |

## DNS Configuration for Email Deliverability

To ensure your emails reach inboxes (not spam), configure these DNS records:

### SPF (Sender Policy Framework)

Authorizes your email provider to send on your behalf.

**Example for Resend:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**Example for SendGrid:**
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
```

**Example for AWS SES:**
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

### DKIM (DomainKeys Identified Mail)

Cryptographically signs your emails.

**Your provider will give you specific DKIM records.** Example from Resend:
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

### DMARC (Domain-based Message Authentication)

Tells recipients what to do with emails that fail SPF/DKIM.

**Basic DMARC record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

**Production DMARC record (after testing):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100
```

## Testing Your Configuration

### 1. Verify Services are Running

```bash
# Check API logs for email worker
docker compose logs api | grep "📧 Email worker started"

# Check Redis connectivity
docker compose exec api node -e "const Redis = require('ioredis'); const r = new Redis({host:'redis'}); r.ping().then(console.log)"
```

### 2. Send a Test Email

1. Log in to PulseStage as a regular user
2. Submit a question in any team
3. Log in as a moderator/admin
4. Answer the question
5. Check your email inbox (or your email provider's logs)

### 3. Monitor the Email Queue

**Via API:**
```bash
curl https://yourdomain.com/admin/email-queue \
  -H "X-Admin-Key: your-admin-key"
```

**Via Health Dashboard:**
- Log in as an admin
- Navigate to Admin → Health Dashboard
- View "Email Queue" section

**Expected healthy state:**
```json
{
  "waiting": 0,
  "active": 0,
  "completed": 150,
  "failed": 0,
  "delayed": 0,
  "paused": false
}
```

### 4. Check Logs

```bash
# Watch for email activity
docker compose logs api -f | grep -E "📧|✅.*sent"

# Look for errors
docker compose logs api --tail 100 | grep -E "error|Error|ERROR"
```

## Troubleshooting

### Emails Not Sending

**Symptom:** Questions are answered but no emails arrive.

**Diagnosis:**

1. **Check email worker started:**
   ```bash
   docker compose logs api | grep "📧 Email worker started"
   ```
   If missing: Check `REDIS_URL` environment variable.

2. **Check if jobs are queued:**
   ```bash
   curl https://yourdomain.com/admin/email-queue -H "X-Admin-Key: your-key"
   ```
   If `waiting` > 0: Jobs queued but not processing (worker issue).
   If `failed` > 0: Jobs failed (check logs for errors).

3. **Check for SMTP authentication errors:**
   ```bash
   docker compose logs api --tail 100 | grep -i "auth"
   ```
   Common issue: Wrong `SMTP_USER` or `SMTP_PASS`.

4. **Verify provider credentials:**
   - Resend: Test API key at [resend.com/api-keys](https://resend.com/api-keys)
   - SendGrid: Check key hasn't expired
   - AWS SES: Verify SMTP credentials are correct

### Emails Going to Spam

**Symptom:** Emails arrive but in spam folder.

**Fix:**

1. **Add SPF, DKIM, DMARC records** (see DNS Configuration above)
2. **Verify your domain** with your email provider
3. **Use a real domain** (not `localhost`, `example.com`, etc.)
4. **Warm up your domain** by sending gradually increasing volumes
5. **Check your sender reputation** at [mail-tester.com](https://www.mail-tester.com/)

### High Email Failure Rate

**Symptom:** Many jobs in `failed` status.

**Diagnosis:**

```bash
# Check recent failed jobs
docker compose exec redis redis-cli LRANGE "bull:email:failed" 0 10
```

**Common causes:**
- Invalid recipient email addresses
- Rate limiting by email provider (throttle sending)
- Domain not verified
- Quota exceeded

**Fix:**
- For transient errors: Jobs auto-retry 3 times with backoff
- For permanent errors: Check audit logs and fix root cause

### User Not Receiving Emails

**Symptom:** Some users report not getting notifications.

**Diagnosis:**

1. **Check user's email preferences:**
   - User Profile → Settings → Email Notifications
   - Ensure "Receive email notifications" is enabled

2. **Verify email address is correct:**
   ```bash
   docker compose exec db psql -U postgres -d ama \
     -c "SELECT id, email FROM \"User\" WHERE email = 'user@example.com';"
   ```

3. **Check if email was sent:**
   ```bash
   docker compose logs api | grep "user@example.com"
   ```
   Should see: `📧 Queued email notification for user@example.com`

## Monitoring in Production

### Metrics to Watch

1. **Email Queue Size** (`waiting`, `active`)
   - Should typically be 0-5
   - Alert if > 100 (backlog building up)

2. **Failed Email Rate** (`failed` / `completed`)
   - Should be < 1%
   - Alert if > 5%

3. **Processing Time**
   - Most emails should send within 5 seconds
   - Alert if average > 30 seconds

### Recommended Monitoring Setup

**Option 1: Health Dashboard**
- Admin → Health Dashboard
- Auto-refreshes every 5 seconds
- Shows queue status, counts, and error rates

**Option 2: API Endpoint**
```bash
# Add to your monitoring tool (Datadog, New Relic, etc.)
GET /admin/email-queue
GET /admin/health
```

**Option 3: Logs**
```bash
# Export logs to your log aggregation service
docker compose logs api -f | grep "📧\|✅.*sent\|❌.*failed"
```

## User Email Preferences

Users can control email notifications via their profile:

1. **Navigate to Profile**
   - Click user menu (top right) → Profile

2. **Email Notifications Section**
   - Toggle "Receive email notifications when your questions are answered"
   - Changes save automatically

**Technical Implementation:**
- Stored in `UserPreferences` table (`emailNotifications` field)
- Defaults to `true` for new users
- Checked before queuing email jobs

## Adding Custom Email Templates

See [Development Guide: Email Templates](../development/email-templates.md) for instructions on creating new email templates with React Email.

## Security Considerations

1. **Protect API Keys:**
   - Never commit API keys to version control
   - Use environment variables or secrets management (e.g., AWS Secrets Manager)
   - Rotate keys periodically

2. **Rate Limiting:**
   - PulseStage automatically queues emails (no unbounded sending)
   - BullMQ worker processes 5 concurrent emails max
   - Configure your email provider's rate limits

3. **Email Content:**
   - All email content is HTML-escaped by React Email
   - User input (question/answer text) is sanitized
   - Links include full URLs (no relative paths)

4. **Unsubscribe:**
   - All emails include unsubscribe link (profile settings)
   - Consider adding one-click unsubscribe header (future)

## FAQ

**Q: Can I use multiple email providers?**  
A: No, only one provider can be active at a time. Set `EMAIL_PROVIDER` to either `smtp` or `resend`.

**Q: Does PulseStage support email attachments?**  
A: Not currently. All emails are HTML + plain text only.

**Q: What happens if Redis goes down?**  
A: New email jobs cannot be queued. Existing jobs remain in Redis and process when it recovers. No emails are lost.

**Q: Can I customize email templates?**  
A: Yes! Email templates are React components in `api/src/emails/`. See development docs for details.

**Q: How do I test email without sending real emails?**  
A: Use Mailpit for local development (see [Email Testing Guide](../development/email-testing.md)).

**Q: What's the maximum email throughput?**  
A: BullMQ worker processes 5 concurrent emails. Typical rate: 50-100 emails/minute. Configurable in `emailQueue.ts`.

**Q: Are emails sent synchronously or asynchronously?**  
A: Asynchronously. When a question is answered, the API queues the email and returns immediately. A background worker sends it within 1-5 seconds.

**Q: Can I see sent email history?**  
A: Yes, via audit logs. Future: Admin UI for email history/analytics.

## Next Steps

- ✅ Configure your email provider
- ✅ Add DNS records for deliverability
- ✅ Test with a few users
- ✅ Monitor email queue in production
- 🔜 Add custom email templates (future)
- 🔜 Configure weekly digest emails (future)
- 🔜 Set up email analytics dashboard (future)

## Resources

- [React Email Documentation](https://react.email)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Mail Tester (Check Email Deliverability)](https://www.mail-tester.com/)

