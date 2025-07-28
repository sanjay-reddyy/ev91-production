/*
  Warnings:

  - You are about to drop the column `oemType` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleModel` on the `vehicles` table. All the data in the column will be lost.
  - Added the required column `color` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelId` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "oems" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT,
    "website" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "gstin" TEXT,
    "panNumber" TEXT,
    "registeredAddress" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "modelCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "launchYear" INTEGER,
    "discontinuedYear" INTEGER,
    "vehicleType" TEXT NOT NULL DEFAULT '2-Wheeler',
    "fuelType" TEXT NOT NULL,
    "engineCapacity" TEXT,
    "batteryCapacity" TEXT,
    "maxSpeed" INTEGER,
    "range" INTEGER,
    "chargingTime" TEXT,
    "seatingCapacity" INTEGER NOT NULL DEFAULT 2,
    "weight" REAL,
    "dimensions" TEXT,
    "availableVariants" TEXT,
    "availableColors" TEXT,
    "standardFeatures" TEXT,
    "optionalFeatures" TEXT,
    "basePrice" REAL,
    "priceRange" TEXT,
    "serviceInterval" INTEGER,
    "warrantyPeriod" INTEGER,
    "spareParts" TEXT,
    "imageUrl" TEXT,
    "brochureUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicle_models_oemId_fkey" FOREIGN KEY ("oemId") REFERENCES "oems" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "variant" TEXT,
    "color" TEXT NOT NULL,
    "year" INTEGER,
    "vehicleType" TEXT,
    "batteryType" TEXT,
    "batteryCapacity" REAL,
    "maxRange" INTEGER,
    "maxSpeed" INTEGER,
    "purchaseDate" DATETIME,
    "registrationDate" DATETIME NOT NULL,
    "purchasePrice" REAL,
    "currentValue" REAL,
    "ageInMonths" INTEGER,
    "fleetOperatorId" TEXT,
    "currentRiderId" TEXT,
    "assignmentDate" DATETIME,
    "operationalStatus" TEXT NOT NULL DEFAULT 'Available',
    "serviceStatus" TEXT NOT NULL DEFAULT 'Active',
    "location" TEXT,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_vehicles" ("ageInMonths", "assignmentDate", "batteryCapacity", "batteryType", "chassisNumber", "createdAt", "currentRiderId", "currentValue", "engineNumber", "fleetOperatorId", "id", "location", "maxRange", "maxSpeed", "mileage", "operationalStatus", "purchaseDate", "purchasePrice", "registrationDate", "registrationNumber", "serviceStatus", "updatedAt", "vehicleType") SELECT "ageInMonths", "assignmentDate", "batteryCapacity", "batteryType", "chassisNumber", "createdAt", "currentRiderId", "currentValue", "engineNumber", "fleetOperatorId", "id", "location", "maxRange", "maxSpeed", "mileage", "operationalStatus", "purchaseDate", "purchasePrice", "registrationDate", "registrationNumber", "serviceStatus", "updatedAt", "vehicleType" FROM "vehicles";
DROP TABLE "vehicles";
ALTER TABLE "new_vehicles" RENAME TO "vehicles";
CREATE UNIQUE INDEX "vehicles_registrationNumber_key" ON "vehicles"("registrationNumber");
CREATE UNIQUE INDEX "vehicles_chassisNumber_key" ON "vehicles"("chassisNumber");
CREATE UNIQUE INDEX "vehicles_engineNumber_key" ON "vehicles"("engineNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "oems_name_key" ON "oems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "oems_code_key" ON "oems"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_oemId_modelCode_key" ON "vehicle_models"("oemId", "modelCode");
