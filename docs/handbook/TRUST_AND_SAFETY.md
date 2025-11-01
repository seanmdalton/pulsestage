# Trust & Safety: Content Moderation

**Purpose:** Protect users from harmful content while minimizing false positives.

**Architecture:** Cascading filter system (local + optional AI) with tiered response.

---

## Moderation Philosophy

PulseStage uses a **tiered moderation approach**:

1. **Prevention**: Automated filters catch obvious violations
2. **Review**: Borderline content goes to moderator queue
3. **Transparency**: Users notified with clear reasons
4. **Privacy**: All moderation actions audit-logged

**Goal:** Balance safety with free expression.

---

## Filter Architecture

### Cascading Filters

```
User submits question/answer
  ↓
Local Filter (always runs)
  ↓
OpenAI Filter (if API key configured)
  ↓
Combine Results
  ↓
Tiered Response (high/medium/low confidence)
```

**Content is flagged if EITHER filter flags it.**

---

## Local Filter (Always Active)

**Technology:** Rule-based detection (no external dependencies)

**Detection Patterns:**

### 1. Profanity Detection
- Library: `bad-words` (npm)
- Detects common profanity across languages
- Updates regularly with community contributions

### 2. Spam Detection
```javascript
// Repeated characters (10+ times)
/(.)\1{10,}/i

// Multiple URLs
/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/gi

// Spam keywords
/\b(buy|cheap|discount|free|click here|limited time|act now|sale|order now)\b/gi

// Long numbers (phone numbers)
/\b\d{10,}\b/g
```

### 3. Toxic Language
```javascript
// Harmful content patterns
/\b(kill yourself|kys|neck yourself)\b/gi
/\b(ni(gg|bb)er|f[a@]gg[o0]t|retard)\b/gi
/\b(rape|molest|abuse)\b/gi
```

### 4. Excessive Capitalization
- Detects "shouting" (>60% caps)
- Minimum 20 characters to avoid false positives

