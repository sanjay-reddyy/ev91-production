-- Migration: Add KYC Documents table
-- SQL script to create the kyc_documents table in the rider schema

-- First check if the kyc_documents table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rider' AND table_name = 'kyc_documents') THEN
        -- Create the table
        CREATE TABLE "rider"."kyc_documents" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "riderId" UUID NOT NULL,
            "documentType" VARCHAR(50) NOT NULL,
            "documentTypeDisplay" VARCHAR(100),
            "documentNumber" VARCHAR(100),
            "documentImageUrl" TEXT,
            "verificationStatus" VARCHAR(20) NOT NULL DEFAULT 'pending',
            "verificationDate" TIMESTAMP,
            "verificationNotes" TEXT,
            "verifiedBy" VARCHAR(100),
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
        );

        -- Add the foreign key constraint if Rider table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rider' AND table_name = 'Rider') THEN
            ALTER TABLE "rider"."kyc_documents"
            ADD CONSTRAINT "kyc_documents_riderId_fkey"
            FOREIGN KEY ("riderId")
            REFERENCES "rider"."Rider"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
        END IF;

        RAISE NOTICE 'KYC Documents table created successfully';
    ELSE
        RAISE NOTICE 'KYC Documents table already exists';
    END IF;
END
$$;-- Create indexes for better performance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rider' AND table_name = 'kyc_documents') THEN
        -- Check if indexes already exist before creating them
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'rider' AND tablename = 'kyc_documents' AND indexname = 'kyc_documents_riderId_idx') THEN
            CREATE INDEX "kyc_documents_riderId_idx" ON "rider"."kyc_documents"("riderId");
            RAISE NOTICE 'Created index kyc_documents_riderId_idx';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'rider' AND tablename = 'kyc_documents' AND indexname = 'kyc_documents_documentType_idx') THEN
            CREATE INDEX "kyc_documents_documentType_idx" ON "rider"."kyc_documents"("documentType");
            RAISE NOTICE 'Created index kyc_documents_documentType_idx';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'rider' AND tablename = 'kyc_documents' AND indexname = 'kyc_documents_verificationStatus_idx') THEN
            CREATE INDEX "kyc_documents_verificationStatus_idx" ON "rider"."kyc_documents"("verificationStatus");
            RAISE NOTICE 'Created index kyc_documents_verificationStatus_idx';
        END IF;

        -- Add comment for documentation
        COMMENT ON TABLE "rider"."kyc_documents" IS 'Stores KYC document information and verification status';
        RAISE NOTICE 'Added table comment';
    END IF;
END
$$;
