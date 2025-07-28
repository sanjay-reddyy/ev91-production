/*
  Warnings:

  - You are about to drop the column `firebaseUid` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `otp` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `otpAttempts` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `otpVerified` on the `Rider` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tempId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "requestId" TEXT NOT NULL DEFAULT '',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "registrationStatus" TEXT NOT NULL DEFAULT 'PENDING',
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
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "consentLogs" TEXT,
    "ip" TEXT,
    "agreementSigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);
INSERT INTO "new_Rider" ("aadhaar", "address1", "address2", "agreementSigned", "city", "consent", "consentLogs", "createdAt", "dl", "dob", "emergencyName", "emergencyPhone", "emergencyRelation", "id", "ip", "kycStatus", "name", "pan", "phone", "pincode", "selfie", "state", "updatedAt") SELECT "aadhaar", "address1", "address2", "agreementSigned", "city", "consent", "consentLogs", "createdAt", "dl", "dob", "emergencyName", "emergencyPhone", "emergencyRelation", "id", "ip", "kycStatus", "name", "pan", "phone", "pincode", "selfie", "state", "updatedAt" FROM "Rider";
DROP TABLE "Rider";
ALTER TABLE "new_Rider" RENAME TO "Rider";
CREATE UNIQUE INDEX "Rider_phone_key" ON "Rider"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "OtpVerification_tempId_key" ON "OtpVerification"("tempId");
