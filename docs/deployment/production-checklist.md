# Production Deployment Checklist

This checklist ensures all security and operational requirements are met before deploying PulseStage to production.

## 🔐 Security & Secrets

### Required Secrets
- [ ] Generate secure secrets: `cd api && npm run generate-secrets`
- [ ] `SESSION_SECRET` set (min 32 characters)
- [ ] `CSRF_SECRET` set (min 32 characters)
- [ ] `ADMIN_KEY` set (min 32 characters)
- [ ] All secrets stored in secure secrets manager (e.g., Vault, AWS Secrets Manager)
- [ ] No default/example secrets in use (`change-me`, `test`, etc.)
- [ ] Secrets rotated from development/staging environments

### Environment Configuration
- [ ] `NODE_ENV=production` set
- [ ] `DATABASE_URL` configured with production credentials
- [ ] Database password changed from default (`app:app`)
- [ ] Connection pool parameters configured in `DATABASE_URL`:
  ```
  ?connection_limit=20&pool_timeout=60&connect_timeout=10
  ```

### CORS & Networking
- [ ] `CORS_ORIGINS` set to comma-separated allowlist (no wildcard `*`)
- [ ] `CORS_ORIGIN` removed or matches first `CORS_ORIGINS` entry
- [ ] Frontend URL configured in `FRONTEND_URL`
- [ ] All URLs use HTTPS (no HTTP in production)

### Authentication
- [ ] OAuth credentials configured (GitHub and/or Google)
- [ ] `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` set
- [ ] `GITHUB_CALLBACK_URL` points to production domain
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set (if using Google)
- [ ] `GOOGLE_CALLBACK_URL` points to production domain
- [ ] Demo mode disabled (automatic in `NODE_ENV=production`)

## 🗄️ Infrastructure

### Redis
- [ ] Redis server deployed and accessible
- [ ] `REDIS_URL` configured (not localhost)
- [ ] Redis password set (if applicable)
- [ ] Redis persistence enabled (AOF or RDB)
- [ ] Redis memory limits configured
- [ ] Redis monitoring enabled

### Database
- [ ] PostgreSQL 14+ deployed
- [ ] Database backups configured (automated daily)
- [ ] Point-in-time recovery enabled
- [ ] Database connection limits configured
- [ ] Database monitoring enabled
- [ ] Migrations run: `cd api && npx prisma migrate deploy`

### Email (Optional)
- [ ] Email provider configured (`EMAIL_PROVIDER=smtp` or `resend`)
- [ ] SMTP credentials set (if using SMTP)
- [ ] Resend API key set (if using Resend)
- [ ] `EMAIL_FROM` and `EMAIL_FROM_NAME` configured
- [ ] Test email sent successfully

## 🏗️ Application

### Docker & Deployment
- [ ] Docker images built from main branch
- [ ] Images scanned for vulnerabilities (Trivy)
- [ ] Images pushed to container registry
- [ ] Health check endpoints configured:
  - Liveness: `GET /health/live`
  - Readiness: `GET /health/ready`
- [ ] Resource limits set (CPU, memory)
- [ ] Horizontal Pod Autoscaling configured (if using Kubernetes)

### Monitoring & Observability
- [ ] Application logs forwarded to centralized logging
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Uptime monitoring configured
- [ ] Alerts configured for:
  - High error rate (>5%)
  - High response time (>2s p95)
  - Database connection failures
  - Redis connection failures
  - High memory usage (>80%)
- [ ] Dashboards created for key metrics

### Performance
- [ ] CDN configured for static assets (if applicable)
- [ ] Compression enabled (gzip/brotli)
- [ ] Rate limiting tested and verified
- [ ] Database indexes verified
- [ ] Slow query monitoring enabled

## 🧪 Testing

### Pre-Deployment Tests
- [ ] Run pre-flight check: `cd api && npm run preflight-check`
- [ ] All tests passing: `cd api && npm test`
- [ ] Linting passing: `cd api && npm run lint`
- [ ] Security scan passing: `npm run security`
- [ ] Load testing completed (if applicable)

### Smoke Tests (Post-Deployment)
- [ ] Health endpoints responding:
  ```bash
  curl https://api.yourdomain.com/health/live
  curl https://api.yourdomain.com/health/ready
  ```
- [ ] OAuth login flow working
- [ ] Question submission working
- [ ] Email notifications working (if configured)
- [ ] SSE events delivering
- [ ] Admin dashboard accessible

## 🔄 Deployment Process

### Before Deployment
1. [ ] Review all changes since last deployment
2. [ ] Run full test suite locally
3. [ ] Create database backup
4. [ ] Notify team of deployment window
5. [ ] Have rollback plan ready

### During Deployment
1. [ ] Deploy database migrations first (if any)
2. [ ] Deploy API service with zero-downtime strategy
3. [ ] Deploy frontend service
4. [ ] Monitor error rates and response times
5. [ ] Verify health checks passing

### After Deployment
1. [ ] Run smoke tests
2. [ ] Monitor logs for errors (15 minutes)
3. [ ] Verify user traffic flowing normally
4. [ ] Update deployment documentation
5. [ ] Notify team of successful deployment

## 🚨 Rollback Plan

If issues are detected:

1. **Immediate Rollback**
   ```bash
   # Roll back to previous Docker images
   kubectl rollout undo deployment/pulsestage-api
   kubectl rollout undo deployment/pulsestage-web
   ```

2. **Database Rollback**
   - If migrations were applied, restore from backup
   - Document rollback procedure in incident report

3. **Communication**
   - Notify team of rollback
   - Create incident report
   - Schedule post-mortem

## 📊 Success Criteria

Deployment is considered successful when:

- [ ] All health checks passing for 15 minutes
- [ ] Error rate < 1%
- [ ] p95 response time < 500ms
- [ ] No critical errors in logs
- [ ] User traffic flowing normally
- [ ] All smoke tests passing

## 🔗 Helpful Commands

```bash
# Generate production secrets
cd api && npm run generate-secrets

# Run pre-flight checks
cd api && npm run preflight-check

# Test database connection
psql "$DATABASE_URL" -c "SELECT 1"

# Test Redis connection
redis-cli -u "$REDIS_URL" ping

# Check health endpoints
curl https://api.yourdomain.com/health/live
curl https://api.yourdomain.com/health/ready

# View application logs
kubectl logs -f deployment/pulsestage-api --tail=100
docker compose logs -f api --tail=100

# Database backup
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d-%H%M%S).sql

# Database restore
psql "$DATABASE_URL" < backup-YYYYMMDD-HHMMSS.sql
```

## 📞 Support Contacts

- **On-Call Engineer**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Infrastructure Team**: [Contact Info]
- **Security Team**: [Contact Info]

## 📚 Additional Resources

- [Architecture Documentation](../architecture/system-design.md)
- [Security Guidelines](../security/overview.md)
- [Monitoring Setup](./monitoring.md)
- [Troubleshooting Guide](../../TROUBLESHOOTING.md)

---

**Last Updated**: 2025-01-14  
**Next Review**: 2025-04-14 (Quarterly)

