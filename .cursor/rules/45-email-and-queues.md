# Email and Background Work

## Pipeline
- Use queue with retries and backoff. Never send email on the request path.
- In dev, route to a local sink (e.g., Mailpit). In prod, SMTP/Resend via env.

## Auditing
- Emit audit logs for notifications and moderation decisions.
- Expose minimal counters for ops dashboards.
