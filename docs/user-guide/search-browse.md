# Search & Browse

PulseStage offers powerful search and filtering capabilities to help you find relevant questions quickly.

## Quick Search

### Basic Search

The search bar is available on both **Open Questions** and **Answered Questions** pages.

**Features:**
- **Full-text search** - Searches both question body and answers
- **Prefix matching** - "mob" finds "mobile", "rem" finds "remote"
- **Multi-word search** - "remote work" finds questions containing both words
- **Debounced input** - Results update 300ms after you stop typing (smooth, no lag)

**Example searches:**
```
remote          → Finds "remote work", "working remotely", etc.
benefits        → Finds questions about benefits packages
work life       → Finds "work-life balance" questions
```

### How It Works

PulseStage uses PostgreSQL full-text search with:

- **GIN indexes** for fast searching
- **English stemming** - "running" matches "run", "runs", "ran"
- **Relevance ranking** - Best matches appear first
- **Prefix operators** - Substring matching for partial words

## Advanced Filters

Click **"Advanced Filters"** to access additional filtering options.

### Filter by Tag

Select a tag from the dropdown to show only questions with that tag.

**Use cases:**
- Find all "Important" questions
- See questions "Currently Presenting"
- Filter by topic tags like "Policy" or "Benefits"

### Filter by Date Range

**From Date:** Show questions created on or after this date  
**To Date:** Show questions created on or before this date

**Date handling:**
- Inclusive of both start and end dates
- Full day included (00:00:00 to 23:59:59)
- Works correctly across timezones

**Use cases:**
- Questions from last week
- Questions submitted before last town hall
- Questions from a specific event or meeting

### Filter by Team

Automatically applied when viewing a team page (e.g., `/engineering/open`).

Switch teams using the team dropdown in the navigation bar.

### Combined Filters

All filters work together:

**Example:** Search for "remote" + Tag: "Policy" + From: Last month
- Shows only policy questions about remote work from the last month

### Clear Filters

The **"Clear All Filters"** button appears when filters are active.

Shows count: "Clear All Filters (3)" indicating how many filters are applied.

## Browsing Questions

### Open Questions Page

**Default View:**
- Shows all OPEN (unanswered) questions
- Sorted by upvotes (highest first)
- Real-time updates as new questions arrive

**Includes:**
- Question body
- Upvote count with button
- Tags (color-coded)
- Team name
- Creation date
- Upvote button (if you haven't upvoted yet)

### Answered Questions Page

**Default View:**
- Shows all ANSWERED questions
- Grouped by week
- Sorted by date (most recent first)

**Card View Features:**
- Question preview (truncated)
- Answer preview (truncated)
- Click to expand and read full Q&A
- Tags visible
- Upvote count
- Answered date

### Question Details

Click any question to see:

- Full question text
- Complete answer (if answered)
- All tags
- Upvote count
- Submission and answer timestamps
- Team information

## Search Tips

### Finding Specific Topics

1. **Use specific keywords** - "remote policy" better than "remote"
2. **Try variations** - "benefit", "benefits", "comp", "compensation"
3. **Use tags** - Filter by tag after searching

### Discovering Trending Topics

1. **Sort by upvotes** - Default on Open Questions
2. **Check recent** - Use date filter for last week
3. **Browse by team** - See what each team is asking

### Research Before Submitting

1. **Search first** - Your question might already be asked
2. **Upvote existing** - Better than duplicate submissions
3. **Check answered** - Question might already have an answer

## Keyboard Shortcuts

While browsing:

- **Type to search** - Focus is on search bar by default
- **Click question** - Open details/answer modal
- **Click upvote** - Upvote without opening modal

## Real-Time Updates

Search results and filtered views update in real-time:

- **New questions** appear automatically if they match filters
- **Upvote counts** update live
- **Tags** added by moderators appear instantly
- **Status changes** (answered questions removed from open view)

No need to refresh the page!

## Mobile Experience

All search and filter features work on mobile:

- **Responsive filters** - Stack vertically on small screens
- **Touch-friendly** - Large tap targets for upvotes and filters
- **Collapsible filters** - Advanced filters hidden by default to save space

## Related Pages

- [Submitting Questions](submitting-questions.md)
- [Upvoting](upvoting.md)
- [Teams](teams.md)
