-- CreateTable
CREATE TABLE "oems" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" TEXT NOT NULL,
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
    "batteryType" TEXT,
    "batteryCapacity" TEXT,
    "maxSpeed" INTEGER,
    "range" INTEGER,
    "chargingTime" TEXT,
    "seatingCapacity" INTEGER NOT NULL DEFAULT 2,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "availableVariants" TEXT,
    "availableColors" TEXT,
    "standardFeatures" TEXT,
    "optionalFeatures" TEXT,
    "basePrice" DOUBLE PRECISION,
    "priceRange" TEXT,
    "serviceInterval" INTEGER,
    "warrantyPeriod" INTEGER,
    "spareParts" TEXT,
    "imageUrl" TEXT,
    "brochureUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "variant" TEXT,
    "color" TEXT NOT NULL,
    "year" INTEGER,
    "vehicleType" TEXT,
    "batteryType" TEXT,
    "batteryCapacity" DOUBLE PRECISION,
    "maxRange" INTEGER,
    "maxSpeed" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "registrationDate" TIMESTAMP(3) NOT NULL,
    "purchasePrice" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "ageInMonths" INTEGER,
    "fleetOperatorId" TEXT,
    "currentRiderId" TEXT,
    "assignmentDate" TIMESTAMP(3),
    "operationalStatus" TEXT NOT NULL DEFAULT 'Available',
    "serviceStatus" TEXT NOT NULL DEFAULT 'Active',
    "location" TEXT,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rc_details" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "rcNumber" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL,
    "validUpto" TIMESTAMP(3),
    "fuelType" TEXT NOT NULL DEFAULT 'Electric',
    "seatingCapacity" INTEGER,
    "rcPhotoUrl" TEXT,
    "rcUploadDate" TIMESTAMP(3),
    "rcVerificationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rc_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_details" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "insuranceType" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "policyStartDate" TIMESTAMP(3) NOT NULL,
    "policyEndDate" TIMESTAMP(3) NOT NULL,
    "premiumAmount" DOUBLE PRECISION NOT NULL,
    "coverageAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "renewalReminder" BOOLEAN NOT NULL DEFAULT true,
    "policyPhotoUrl" TEXT,
    "policyUploadDate" TIMESTAMP(3),
    "verificationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "issueReported" TEXT,
    "workPerformed" TEXT NOT NULL,
    "mechanicName" TEXT,
    "serviceCenter" TEXT,
    "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "partsCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "partsReplaced" TEXT,
    "serviceStatus" TEXT NOT NULL DEFAULT 'Completed',
    "nextServiceDue" TIMESTAMP(3),
    "mileageAtService" INTEGER,
    "qualityRating" INTEGER,
    "serviceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damage_records" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "damageType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "damageDate" TIMESTAMP(3) NOT NULL,
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "damageLocation" TEXT,
    "incidentLocation" TEXT,
    "weatherConditions" TEXT,
    "reportedBy" TEXT NOT NULL,
    "witnessDetails" TEXT,
    "policeReport" BOOLEAN NOT NULL DEFAULT false,
    "policeReportNumber" TEXT,
    "resolutionStatus" TEXT NOT NULL DEFAULT 'Reported',
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "repairDate" TIMESTAMP(3),
    "repairDetails" TEXT,
    "insuranceClaim" BOOLEAN NOT NULL DEFAULT false,
    "claimNumber" TEXT,
    "claimStatus" TEXT,
    "claimAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "damage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_media" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mediaCategory" TEXT NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT,

    CONSTRAINT "vehicle_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_media" (
    "id" TEXT NOT NULL,
    "serviceRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "description" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damage_media" (
    "id" TEXT NOT NULL,
    "damageRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "description" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "damage_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_records" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "handoverType" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "handoverDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "verifiedBy" TEXT,
    "verificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handover_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_media" (
    "id" TEXT NOT NULL,
    "handoverRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "photoType" TEXT NOT NULL,
    "description" TEXT,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handover_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_status_history" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changeReason" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "relatedRecordType" TEXT,
    "relatedRecordId" TEXT,

    CONSTRAINT "vehicle_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_analytics" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "totalVehicles" INTEGER NOT NULL DEFAULT 0,
    "activeVehicles" INTEGER NOT NULL DEFAULT 0,
    "vehiclesUnderService" INTEGER NOT NULL DEFAULT 0,
    "damagedVehicles" INTEGER NOT NULL DEFAULT 0,
    "utilizationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageMileage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maintenanceCosts" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "damageCosts" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "insuranceCosts" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageServiceTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageRepairTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "customerSatisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oems_name_key" ON "oems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "oems_code_key" ON "oems"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_oemId_modelCode_key" ON "vehicle_models"("oemId", "modelCode");

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

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_oemId_fkey" FOREIGN KEY ("oemId") REFERENCES "oems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rc_details" ADD CONSTRAINT "rc_details_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_details" ADD CONSTRAINT "insurance_details_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_records" ADD CONSTRAINT "damage_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_media" ADD CONSTRAINT "vehicle_media_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_media" ADD CONSTRAINT "service_media_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "service_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_media" ADD CONSTRAINT "damage_media_damageRecordId_fkey" FOREIGN KEY ("damageRecordId") REFERENCES "damage_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_records" ADD CONSTRAINT "handover_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_media" ADD CONSTRAINT "handover_media_handoverRecordId_fkey" FOREIGN KEY ("handoverRecordId") REFERENCES "handover_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
