-- CreateTable
CREATE TABLE "rider"."kyc_documents" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentTypeDisplay" TEXT,
    "documentNumber" TEXT,
    "documentImageUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verificationDate" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kyc_documents_riderId_idx" ON "rider"."kyc_documents"("riderId");

-- CreateIndex
CREATE INDEX "kyc_documents_documentType_idx" ON "rider"."kyc_documents"("documentType");

-- CreateIndex
CREATE INDEX "kyc_documents_verificationStatus_idx" ON "rider"."kyc_documents"("verificationStatus");

-- AddForeignKey
ALTER TABLE "rider"."kyc_documents" ADD CONSTRAINT "kyc_documents_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "rider"."Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
