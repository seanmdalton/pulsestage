# Security Model

## Auth & Roles

### Role Hierarchy
- Roles: `viewer`, `member`, `moderator`, `admin`, `owner` (per-tenant, per ADR-0003)
- **viewer**: Read-only access (view questions, pulse data)
- **member**: Can submit questions, respond to pulse, upvote
- **moderator**: Team-scoped moderation rights (answer, tag, pin questions)
- **admin**: Tenant-wide administration and moderation (all teams)
- **owner**: Full tenant control including settings and user management
- Authorization enforced server-side on every write and sensitive read.

### Authentication Methods
- **Production**: GitHub OAuth, Google OAuth (required)
- **Development**: Demo mode (disabled in production)
- **Session Management**: Redis-backed sessions (production), memory-backed (development)
- **Session Lifetime**: 8 hours (configurable per tenant)

**See:** `/handbook/AUTHENTICATION.md` for full details

---

## Rate Limiting (Production Only)

### Architecture
- **Technology**: Redis-based rate limiting (per-tenant, per-IP)
- **Requirement**: Redis MUST be configured in production (security critical)
- **Development**: Rate limiting disabled for ease of development

### Rate Limit Tiers

**Read Operations:**
- 100 requests/minute (generous limits)

**Write Operations:**
- Create question: 10/minute
- Create comment: 20/minute
- Upvote: 30/minute
- Update: 20/minute
- Delete: 10/minute

**Sensitive Operations:**
- Auth attempt: 5 per 5 minutes
- Password reset: 3 per hour
- Email send: 10 per hour
- Admin action: 50 per 15 minutes

**Search/Export:**
- Search: 60/minute
- Export: 5 per 15 minutes

### Per-Tenant Isolation
Rate limits are enforced per-tenant AND per-IP:
```
Key format: rate:{route}:{tenantId}:{ip}
```
This prevents one tenant from exhausting limits for others.

### Response to Rate Limit Exceeded
```json
HTTP 429 Too Many Requests
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Maximum 10 requests per minute."
}
```

### Production Requirement
**If Redis is not available in production:**
- API refuses to start (security requirement)
- Rate limiting is CRITICAL for preventing abuse

---

## Content Moderation

### Tiered Moderation System
PulseStage uses cascading filters to detect harmful content:

**Filter Layers:**
1. **Local Filter** (always active):
   - Profanity detection
   - Spam patterns (repeated chars, excessive URLs)
   - Toxic language (hate speech, harmful content)
   - Excessive capitalization

2. **OpenAI Moderation API** (optional, recommended for production):
   - 11 categories (hate, harassment, violence, self-harm, sexual content)
   - Context-aware detection
   - Multi-language support

### Response Tiers
- **High Confidence**: Auto-reject (400 error returned to user)
- **Medium/Low Confidence**: Send to moderation queue (UNDER_REVIEW status)

### Audit Trail
All moderation actions are logged:
- Content flagged
- Reasons for flagging
- Moderation provider (local, OpenAI)
- Confidence level
- Manual moderator decisions

**See:** `/handbook/TRUST_AND_SAFETY.md` for full details

---

## Anonymity & Privacy

### Pulse Anonymity Guarantees
- **PulseResponse table has NO userId field** (enforced at schema level)
- Responses cannot be traced to individuals, even by admins
- Only aggregates shown when `n >= threshold` (default: 5)
- Individual responses never exposed

**Schema Enforcement:**
```prisma
model PulseResponse {
  id          String   @id @default(uuid())
  questionId  String
  teamId      String?
  score       Int      // 1-5
  // NO userId field - anonymity by design
}
```

### Q&A Submissions
- Questions are attributed to submitter (not anonymous by default)
- Optional: `allowAnonymousQuestions` setting (future)
- Moderators can see question authors

### Data Minimization
- Only essential data collected
- No tracking cookies or analytics (by default)
- User agents and IP addresses logged only for security (audit logs)

**See:** `/handbook/PULSE_SYSTEM.md` for pulse privacy details

---

## Audit Logging

### Comprehensive Action Tracking
All significant actions are logged asynchronously (non-blocking):

**Categories:**
- Question lifecycle (create, update, delete, answer, pin, freeze)
- Moderation actions (flag, approve, reject)
- Upvotes (add, remove)
- Tags (create, add, remove, delete)
- User management (create, update, delete, login, logout)
- Team management (create, update, delete, add member, remove member, role change)
- Settings changes

