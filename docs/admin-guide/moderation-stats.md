# Moderation Stats

Track moderation activity and performance with detailed analytics dashboard.

## Overview

Access Moderation Stats from the Admin Panel → **Stats** tab.

**Who can access:**
- ✅ Moderators (see their own stats + team stats)
- ✅ Admins (all stats)
- ✅ Owners (all stats)

## Overall Metrics

Four key performance indicators displayed as cards:

### Questions Reviewed
Total number of questions reviewed/answered by all moderators in the date range.

**Includes:**
- Questions answered
- Questions reviewed but not answered
- All moderator activity

### Questions Answered
Total questions that received a response (status changed to ANSWERED).

**Answer Rate** = Questions Answered / Questions Reviewed

### Questions Pinned
Total questions currently pinned (highlighted as important).

### Average Response Time
Mean time from question creation to response, calculated across all answered questions.

**Displayed as:**
- Minutes (e.g., "45m") for < 60 minutes
- Hours and minutes (e.g., "2h 15m") for >= 60 minutes
- "N/A" if no questions have been answered

## Per-Moderator Breakdown

Detailed table showing performance for each moderator:

| Column | Description |
|--------|-------------|
| **Moderator** | Name and email address |
| **Reviewed** | Total questions reviewed |
| **Answered** | Questions with responses |
| **Pinned** | Questions pinned by this moderator |
| **Frozen** | Questions frozen by this moderator |
| **Avg Response** | Average time to respond |
| **Teams** | Number of teams this moderator covers |

**Sorted by:** Questions reviewed (most active moderators first)

## Filters

### Date Range

**Default:** Last 30 days (most recent activity)

**Custom Range:**
- **Start Date** - Beginning of date range
- **End Date** - End of date range (inclusive, includes full day)

**Indicator:** Blue badge shows current range: "📅 Showing: MM/DD/YYYY - MM/DD/YYYY"

**Reset Button:** "Reset to Last 30 Days" returns to default view

### Team Filter

Filter stats to a specific team to see:
- Only questions from that team
- Only moderators active on that team
- Team-specific metrics

## Activity Breakdown

Side panel showing additional metrics:

### Activity Metrics
- **Total Reviewed** - Same as overall card
- **Answer Rate** - Percentage of reviewed questions that were answered
- **Questions Frozen** - Total frozen in this period

### Team Activity
- **Active Moderators** - Number of moderators with activity
- **Avg per Moderator** - Questions reviewed per moderator
- **Coverage** - Total team assignments across all moderators

## Use Cases

### Monitor Moderator Performance

1. **Check default view** (last 30 days, all teams)
2. **Review per-moderator stats** - Who's most active?
3. **Check answer rates** - Are moderators responding?
4. **Review response times** - Are we answering quickly?

### Analyze Team Engagement

1. **Filter to specific team** (e.g., "Engineering")
2. **Check question volume** - How many questions from this team?
3. **Review moderator coverage** - How many moderators active?
4. **Check response quality** - Are questions getting answered?

### Historical Analysis

1. **Set custom date range** (e.g., Q1 2025)
2. **Compare periods** - More/less activity than last quarter?
3. **Identify trends** - Which teams need more moderation support?

### Performance Reviews

1. **Filter to specific moderator** using team filter
2. **Check their metrics** - Questions reviewed, answered, response time
3. **Compare to team average**
4. **Identify top performers** - Sorted by activity

## What Gets Tracked

### When is `reviewedBy` Set?

The `reviewedBy` field is automatically set when:

1. **Moderator answers a question** - `reviewedBy` = user who answered
2. **`reviewedAt` timestamp** - When the answer was submitted

### Moderation Actions Tracked

All moderation actions are counted:

- ✅ Answering questions
- ✅ Pinning/unpinning
- ✅ Freezing/unfreezing
- ✅ Tagging questions
- ✅ Bulk operations

## Interpreting Metrics

### High Review Count, Low Answer Count

**Indicates:** Moderators are active but not answering

**Possible reasons:**
- Questions are being triaged/tagged but not answered
- Questions frozen or archived without answers
- Bulk operations counting as reviews

### Long Response Times

**Indicates:** Delay between question submission and answer

**Possible reasons:**
- Questions submitted far in advance of town hall
- Complex questions requiring research
- Low moderator availability

**Action:** Consider more moderators or faster triage process

### Uneven Distribution

**Indicates:** Some moderators much more active than others

**Possible reasons:**
- Different team sizes
- Uneven team assignments
- Some moderators more engaged

**Action:** Review team assignments and workload distribution

## Best Practices

### Regular Monitoring

- **Check weekly** - Review last 7 days of activity
- **Monthly reports** - Compare month-over-month trends
- **Pre-event** - Ensure all moderators prepared for town halls

### Setting Expectations

Use stats to set team goals:

- **Target response time** - e.g., < 24 hours
- **Answer rate** - e.g., > 80% of reviewed questions answered
- **Coverage** - Each team has >= 2 active moderators

### Recognizing Top Performers

- **Sort by questions reviewed** - See most active moderators
- **Share achievements** - Recognize top contributors
- **Balance workload** - Redistribute if one moderator doing too much

## Related Pages

- [Moderation Queue](../moderator-guide/moderation-queue.md)
- [Audit Logging](audit-logging.md)
- [Export](export.md)

