-- Migration script to add OEM and VehicleModel tables and migrate existing data
-- This should be run after the Prisma schema is updated

-- First, let's see what unique OEM types we have in the current data
-- We'll create OEMs based on existing oemType values

-- Insert OEMs based on existing data
INSERT INTO "oems" (id, name, "displayName", code, "isActive", "isPreferred", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid() as id,
  "oemType" as name,
  "oemType" as "displayName",
  UPPER(SUBSTRING("oemType", 1, 3)) as code,
  true as "isActive",
  false as "isPreferred",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM (
  SELECT DISTINCT "oemType" 
  FROM vehicles 
  WHERE "oemType" IS NOT NULL AND "oemType" != ''
) unique_oems
ON CONFLICT (name) DO NOTHING;

-- Insert VehicleModels based on existing OEM + Model combinations
INSERT INTO "vehicle_models" (
  id, "oemId", name, "displayName", "modelCode", category, segment,
  "vehicleType", "fuelType", "isActive", "isPopular", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid() as id,
  o.id as "oemId",
  v."vehicleModel" as name,
  v."vehicleModel" as "displayName",
  UPPER(SUBSTRING(v."vehicleModel", 1, 6)) as "modelCode",
  'E-Vehicle' as category, -- Default category
  'Standard' as segment,   -- Default segment
  COALESCE(v."vehicleType", '2-Wheeler') as "vehicleType",
  'Electric' as "fuelType", -- Default for EV fleet
  true as "isActive",
  false as "isPopular",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM (
  SELECT DISTINCT "oemType", "vehicleModel", "vehicleType"
  FROM vehicles 
  WHERE "oemType" IS NOT NULL AND "oemType" != ''
    AND "vehicleModel" IS NOT NULL AND "vehicleModel" != ''
) v
JOIN "oems" o ON o.name = v."oemType"
ON CONFLICT ("oemId", "modelCode") DO NOTHING;

-- Now we need to add the modelId column to vehicles table temporarily
-- This will be done through Prisma migration, but we need to populate it

-- Update vehicles with the correct modelId
UPDATE vehicles 
SET "modelId" = vm.id
FROM "vehicle_models" vm
JOIN "oems" o ON vm."oemId" = o.id
WHERE vehicles."oemType" = o.name 
  AND vehicles."vehicleModel" = vm.name;

-- After this migration:
-- 1. The Prisma schema should be updated to remove oemType and vehicleModel columns
-- 2. The modelId should be made required (NOT NULL)
-- 3. Frontend should be updated to use the new API structure
