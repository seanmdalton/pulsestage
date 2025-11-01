# Moderation Stats

Track moderator activity and performance.

## Overview

Moderation stats show:
- Which moderators are most active
- Average response times
- Question answer rates
- Team moderation health

**Access:** Admin → Moderation → Stats

## Metrics

### Per Moderator

**Activity:**
- Questions answered
- Tags applied
- Questions pinned/frozen
- Bulk operations performed

**Timing:**
- Average time to first answer
- Total moderation time
- Active hours per week

**Quality:**
- Questions answered vs. team total
- Answer length (average)
- Tags per question (average)

### Per Team

**Coverage:**
- Open question count
- Average time to answer
- Moderator count
- Questions per moderator

**Trends:**
- Questions answered per week
- Response time trend
- Open question backlog

## View Stats

### Moderator Leaderboard

1. Admin → Moderation → Stats
2. View "Moderator Activity"

Shows top moderators by:
- Questions answered
- Response time
- Overall activity

### Team Dashboard

1. Admin → Moderation → Stats
2. Select team
3. View team-specific metrics

### Time Range

Select period:
- Last 7 days
- Last 30 days
- Last 90 days
- All time
- Custom range

## Key Indicators

### Healthy Moderation

**Signs:**
- Average response time < 24 hours
- Open question backlog < 10
- Multiple active moderators per team
- Even distribution of workload

### Needs Attention

**Warning signs:**
- Average response time > 48 hours
- Open question backlog > 20
- Single moderator doing all work
- Declining activity trend

## Use Cases

### Performance Reviews

Export stats for moderator performance reviews:
1. Filter by moderator and date range
2. View activity metrics
3. Export as CSV

### Capacity Planning

Identify teams needing more moderators:
1. View team stats
2. Check open question backlog
3. Compare moderator counts
4. Add moderators if needed

### Recognition

Recognize active moderators:
1. View leaderboard
2. Identify top contributors
3. Thank/reward high performers

## Moderation Workflow

### Question Lifecycle

**Metrics tracked:**
1. **Submitted** → Question created
2. **Reviewed** → Moderator views question
3. **Answered** → Moderator provides answer
4. **Tagged** → Question categorized
5. **Pinned/Frozen** → Special handling

**Time to answer** = Time from submission to answer

### Bulk Operations

Tracked separately:
- Bulk tag operations
- Bulk pin operations
- Bulk freeze operations
- Bulk delete operations

## Reports

### Weekly Report

Automatically generated:
- Total questions answered
- Average response time
- Top moderators
- Teams needing attention

**Access:** Admin → Reports → Weekly Moderation

### Monthly Report

Comprehensive overview:
- All metrics
- Trend comparisons
- Team rankings
- Moderator performance

**Access:** Admin → Reports → Monthly Moderation

## Benchmarks

### Response Time

**Excellent:** < 6 hours  
**Good:** 6-24 hours  
**Acceptable:** 24-48 hours  
**Needs improvement:** > 48 hours

### Question Backlog

**Excellent:** 0-5 open questions  
**Good:** 5-10 open questions  
**Acceptable:** 10-20 open questions  
**Needs improvement:** > 20 open questions

### Moderator Activity

**Active:** > 10 questions/month  
**Moderate:** 5-10 questions/month  
**Low:** 1-5 questions/month  
**Inactive:** 0 questions/month

## Optimize Moderation

### Add Moderators

If response times are slow:
1. Check team stats
2. Identify understaffed teams
3. Promote active members to moderators

See [Team Management](team-management.md).

### Redistribute Workload

If one moderator is overloaded:
1. View moderator stats
2. Identify imbalanced workload
3. Encourage other moderators to participate

### Set Expectations

Share targets with moderators:
- Aim for < 24 hour response time
- Answer 2-3 questions per week
- Keep backlog < 10 questions

## Privacy

### What's NOT Tracked

- Individual question views
- Search queries
- Time spent reading
- Draft answers

**Why:** Privacy and simplicity. Only completed actions tracked.

### Data Access

Only admins and owners can view moderation stats.

Moderators cannot see:
- Other moderators' stats
- Team-wide comparisons
- Leaderboards

## Export Stats

1. Admin → Moderation → Stats
2. Apply filters
3. Click "Export"
4. Choose CSV or JSON
5. Download

**Use cases:**
- Performance reports
- Capacity planning
- Executive dashboards

## Troubleshooting

### Stats Not Updating

**Check:**
- Refresh page
- Clear cache
- Verify actions were completed (not drafts)

### Missing Moderator

**Reasons:**
- Moderator has no activity in selected time range
- Moderator role was recently assigned
- Moderator was removed from team

### Incorrect Numbers

**Solutions:**
- Check time range selected
- Verify filters
- Contact support if persists

## Related Documentation

- [Roles & Permissions](roles-permissions.md) - Moderator role
- [Team Management](team-management.md) - Assign moderators
- [Audit Logging](audit-logging.md) - Detailed action logs
- [Moderator Guide](../moderator/overview.md) - Moderator workflows
