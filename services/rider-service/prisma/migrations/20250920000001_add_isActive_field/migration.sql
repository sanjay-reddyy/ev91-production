-- AlterTable
ALTER TABLE "rider"."Rider" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

-- Update existing riders to set isActive based on registrationStatus
UPDATE "rider"."Rider" SET "isActive" = ("registrationStatus" = 'COMPLETED');
