-- AlterTable
-- Add emailNotifications column to UserPreferences table
ALTER TABLE "UserPreferences" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;


