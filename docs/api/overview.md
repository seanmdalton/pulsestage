# API Reference Overview

Welcome to the PulseStage API documentation! This reference covers all available endpoints, authentication methods, and integration patterns.

## Base URL

All API requests should be made to:

```
http://localhost:3000/api
```

Or in production:

```
https://your-domain.com/api
```

## Authentication

PulseStage uses **SSO (Single Sign-On)** for authentication. All API requests must include:

```http
X-Tenant-ID: your-tenant-id
X-Mock-SSO-User: user@example.com  # For development
```

In production, authentication is handled by your SSO provider, and the API validates sessions via cookies.

[Learn more about authentication →](authentication.md)

## Core Concepts

### Multi-Tenancy
Every request must include a tenant ID. Data is isolated per tenant, ensuring complete separation between organizations.

### Team Scoping
Questions, users, and permissions are scoped to teams. Users can be members of multiple teams with different roles per team.

### Role-Based Access Control (RBAC)
Five roles control access:
- **Viewer**: Read-only access
- **Member**: Can submit and upvote questions
- **Moderator**: Can answer and tag questions (team-scoped)
- **Admin**: Can manage teams and users (global access)
- **Owner**: Full system access (global access)

### Real-Time Updates
PulseStage uses **Server-Sent Events (SSE)** for real-time updates. Connect to `/sse` to receive live events.

## Available Resources

### Questions
Submit, upvote, search, and manage questions.

[View Questions API →](questions.md)

**Key Endpoints**:
- `GET /questions` - List questions with filters
- `POST /questions` - Submit a new question
- `POST /questions/:id/upvote` - Upvote a question
- `POST /questions/:id/respond` - Answer a question (moderator+)
- `POST /questions/:id/pin` - Pin a question (moderator+)
- `POST /questions/:id/freeze` - Freeze a question (moderator+)

### Teams
Manage teams and memberships.

[View Teams API →](teams.md)

**Key Endpoints**:
- `GET /teams` - List all teams
- `POST /teams` - Create a new team (admin+)
- `GET /teams/:id` - Get team details
- `POST /teams/:id/members` - Add team member (admin+)

### Tags
Create and manage tags for organizing questions.

[View Tags API →](tags.md)

**Key Endpoints**:
- `GET /tags` - List all tags
- `POST /tags` - Create a new tag (admin+)
- `POST /questions/:id/tag` - Tag a question (moderator+)
- `DELETE /questions/:id/tag/:tagId` - Remove tag (moderator+)

### Users
User profile and preferences.

[View Users API →](users.md)

**Key Endpoints**:
- `GET /users/me` - Get current user profile
- `GET /users/:id` - Get user details

### Admin
Administrative endpoints for moderation, stats, and audit logs.

[View Admin API →](admin.md)

**Key Endpoints**:
- `GET /admin/moderation-queue` - Get moderation queue (moderator+)
- `POST /admin/bulk-action` - Bulk operations (admin+)
- `POST /admin/bulk-tag` - Bulk tagging (moderator+)
- `GET /admin/stats/moderation` - Moderation statistics (moderator+)
- `GET /admin/audit-log` - View audit logs (admin+)
- `GET /admin/export` - Export data as CSV/JSON (admin+)

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "id": "uuid",
  "body": "Question text",
  "upvotes": 5,
  "status": "OPEN",
  "createdAt": "2025-10-05T12:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### List Response
```json
{
  "questions": [...],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate action (e.g., already upvoted) |
| 500 | Internal Server Error | Server-side error |

## Rate Limiting

API requests are rate-limited per user and IP address:

- **Per User**: 100 requests per minute
- **Per IP**: 1000 requests per minute (for anonymous endpoints)

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696512000
```

When rate limited, you'll receive a `429 Too Many Requests` response.

## CSRF Protection

State-changing endpoints (POST, PUT, DELETE) require a CSRF token:

1. Get the token from the `_csrf` cookie (set on first request)
2. Include it in the `x-csrf-token` header

```http
X-CSRF-Token: your-csrf-token
```

## Real-Time Updates (SSE)

Connect to the SSE endpoint to receive real-time events:

```javascript
const eventSource = new EventSource('/sse?tenantId=default');

eventSource.addEventListener('question:created', (event) => {
  const question = JSON.parse(event.data);
  console.log('New question:', question);
});
```

**Event Types**:
- `question:created` - New question submitted
- `question:upvoted` - Question upvoted
- `question:answered` - Question answered
- `question:tagged` - Tag added to question
- `question:untagged` - Tag removed from question
- `question:pinned` - Question pinned/unpinned
- `question:frozen` - Question frozen/unfrozen
- `heartbeat` - Keep-alive event (every 30s)

## Pagination

List endpoints support pagination via query parameters:

```http
GET /questions?limit=20&offset=40
```

- `limit`: Number of items per page (default: 100, max: 1000)
- `offset`: Number of items to skip (default: 0)

## Filtering & Search

The questions endpoint supports advanced filtering:

```http
GET /questions?
  search=mobile+app&
  status=OPEN&
  teamId=team-uuid&
  tags=tag-uuid-1,tag-uuid-2&
  fromDate=2025-10-01&
  toDate=2025-10-05
```

**Parameters**:
- `search`: Full-text search (supports prefix matching)
- `status`: `OPEN` or `ANSWERED`
- `teamId`: Filter by team
- `tags`: Comma-separated tag IDs
- `fromDate`: ISO date (YYYY-MM-DD)
- `toDate`: ISO date (YYYY-MM-DD)
- `sort`: `upvotes` (default) or `createdAt`
- `order`: `desc` (default) or `asc`

## Security Headers

All API responses include security headers:

```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

[Learn more about security →](../security/overview.md)

## Example Requests

### Submit a Question
```bash
curl -X POST http://localhost:3000/questions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -H "X-Mock-SSO-User: user@example.com" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "body": "What is our remote work policy?",
    "teamId": "team-uuid"
  }'
```

### Search Questions
```bash
curl "http://localhost:3000/questions?search=remote&status=OPEN" \
  -H "X-Tenant-ID: default" \
  -H "X-Mock-SSO-User: user@example.com"
```

### Upvote a Question
```bash
curl -X POST http://localhost:3000/questions/{id}/upvote \
  -H "X-Tenant-ID: default" \
  -H "X-Mock-SSO-User: user@example.com" \
  -H "X-CSRF-Token: your-csrf-token"
```

## SDK & Client Libraries

Currently, the web application includes a TypeScript API client (`web/src/lib/api.ts`) that can be used as a reference for building your own client.

## Need Help?

- **Authentication issues**: See [Authentication](authentication.md)
- **Permission errors**: See [RBAC Documentation](../security/rbac.md)
- **Rate limiting**: Contact your admin
- **Technical issues**: Check our [GitHub Issues](https://github.com/seanmdalton/pulsestage/issues)

## Next Steps

Explore the detailed API documentation:

- [Authentication](authentication.md) - Understand SSO and session management
- [Questions API](questions.md) - Submit, search, and manage questions
- [Admin API](admin.md) - Administrative and moderation endpoints
- [Security](../security/overview.md) - Security features and best practices
