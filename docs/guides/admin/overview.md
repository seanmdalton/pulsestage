# Admin Guide

Administrative features and workflows for PulseStage.

## Admin Role

Admins have full access to all features:
- Manage teams and users
- Configure tenant settings
- View audit logs
- Monitor email queue
- Export data
- Manage tags
- Access all team content

See [Roles & Permissions](roles-permissions.md) for complete role details.

## Quick Links

- [Roles & Permissions](roles-permissions.md) - Manage user roles
- [Team Management](team-management.md) - Create and manage teams
- [Tag Management](tag-management.md) - Organize questions with tags
- [Audit Logging](audit-logging.md) - Track all administrative actions
- [Data Export](export.md) - Export questions, pulse, audit logs
- [Moderation Stats](moderation-stats.md) - View moderation metrics

## Common Tasks

### Access Admin Panel

Navigate to Admin → Overview in the main navigation.

### Manage Users

1. Admin → Users
2. Search for user by email or name
3. Click user to edit:
   - Assign roles (viewer, member, moderator, admin, owner)
   - Set primary team
   - Add/remove team memberships

### Create Teams

1. Admin → Teams
2. Click "Create Team"
3. Enter details:
   - Name (e.g., "Engineering")
   - Slug (e.g., "engineering")
   - Description (optional)

See [Team Management](team-management.md).

### Monitor Activity

1. **Audit Logs**: Admin → Audit Logs
   - Filter by actor, action, entity, date
   - Export as CSV/JSON

2. **Email Queue**: Admin → Email Queue
   - View pending and sent emails
   - Retry failed emails

3. **Moderation Stats**: Admin → Moderation
   - View moderator activity
   - Track response times

### Configure Settings

Admin → Tenant Settings:

- **Branding**
  - Website title
  - Welcome message
  - Logo URL

- **Theme**
  - Choose from 3 built-in themes
  - Light/dark mode preference

- **Features**
  - Enable/disable pulse invitations
  - Configure cohort size
  - Set participation threshold

See [handbook/ADMIN_GUIDE.md](../../handbook/ADMIN_GUIDE.md) for complete admin documentation.

## System Administration

### Health Monitoring

Check system health:
- API: `http://localhost:3000/health`
- Database connectivity
- Redis connectivity
- Rate limiting status

### Email Configuration

Monitor email delivery:
1. Admin → Email Queue
2. View all pending and sent emails
3. Retry failed emails
4. Check email provider status

See [handbook/INTEGRATIONS/EMAIL.md](../../handbook/INTEGRATIONS/EMAIL.md).

### Security Monitoring

1. **Audit Logs**: Track all admin/moderator actions
2. **Rate Limiting**: Monitor API request rates
3. **Content Moderation**: Review flagged content

See [handbook/SECURITY_MODEL.md](../../handbook/SECURITY_MODEL.md).

## Data Management

### Backups

Export data regularly:
- Questions: Admin → Export → Questions
- Pulse: Admin → Export → Pulse Responses
- Audit Logs: Admin → Export → Audit Logs

Format: CSV or JSON

### Data Retention

- Audit logs: Retained indefinitely
- Pulse responses: Anonymous, retained indefinitely
- Questions: Retained until deleted
- User data: Retained until account deleted

## Troubleshooting

### Cannot Access Admin Panel

Verify your role:
1. Contact another admin or owner
2. Check database: `SELECT role FROM "User" WHERE email='your@email.com';`

Required role: Admin or Owner

### Users Cannot Log In

1. Check authentication configuration (Admin → Tenant Settings)
2. Verify OAuth apps are configured
3. Check audit logs for failed login attempts

### Email Not Sending

1. Admin → Email Queue
2. Check failed emails
3. Verify email provider configuration
4. Test with Admin → Send Test Email

## Best Practices

1. **Regular Audits**: Review audit logs weekly
2. **Role Assignment**: Grant minimum necessary permissions
3. **Team Organization**: Create teams that match your org structure
4. **Tag Management**: Maintain consistent tag taxonomy
5. **Data Exports**: Regular backups of critical data

## Next Steps

- [Roles & Permissions](roles-permissions.md) - Understand role model
- [Team Management](team-management.md) - Set up teams
- [handbook/ADMIN_GUIDE.md](../../handbook/ADMIN_GUIDE.md) - Complete admin documentation
