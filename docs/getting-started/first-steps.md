# First Steps with PulseStage

Welcome to PulseStage! This guide walks you through the main features and helps you get started.

## Table of Contents

- [Sign In](#sign-in)
- [Understanding Roles](#understanding-roles)
- [Submit Your First Question](#submit-your-first-question)
- [Up-Vote Questions](#up-vote-questions)
- [Browse and Search](#browse-and-search)
- [Moderator Features](#moderator-features)
- [Admin Panel](#admin-panel)
- [Presentation Mode](#presentation-mode)

---

## Sign In

After completing the Setup Wizard, you'll need to sign in:

### Demo Data Users

Navigate to the SSO test page:
```
http://localhost:5173/sso-test.html
```

You'll see 4 demo users:
- **Alice Anderson** (alice.admin@acme.com) - Admin role, Engineering team
- **Charlie Chen** (charlie.owner@acme.com) - Owner, Product & Marketing teams
- **David Martinez** (david@acme.com) - Moderator, Engineering team
- **Emily Evans** (emily.member@acme.com) - Member, Engineering & Product teams

Click any user to sign in with their account.

### Custom Setup

If you created your own organization:
1. Navigate to `http://localhost:5173/sso-test.html`
2. You'll see your admin user
3. Click to sign in

---

## Understanding Roles

PulseStage has 5 role levels with increasing permissions:

### Viewer (Default)
- View questions and answers
- Search and browse
- No authentication required

### Member
- Everything Viewer can do, plus:
- Submit questions
- Up-vote questions
- Edit/delete own questions

### Moderator
- Everything Member can do, plus:
- Answer questions
- Pin/unpin questions
- Freeze questions (prevent new upvotes)
- Add/remove tags
- Access Presentation Mode
- **Team-scoped**: Only for assigned teams

### Admin
- Everything Moderator can do, plus:
- Access Admin Panel
- View moderation stats
- Manage tags across all teams
- Bulk operations
- Export data
- View audit logs
- **Cross-team**: Access all teams

### Owner
- Everything Admin can do, plus:
- Create/edit/delete teams
- Manage team members
- Change user roles
- Manage organization settings
- **Full control**

---

## Submit Your First Question

1. **Sign in** with any Member+ account
2. **Select a team** from the navigation
3. **Click "Submit Question"** button
4. **Enter your question**
   - Be clear and concise
   - 10-2000 characters
   - One question per submission
5. **Click "Submit"**

Your question will appear instantly with 1 automatic upvote (from you).

---

## Up-Vote Questions

Help surface the most important questions:

1. **Browse open questions** in any team
2. **Click the ⬆️ button** to upvote
3. **Questions sort by upvote count** automatically
4. **You can only upvote once** per question

Upvoting helps prioritize what gets answered first.

---

## Browse and Search

### Browse Questions

- **Open Questions**: Waiting for answers
- **Answered Questions**: View all responses
- **All Teams**: See questions across teams (Admin+)

### Search

Use the search bar to find specific questions:

- **Full-text search**: Searches question body and responses
- **Prefix matching**: Type partial words
- **Filter by**:
  - Team
  - Tags
  - Status (Open/Answered)
  - Date range

Example searches:
- "remote work"
- "benefits"
- "#urgent" (searches by tag)

---

## Moderator Features

Available to Moderators, Admins, and Owners in their assigned teams.

### Answer Questions

1. **Click on a question** to open details
2. **Click "Answer" button**
3. **Write your response** (clear, comprehensive)
4. **Click "Submit Answer"**

The question status changes to "Answered" and appears in the answered list.

### Pin Questions

Highlight important questions at the top:

1. **Open question details**
2. **Click "Pin" button**
3. **Pinned questions** appear first in the list

### Freeze Questions

Prevent further upvotes (for already-answered questions):

1. **Open question details**
2. **Click "Freeze" button**
3. **Frozen questions** show a ❄️ icon

### Add Tags

Organize questions with tags:

1. **Open question details**
2. **Click "+ Tag"**
3. **Select or create a tag**
4. **Tags appear** on the question card

Common tags:
- 🏷️ Important
- 🔥 Urgent
- 💡 Feature Request
- ✅ Answered Live
- 🎤 Currently Presenting

---

## Admin Panel

Available to Admins and Owners. Access via your profile menu → "Admin Panel".

### Dashboard Tabs

#### Moderation Queue
- View all questions with filters
- Bulk operations (pin, freeze, tag, delete)
- Quick actions for common tasks
- Real-time updates

#### Stats
- Questions answered per moderator
- Average response time
- Activity trends
- Team-level analytics

#### Teams
- View all teams
- Create new teams
- Edit team details
- Activate/deactivate teams
- View member counts

#### Tags
- Create custom tags
- Edit tag names and colors
- Delete unused tags
- See tag usage counts

#### Users (Owner only)
- View all users
- Change user roles
- Remove users from teams
- Search by name/email

#### Export
- Export questions to CSV/JSON
- Filter by date range, status, team
- Include metadata and responses
- Download for analysis

#### Audit Logs (Admin+)
- View all system actions
- Track user changes
- See who did what and when
- Filter by action type, user, date

#### Settings (Owner only)
- Change organization name
- Configure tenant settings
- Manage organization-level options

---

## Presentation Mode

Perfect for live town halls and all-hands meetings. Available to Moderator+ roles.

### Entering Presentation Mode

1. **Navigate to a team**
2. **Click "Presentation Mode"** in the top right
3. **Full-screen view** optimized for projection
4. **Questions auto-sort** by upvotes
5. **Real-time updates** as votes come in

### Using Presentation Mode

- **Large, readable text** for audiences
- **Auto-tagged** as "Currently Presenting"
- **Answer inline** without leaving presentation
- **Questions auto-mark** as "Reviewed" when answered
- **Press ESC** to exit

### Tips for Presentations

1. **Sort by upvotes** to address top priorities
2. **Use tags** to track answered questions
3. **Pin important questions** to keep them visible
4. **Answer live** for immediate engagement
5. **Export afterwards** for follow-up items

---

## Next Steps

### Explore More Features

- **[User Guide](../user-guide/overview.md)** - Detailed feature walkthrough
- **[Moderator Guide](../moderator-guide/overview.md)** - Moderation best practices
- **[Admin Guide](../admin-guide/overview.md)** - Admin panel features

### Customize Your Installation

- **[Configuration](configuration.md)** - Environment settings
- **[Team Management](../admin-guide/team-management.md)** - Organize your teams
- **[Role Management](../admin-guide/roles-permissions.md)** - Set up permissions

### For Developers

- **[Development Guide](../development/setup.md)** - Contribute to PulseStage
- **[API Documentation](../api/overview.md)** - REST API reference
- **[Architecture](../architecture/system-design.md)** - System design

---

## Common Workflows

### Town Hall Q&A Workflow

1. **Before the meeting**:
   - Admins create a team event (e.g., "Q1 All-Hands")
   - Share the link with employees
   - Employees submit questions ahead of time

2. **During the meeting**:
   - Moderator opens Presentation Mode
   - Questions are sorted by upvotes
   - Leadership answers top questions live
   - Tag questions as "Answered Live"

3. **After the meeting**:
   - Admin exports unanswered questions
   - Follow-up responses are added via the platform
   - Transcript can be exported for documentation

### Team Retrospective Workflow

1. **Setup**:
   - Create a team (e.g., "Engineering Retro")
   - Invite team members

2. **Collection Phase**:
   - Team submits questions/topics
   - Upvote most important items
   - Use tags: "Went Well", "Needs Improvement", "Action Item"

3. **Discussion Phase**:
   - Open Presentation Mode
   - Discuss top-voted items
   - Answer/respond inline

4. **Follow-Up**:
   - Export action items
   - Track progress in next retro

---

## Tips & Best Practices

### For Question Submitters

- ✅ **Be specific**: "What's our remote work policy for 2025?" vs "Policy question?"
- ✅ **One question per submission**: Makes it easier to answer
- ✅ **Search first**: Your question might already be answered
- ✅ **Upvote similar questions**: Rather than duplicating

### For Moderators

- ✅ **Answer promptly**: Within 48 hours when possible
- ✅ **Be comprehensive**: Answer thoroughly to avoid follow-ups
- ✅ **Use tags**: Organize for easier tracking
- ✅ **Pin important**: Keep critical questions visible

### For Admins

- ✅ **Review audit logs**: Track system usage
- ✅ **Monitor stats**: Identify response bottlenecks
- ✅ **Export regularly**: Keep records for compliance
- ✅ **Manage tags**: Keep them organized and relevant

---

## Troubleshooting

### Can't Submit Questions

- Ensure you're signed in (Member+ role required)
- Check you're on a team page, not the home page
- Verify question length (10-2000 characters)

### Not Seeing All Teams

- Regular users only see teams they're members of
- Admins see all teams
- Check with your admin if you need access

### Presentation Mode Not Available

- Requires Moderator+ role
- Must be on a team page with questions
- Check your role in Profile → Teams

### Changes Not Appearing

- Hard refresh: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear browser cache
- Check real-time connection (top-right indicator)

---

## Getting Help

- 📖 [Full Documentation](../index.md)
- 🐛 [Report Issues](https://github.com/seanmdalton/pulsestage/issues)
- 💬 [Discussions](https://github.com/seanmdalton/pulsestage/discussions)
- 📧 Contact your PulseStage administrator

---

Welcome to PulseStage! We hope you enjoy using it to improve communication and transparency in your organization. 🚀
