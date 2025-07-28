/*
  Warnings:

  - Added the required column `firebaseUid` to the `Rider` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firebaseUid" TEXT NOT NULL,
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
INSERT INTO "new_Rider" ("aadhaar", "address1", "address2", "agreementSigned", "city", "consent", "consentLogs", "createdAt", "dl", "dob", "emergencyName", "emergencyPhone", "emergencyRelation", "firebaseUid", "id", "ip", "kycStatus", "name", "otp", "otpAttempts", "otpVerified", "pan", "phone", "pincode", "selfie", "state", "updatedAt") SELECT "aadhaar", "address1", "address2", "agreementSigned", "city", "consent", "consentLogs", "createdAt", "dl", "dob", "emergencyName", "emergencyPhone", "emergencyRelation", 'temp_firebase_uid_' || "id", "id", "ip", "kycStatus", "name", "otp", "otpAttempts", "otpVerified", "pan", "phone", "pincode", "selfie", "state", "updatedAt" FROM "Rider";
DROP TABLE "Rider";
ALTER TABLE "new_Rider" RENAME TO "Rider";
CREATE UNIQUE INDEX "Rider_firebaseUid_key" ON "Rider"("firebaseUid");
CREATE UNIQUE INDEX "Rider_phone_key" ON "Rider"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
