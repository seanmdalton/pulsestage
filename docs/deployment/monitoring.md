# Monitoring

Monitor PulseStage in production to ensure reliability and performance.

## Health Endpoints

### API Health Check

```bash
curl https://api.yourdomain.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T12:00:00.000Z",
  "uptime": "2d 4h 30m",
  "database": {
    "status": "connected",
    "latency": "5ms"
  },
  "redis": {
    "status": "connected",
    "latency": "2ms"
  },
  "rateLimiting": {
    "status": "active",
    "requestsInLastHour": 1234
  },
  "auth": {
    "mode": "production",
    "strategies": ["github", "google"]
  }
}
```

### Frontend Health

```bash
curl -I https://yourdomain.com
```

Should return `200 OK`.

## Application Metrics

### Built-in Health Dashboard

Visit `/admin/health` for real-time metrics:

- **System Status**: API, database, Redis connectivity
- **Rate Limiting**: Request counts and limits
- **Auth Status**: Enabled authentication modes
- **Uptime**: Service uptime

**Access**: Requires admin role

### Key Metrics to Monitor

| Metric | Endpoint | Target |
|--------|----------|--------|
| **API Response Time** | `/health` | < 100ms |
| **Database Latency** | `/health` | < 10ms |
| **Redis Latency** | `/health` | < 5ms |
| **Error Rate** | Application logs | < 1% |
| **Uptime** | `/health` | > 99.9% |

## Logging

### Application Logs

**Docker Compose:**
```bash
docker compose logs -f api
docker compose logs -f web
```

**Production:**
```bash
journalctl -u pulsestage-api -f
journalctl -u pulsestage-web -f
```

### Log Levels

- **ERROR**: Critical issues requiring immediate attention
- **WARN**: Potential problems
- **INFO**: General application flow
- **DEBUG**: Detailed debugging (development only)

### Important Log Patterns

**Session Issues:**
```
🍪 Session config: secure=true, sameSite=lax
```

**Authentication:**
```
🔐 Auth modes enabled: github, google
```

**Database:**
```
[OK] Database connected successfully
[ERROR] Database connection failed
```

**Redis:**
```
 Redis connected for rate limiting
[ERROR] Failed to connect to Redis
```

## Audit Logging

PulseStage logs all admin actions for compliance:

- User role changes
- Team member additions/removals
- Question moderation (pin, freeze, delete)
- Bulk operations
- Settings changes

**Access audit logs:**
```bash
# Via Admin Panel
/admin/audit

# Via API
curl -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/admin/audit?limit=100
```

## Alerting

### Set Up Alerts

Monitor these conditions:

1. **API Health Check Fails**
   - Check: `curl https://api.yourdomain.com/health`
   - Alert: Response code ≠ 200

2. **High Error Rate**
   - Check: Application logs
   - Alert: Error count > 10/minute

3. **Database Connection Lost**
   - Check: `/health` endpoint
   - Alert: `database.status ≠ "connected"`

4. **Redis Connection Lost**
   - Check: `/health` endpoint
   - Alert: `redis.status ≠ "connected"`

5. **High Response Time**
   - Check: API response time
   - Alert: Response time > 1 second

### Example: Uptime Monitoring

**Using Uptime Robot (free):**

1. Add HTTP(s) Monitor
2. URL: `https://api.yourdomain.com/health`
3. Monitoring Interval: 5 minutes
4. Alert Contacts: Email, SMS, Slack

**Using Healthchecks.io:**

```bash
# Add to crontab
*/5 * * * * curl -fsS --retry 3 https://hc-ping.com/your-uuid-here > /dev/null
```

## Performance Monitoring

### Database Performance

```bash
# Check slow queries
docker compose exec postgres psql -U postgres -d pulsestage -c "
  SELECT query, calls, mean_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"
```

### Redis Performance

```bash
# Check Redis stats
docker compose exec redis redis-cli INFO stats
```

### API Performance

Monitor response times for key endpoints:
- `GET /questions` - Should be < 200ms
- `GET /teams` - Should be < 100ms
- `POST /questions` - Should be < 300ms
- `GET /health` - Should be < 50ms

## Resource Usage

### Docker Stats

```bash
docker stats
```

Monitor:
- **CPU usage**: Should be < 80%
- **Memory usage**: Should be < 80%
- **Network I/O**: Watch for anomalies

### Disk Usage

```bash
# Check database size
docker compose exec postgres psql -U postgres -c "
  SELECT pg_database.datname,
         pg_size_pretty(pg_database_size(pg_database.datname)) AS size
  FROM pg_database;
"

# Check disk space
df -h
```

## Backup Verification

Regularly verify backups work:

```bash
# Test database backup
docker compose exec postgres pg_dump -U postgres pulsestage > test-backup.sql

# Test restore to separate database
docker compose exec postgres createdb -U postgres test_restore
docker compose exec -T postgres psql -U postgres test_restore < test-backup.sql
```

## Security Monitoring

### Failed Login Attempts

Monitor for brute force attacks:

```bash
# Check logs for repeated failures
docker compose logs api | grep "Authentication failed"
```

### Unusual Activity

Watch for:
- Bulk operations outside business hours
- Repeated 401/403 errors
- Unusual rate limit hits

### Rate Limiting

```bash
# Check rate limit stats
curl https://api.yourdomain.com/health | jq '.rateLimiting'
```

## Troubleshooting

### High CPU Usage

1. Check slow queries
2. Review recent changes
3. Check for infinite loops in logs

### High Memory Usage

1. Check for memory leaks
2. Review Redis memory usage
3. Check database connections

### Slow Response Times

1. Check database performance
2. Check Redis performance
3. Review recent deployments
4. Check resource utilization

## See Also

- **[Production Runbook](production-runbook.md)** - Operational procedures
- **[Troubleshooting Guide](render-troubleshooting.md)** - Common issues
- **[Health Dashboard](../admin-guide/overview.md)** - Admin interface
