# Team Management

Create and manage teams to organize questions and users.

## Team Structure

Teams organize:
- Questions (team-scoped)
- Pulse data (team-scoped with org rollups)
- Moderators (team-scoped permissions)
- Users (primary team + memberships)

## Create Team

1. Admin → Teams
2. Click "Create Team"
3. Enter:
   - **Name**: Display name (e.g., "Engineering")
   - **Slug**: URL-friendly (e.g., "engineering")
   - **Description**: Optional team description

4. Click "Create"

**Slug requirements:**
- Lowercase
- No spaces (use hyphens)
- Alphanumeric + hyphens only
- Cannot be: "all", "admin", "api"

## Edit Team

1. Admin → Teams → [Team Name]
2. Click "Edit"
3. Update name, slug, or description
4. Save

**Note:** Changing slug changes team URLs.

## Delete Team

1. Admin → Teams → [Team Name]
2. Click "Delete"
3. Confirm deletion

**Warning:** This deletes:
- All team questions
- All team pulse data
- Team memberships

Cannot be undone.

## Manage Team Members

### Add Members

1. Admin → Teams → [Team Name] → "Manage Members"
2. Click "Add Member"
3. Search for user by email/name
4. Select role:
   - Viewer
   - Member
   - Moderator
5. Click "Add"

### Change Member Role

1. Admin → Teams → [Team Name] → "Manage Members"
2. Find user
3. Click role dropdown
4. Select new role
5. Save

### Remove Members

1. Admin → Teams → [Team Name] → "Manage Members"
2. Find user
3. Click "Remove"
4. Confirm

**Note:** Users must belong to at least one team.

## Primary Team

Each user has one primary team:

- Determines default view on login
- Used for pulse cohort assignment
- Shown in user profile

**Set primary team:**
1. Admin → Users → [User Name]
2. Select "Primary Team"
3. Save

## Team Visibility

All teams are visible to all users (public).

**Privacy:**
- Questions are team-scoped
- Pulse data is team-scoped
- Moderator permissions are team-scoped

Users can:
- View all teams
- Switch between teams
- See question counts per team

## Bulk Operations

### Bulk Add Members

1. Create CSV file:
```csv
email,team,role
alice@example.com,engineering,member
bob@example.com,engineering,moderator
```

2. Admin → Teams → [Team Name] → "Import Members"
3. Upload CSV
4. Review and confirm

### Bulk Update Roles

1. Admin → Teams → [Team Name] → "Manage Members"
2. Select multiple users
3. Click "Change Role"
4. Select new role
5. Confirm

## Team Analytics

View team statistics:

1. Admin → Teams → [Team Name] → "Analytics"

Shows:
- Total members
- Active questions
- Answered questions
- Pulse participation rate
- Moderator activity

## Common Tasks

### Create Department Teams

Recommended structure:
- Engineering
- Product
- Marketing
- Sales
- Customer Success
- General (for company-wide questions)

### Reorganize Teams

When teams change:
1. Create new team
2. Move users to new team
3. Archive old team (optional)

**Cannot:** Move questions between teams (by design).

### Seasonal Teams

For temporary teams (e.g., "All Hands 2025"):
1. Create team
2. Use for event
3. Delete or archive after event

## Best Practices

1. **Naming:** Use clear, recognized team names
2. **Size:** Keep teams < 100 members for best experience
3. **Moderators:** Assign 2-3 moderators per team
4. **Primary teams:** Ensure all users have primary team set
5. **Cleanup:** Delete unused teams periodically

## Troubleshooting

### Cannot Delete Team

**Reasons:**
- Team has questions (delete questions first)
- Team has members (remove members first)
- You don't have admin/owner role

### Users Not Seeing Team

**Check:**
- Team is created
- User is logged in
- Team hasn't been deleted

### Moderator Cannot Access Team

**Check:**
- Moderator is member of team
- Moderator role is assigned for that team
- Team exists

## Related Documentation

- [Roles & Permissions](roles-permissions.md) - Team roles
- [handbook/DATA_MODEL_SNAPSHOT.md](../../handbook/DATA_MODEL_SNAPSHOT.md) - Team data model
- [handbook/PRODUCT_VISION.md](../../handbook/PRODUCT_VISION.md) - Team-first architecture
