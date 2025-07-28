-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "clientCode" TEXT NOT NULL,
    "clientType" TEXT NOT NULL,
    "industrySector" TEXT,
    "businessCategory" TEXT,
    "primaryContactPerson" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "secondaryEmail" TEXT,
    "phone" TEXT,
    "secondaryPhone" TEXT,
    "website" TEXT,
    "headquartersAddress" TEXT,
    "headquartersCity" TEXT,
    "headquartersState" TEXT,
    "headquartersCountry" TEXT NOT NULL DEFAULT 'India',
    "pinCode" TEXT,
    "geographicRegions" TEXT,
    "registrationNumber" TEXT,
    "panNumber" TEXT,
    "gstNumber" TEXT,
    "businessSize" TEXT,
    "annualRevenueRange" TEXT,
    "employeeCountRange" TEXT,
    "evPortfolio" TEXT,
    "fleetSize" INTEGER,
    "hasChargingInfra" BOOLEAN NOT NULL DEFAULT false,
    "chargingInfraDetails" TEXT,
    "batteryTechPreference" TEXT,
    "serviceRequirements" TEXT,
    "creditLimit" REAL,
    "paymentTerms" TEXT,
    "preferredPaymentMethod" TEXT,
    "taxCategory" TEXT,
    "discountCategory" TEXT,
    "baseOrderRate" REAL NOT NULL DEFAULT 25.0,
    "rateEffectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateType" TEXT NOT NULL DEFAULT 'fixed',
    "minimumRate" REAL NOT NULL DEFAULT 15.0,
    "maximumRate" REAL NOT NULL DEFAULT 50.0,
    "bulkBonusEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bulkOrdersThreshold" INTEGER NOT NULL DEFAULT 10,
    "bulkBonusAmount" REAL NOT NULL DEFAULT 50.0,
    "bulkResetPeriod" TEXT NOT NULL DEFAULT 'daily',
    "weeklyBonusEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyOrderTarget" INTEGER NOT NULL DEFAULT 70,
    "weeklyBonusAmount" REAL NOT NULL DEFAULT 500.0,
    "performanceMultiplierEnabled" BOOLEAN NOT NULL DEFAULT false,
    "topPerformerRate" REAL NOT NULL DEFAULT 1.2,
    "performanceCriteria" TEXT NOT NULL DEFAULT 'rating',
    "paymentCycle" TEXT NOT NULL DEFAULT 'weekly',
    "paymentMethods" TEXT,
    "minimumPayout" REAL NOT NULL DEFAULT 100.0,
    "payoutDay" TEXT NOT NULL DEFAULT 'Friday',
    "clientStatus" TEXT NOT NULL DEFAULT 'Active',
    "acquisitionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountManagerId" TEXT,
    "clientPriority" TEXT NOT NULL DEFAULT 'Medium',
    "relationshipType" TEXT NOT NULL DEFAULT 'Direct',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "clients_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeCode" TEXT NOT NULL,
    "storeType" TEXT NOT NULL,
    "brandFranchise" TEXT,
    "completeAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pinCode" TEXT NOT NULL,
    "landmark" TEXT,
    "gpsLatitude" REAL,
    "gpsLongitude" REAL,
    "zoneRegion" TEXT,
    "storeManagerName" TEXT,
    "contactNumber" TEXT,
    "emailAddress" TEXT,
    "whatsappNumber" TEXT,
    "weekdayOpeningHours" TEXT,
    "weekendOpeningHours" TEXT,
    "workingDays" TEXT,
    "storeSizeSquareFt" INTEGER,
    "displayUnitsCount" INTEGER,
    "staffCount" INTEGER,
    "languagesSupported" TEXT,
    "vehicleTypesDisplayed" TEXT,
    "hasTestDriveFacility" BOOLEAN NOT NULL DEFAULT false,
    "chargingStationsCount" INTEGER NOT NULL DEFAULT 0,
    "chargingStationTypes" TEXT,
    "serviceBaysCount" INTEGER NOT NULL DEFAULT 0,
    "hasSparePartsInventory" BOOLEAN NOT NULL DEFAULT false,
    "hasBatterySwapping" BOOLEAN NOT NULL DEFAULT false,
    "monthlySalesTarget" REAL,
    "serviceCapacityPerDay" INTEGER,
    "inventoryCapacity" INTEGER,
    "storeStatus" TEXT NOT NULL DEFAULT 'Active',
    "openingDate" DATETIME,
    "leaseOwnedStatus" TEXT,
    "monthlyRent" REAL,
    "operationalCosts" REAL,
    "revenueTarget" REAL,
    "commissionStructure" TEXT,
    "currentOfferRate" REAL NOT NULL DEFAULT 0.0,
    "offerStartDate" DATETIME,
    "offerEndDate" DATETIME,
    "offerType" TEXT NOT NULL DEFAULT 'none',
    "offerReason" TEXT,
    "isOfferActive" BOOLEAN NOT NULL DEFAULT false,
    "busyLevel" TEXT NOT NULL DEFAULT 'medium',
    "averageOrdersPerDay" INTEGER NOT NULL DEFAULT 0,
    "peakHours" TEXT,
    "busyDays" TEXT,
    "orderDifficultyLevel" TEXT NOT NULL DEFAULT 'medium',
    "averageDeliveryDistance" REAL NOT NULL DEFAULT 0.0,
    "monthlyOrderVolume" INTEGER NOT NULL DEFAULT 0,
    "riderRating" REAL NOT NULL DEFAULT 0.0,
    "averagePickupTime" INTEGER NOT NULL DEFAULT 0,
    "storePriority" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stores_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rider_earnings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT,
    "baseRate" REAL NOT NULL,
    "storeOfferRate" REAL NOT NULL DEFAULT 0.0,
    "totalRate" REAL NOT NULL,
    "bulkOrderBonus" REAL NOT NULL DEFAULT 0.0,
    "performanceBonus" REAL NOT NULL DEFAULT 0.0,
    "weeklyTargetBonus" REAL NOT NULL DEFAULT 0.0,
    "specialEventBonus" REAL NOT NULL DEFAULT 0.0,
    "finalEarning" REAL NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryTime" INTEGER,
    "riderRating" REAL,
    "distance" REAL,
    "bonusesApplied" TEXT,
    "rateCalculationLog" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" DATETIME,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rider_earnings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rider_earnings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weekly_rider_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "weekEndDate" DATETIME NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "averageOrdersPerDay" REAL NOT NULL DEFAULT 0.0,
    "bestDayOrders" INTEGER NOT NULL DEFAULT 0,
    "worstDayOrders" INTEGER NOT NULL DEFAULT 0,
    "baseEarnings" REAL NOT NULL DEFAULT 0.0,
    "offerEarnings" REAL NOT NULL DEFAULT 0.0,
    "bonusEarnings" REAL NOT NULL DEFAULT 0.0,
    "totalEarnings" REAL NOT NULL DEFAULT 0.0,
    "averageRating" REAL NOT NULL DEFAULT 0.0,
    "averageDeliveryTime" REAL NOT NULL DEFAULT 0.0,
    "onTimeDeliveryPercentage" REAL NOT NULL DEFAULT 0.0,
    "totalDistance" REAL NOT NULL DEFAULT 0.0,
    "dailyTargetAchieved" TEXT,
    "weeklyTargetAchieved" BOOLEAN NOT NULL DEFAULT false,
    "bonusesEarned" TEXT,
    "topClientId" TEXT,
    "topStoreId" TEXT,
    "citiesWorked" TEXT,
    "totalPaid" REAL NOT NULL DEFAULT 0.0,
    "pendingAmount" REAL NOT NULL DEFAULT 0.0,
    "paymentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rate_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "oldBaseRate" REAL NOT NULL,
    "newBaseRate" REAL NOT NULL,
    "changeReason" TEXT,
    "effectiveDate" DATETIME NOT NULL,
    "changedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_key" ON "clients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clients_clientCode_key" ON "clients"("clientCode");

-- CreateIndex
CREATE UNIQUE INDEX "stores_storeCode_key" ON "stores"("storeCode");

-- CreateIndex
CREATE UNIQUE INDEX "stores_clientId_storeCode_key" ON "stores"("clientId", "storeCode");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_rider_summaries_riderId_weekStartDate_key" ON "weekly_rider_summaries"("riderId", "weekStartDate");
