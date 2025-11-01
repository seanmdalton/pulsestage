# Roles & Permissions

PulseStage uses role-based access control (RBAC) with 5 roles.

## Roles

### Viewer
**Scope:** Team-scoped

**Permissions:**
- Browse questions
- View answers
- Upvote questions
- View pulse dashboard (team only)

**Cannot:**
- Submit questions
- Answer questions
- Moderate content
- Access admin features

---

### Member
**Scope:** Team-scoped

**Permissions:**
- All Viewer permissions, plus:
- Submit questions (anonymous or named)
- Respond to pulse invitations
- Search and filter questions

**Cannot:**
- Answer questions
- Moderate content
- Access admin features

**Default role** for new users.

---

### Moderator
**Scope:** Team-scoped

**Permissions:**
- All Member permissions, plus:
- Answer questions (team only)
- Tag questions (team only)
- Pin questions (team only)
- Freeze questions (team only)
- Access moderation queue (team only)
- Use presentation mode (team only)
- Bulk operations (team only)

**Cannot:**
- Moderate other teams' content
- Access admin features
- Manage users

**Key feature:** Team-scoped permissions. Moderators can only moderate their assigned teams.

---

### Admin
**Scope:** Global (all teams)

**Permissions:**
- All Moderator permissions (all teams), plus:
- View audit logs
- Export data (CSV/JSON)
- Manage teams (create, edit, delete)
- Manage tags (create, edit, delete)
- Monitor email queue
- Configure tenant settings
- Manage user roles
- View moderation stats

**Cannot:**
- Delete users
- Change owner role

---

### Owner
**Scope:** Global (all teams)

**Permissions:**
- All Admin permissions, plus:
- Delete users
- Assign/revoke owner role
- Complete system control

**Highest privilege level.**

## Permission Matrix

| Permission | Viewer | Member | Moderator | Admin | Owner |
|------------|--------|--------|-----------|-------|-------|
| Browse questions | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upvote | ✓ | ✓ | ✓ | ✓ | ✓ |
| Submit questions | - | ✓ | ✓ | ✓ | ✓ |
| Answer questions | - | - | ✓ (team) | ✓ (all) | ✓ (all) |
| Tag/Pin/Freeze | - | - | ✓ (team) | ✓ (all) | ✓ (all) |
| Presentation mode | - | - | ✓ (team) | ✓ (all) | ✓ (all) |
| View audit logs | - | - | - | ✓ | ✓ |
| Export data | - | - | - | ✓ | ✓ |
| Manage teams | - | - | - | ✓ | ✓ |
| Manage users | - | - | - | ✓ | ✓ |
| Delete users | - | - | - | - | ✓ |
| Assign owner | - | - | - | - | ✓ |

## Assigning Roles

### User Roles

1. Admin → Users → [User Name]
2. Select role from dropdown
3. Save

**Note:** User must be logged in at least once before role can be assigned.

### Team Roles

Users can have different roles per team:

1. Admin → Teams → [Team Name]
2. Click "Manage Members"
3. Add user and select role
4. Save

**Example:**
- Alice: Moderator (Engineering), Member (Product)
- Bob: Admin (global)

## Role Strategy

### Small Organizations (< 50 users)

- **Most users:** Member
- **Team leads:** Moderator (their team)
- **1-2 people:** Admin
- **1 person:** Owner

### Large Organizations (50+ users)

- **All employees:** Member or Viewer
- **Team leads:** Moderator (their team)
- **Department heads:** Admin
- **1-2 people:** Owner

### External Users (Contractors, Partners)

- **Default:** Viewer
- **If contributing:** Member
- **Never:** Moderator, Admin, or Owner

## Security Considerations

### Principle of Least Privilege

Grant minimum permissions necessary:
- Default to **Member** for regular users
- **Moderator** only for active team moderators
- **Admin** only for system administrators
- **Owner** only for 1-2 trusted individuals

### Role Changes

All role changes are logged in audit log:
- Actor (who changed role)
- Target (whose role changed)
- Old role → New role
- Timestamp

View in Admin → Audit Logs.

### Team-Scoped Security

Moderators can only:
- View their assigned teams
- Moderate content in their teams
- Cannot access other teams' private content

Admins and owners can access all teams.

## Role Validation

### Check User's Roles

Admin → Users → [User Name]

Shows:
- Global role
- Team memberships and roles
- Primary team

### Verify Permissions

Test as user:
1. Admin → Users → [User Name]
2. Click "Impersonate User" (if available)
3. Verify permissions work as expected

Or check database:
```sql
SELECT u.email, u.role, tm.team_id, tm.role as team_role
FROM "User" u
LEFT JOIN "TeamMembership" tm ON u.id = tm.user_id
WHERE u.email = 'user@example.com';
```

## Common Issues

### User Cannot Submit Questions

**Check:**
1. Role is Member or higher
2. User is member of at least one team
3. User has set primary team

### Moderator Cannot Answer Questions

**Check:**
1. Question is in moderator's team
2. Moderator role is assigned for that team
3. Question is not frozen

### Admin Cannot Access Feature

**Check:**
1. Feature is enabled in tenant settings
2. User role is Admin or Owner
3. Browser cookies/session are valid

## Best Practices

1. **Regular audits** - Review role assignments quarterly
2. **Offboarding** - Remove roles when users leave
3. **Team changes** - Update team memberships when users change teams
4. **Document decisions** - Keep record of why users have elevated roles

## Related Documentation

- [Team Management](team-management.md) - Assign team roles
- [Audit Logging](audit-logging.md) - Track role changes
- [handbook/SECURITY_MODEL.md](../../handbook/SECURITY_MODEL.md) - Security model details
- [handbook/DECISIONS/ADR-0003-roles.md](../../handbook/DECISIONS/ADR-0003-roles.md) - Role design decisions
