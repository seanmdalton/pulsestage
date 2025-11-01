# First Steps

Set up PulseStage for your organization.

## 1. Configure Authentication

### For Production

Disable demo mode and configure OAuth:

```bash
# .env
NODE_ENV=production
AUTH_MODE_DEMO=false

# GitHub OAuth (recommended)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
```

See [handbook/AUTHENTICATION.md](../handbook/AUTHENTICATION.md) for OAuth setup instructions.

## 2. Create Teams

1. Log in as admin
2. Navigate to Admin → Teams
3. Click "Create Team"
4. Enter team details:
   - Name (e.g., "Engineering")
   - Slug (e.g., "engineering")
   - Description (optional)

Recommended teams:
- Engineering
- Product
- Marketing
- Sales
- General

## 3. Invite Users

Users are automatically created on first OAuth login.

### Assign Team Memberships

1. Admin → Teams → [Team Name]
2. Click "Manage Members"
3. Add users and assign roles:
   - **Viewer** - Browse and upvote
   - **Member** - Submit questions and upvote
   - **Moderator** - Answer and moderate questions
   - **Admin** - Full access (all teams)
   - **Owner** - Complete control

### Set Primary Teams

Each user needs a primary team:

1. Admin → Users → [User Name]
2. Select "Primary Team"
3. Save

Primary team determines:
- Default team view on login
- Pulse invitation cohort
- Team-scoped notifications

## 4. Configure Email (Optional)

Required for pulse invitations and notifications.

### Using Resend (Recommended)

```bash
# .env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=noreply@yourdomain.com
```

### Using SMTP

```bash
# .env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com
```

See [handbook/INTEGRATIONS/EMAIL.md](../handbook/INTEGRATIONS/EMAIL.md).

## 5. Enable Pulse Invitations (Optional)

Weekly sentiment surveys with email invitations.

```bash
# .env
PULSE_INVITES_ENABLED=true
PULSE_COHORT_SIZE=20
PULSE_INVITE_CRON=0 9 * * *  # Daily at 9 AM
```

Requires email configuration.

See [handbook/PULSE_SYSTEM.md](../handbook/PULSE_SYSTEM.md).

## 6. Customize Branding (Optional)

```bash
# .env
WEBSITE_TITLE=Your Company Q&A
WELCOME_MESSAGE=Welcome to our employee engagement platform!

# web/.env
VITE_WEBSITE_TITLE=Your Company Q&A
```

## 7. Set Up Monitoring

### Health Checks

- Liveness: `http://your-domain.com/health/live`
- Readiness: `http://your-domain.com/health/ready`
- Full health: `http://your-domain.com/health`

### Audit Logs

View all admin/moderator actions:

1. Admin → Audit Logs
2. Filter by:
   - Actor (who performed action)
   - Action (what was done)
   - Entity (what was affected)
   - Date range

## Common Tasks

### Reset Demo Data

```bash
make db-seed
```

### View Email Queue

Admin → Email Queue

Shows all pending and sent emails.

### Export Data

Admin → Export

Export questions, pulse responses, or audit logs as CSV/JSON.

### Manage Tags

Admin → Tags

Create, edit, or delete question tags.

## Next Steps

- [User Guide](../guides/user/overview.md) - User features
- [Moderator Guide](../guides/moderator/overview.md) - Moderation workflow
- [Admin Guide](../guides/admin/overview.md) - Administration
- [Production Deployment](../deployment/production.md) - Production setup
