# Security Overview

PulseStage implements comprehensive security measures to protect your data, ensure proper access control, and maintain compliance with security best practices.

## Security Philosophy

PulseStage follows a **defense-in-depth** approach with multiple layers of security:

1. **Authentication & Authorization**: Strong identity verification and role-based access control
2. **Data Protection**: Encryption, isolation, and secure transmission
3. **Attack Prevention**: CSRF protection, rate limiting, and input validation
4. **Audit & Compliance**: Comprehensive logging and traceability
5. **Secure Development**: SAST, vulnerability scanning, and secure defaults

## Key Security Features

### 🔐 Role-Based Access Control (RBAC)

Fine-grained permissions system with five roles:
- **Viewer**: Read-only access
- **Member**: Can submit and upvote questions
- **Moderator**: Can answer and manage questions (team-scoped)
- **Admin**: Full administrative access (global)
- **Owner**: Complete system control (global)

[Learn more about RBAC →](rbac.md)

### 📋 Audit Logging

Comprehensive, **append-only** audit logs track:
- Actor (who performed the action)
- Action (what was done)
- Entity (what was affected)
- Timestamp (when it occurred)
- Before/After state (what changed)
- IP address & User-Agent (context)

[Learn more about audit logging →](audit-logging.md)

### 🛡️ Security Headers

HTTP security headers protect against common attacks:
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS
- **Referrer-Policy**: Controls referrer information

[Learn more about security headers →](security-headers.md)

### 🍪 Session Management

Secure session handling with:
- **HttpOnly cookies**: Prevents JavaScript access
- **Secure flag**: HTTPS-only transmission
- **SameSite=Lax**: CSRF protection
- **Session expiration**: Automatic timeout
- **CSRF tokens**: Double-submit cookie pattern

[Learn more about sessions →](sessions.md)

### 🚦 Rate Limiting

Protect against abuse with:
- Per-user rate limits (100 req/min)
- Per-IP rate limits (1000 req/min)
- Redis-backed sliding window
- Graceful degradation to memory store

[Learn more about rate limiting →](rate-limiting.md)

### 🔍 CI Security Scanning

Automated security scanning in CI/CD:
- **Semgrep**: Static Application Security Testing (SAST)
- **Trivy**: Dependency and Docker image scanning
- **SBOM (Syft)**: Software Bill of Materials
- **MDN HTTP Observatory**: Security header validation

[Learn more about CI scanning →](ci-scanning.md)

## Security Architecture

### Multi-Tenant Isolation

Every tenant has complete data isolation:
- Separate database records per tenant
- Tenant-scoped queries enforced at the ORM level
- No cross-tenant data leakage

### Team Scoping

Questions and permissions are team-scoped:
- Users can belong to multiple teams
- Different roles per team
- Moderators limited to their assigned teams
- Admins have global access

### Permission Enforcement

Permissions are enforced at multiple levels:

1. **Middleware**: Request-level authorization
2. **API Routes**: Endpoint-specific checks
3. **Database Queries**: Tenant and team filtering
4. **Frontend**: UI elements hidden based on permissions

## Common Security Scenarios

### User Submits a Question

1. **Authentication**: User identity verified via SSO
2. **Authorization**: User must be a member+ role
3. **CSRF Check**: Token validated for POST request
4. **Rate Limit**: Request counted against user limit
5. **Input Validation**: Question body validated (Zod schema)
6. **Tenant Isolation**: Question saved with user's tenant ID
7. **Team Scoping**: Question associated with selected team
8. **Audit Log**: Action recorded with actor, entity, timestamp

### Moderator Answers a Question

1. **Authentication**: Moderator identity verified
2. **Authorization**: User must have `question.answer` permission
3. **Team Check**: Question must be in moderator's team
4. **CSRF Check**: Token validated
5. **Input Validation**: Answer validated
6. **Database Update**: Question marked as answered
7. **Audit Log**: Answer action recorded
8. **SSE Broadcast**: Real-time update sent to team

### Admin Views Audit Logs

1. **Authentication**: Admin identity verified
2. **Authorization**: User must have `admin.access` permission
3. **Tenant Filter**: Only see logs for their tenant
4. **Team Filter**: Admins see all teams, moderators see their teams
5. **Pagination**: Logs paginated for performance
6. **Export**: Can download as CSV/JSON

