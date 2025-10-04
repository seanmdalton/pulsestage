-- CreateTable: Tenant
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- Insert default tenant for backward compatibility
INSERT INTO "Tenant" ("id", "slug", "name", "createdAt", "updatedAt")
VALUES ('default-tenant-id', 'default', 'Default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add tenantId columns (nullable initially for backfill)
ALTER TABLE "Team" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Question" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Tag" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "UserPreferences" ADD COLUMN "tenantId" TEXT;

-- Backfill existing data with default tenant
UPDATE "Team" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "Question" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "Tag" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "User" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "UserPreferences" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;

-- Make tenantId NOT NULL
ALTER TABLE "Team" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Tag" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "UserPreferences" ALTER COLUMN "tenantId" SET NOT NULL;

-- Drop old unique constraints that need to be per-tenant
ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_slug_key";
ALTER TABLE "Tag" DROP CONSTRAINT IF EXISTS "Tag_name_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_ssoId_key";

-- Add foreign key constraints
ALTER TABLE "Team" ADD CONSTRAINT "Team_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new unique constraints (per-tenant)
CREATE UNIQUE INDEX "Team_tenantId_slug_key" ON "Team"("tenantId", "slug");
CREATE UNIQUE INDEX "Tag_tenantId_name_key" ON "Tag"("tenantId", "name");
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE UNIQUE INDEX "User_tenantId_ssoId_key" ON "User"("tenantId", "ssoId");

-- Add indexes for performance
CREATE INDEX "Team_tenantId_idx" ON "Team"("tenantId");
CREATE INDEX "Question_tenantId_idx" ON "Question"("tenantId");
CREATE INDEX "Question_tenantId_status_idx" ON "Question"("tenantId", "status");
CREATE INDEX "Question_tenantId_teamId_idx" ON "Question"("tenantId", "teamId");
CREATE INDEX "Tag_tenantId_idx" ON "Tag"("tenantId");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "UserPreferences_tenantId_idx" ON "UserPreferences"("tenantId");

