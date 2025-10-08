# Testing Email Functionality

This guide explains how to test PulseStage's email notification system locally using Mailpit.

## Prerequisites

- Docker Compose running with Mailpit service
- API configured to use SMTP (default in `docker-compose.override.yaml`)
- Mailpit web UI accessible at http://localhost:8025

## Quick Test Steps

### 1. Ensure Services are Running

```bash
cd /home/klitz/Development/ama-app
docker compose up -d
```

Wait for all services to be ready (~30 seconds). Verify the email worker started:

```bash
docker compose logs api | grep "📧 Email worker started"
```

You should see: `📧 Email worker started`

### 2. Open Mailpit

In your browser, navigate to:
```
http://localhost:8025
```

This is your local email inbox. Leave this tab open.

### 3. Submit and Answer a Question

#### 3a. As a User - Submit a Question

1. Open the app: http://localhost:5173
2. Log in as **Alice** (or any test user)
3. Go to the ACME tenant's town hall
4. **Submit a new question**, e.g., "How do I test email notifications?"
5. Note the question ID or text

#### 3b. As a Moderator - Answer the Question

1. Still in the app, log in as a **Moderator or Admin** (e.g., switch to a moderator user)
2. Go to the **Moderation Queue** or view the question you just submitted
3. **Provide an answer** and click "Submit Response"
4. You should see a success message

#### 3c. Check Mailpit

1. Switch back to the Mailpit tab (http://localhost:8025)
2. **Refresh** if needed
3. You should see a new email to Alice's email address with the subject "Your question was answered!"
4. Click to view the email and verify:
   - Question text is present
   - Answer text is present
   - Responder name is shown
   - Link to view the question works
   - Unsubscribe link goes to profile settings

### 4. Monitor Logs

In a terminal, watch for email activity:

```bash
cd /home/klitz/Development/ama-app
docker compose logs api -f | grep -E "📧|Email|✅.*sent"
```

Expected log messages (in order):
1. `📧 Email worker started` - Worker initialized on startup
2. `📧 Queued email notification for alice@example.com` - Email queued when question answered
3. `📧 Processing email job 1: question-answered` - Worker picked up the job
4. `✅ Email sent successfully to alice@example.com: <message-id>` - Email delivered to Mailpit

### 5. Test Email Preferences (Opt-Out)

1. Log in as Alice (the user who submitted the question)
2. Go to **Profile Settings**
3. **Disable email notifications** (toggle or checkbox)
4. Submit another question
5. Have a moderator answer it
6. **Verify NO email arrives** in Mailpit for this question

### 6. Check Email Queue Status

View the queue status via the admin health dashboard or API:

```bash
curl -X GET http://localhost:3000/admin/email-queue \
  -H "X-Admin-Key: dev-admin-key" \
  | jq
```

Expected response:
```json
{
  "waiting": 0,
  "active": 0,
  "completed": 2,
  "failed": 0,
  "delayed": 0,
  "paused": false
}
```

## Troubleshooting

### Issue: No emails arriving in Mailpit

**Diagnosis Steps:**

1. **Check email worker is running:**
   ```bash
   docker compose logs api | grep "📧 Email worker"
   ```
   Expected: `📧 Email worker started`

2. **Check if email was queued:**
   ```bash
   docker compose logs api | grep "📧 Queued email"
   ```
   Expected: `📧 Queued email notification for user@example.com`

3. **Check for SMTP errors:**
   ```bash
   docker compose logs api --tail 100 | grep -E "SMTP|credentials|auth"
   ```
   Should see NO errors (the SMTP fix removed credential requirements for Mailpit)

4. **Verify Redis connection:**
   ```bash
   docker compose ps redis
   docker compose logs redis --tail 20
   ```
   Redis should be running and connected.

5. **Check Mailpit is running:**
   ```bash
   docker compose ps mailpit
   ```
   Should show "running". If not:
   ```bash
   docker compose up -d mailpit
   ```

6. **Check email queue:**
   ```bash
   curl http://localhost:3000/admin/email-queue -H "X-Admin-Key: dev-admin-key"
   ```
   Look for `failed` count > 0, which indicates retry failures.

### Issue: Emails queued but not processing

1. **Restart the email worker:**
   ```bash
   docker compose restart api
   docker compose logs api -f
   ```
   Watch for `📧 Email worker started`

2. **Check Redis connectivity:**
   ```bash
   docker compose exec api node -e "const Redis = require('ioredis'); const r = new Redis({host:'redis'}); r.ping().then(console.log)"
   ```
   Expected: `PONG`

### Issue: User preferences not saving

1. **Verify migration ran:**
   ```bash
   docker compose exec api npx prisma migrate status
   ```
   Should show all migrations applied.

2. **Check database column exists:**
   ```bash
   docker compose exec db psql -U postgres -d ama -c "\d \"UserPreferences\""
   ```
   Should include `emailNotifications` column.

3. **Manually query preferences:**
   ```bash
   docker compose exec db psql -U postgres -d ama -c "SELECT id, \"userId\", \"emailNotifications\" FROM \"UserPreferences\" LIMIT 5;"
   ```

## Email Providers Configuration

### Local Development (Mailpit - Default)

Already configured in `docker-compose.override.yaml`:
```yaml
EMAIL_PROVIDER=smtp
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@pulsestage.local
EMAIL_FROM_NAME=PulseStage
FRONTEND_URL=http://localhost:5173
```

### Production with Resend (Recommended)

Create a `.env` file or set environment variables:
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=PulseStage
FRONTEND_URL=https://yourdomain.com
```

### Production with SMTP (e.g., SendGrid, AWS SES)

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=PulseStage
FRONTEND_URL=https://yourdomain.com
```

## Development: Preview Email Templates

React Email provides a dev server to preview templates:

```bash
cd api
npm run email:dev
```

Then open http://localhost:3001 to see all email templates with hot reload.

## Next Steps

Once local testing is successful:

1. ✅ **Email notifications working** - You've verified the core flow
2. **Add email preferences UI** - Already added to profile page, test it
3. **Configure production email provider** - Set up Resend or SMTP credentials
4. **Set up DNS records** (SPF, DKIM, DMARC) - For production deliverability
5. **Add more email templates** - Welcome emails, digests, etc.
6. **Monitor email queue in production** - Use `/admin/health` and `/admin/email-queue` endpoints
