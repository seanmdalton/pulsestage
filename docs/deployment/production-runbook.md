# Production Runbook

Quick reference guide for common production operations and incident response.

## 🚀 Quick Start

### Check System Status
```bash
# Health checks
curl https://api.yourdomain.com/health/live
curl https://api.yourdomain.com/health/ready

# Detailed metrics (requires admin authentication)
curl -H "Authorization: Bearer $ADMIN_KEY" \
  https://api.yourdomain.com/admin/health
```

### View Logs
```bash
# Kubernetes
kubectl logs -f deployment/pulsestage-api --tail=100
kubectl logs -f deployment/pulsestage-web --tail=100

# Docker Compose
docker compose logs -f api --tail=100
docker compose logs -f web --tail=100

# Follow errors only
kubectl logs -f deployment/pulsestage-api | grep ERROR
```

## 🔧 Common Operations

### Restart Services
```bash
# Kubernetes - rolling restart (zero downtime)
kubectl rollout restart deployment/pulsestage-api
kubectl rollout restart deployment/pulsestage-web

# Docker Compose
docker compose restart api
docker compose restart web

# Full redeploy
docker compose down && docker compose up -d
```

### Scale Services
```bash
# Kubernetes - scale to 3 replicas
kubectl scale deployment/pulsestage-api --replicas=3

# Check scaling status
kubectl get pods -w
```

### Database Operations
```bash
# Create backup
pg_dump "$DATABASE_URL" | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# List recent backups
ls -lth backup-*.sql.gz | head -10

# Restore from backup
gunzip -c backup-YYYYMMDD-HHMMSS.sql.gz | psql "$DATABASE_URL"

# Run migrations
cd api && npx prisma migrate deploy

# Check migration status
cd api && npx prisma migrate status

# Check database connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()"
```

### Redis Operations
```bash
# Check Redis connection
redis-cli -u "$REDIS_URL" ping

# Monitor Redis commands
redis-cli -u "$REDIS_URL" monitor

# Check memory usage
redis-cli -u "$REDIS_URL" info memory

# Flush all keys (DANGEROUS - only for emergencies)
redis-cli -u "$REDIS_URL" flushall

# Check specific session
redis-cli -u "$REDIS_URL" keys "ama-session:*" | head -10
```

### Secret Rotation
```bash
# 1. Generate new secrets
cd api && npm run generate-secrets

# 2. Update secrets in secrets manager
# (AWS Secrets Manager, Vault, etc.)

# 3. Update deployment configuration
kubectl edit secret pulsestage-secrets

# 4. Rolling restart to pick up new secrets
kubectl rollout restart deployment/pulsestage-api

# 5. Verify no authentication errors
kubectl logs deployment/pulsestage-api | grep -i "session\|csrf" | tail -50
```

## 🚨 Incident Response

### High Error Rate
```bash
# 1. Check recent errors
kubectl logs deployment/pulsestage-api --since=10m | grep ERROR | tail -50

# 2. Check error distribution
kubectl logs deployment/pulsestage-api --since=1h | grep ERROR | \
  awk '{print $NF}' | sort | uniq -c | sort -rn

# 3. Check health status
curl https://api.yourdomain.com/health/ready

# 4. If database issue - check connections
psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"

# 5. If Redis issue - check Redis
redis-cli -u "$REDIS_URL" info stats
```

### High Response Times
```bash
# 1. Check slow queries in last hour
kubectl logs deployment/pulsestage-api --since=1h | grep "Slow query"

# 2. Check database query times
psql "$DATABASE_URL" -c "
  SELECT query, mean_exec_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10
"

# 3. Check memory usage
kubectl top pods | grep pulsestage

# 4. Check CPU usage
kubectl top nodes
```

### Database Connection Failures
```bash
# 1. Check if database is accessible
psql "$DATABASE_URL" -c "SELECT 1"

# 2. Check current connections
psql "$DATABASE_URL" -c "
  SELECT count(*), state 
  FROM pg_stat_activity 
  GROUP BY state
"

# 3. Check connection limits
psql "$DATABASE_URL" -c "SHOW max_connections"

# 4. Terminate idle connections (if at limit)
psql "$DATABASE_URL" -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
  AND query_start < NOW() - INTERVAL '10 minutes'
"

# 5. Restart API to reset connection pool
kubectl rollout restart deployment/pulsestage-api
```

### Redis Connection Failures
```bash
# 1. Check Redis availability
redis-cli -u "$REDIS_URL" ping

# 2. Check Redis memory
redis-cli -u "$REDIS_URL" info memory

# 3. If Redis is down - restart Redis
docker compose restart redis  # or kubectl restart

# 4. After Redis is back - restart API
kubectl rollout restart deployment/pulsestage-api

# 5. Monitor for reconnection
kubectl logs -f deployment/pulsestage-api | grep -i redis
```