## Security Best Practices

### For Administrators

!!! tip "Admin Security Checklist"
    - ✅ Limit admin roles to trusted users
    - ✅ Review audit logs weekly
    - ✅ Export and backup data regularly
    - ✅ Use strong SSO authentication
    - ✅ Monitor rate limit violations
    - ✅ Keep dependencies updated
    - ✅ Review moderation statistics for anomalies

### For Developers

!!! tip "Developer Security Checklist"
    - ✅ Always use parameterized queries (Prisma ORM)
    - ✅ Validate all input with Zod schemas
    - ✅ Enforce RBAC on all endpoints
    - ✅ Include tenant/team filters in queries
    - ✅ Log security-relevant actions
    - ✅ Use CSRF protection on state-changing endpoints
    - ✅ Run security scans before pushing

### For Moderators

!!! tip "Moderator Security Checklist"
    - ✅ Don't share your credentials
    - ✅ Log out from shared devices
    - ✅ Report suspicious questions
    - ✅ Use strong passwords with your SSO provider
    - ✅ Review questions before answering

## Compliance & Standards

PulseStage follows industry security standards:

- **OWASP Top 10**: Mitigations for common web vulnerabilities
- **CWE/SANS Top 25**: Protection against dangerous software errors
- **Mozilla Observatory**: A+ security header configuration
- **NIST**: Secure development lifecycle practices

## Threat Model

### Threats Mitigated

✅ **SQL Injection**: Prisma ORM with parameterized queries  
✅ **XSS (Cross-Site Scripting)**: CSP, input validation, output encoding  
✅ **CSRF (Cross-Site Request Forgery)**: Double-submit cookie tokens  
✅ **Clickjacking**: X-Frame-Options: DENY  
✅ **MIME Sniffing**: X-Content-Type-Options: nosniff  
✅ **Man-in-the-Middle**: HSTS, Secure cookies  
✅ **Brute Force**: Rate limiting  
✅ **Privilege Escalation**: RBAC enforcement  
✅ **Data Leakage**: Multi-tenant and team isolation  
✅ **Dependency Vulnerabilities**: Trivy scanning, automated updates  

### Out of Scope

⚠️ **DDoS Protection**: Use a CDN or load balancer (e.g., Cloudflare)  
⚠️ **Physical Security**: Secure your hosting infrastructure  
⚠️ **SSO Provider Security**: Ensure your identity provider is secure  
⚠️ **Insider Threats**: Implement organizational policies  

## Incident Response

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. **Email** security concerns to the repository maintainers
3. **Include** details: steps to reproduce, impact, affected versions
4. **Wait** for acknowledgment before public disclosure

We aim to respond within 48 hours and issue patches promptly.

## Security Roadmap

Future security enhancements:

- [ ] OpenTelemetry tracing for security events
- [ ] Advanced threat detection (AI-based moderation)
- [ ] Additional compliance certifications (SOC 2, ISO 27001)
- [ ] Encrypted data at rest (database-level encryption)
- [ ] Advanced anomaly detection
- [ ] Two-factor authentication (2FA) support

## Security Metrics

Track your security posture:

- **Vulnerability Scan Results**: CI/CD pipeline reports
- **Audit Log Volume**: Track administrative actions
- **Rate Limit Violations**: Monitor abuse attempts
- **Failed Authentication Attempts**: Track in logs
- **Uptime & Availability**: Monitor with health checks

[View CI Security Scanning →](ci-scanning.md)

## Need Help?

- **RBAC questions**: See [RBAC Documentation](rbac.md)
- **Audit logs**: See [Audit Logging](audit-logging.md)
- **Security headers**: See [Security Headers](security-headers.md)
- **Report vulnerabilities**: Contact maintainers privately
- **General security**: Check [GitHub Security Advisories](https://github.com/seanmdalton/pulsestage/security)

## Next Steps

Explore detailed security documentation:

- [RBAC & Permissions](rbac.md) - Understand role-based access control
- [Audit Logging](audit-logging.md) - Track administrative actions
- [Security Headers](security-headers.md) - HTTP security configuration
- [Session Management](sessions.md) - Secure session handling
- [CI Security Scanning](ci-scanning.md) - Automated vulnerability detection
