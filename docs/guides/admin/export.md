# Data Export

Export questions, pulse responses, and audit logs.

## Export Types

### Questions Export

Export all questions with:
- Question text
- Author (if not anonymous)
- Team
- Tags
- Status (open/answered)
- Upvote count
- Answer text and author
- Created date
- Answered date

### Pulse Export

Export pulse responses with:
- Question text
- Response value (1-5)
- Team
- Cohort
- Response date
- **No user identification** (anonymous by design)

### Audit Logs Export

Export administrative actions with:
- Actor
- Action
- Entity
- Timestamp
- Before/after state
- IP address
- User agent

## Export Format

Choose between:
- **CSV**: Spreadsheet-compatible, easy to analyze
- **JSON**: Structured data, API-compatible

## Export Questions

1. Admin → Export
2. Select "Questions"
3. Choose filters (optional):
   - Team
   - Status (open/answered/all)
   - Date range
   - Tags
4. Select format (CSV or JSON)
5. Click "Export"
6. Download file

**File name:** `questions-YYYY-MM-DD.csv`

## Export Pulse Responses

1. Admin → Export
2. Select "Pulse Responses"
3. Choose filters (optional):
   - Team
   - Date range
   - Question
4. Select format (CSV or JSON)
5. Click "Export"
6. Download file

**File name:** `pulse-YYYY-MM-DD.csv`

**Privacy:** No userId or email in export (anonymous).

## Export Audit Logs

1. Admin → Audit Logs
2. Apply filters (optional)
3. Click "Export"
4. Select format (CSV or JSON)
5. Download file

**File name:** `audit-log-YYYY-MM-DD.csv`

## CSV Format

### Questions CSV

```csv
id,text,author_email,team,tags,status,upvotes,answer_text,answer_author,created_at,answered_at
1,"Question text?","alice@example.com","Engineering","Benefits,Policy",answered,5,"Answer text","bob@example.com","2025-01-01T10:00:00Z","2025-01-02T14:00:00Z"
```

### Pulse CSV

```csv
id,question_text,response_value,team,cohort,created_at
1,"How satisfied are you?",4,"Engineering","Weekday","2025-01-01T10:00:00Z"
```

### Audit Log CSV

```csv
id,actor_email,action,entity_type,entity_id,timestamp,before,after,ip_address
1,"admin@example.com","USER_ROLE_CHANGE","User","123","2025-01-01T10:00:00Z","{""role"":""member""}","{""role"":""admin""}","192.168.1.1"
```

## JSON Format

Structured data with full object details:

```json
{
  "questions": [
    {
      "id": 1,
      "text": "Question text?",
      "author": {
        "email": "alice@example.com",
        "name": "Alice"
      },
      "team": {
        "id": 1,
        "name": "Engineering",
        "slug": "engineering"
      },
      "tags": ["Benefits", "Policy"],
      "status": "answered",
      "upvotes": 5,
      "answer": {
        "text": "Answer text",
        "author": {
          "email": "bob@example.com",
          "name": "Bob"
        },
        "createdAt": "2025-01-02T14:00:00Z"
      },
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "exportedAt": "2025-01-15T10:00:00Z",
    "filters": {
      "team": "Engineering",
      "status": "answered"
    }
  }
}
```

## Use Cases

### Compliance Reporting

Export audit logs quarterly for:
- SOC 2 compliance
- Internal audits
- Security reviews

### Data Analysis

Export questions and pulse responses for:
- Trend analysis
- Topic modeling
- Sentiment analysis
- Executive dashboards

### Backup

Regular exports for:
- Data backup
- Disaster recovery
- Migration

### External Tools

Export and import into:
- Excel/Google Sheets (CSV)
- BI tools (Tableau, PowerBI)
- Data warehouses
- Analytics platforms

## Automation

### API Export (Future)

Programmatic export via API:

```bash
curl -X POST https://api.yourdomain.com/admin/export \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"questions","format":"json"}'
```

**Status:** Not yet implemented. Manual export only.

### Scheduled Exports (Future)

Configure automatic exports:
- Daily/weekly/monthly schedule
- Email or upload to S3
- Filtered by team/date

**Status:** Not yet implemented.

## Security

### Access Control

Only admins and owners can export data.

### Audit Trail

All exports are logged:
- Who exported
- What was exported
- When
- Filters applied

View in Admin → Audit Logs (action: `EXPORT_CREATE`).

### Data Privacy

**Pulse exports:**
- No userId or email (anonymous by design)
- Only aggregated response data

**Question exports:**
- Anonymous questions: No author information
- Named questions: Author included

## Limitations

### Size Limits

Maximum rows per export:
- Questions: 10,000
- Pulse responses: 100,000
- Audit logs: 100,000

**Workaround:** Export in date range chunks.

### Performance

Large exports may take time:
- < 1,000 rows: Instant
- 1,000-10,000 rows: Few seconds
- 10,000+ rows: Up to 1 minute

### Filters

Not all fields are filterable:
- Questions: Team, status, tags, date
- Pulse: Team, question, date
- Audit logs: Actor, action, entity, date

## Troubleshooting

### Export Times Out

**Solutions:**
- Reduce date range
- Apply more specific filters
- Export in smaller chunks

### CSV Opens Incorrectly in Excel

**Solutions:**
- Use UTF-8 encoding
- Import as data (not open directly)
- Use Google Sheets instead

### Missing Data in Export

**Check:**
- Filters applied correctly
- Date range includes data
- You have permission to view data

## Best Practices

1. **Regular backups**: Export monthly
2. **Compliance**: Export audit logs quarterly
3. **Analysis**: Export questions/pulse for insights
4. **Security**: Store exports securely, encrypt if needed
5. **Retention**: Delete old exports per policy

## Related Documentation

- [Audit Logging](audit-logging.md) - View and filter logs
- [handbook/SECURITY_MODEL.md](../../handbook/SECURITY_MODEL.md) - Data security
- [handbook/DATA_MODEL_SNAPSHOT.md](../../handbook/DATA_MODEL_SNAPSHOT.md) - Data structure