### 5. Sentiment Analysis
- Library: `compromise` (NLP)
- Detects negative sentiment
- Low confidence signal (doesn't auto-flag)

**Confidence Levels:**
- **High**: Profanity, spam, or toxic language detected
- **Medium**: Excessive caps or negative sentiment
- **Low**: No issues detected

---

## OpenAI Filter (Optional)

**Configuration:**
```bash
OPENAI_API_KEY=sk-...  # If not set, filter is skipped
```

**Technology:** OpenAI Moderation API (`text-moderation-latest`)

**Detection Categories:**
1. Hate speech
2. Hate/threatening
3. Harassment
4. Harassment/threatening
5. Self-harm
6. Self-harm/intent
7. Self-harm/instructions
8. Sexual content
9. Sexual/minors
10. Violence
11. Violence/graphic

**Confidence Scoring:**
- Category scores range 0.0-1.0
- High: Any score > 0.8
- Medium: Any score > 0.5
- Low: All scores < 0.5

**Benefits:**
- Catches nuanced violations
- Evolves with OpenAI updates
- Multi-language support
- Context-aware

**Costs:**
- Free tier: 1M tokens/month
- Paid: $0.002 per 1K tokens (~500 moderations = $0.001)

---

## Tiered Response System

### High Confidence (Auto-Reject)

**Trigger:** Clear violations (profanity, spam, toxic language)

**Action:** Reject immediately with 400 error

**User Experience:**
```json
{
  "error": "Content does not meet community guidelines",
  "reasons": [
    "Contains profanity",
    "Toxic language detected"
  ],
  "moderationId": "mod_1234567890"
}
```

**Rationale:** Obvious violations don't need human review.

---

### Medium/Low Confidence (Review Queue)

**Trigger:** Borderline content, ambiguous language

**Action:** Set question status to `UNDER_REVIEW`

**User Experience:**
- Question submitted successfully
- Status shows "Under Review"
- Notification when approved/rejected

**Moderator Experience:**
- Appears in moderation queue
- See flagging reasons
- Approve or reject with comment

**Rationale:** Human judgment for gray areas.

---

## Moderation Queue Workflow

### For Users

1. Submit question with borderline content
2. Question created with status `UNDER_REVIEW`
3. Not visible to other users yet
4. Receive notification when reviewed

### For Moderators

1. Access moderation queue: `/moderation/queue`
2. View flagged questions with reasons
3. Review content and context
4. Actions:
   - **Approve**: Change status to `OPEN`, visible to all
   - **Reject**: Delete question, notify user
   - **Edit & Approve**: Fix minor issues, then approve
   - **Escalate**: Flag for admin review

### Team Scoping

**Moderators** see questions from their teams only.

**Admins** see questions from all teams in tenant.

---

## Audit Logging

**All moderation actions are logged:**

### Events Logged

1. **Content Flagged**
   - Action: `question.moderation.flagged`
   - Metadata: reasons, confidence, providers, moderationId

2. **Question Approved**
   - Action: `question.approve`
   - Metadata: moderatorId, original reasons

3. **Question Rejected**
   - Action: `question.reject`
   - Metadata: moderatorId, rejection reason

4. **Auto-Reject**
   - Action: `question.auto_reject`
   - Metadata: reasons, confidence, providers

**Audit logs include:**
- Tenant ID
- User ID (submitter)
- Moderator ID (if manual action)
- IP address
- User agent
- Timestamp
- Before/after content

---

## False Positive Handling

### User Reports

**Status:** Not yet implemented

**Planned:**
- "Report false positive" button
- Admin can review and adjust filters
- Whitelist specific phrases/users

### Moderator Override

**Current:** Moderators can approve flagged content

**Effect:**
- Question becomes visible
- Audit log shows override
- No impact on future moderation

---

## Development vs Production

### Development

- **Local Filter:** Active
- **OpenAI Filter:** Active if `OPENAI_API_KEY` set
- **Audit Logging:** Active (development database)
- **Review Queue:** Functional

**Testing:**
```bash
# Test without OpenAI
unset OPENAI_API_KEY

# Test with OpenAI
export OPENAI_API_KEY=sk-...
```

### Production

- **Local Filter:** Active (required)
- **OpenAI Filter:** Recommended (optional)
- **Audit Logging:** Active (production database, retained)
- **Review Queue:** Moderators handle queue

**Recommendation:** Enable OpenAI for production (better accuracy).

---

## Configuration Options

### Tenant Settings (Future)

**Planned settings:**
```javascript
{
  moderation: {
    autoRejectThreshold: 'high' | 'medium' | 'low',
    enableOpenAI: true | false,
    customBannedWords: string[],
    customAllowedWords: string[],
    requireApprovalForAll: boolean  // Manual review for everything
  }
}
```

**Current:** Hardcoded behavior (high = reject, medium/low = review).

---

## Performance & Scaling

### Latency

- **Local Filter:** <5ms (synchronous)
- **OpenAI Filter:** 100-500ms (async API call)
- **Total Impact:** ~500ms worst case (OpenAI enabled)

### Optimization

- Filters run in parallel
- Local filter can reject before OpenAI completes
- OpenAI errors don't block submission (local-only fallback)

### Caching (Future)

**Planned:**
- Cache OpenAI results for identical content
- Redis-backed cache with 24-hour TTL
- Reduce API costs and latency

---

## Compliance & Legal

### GDPR

- Flagged content stored temporarily (audit logs)
- User can request deletion of all content
- Audit logs anonymized after 90 days (planned)

### Age-Appropriate Content

- `sexual/minors` category auto-rejects (high confidence)
- Zero tolerance for child safety violations
- Immediate escalation to admin

### Hate Speech

- Multi-layer detection (local + OpenAI)
- Context-aware (OpenAI)
- Manual review for borderline cases

---

## Monitoring & Metrics

### Key Metrics (Admin Dashboard - Planned)

- **Flagging Rate:** % of submissions flagged
- **Auto-Reject Rate:** % auto-rejected (high confidence)
- **Review Queue Size:** Current pending count
- **False Positive Rate:** % approved after review
- **Average Review Time:** Time from flag to decision

### Alerts (Planned)

- Review queue > 50 items
- Flagging rate spike (>20% in 1 hour)
- OpenAI API errors

---

## Troubleshooting

### Content Incorrectly Flagged

**Symptoms:** Safe content auto-rejected or sent to review

**Diagnosis:**
1. Check audit logs for moderation reasons
2. Test with local filter only (disable OpenAI)
3. Test with OpenAI only (bypass local filter)

**Solutions:**
- Add to custom allowed words (future)
- Adjust auto-reject threshold (future)
- Manually approve from review queue

### Content Not Flagged

**Symptoms:** Harmful content published without review

**Diagnosis:**
1. Check if OpenAI key configured
2. Test content through moderation API
3. Review filter patterns

**Solutions:**
- Enable OpenAI filter (if not active)
- Report pattern to dev team
- Add to local filter patterns
- Manual moderation as fallback

### OpenAI API Errors

**Symptoms:** All content goes to review queue

**Diagnosis:**
1. Check API key validity
2. Check OpenAI service status
3. Check rate limits

**Solutions:**
- Local filter still active (fallback)
- Fix API key or wait for service restoration
- Moderators review queue

---

## Best Practices

### For Moderators

1. **Context Matters:** Consider intent, not just words
2. **Consistency:** Apply guidelines uniformly
3. **Speed:** Review queue within 24 hours
4. **Documentation:** Note reasons for decisions
5. **Escalate:** Flag edge cases for admin review

### For Admins

1. **Monitor Metrics:** Track false positive rates
2. **Adjust Thresholds:** Balance safety vs friction
3. **Train Moderators:** Provide clear guidelines
4. **Review Appeals:** User feedback on false positives

### For Developers

1. **Test Thoroughly:** Include edge cases in tests
2. **Monitor Performance:** OpenAI latency impact
3. **Update Patterns:** Add new toxic patterns as discovered
4. **Cache OpenAI:** Reduce costs and latency (planned)

---

## Related Documentation

- `/handbook/SECURITY_MODEL.md` - Overall security architecture
- `/handbook/ADMIN_GUIDE.md` - Moderation queue management
- `/handbook/DECISIONS/ADR-0003-roles.md` - Moderator permissions
- `/api/src/lib/moderation/` - Implementation details

