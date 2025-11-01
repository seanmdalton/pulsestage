# Audit Logging

Track all administrative and moderation actions.

## Overview

Audit logs record:
- Who performed the action (actor)
- What action was taken
- What was affected (entity)
- When it occurred
- Before/after state (for changes)
- IP address and user agent

**Purpose:**
- Compliance and accountability
- Security monitoring
- Troubleshooting
- Change tracking

## View Audit Logs

Admin → Audit Logs

## Log Entries

Each entry shows:
- **Actor**: User who performed action
- **Action**: What was done (e.g., "QUESTION_ANSWER", "USER_ROLE_CHANGE")
- **Entity**: What was affected (question ID, user ID, etc.)
- **Timestamp**: When action occurred
- **Details**: Before/after state, additional context
- **IP Address**: Actor's IP
- **User Agent**: Actor's browser/client

## Actions Logged

### User Management
- `USER_CREATE` - User created
- `USER_UPDATE` - User updated
- `USER_DELETE` - User deleted
- `USER_ROLE_CHANGE` - Role assigned/changed
- `USER_TEAM_ADD` - Added to team
- `USER_TEAM_REMOVE` - Removed from team

### Question Management
- `QUESTION_CREATE` - Question submitted
- `QUESTION_ANSWER` - Question answered
- `QUESTION_PIN` - Question pinned
- `QUESTION_UNPIN` - Question unpinned
- `QUESTION_FREEZE` - Question frozen
- `QUESTION_UNFREEZE` - Question unfrozen
- `QUESTION_DELETE` - Question deleted
- `QUESTION_TAG_ADD` - Tag added
- `QUESTION_TAG_REMOVE` - Tag removed

### Team Management
- `TEAM_CREATE` - Team created
- `TEAM_UPDATE` - Team updated
- `TEAM_DELETE` - Team deleted
- `TEAM_MEMBER_ADD` - Member added
- `TEAM_MEMBER_REMOVE` - Member removed
- `TEAM_MEMBER_ROLE_CHANGE` - Member role changed

### System Administration
- `SETTINGS_UPDATE` - Tenant settings changed
- `TAG_CREATE` - Tag created
- `TAG_UPDATE` - Tag updated
- `TAG_DELETE` - Tag deleted
- `EXPORT_CREATE` - Data export generated

### Moderation
- `CONTENT_MODERATE` - Content flagged
- `CONTENT_APPROVE` - Content approved
- `CONTENT_REJECT` - Content rejected

## Filter Logs

### By Actor
Search by user email or name to see all their actions.

### By Action
Filter by specific action type (e.g., all role changes).

### By Entity
Filter by entity ID (e.g., all actions on specific question).

### By Date Range
Select start and end dates.

### Combined Filters
Use multiple filters together (e.g., actor + action + date range).

## Export Logs

1. Admin → Audit Logs
2. Apply filters (optional)
3. Click "Export"
4. Choose format: CSV or JSON
5. Download

**Use cases:**
- Compliance reports
- Security investigations
- Change tracking
- Data retention

## Log Retention

- Logs are **append-only** (cannot be modified or deleted)
- Retained indefinitely by default
- No automatic deletion

**Custom retention:**
Configure in database or implement archival process.

## Common Queries

### Who Answered This Question?
1. Filter by Entity: Question ID
2. Filter by Action: `QUESTION_ANSWER`

### Who Changed This User's Role?
1. Filter by Entity: User ID
2. Filter by Action: `USER_ROLE_CHANGE`

### All Actions by User
1. Filter by Actor: User email

### All Failed Login Attempts
1. Filter by Action: `LOGIN_FAILED`

### Changes in Last 24 Hours
1. Filter by Date: Yesterday to Now

## Security Monitoring

### Suspicious Activity

Monitor for:
- Multiple failed login attempts
- Unusual role changes
- Bulk deletions
- Off-hours administrative actions

### Investigation Workflow

1. **Identify issue**: Notice suspicious activity
2. **Check audit logs**: Filter by relevant criteria
3. **Verify actor**: Confirm user identity
4. **Review actions**: Examine what was done
5. **Take action**: Revert changes if needed, contact user

### Compliance

Audit logs provide evidence for:
- SOC 2 compliance
- GDPR data handling
- Internal audits
- Security incidents

## Log Details

### Before/After State

Changes show:
```json
{
  "before": {
    "role": "member"
  },
  "after": {
    "role": "admin"
  }
}
```

### Contextual Information

Some logs include:
- Reason (if provided)
- IP address
- User agent
- Session ID
- Bulk operation ID (for batch changes)

## Access Control

**Who can view audit logs:**
- Admins
- Owners

**Who cannot view:**
- Viewers
- Members
- Moderators

**Visibility:**
- All actions across all teams
- No team-scoping for audit logs

## Best Practices

1. **Regular reviews**: Check logs weekly for unusual activity
2. **Compliance reporting**: Export logs monthly/quarterly
3. **Incident response**: Check logs first when investigating issues
4. **Role changes**: Always review who changed roles and why
5. **Data exports**: Monitor who exports data

## Limitations

**Not logged:**
- User logins (except failures)
- Question views
- Upvotes
- Search queries
- Pulse responses (anonymous by design)

**Why:** Privacy and performance. Only administrative actions are logged.

## Troubleshooting

### Cannot Find Log Entry

**Check:**
- Correct date range selected
- Filters not too restrictive
- Action actually occurred (verify in UI)

### Log Shows Wrong Actor

**Possible causes:**
- System action (shows as "system" actor)
- Automated process (cron, queue worker)
- Impersonation (admin acting as user)

### Export Fails

**Solutions:**
- Reduce date range
- Apply more specific filters
- Contact support if persists

## Related Documentation

- [handbook/SECURITY_MODEL.md](../../handbook/SECURITY_MODEL.md) - Security model
- [Roles & Permissions](roles-permissions.md) - Who can do what
- [Data Export](export.md) - Export other data
