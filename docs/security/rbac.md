# Role-Based Access Control (RBAC)

PulseStage implements a comprehensive RBAC system with five distinct roles and team-scoped permissions.

## Roles

### Viewer
- **Access**: Read-only, anonymous access
- **Permissions**:
  - Browse questions (open and answered)
  - Use search functionality
  - View team information

**Use Case**: Public access, unauthenticated users

### Member
- **Access**: Basic authenticated user
- **Permissions**:
  - All Viewer permissions
  - Submit questions
  - Upvote questions
  - Manage profile preferences

**Use Case**: All employees, authenticated users

### Moderator
- **Access**: Team-scoped moderation
- **Permissions**:
  - All Member permissions  
  - Answer questions (in assigned teams only)
  - Add/remove tags on questions
  - Access presentation mode
  - View admin panel (limited to their teams)

**Use Case**: Team leads, department managers

### Admin
- **Access**: Global administrative access
- **Permissions**:
  - All Moderator permissions (across all teams)
  - Create and manage teams
  - Create and manage tags
  - Access audit logs
  - Export data
  - View all questions across teams

**Use Case**: Platform administrators, IT team

### Owner
- **Access**: Complete system control
- **Permissions**:
  - All Admin permissions
  - Manage user roles
  - System configuration

**Use Case**: System owners, executive admins

## Permission Matrix

| Permission | Viewer | Member | Moderator | Admin | Owner |
|-----------|--------|--------|-----------|-------|-------|
| View questions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit questions | ❌ | ✅ | ✅ | ✅ | ✅ |
| Upvote questions | ❌ | ✅ | ✅ | ✅ | ✅ |
| Answer questions | ❌ | ❌ | ✅ (team-scoped) | ✅ | ✅ |
| Tag questions | ❌ | ❌ | ✅ (team-scoped) | ✅ | ✅ |
| Presentation mode | ❌ | ❌ | ✅ (team-scoped) | ✅ | ✅ |
| Create teams | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage tags | ❌ | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Export data | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ❌ | ✅ |

## Team Scoping

Moderators have **team-scoped permissions**, meaning:

- They can only answer questions from teams they moderate
- They can only tag questions in their assigned teams
- They only see questions from their teams in the admin panel
- Presentation mode is limited to their teams

**Example**:
- Mike (Moderator of "People" team) can:
  - ✅ Answer questions in the People team
  - ❌ Answer questions in the Engineering team
  - ✅ See "Admin Panel" link when viewing People team questions
  - ❌ See "Admin Panel" link when viewing Engineering team questions

## Implementation

### Backend Enforcement

Permissions are enforced at the API level using middleware:

```typescript
// Team-scoped permission check
app.post("/questions/:id/respond", 
  extractQuestionTeam(), 
  requirePermission('question.answer', { teamIdParam: 'teamId' }), 
  async (req, res) => {
    // Handler
  }
);
```

### Frontend UI

The UI dynamically shows/hides features based on:
1. User's role in the current team
2. Current team context (which team page they're viewing)

### Audit Logging

All permission checks (grants and denials) are logged to the audit log for compliance and security monitoring.

## Testing

RBAC is comprehensively tested with 20+ test scenarios covering:
- Team-scoped permissions
- Role hierarchy
- Cross-tenant isolation
- Permission denials

See [api/src/rbac.test.ts](../../api/src/rbac.test.ts) for implementation.

## Best Practices

1. **Principle of Least Privilege**: Assign the minimum role needed
2. **Team Scoping**: Use moderators for department-level moderation
3. **Audit Regularly**: Review audit logs for suspicious activity
4. **Limit Owners**: Only assign owner role to trusted administrators

## Related Documentation

- [Security Overview](overview.md)
- [Audit Logging](audit-logging.md)
- [Admin Guide: Roles & Permissions](../admin-guide/roles-permissions.md)
