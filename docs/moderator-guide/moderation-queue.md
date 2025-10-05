# Moderation Queue

The Moderation Queue is a powerful interface for moderators and admins to efficiently manage and moderate questions across all teams.

## Overview

Access the Moderation Queue from the Admin Panel → **Moderation Queue** tab.

**Who can access:**
- ✅ Moderators (for their teams)
- ✅ Admins (all teams)
- ✅ Owners (all teams)

## Features

### 📊 Table View

All questions are displayed in a comprehensive table with:

- **Checkbox** - Select for bulk operations
- **Question** - Body text with pinned 📌 and frozen ❄️ indicators
- **Team** - Which team the question belongs to
- **Status** - OPEN or ANSWERED
- **Upvotes** - Number of upvotes
- **Tags** - Color-coded tag pills
- **Actions** - Quick action buttons

### 🔍 Filters

Filter questions by:

- **Status** - All, Open, or Answered
- **Team** - Filter to specific team
- **Pinned** - All, Pinned Only, or Unpinned Only
- **Frozen** - All, Frozen Only, or Unfrozen Only
- **Needs Review** - Checkbox to show only unreviewed questions

Clear all filters with the "Clear Filters" button.

### ⚡ Quick Actions

Each question has quick action buttons:

- **📌 Pin/Unpin** - Highlight important questions (pinned appear first)
- **❄️ Freeze/Unfreeze** - Lock questions from further interaction
- **💬 Answer** - Open answer modal (only for OPEN questions)

Actions update instantly and sync across all browser windows via SSE.

## Bulk Operations

### Selecting Questions

1. **Select individual questions** - Click checkbox next to each question
2. **Select all** - Click checkbox in table header
3. **Selection shows badge** - "X questions selected" with available actions

### Bulk Tag Actions

When questions are selected, use the **Tag Actions** dropdown:

**Add Tag:**
- Select "+ Tag Name" from dropdown
- Tag is added to all selected questions
- Success count displayed

**Remove Tag:**
- Select "- Tag Name" from dropdown
- Tag is removed from all selected questions

### Bulk Actions

Use the **Bulk Actions** dropdown for:

- **📌 Pin All** - Pin all selected questions
- **📌 Unpin All** - Remove pin from all selected
- **❄️ Freeze All** - Freeze all selected questions
- **❄️ Unfreeze All** - Unfreeze all selected
- **🗑️ Delete All** - Permanently delete (requires confirmation)

**Results:**
- Success/error count displayed
- Audit log created for all operations
- Real-time updates via SSE to all connected clients

## Pin vs Freeze

### 📌 Pin

**Purpose:** Highlight important questions

**Effect:**
- Question appears first in lists (ordered by pin status)
- Visual 📌 indicator shown
- Tracks who pinned and when
- Does NOT prevent upvotes or responses

**Use Cases:**
- Highlight frequently asked questions
- Mark questions for leadership attention
- Prioritize for upcoming town hall

### ❄️ Freeze

**Purpose:** Lock questions from further interaction

**Effect:**
- Visual ❄️ indicator shown
- Prevents new upvotes (optional enforcement)
- Prevents new responses (optional enforcement)
- Tracks who froze and when

**Use Cases:**
- Mark questions as resolved
- Prevent interaction on sensitive topics
- Archive old questions while keeping them visible

## Best Practices

### Efficient Workflow

1. **Filter to "Needs Review"** - See only unreviewed questions
2. **Sort by team** - Focus on your assigned teams
3. **Use bulk tags** - Tag similar questions at once (e.g., all "Policy" questions)
4. **Pin urgent items** - Ensure leadership sees critical questions
5. **Freeze resolved** - Lock questions that don't need more upvotes

### Tag Strategy

Common tag patterns:

- **"Important"** - High-priority questions
- **"Reviewed"** - Questions already addressed in presentation mode
- **"Currently Presenting"** - Active question in presentation (auto-managed)
- **"Follow-up"** - Needs additional action
- **"Policy"**, **"Benefits"**, **"Culture"** - Topic categories

### Bulk Operations Tips

- **Always review selection** before bulk delete
- **Use bulk tag** to categorize similar questions quickly
- **Bulk pin** for pre-town hall question prioritization
- **Bulk freeze** after event to archive historical questions

## Keyboard Shortcuts

When in moderation queue:

- **Click checkbox** - Select/deselect question
- **Click row** - View question details
- **Quick actions** - Instant pin/freeze/answer

## Real-Time Updates

The moderation queue updates in real-time:

- **New questions** appear automatically
- **Upvote counts** update live
- **Tag changes** from other moderators sync instantly
- **Pin/freeze actions** from other windows reflected immediately

No need to refresh the page!

## Related Pages

- [Answering Questions](answering-questions.md)
- [Tagging](tagging.md)
- [Presentation Mode](presentation-mode.md)
- [Moderation Stats](../admin-guide/moderation-stats.md)

