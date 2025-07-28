-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oemType" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "vehicleType" TEXT NOT NULL DEFAULT '2-wheeler',
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rc_details" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "rcNumber" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "registrationDate" DATETIME NOT NULL,
    "validUpto" DATETIME,
    "fuelType" TEXT NOT NULL DEFAULT 'Electric',
    "seatingCapacity" INTEGER,
    "rcPhotoUrl" TEXT,
    "rcUploadDate" DATETIME,
    "rcVerificationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rc_details_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "insurance_details" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "insuranceType" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "policyStartDate" DATETIME NOT NULL,
    "policyEndDate" DATETIME NOT NULL,
    "premiumAmount" REAL NOT NULL,
    "coverageAmount" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "renewalReminder" BOOLEAN NOT NULL DEFAULT true,
    "policyPhotoUrl" TEXT,
    "policyUploadDate" DATETIME,
    "verificationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "insurance_details_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "issueReported" TEXT,
    "workPerformed" TEXT NOT NULL,
    "mechanicName" TEXT,
    "serviceCenter" TEXT,
    "laborCost" REAL NOT NULL DEFAULT 0.0,
    "partsCost" REAL NOT NULL DEFAULT 0.0,
    "totalCost" REAL NOT NULL DEFAULT 0.0,
    "partsReplaced" TEXT,
    "serviceStatus" TEXT NOT NULL DEFAULT 'Completed',
    "nextServiceDue" DATETIME,
    "mileageAtService" INTEGER,
    "qualityRating" INTEGER,
    "serviceNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "damage_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "damageType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "damageDate" DATETIME NOT NULL,
    "reportedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "damageLocation" TEXT,
    "incidentLocation" TEXT,
    "weatherConditions" TEXT,
    "reportedBy" TEXT NOT NULL,
    "witnessDetails" TEXT,
    "policeReport" BOOLEAN NOT NULL DEFAULT false,
    "policeReportNumber" TEXT,
    "resolutionStatus" TEXT NOT NULL DEFAULT 'Reported',
    "estimatedCost" REAL,
    "actualCost" REAL,
    "repairDate" DATETIME,
    "repairDetails" TEXT,
    "insuranceClaim" BOOLEAN NOT NULL DEFAULT false,
    "claimNumber" TEXT,
    "claimStatus" TEXT,
    "claimAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "damage_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicle_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mediaCategory" TEXT NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT,
    CONSTRAINT "vehicle_media_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "description" TEXT,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_media_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "service_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "damage_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "damageRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "description" TEXT,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "damage_media_damageRecordId_fkey" FOREIGN KEY ("damageRecordId") REFERENCES "damage_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "handover_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "handoverType" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "handoverDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mileageReading" INTEGER,
    "batteryPercentage" INTEGER,
    "fuelLevel" INTEGER,
    "overallCondition" TEXT NOT NULL,
    "exteriorCondition" TEXT NOT NULL,
    "interiorCondition" TEXT NOT NULL,
    "mechanicalCondition" TEXT NOT NULL,
    "issuesReported" TEXT,
    "photosUploaded" BOOLEAN NOT NULL DEFAULT false,
    "handoverLocation" TEXT,
    "gpsLatitude" REAL,
    "gpsLongitude" REAL,
    "verifiedBy" TEXT,
    "verificationDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "handover_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "handover_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handoverRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "photoType" TEXT NOT NULL,
    "description" TEXT,
    "gpsLatitude" REAL,
    "gpsLongitude" REAL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "handover_media_handoverRecordId_fkey" FOREIGN KEY ("handoverRecordId") REFERENCES "handover_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicle_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changeReason" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "relatedRecordType" TEXT,
    "relatedRecordId" TEXT,
    CONSTRAINT "vehicle_status_history_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fleet_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodType" TEXT NOT NULL,
    "periodDate" DATETIME NOT NULL,
    "totalVehicles" INTEGER NOT NULL DEFAULT 0,
    "activeVehicles" INTEGER NOT NULL DEFAULT 0,
    "vehiclesUnderService" INTEGER NOT NULL DEFAULT 0,
    "damagedVehicles" INTEGER NOT NULL DEFAULT 0,
    "utilizationRate" REAL NOT NULL DEFAULT 0.0,
    "averageMileage" REAL NOT NULL DEFAULT 0.0,
    "totalRevenue" REAL NOT NULL DEFAULT 0.0,
    "maintenanceCosts" REAL NOT NULL DEFAULT 0.0,
    "damageCosts" REAL NOT NULL DEFAULT 0.0,
    "insuranceCosts" REAL NOT NULL DEFAULT 0.0,
    "averageServiceTime" REAL NOT NULL DEFAULT 0.0,
    "averageRepairTime" REAL NOT NULL DEFAULT 0.0,
    "customerSatisfaction" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registrationNumber_key" ON "vehicles"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_chassisNumber_key" ON "vehicles"("chassisNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_engineNumber_key" ON "vehicles"("engineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rc_details_vehicleId_key" ON "rc_details"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "rc_details_rcNumber_key" ON "rc_details"("rcNumber");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_details_policyNumber_key" ON "insurance_details"("policyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "fleet_analytics_periodType_periodDate_key" ON "fleet_analytics"("periodType", "periodDate");