### Out of Memory (OOM)
```bash
# 1. Check current memory usage
kubectl top pods | grep pulsestage

# 2. Check memory limits
kubectl describe pod <pod-name> | grep -A 5 "Limits"

# 3. Review application logs for memory leaks
kubectl logs deployment/pulsestage-api | grep "heap\|memory"

# 4. Restart pod to recover
kubectl delete pod <pod-name>

# 5. Increase memory limits if needed
kubectl edit deployment pulsestage-api
# Update resources.limits.memory
```

### Session Issues / Users Logged Out
```bash
# 1. Check Redis session store
redis-cli -u "$REDIS_URL" keys "ama-session:*" | wc -l

# 2. Check session TTL
redis-cli -u "$REDIS_URL" ttl "ama-session:<session-id>"

# 3. Verify SESSION_SECRET hasn't changed
kubectl get secret pulsestage-secrets -o jsonpath='{.data.SESSION_SECRET}' | base64 -d | wc -c
# Should be 32+ characters

# 4. Check for Redis flushall events
redis-cli -u "$REDIS_URL" info stats | grep total_commands_processed
```

### Rate Limiting Issues
```bash
# 1. Check rate limit keys in Redis
redis-cli -u "$REDIS_URL" keys "rate:*"

# 2. Check specific user's rate limits
redis-cli -u "$REDIS_URL" keys "rate:*:<ip-address>"

# 3. Clear rate limits for specific IP (emergency)
redis-cli -u "$REDIS_URL" del "rate:/questions:*:<ip-address>"

# 4. Monitor rate limit hits
kubectl logs deployment/pulsestage-api | grep "rate limit" | tail -50
```

## 📊 Performance Tuning

### Database Optimization
```bash
# Analyze table statistics
psql "$DATABASE_URL" -c "ANALYZE"

# Check index usage
psql "$DATABASE_URL" -c "
  SELECT schemaname, tablename, indexname, idx_scan
  FROM pg_stat_user_indexes
  WHERE idx_scan < 100
  ORDER BY idx_scan
"

# Check table bloat
psql "$DATABASE_URL" -c "
  SELECT schemaname, tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
"
```

### Redis Optimization
```bash
# Check Redis slow log
redis-cli -u "$REDIS_URL" slowlog get 10

# Check key space
redis-cli -u "$REDIS_URL" --bigkeys

# Check eviction stats
redis-cli -u "$REDIS_URL" info stats | grep evicted
```

## 🔐 Security Operations

### Audit Log Review
```bash
# Check recent admin actions
curl -H "Authorization: Bearer $ADMIN_KEY" \
  "https://api.yourdomain.com/admin/audit?limit=50" | jq '.'

# Check failed authentication attempts
kubectl logs deployment/pulsestage-api | \
  grep "Unauthorized\|Forbidden" | tail -50
```

### Security Scan
```bash
# Run Trivy scan on current image
trivy image ghcr.io/yourusername/pulsestage-api:latest

# Run Semgrep on codebase
cd api && npx semgrep --config=auto .
```

## 📈 Monitoring Queries

### Key Metrics
```bash
# Active users (last 15 minutes)
psql "$DATABASE_URL" -c "
  SELECT COUNT(DISTINCT author_id)
  FROM questions
  WHERE created_at > NOW() - INTERVAL '15 minutes'
"

# Questions per hour
psql "$DATABASE_URL" -c "
  SELECT date_trunc('hour', created_at) as hour, COUNT(*)
  FROM questions
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY hour
  ORDER BY hour DESC
"

# Average response time (from logs)
kubectl logs deployment/pulsestage-api --since=1h | \
  grep "responded in" | awk '{print $(NF-1)}' | \
  awk '{sum+=$1; count++} END {print sum/count "ms"}'
```

## 🔄 Deployment Rollback

### Quick Rollback
```bash
# 1. Rollback API
kubectl rollout undo deployment/pulsestage-api

# 2. Rollback Web
kubectl rollout undo deployment/pulsestage-web

# 3. Check rollback status
kubectl rollout status deployment/pulsestage-api
kubectl rollout status deployment/pulsestage-web

# 4. Verify health
curl https://api.yourdomain.com/health/ready
```

### Database Rollback
```bash
# 1. Stop application
kubectl scale deployment/pulsestage-api --replicas=0

# 2. Restore database
gunzip -c backup-YYYYMMDD-HHMMSS.sql.gz | psql "$DATABASE_URL"

# 3. Run migrations (if needed)
cd api && npx prisma migrate deploy

# 4. Restart application
kubectl scale deployment/pulsestage-api --replicas=3
```

## 📞 Escalation Contacts

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Critical Outage | On-Call Engineer | Immediate |
| Database Issues | Database Team | 15 minutes |
| Security Incident | Security Team | Immediate |
| Network Issues | Infrastructure Team | 30 minutes |

## 📚 Additional Resources

- [Troubleshooting Guide](../../TROUBLESHOOTING.md)
- [Architecture Documentation](../architecture/system-design.md)
- [Monitoring Setup](./monitoring.md)
- [Security Guidelines](../security/overview.md)

---

**Last Updated**: 2025-01-14  
**Maintained By**: DevOps Team

