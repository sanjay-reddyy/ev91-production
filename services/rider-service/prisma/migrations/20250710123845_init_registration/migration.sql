-- CreateTable
CREATE TABLE "Rider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "otp" TEXT,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "dob" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "emergencyRelation" TEXT,
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "aadhaar" TEXT,
    "pan" TEXT,
    "dl" TEXT,
    "selfie" TEXT,
    "consentLogs" TEXT,
    "ip" TEXT,
    "agreementSigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Rider_phone_key" ON "Rider"("phone");
