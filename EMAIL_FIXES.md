# Email System Fixes

## Issues Found

When testing the email notification system, we discovered two critical bugs that prevented emails from being sent:

### 1. SMTP Authentication Error
**Problem:** Nodemailer was requiring SMTP authentication even for Mailpit (which doesn't need it).

**Error:** `Missing credentials for "PLAIN"`

**Root Cause:** The SMTP provider was always passing an `auth` object to nodemailer, even when `SMTP_USER` and `SMTP_PASS` were empty strings. Nodemailer interprets an empty `auth` object as "use authentication with empty credentials" rather than "don't authenticate."

**Fix:** Modified `/home/klitz/Development/ama-app/api/src/lib/email/providers/smtp.ts` to conditionally include the `auth` object only when credentials are actually provided:

```typescript
// Only include auth if credentials are provided (Mailpit doesn't need auth)
const transportConfig: any = {
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure ?? false,
}

if (config.smtp.auth.user && config.smtp.auth.pass) {
  transportConfig.auth = {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.pass,
  }
}
```

### 2. Audit Logging Error
**Problem:** Email queue worker was attempting to create audit logs with `tenantId: 'system'`, which doesn't exist in the database.

**Error:** `PrismaClientKnownRequestError` on audit log creation

**Root Cause:** The `AuditLog` model requires a valid `tenantId` foreign key reference. Using `'system'` as a placeholder caused a database constraint violation.

**Fix:** Temporarily disabled audit logging in the email queue worker (`/home/klitz/Development/ama-app/api/src/lib/queue/emailQueue.ts`) with TODO comments to add proper tenant tracking:

```typescript
// TODO: Add audit logging with proper tenant ID from job data
```

**Future Enhancement:** We should pass the `tenantId` as part of the email job data so audit logs can be properly associated with the correct tenant.

## Verified Working

After these fixes:
- ✅ Email worker starts successfully
- ✅ Emails are queued when questions are answered
- ✅ BullMQ worker processes jobs from Redis
- ✅ SMTP connection to Mailpit succeeds
- ✅ Emails appear in Mailpit inbox

## Testing

Follow the steps in `TESTING_EMAIL.md` to verify:

1. **Basic Flow:** Submit question → Answer as moderator → Email arrives in Mailpit
2. **Monitoring:** Check logs for `📧` emoji indicators
3. **Queue Status:** Use `/admin/email-queue` endpoint
4. **User Preferences:** Disable notifications → No email sent

## Next Steps

1. **Add tenant tracking to email jobs:** Include `tenantId` in job data so audit logs work correctly
2. **Re-enable audit logging:** Once tenant IDs are available in job context
3. **Add more email templates:** Welcome emails, digests, etc.
4. **Production email provider:** Configure Resend or SendGrid for production use