### Audit Log Entry Structure
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",              // Who performed the action
  "action": "question.create",
  "entityType": "question",
  "entityId": "uuid",
  "before": { ... },             // State before change (if applicable)
  "after": { ... },              // State after change (if applicable)
  "ipAddress": "192.168.1.1",    // Security context
  "userAgent": "Mozilla/5.0 ...",// Security context
  "metadata": { ... },           // Additional context
  "createdAt": "2025-01-15T14:23:45Z"
}
```

### Retention & Access
- **Retention**: Indefinite (or per tenant configuration)
- **Access**: Admin and owner roles only (`audit.view` permission)
- **Immutability**: Append-only, cannot be modified or deleted
- **Tenant Isolation**: Audit logs filtered by tenant

### Query API
Admins can query audit logs by:
- User ID
- Action type
- Entity type/ID
- Date range
- IP address (security investigations)

**See:** `/handbook/ADMIN_GUIDE.md` for audit log usage

---

## Headers & Sessions

### Security Headers
- **Helmet**: Enabled (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
- **CORS**: Restricted to configured origins (default: `http://localhost:5173` in dev)
- **HSTS**: Enabled in production (force HTTPS)

### Cookie Security
Session cookies configured with:
- `Secure`: true (production only, requires HTTPS)
- `HttpOnly`: true (no JavaScript access)
- `SameSite`: Lax (CSRF protection)
- `MaxAge`: 8 hours (configurable)

### CSRF Protection
- **Enabled**: Yes (via `csurf` middleware)
- **Mechanism**: Token per session, validated on state-changing requests
- **Exemptions**: SSE connections (read-only)

---

## Multi-Tenancy Security

### Tenant Isolation
- **Every database query MUST filter by tenantId**
- **No cross-tenant joins** (enforced by query patterns)
- **Tenant context middleware** validates tenant exists and sets context
- **Session-tenant binding**: User session locked to single tenant

### Tenant Resolution
**Order of precedence:**
1. `x-tenant-id` header
2. Subdomain (e.g., `acme.pulsestage.app` → tenant `acme`)
3. Default tenant (`default`)

### Cross-Tenant Attacks
**Mitigations:**
- All queries filtered by tenantId (enforced in middleware)
- User IDs scoped to tenant (UUID collision impossible)
- API endpoints validate tenant context before any operation

**See:** `/handbook/TENANCY_MODEL.md` for full multi-tenancy details

---

## Development vs Production Security

| Feature | Development | Production |
|---------|------------|------------|
| **Rate Limiting** | Disabled | Required (Redis-based) |
| **Session Store** | Memory | Redis (required) |
| **HTTPS** | Optional | Required |
| **Secure Cookies** | false | true |
| **Demo Auth** | Enabled | Disabled |
| **OAuth** | Optional | Required |
| **Content Moderation** | Active (both filters) | Active (both filters) |
| **Audit Logging** | Active | Active |

---

## Security Checklist (Production)

Before deploying to production:

- [ ] Redis configured (`REDIS_URL` set)
- [ ] Strong `SESSION_SECRET` (32+ random characters)
- [ ] OAuth configured (GitHub and/or Google)
- [ ] Demo mode disabled (`AUTH_MODE_DEMO != true`)
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS origins configured (not `*`)
- [ ] Rate limiting verified (`GET /health/ready` shows Redis healthy)
- [ ] Security scans passed (`make security`)
- [ ] Environment variables secured (not in code, use secrets manager)
- [ ] Database backups configured
- [ ] Audit logs retention configured
- [ ] Monitoring/alerting configured

---

## Incident Response

### Security Event Logging
All security-relevant events logged:
- Failed login attempts
- Rate limit violations
- Content moderation flags (high confidence)
- Admin/owner actions
- Session anomalies

### Monitoring Alerts (Recommended)
- Failed login spike (>20/hour)
- Rate limit exceeded spike (>100/hour)
- Moderation auto-reject spike (>10/hour)
- Database connection failures
- Redis connection failures

### Breach Response Plan
1. **Detect**: Monitoring alerts trigger
2. **Contain**: Rate limiting, block IPs if needed
3. **Investigate**: Query audit logs
4. **Remediate**: Patch vulnerability, rotate secrets
5. **Notify**: Users if data affected (per GDPR/local laws)

---

## Related Documentation

- `/handbook/AUTHENTICATION.md` - Auth implementation
- `/handbook/TRUST_AND_SAFETY.md` - Content moderation
- `/handbook/ADMIN_GUIDE.md` - Admin security features
- `/handbook/TENANCY_MODEL.md` - Multi-tenancy security
- `/handbook/PULSE_SYSTEM.md` - Pulse anonymity
- `/handbook/DECISIONS/ADR-0003-roles.md` - Role definitions
