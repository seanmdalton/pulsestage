# Database Migrations

## Overview

This project uses Prisma migrations to track database schema changes. While the project previously used `prisma db push` for simplicity, we've introduced formal migrations for the multi-tenancy feature to ensure proper backfill of existing data.

## Migration Strategy

### For Multi-Tenancy Migration (20250103000001_add_multi_tenancy_models)

This migration adds multi-tenancy support with zero downtime:

1. **Creates** the `Tenant` table
2. **Inserts** a "default" tenant for backward compatibility
3. **Adds** `tenantId` columns to all tenant-scoped models (nullable)
4. **Backfills** existing data with the default tenant ID
5. **Enforces** NOT NULL constraints on `tenantId`
6. **Updates** unique constraints to be per-tenant
7. **Adds** performance indexes for tenant queries

### Running Migrations

**For existing deployments (with data):**
```bash
npx prisma migrate deploy
```

**For new deployments:**
```bash
npx prisma db push
```

**To reset database (development only):**
```bash
npx prisma migrate reset
```

## Migration Files

- `migration_lock.toml` - Tracks database provider
- `20250103000001_add_multi_tenancy_models/` - Multi-tenancy migration
  - `migration.sql` - SQL statements for schema changes and backfill

## Development Workflow

1. Make schema changes in `schema.prisma`
2. Generate migration: `npx prisma migrate dev --name descriptive_name`
3. Review the generated SQL
4. Test migration on development database
5. Commit migration files
6. Deploy with `npx prisma migrate deploy`

## Notes

- All existing data will be assigned to the "default" tenant
- New tenants can be created via the org signup API
- Users are permanently bound to their tenant
- Tenant isolation is enforced at the database level

