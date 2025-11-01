# Search & Browse

Find questions and answers using search and filters.

## Search

Type in the search box to find questions.

**Searches:**
- Question text
- Answer text
- Tags

**Features:**
- Full-text search
- Prefix matching (e.g., "comp" finds "compensation")
- Debounced (waits for you to stop typing)
- Real-time results

## Filters

### By Status

- **Open** - Unanswered questions
- **Answered** - Questions with answers
- **All** - Both open and answered

### By Team

Select team from navigation to filter by team.

Or use "All Teams" to see organization-wide questions (admins/owners only).

### By Tag

Click a tag or search `tag:benefits` to filter by tag.

**Multiple tags:** Use multiple tag filters to narrow results.

### By Date

Select date range:
- Last 7 days
- Last 30 days
- Last 90 days
- All time
- Custom range

## Sorting

Sort results by:
- **Upvotes** (default) - Most upvoted first
- **Recent** - Newest first
- **Oldest** - Oldest first

## Advanced Search

### Tag Search
```
tag:benefits
```

### Multiple Terms
```
remote work policy
```

Finds questions containing all terms.

### Exact Phrases
Not currently supported. Search finds questions containing all words.

## Browse by Team

1. Click team name in navigation
2. View team's questions
3. Switch teams as needed

Each team shows:
- Question count (open/answered)
- Team-specific questions only
- Team moderators' answers

## View Question Details

Click any question to see:
- Full question text
- Upvote count
- Tags
- Answer (if answered)
- Answer author
- Dates (submitted, answered)

## Tips

1. **Search before submitting** - Avoid duplicates
2. **Use tags** - Filter by topic quickly
3. **Try variants** - "compensation", "pay", "salary" may yield different results
4. **Check date range** - Expand if not finding results
5. **Browse teams** - Question might be in different team

## Keyboard Shortcuts

- `/` - Focus search box
- `Esc` - Clear search

## Search Performance

Full-text search uses PostgreSQL GIN indexes for fast results.

**Performance:**
- < 100ms for most searches
- Searches entire question and answer text
- Case-insensitive

## No Results?

**Try:**
1. Remove filters
2. Expand date range
3. Check different team
4. Try synonyms or broader terms
5. Browse without search

## Related

- [Submitting Questions](submitting-questions.md) - Ask new question
- [Upvoting](upvoting.md) - Vote on results
- [Teams](teams.md) - Team structure
