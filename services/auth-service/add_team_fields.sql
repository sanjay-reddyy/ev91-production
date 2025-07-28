-- Add missing columns to teams table
ALTER TABLE "teams" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "teams" ADD COLUMN "country" TEXT NOT NULL DEFAULT '';
ALTER TABLE "teams" ADD COLUMN "memberCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "teams" ADD COLUMN "maxMembers" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "teams" ADD COLUMN "skills" TEXT;
ALTER TABLE "teams" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Active';

-- Update existing records to have proper default values
UPDATE "teams" SET "city" = 'Unknown', "country" = 'Unknown' WHERE "city" = '' OR "country" = '';
