# Admin Guide Overview

Welcome to the PulseStage admin guide! As an admin, you have global access to manage teams, users, permissions, and system-wide settings.

## What is an Admin?

Admins are **global roles** with access to:
- All teams and questions across the entire tenant
- User and team management
- System configuration and settings
- Audit logs and security features
- Global moderation statistics

## Key Features for Admins

### 👥 Team Management
Create, configure, and manage teams across your organization. Assign moderators and control team settings.

[Learn more about team management →](team-management.md)

### 🏷️ Tag Management
Create and manage global tags that can be used across all teams. Define tag colors and descriptions.

[Learn more about tag management →](tag-management.md)

### 🔐 User Roles & Permissions
Manage user roles and permissions using PulseStage's role-based access control (RBAC) system.

[Learn more about roles & permissions →](roles-permissions.md)

### 📊 Moderation Statistics
View global moderation metrics, track moderator performance, and analyze Q&A activity across all teams.

[Learn more about moderation stats →](moderation-stats.md)

### 📋 Audit Logging
Review comprehensive audit logs of all administrative actions, including who did what and when.

[Learn more about audit logging →](audit-logging.md)

### 📤 Export Data
Export questions, answers, and analytics data for reporting and compliance purposes.

[Learn more about data export →](export.md)

## Admin vs Moderator vs Owner

| Feature | Viewer | Member | Moderator | Admin | Owner |
|---------|--------|--------|-----------|-------|-------|
| View questions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit questions | ❌ | ✅ | ✅ | ✅ | ✅ |
| Upvote questions | ❌ | ✅ | ✅ | ✅ | ✅ |
| Answer questions | ❌ | ❌ | ✅ (team-scoped) | ✅ (global) | ✅ (global) |
| Tag questions | ❌ | ❌ | ✅ (team-scoped) | ✅ (global) | ✅ (global) |
| Pin/Freeze | ❌ | ❌ | ✅ (team-scoped) | ✅ (global) | ✅ (global) |
| Moderation queue | ❌ | ❌ | ✅ (team-scoped) | ✅ (global) | ✅ (global) |
| Manage teams | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage tags | ❌ | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Export data | ❌ | ❌ | ❌ | ✅ | ✅ |
| Full system access | ❌ | ❌ | ❌ | ❌ | ✅ |

!!! info "Global Access"
    **Admins and Owners** have global access across all teams. Unlike moderators, who are team-scoped, admins can:
    
    - View and manage questions from any team
    - Access moderation statistics for all teams
    - Perform administrative actions without team restrictions

## Admin Permissions

As an admin, you have access to:

✅ All questions across all teams  
✅ Global moderation queue and statistics  
✅ Team management (create, edit, delete)  
✅ User role management  
✅ Tag management (create, edit, delete)  
✅ Audit log viewing and export  
✅ Data export (CSV/JSON)  
✅ Pin, freeze, and delete questions globally  

## Getting Started

1. **Access the Admin Panel** from your user dropdown (visible from any team)
2. **Review the Moderation Queue** to see all pending questions
3. **Check Moderation Stats** to understand platform usage
4. **Manage Teams** to organize your organization
5. **Review Audit Logs** to track administrative actions

## Quick Tips

!!! tip "Best Practices"
    - **Set up teams first**: Create your organizational structure before adding users
    - **Define roles clearly**: Assign moderators to appropriate teams
    - **Create tag taxonomy**: Establish consistent tags before Q&A sessions
    - **Monitor audit logs**: Regularly review administrative actions
    - **Export data regularly**: Keep backups and generate reports
    - **Review stats**: Track engagement and moderator performance

!!! warning "Security Best Practices"
    - Limit admin roles to trusted users
    - Review audit logs for suspicious activity
    - Use strong authentication (SSO recommended)
    - Export and backup data regularly
    - Monitor moderation statistics for anomalies

## Admin Workflow

A typical admin workflow:

1. **Initial Setup**:
   - Create teams for your organization
   - Assign moderators to teams
   - Create tag taxonomy
   - Configure settings

2. **Ongoing Management**:
   - Monitor moderation statistics
   - Review audit logs weekly
   - Manage user roles as needed
   - Export data for reporting

3. **Before Events**:
   - Ensure moderators are assigned
   - Review and clean up old questions
   - Check system health

4. **After Events**:
   - Review participation metrics
   - Export Q&A data
   - Analyze engagement trends

## Security & Compliance

As an admin, you're responsible for:

- **Data security**: Protecting user questions and responses
- **Access control**: Managing who can view and moderate
- **Audit trails**: Maintaining records of administrative actions
- **Data retention**: Exporting and archiving data as needed
- **Compliance**: Following your organization's policies

[Learn more about security features →](../security/overview.md)

## Need Help?

- **For user features**: See the [User Guide](../user-guide/overview.md)
- **For moderator features**: See the [Moderator Guide](../moderator-guide/overview.md)
- **For technical issues**: Check our [GitHub Issues](https://github.com/seanmdalton/pulsestage/issues)
- **For security**: See the [Security Documentation](../security/overview.md)

## Next Steps

Ready to administer PulseStage? Check out these guides:

- [Team Management](team-management.md) - Set up your organizational structure
- [Roles & Permissions](roles-permissions.md) - Understand the RBAC system
- [Moderation Stats](moderation-stats.md) - Track platform engagement
- [Audit Logging](audit-logging.md) - Monitor administrative actions
