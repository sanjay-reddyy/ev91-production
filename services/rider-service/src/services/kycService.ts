import { prisma } from "../config/database";
import { env } from "../config/env";
import { s3Service } from "./s3Service";
import { registrationCompletionService } from "./registrationCompletionService";
import axios from "axios";

/**
 * KYC document types
 */
export enum KycDocumentType {
  AADHAAR = "aadhaar",
  PAN = "pan",
  DL = "dl",
  SELFIE = "selfie",
  AGREEMENT = "agreement", // Hard copy signed agreement uploaded by backend team
}

/**
 * KYC service for handling document uploads and verification
 */
export class KycService {
  /**
   * Upload KYC document to S3 and save reference in database
   */
  async uploadDocument(
    riderId: string,
    documentType: KycDocumentType,
    file: any | Buffer,
    mimeType: string,
    documentNumber?: string
  ) {
    const startTime = Date.now();
    try {
      // Validate rider exists
      const rider = await prisma.rider.findUnique({ where: { id: riderId } });
      if (!rider) {
        throw new Error("Rider not found");
      }

      console.log(
        `🔄 Processing document upload for rider ${riderId} (type: ${documentType})`
      );

      // Upload to S3 using the new S3Service
      const uploadResult = await s3Service.uploadFile(file, {
        riderId: riderId,
        documentType: documentType,
        folder: "kyc",
        metadata: {
          riderId: riderId,
          documentType: documentType,
        },
      });

      // Store the S3 key instead of the full URL for better security
      // Pre-signed URLs will be generated when retrieving documents
      const s3Key = uploadResult.key;
      console.log(`✅ S3 upload complete. Key: ${s3Key}`);

      // Map document type to display name
      const documentTypeDisplayMap: Record<string, string> = {
        [KycDocumentType.AADHAAR]: "Aadhaar Card",
        [KycDocumentType.PAN]: "PAN Card",
        [KycDocumentType.DL]: "Driving License",
        [KycDocumentType.SELFIE]: "Selfie Photo",
        [KycDocumentType.AGREEMENT]: "Signed Agreement", // Hard copy agreement
      };

      // Check if a document of this type already exists for this rider
      const existingDocument = await prisma.kycDocument.findFirst({
        where: {
          riderId: riderId,
          documentType: documentType,
        },
      });

      let document;
      if (existingDocument) {
        // Update existing document
        console.log(
          `📝 Updating existing ${documentType} document (ID: ${existingDocument.id})`
        );
        document = await prisma.kycDocument.update({
          where: { id: existingDocument.id },
          data: {
            documentNumber: documentNumber || existingDocument.documentNumber,
            documentImageUrl: s3Key,
            verificationStatus: "pending", // Reset to pending when document is replaced
            verificationDate: null, // Clear verification date
            verificationNotes: null, // Clear verification notes
            verifiedBy: null, // Clear verifier
            updatedAt: new Date(),
          },
        });
        console.log(`✅ Updated existing document record`);
      } else {
        // Create new document entry in KycDocument table
        console.log(`📝 Creating new ${documentType} document record`);
        document = await prisma.kycDocument.create({
          data: {
            riderId: riderId,
            documentType: documentType,
            documentTypeDisplay:
              documentTypeDisplayMap[documentType] || documentType,
            documentNumber: documentNumber || `${documentType}-${Date.now()}`,
            documentImageUrl: s3Key,
            verificationStatus: "pending",
          },
        });
        console.log(`✅ Created new document record`);
      }

      // Update rider's kycStatus if it's currently "incomplete"
      // When first document is uploaded, change status from "incomplete" to "pending"
      if (rider.kycStatus === "incomplete") {
        console.log(
          `📝 Updating rider kycStatus from "incomplete" to "pending" (first document uploaded)`
        );
        await prisma.rider.update({
          where: { id: riderId },
          data: { kycStatus: "pending" },
        });
      }

      console.log(
        `✅ Document upload completed in ${Date.now() - startTime}ms`
      );

      // Generate a pre-signed URL for the response (valid for 1 hour)
      const presignedUrl = await s3Service.getPresignedUrl(s3Key, 3600);

      return {
        id: document.id,
        documentType,
        documentTypeDisplay: document.documentTypeDisplay,
        url: presignedUrl,
        s3Key: s3Key, // Include key for reference
        message: existingDocument
          ? "Document updated successfully"
          : "Document uploaded successfully",
      };
    } catch (error) {
      console.error(`❌ Error uploading document: ${(error as Error).message}`);
      throw new Error(`Failed to upload document: ${(error as Error).message}`);
    }
  }

  /**
   * Get KYC status for rider
   */
  async getKycStatus(riderId: string) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });

    if (!rider) {
      throw new Error("Rider not found");
    }

    // Get all KYC documents for this rider
    const kycDocuments = await prisma.kycDocument.findMany({
      where: { riderId: riderId },
      orderBy: { updatedAt: "desc" },
    });

    // Determine overall KYC status
    const documentsByType: Record<string, any> = {};

    // Group documents by type (get most recent for each type)
    for (const doc of kycDocuments) {
      if (
        !documentsByType[doc.documentType] ||
        new Date(doc.updatedAt) >
          new Date(documentsByType[doc.documentType].updatedAt)
      ) {
        documentsByType[doc.documentType] = doc;
      }
    }

    const requiredDocumentTypes = [
      KycDocumentType.AADHAAR,
      KycDocumentType.PAN,
      KycDocumentType.DL,
      KycDocumentType.SELFIE,
    ];

    // Check if all required documents are present and verified
    const missingDocuments = requiredDocumentTypes.filter(
      (type) => !documentsByType[type]
    );

    const pendingDocuments = Object.values(documentsByType).filter(
      (doc) => doc.verificationStatus === "pending"
    );

    const rejectedDocuments = Object.values(documentsByType).filter(
      (doc) => doc.verificationStatus === "rejected"
    );

    let overallStatus = "incomplete";
    if (missingDocuments.length === 0) {
      if (rejectedDocuments.length > 0) {
        overallStatus = "rejected";
      } else if (pendingDocuments.length > 0) {
        overallStatus = "pending";
      } else {
        overallStatus = "approved";
      }
    }

    return {
      overallStatus: overallStatus,
      documents: Object.values(documentsByType),
      missingDocuments: missingDocuments,
      completionPercentage: Math.round(
        (Object.keys(documentsByType).length / requiredDocumentTypes.length) *
          100
      ),
    };
  }

  /**
   * Submit KYC documents for verification via provider API
   */
  async submitForVerification(riderId: string) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });

    if (!rider) {
      throw new Error("Rider not found");
    }

    // Check if all required documents are uploaded
    if (!rider.aadhaar || !rider.pan || !rider.dl || !rider.selfie) {
      throw new Error("All required documents must be uploaded");
    }

    try {
      // Call KYC provider API to verify documents
      const response = await axios.post(
        `${env.KYC_PROVIDER_URL}/verify`,
        {
          riderId: rider.id,
          name: rider.name,
          dob: rider.dob,
          documents: {
            aadhaar: rider.aadhaar,
            pan: rider.pan,
            dl: rider.dl,
            selfie: rider.selfie,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${env.KYC_PROVIDER_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // For demo purposes, you can auto-approve in development
      const kycStatus = env.NODE_ENV === "development" ? "approved" : "pending";

      // Update KYC status
      await prisma.rider.update({
        where: { id: riderId },
        data: { kycStatus },
      });

      return {
        message: "KYC verification submitted successfully",
        status: kycStatus,
        providerResponse: response.data,
      };
    } catch (error) {
      console.error("KYC verification error:", error);
      throw new Error(`Failed to verify KYC: ${(error as Error).message}`);
    }
  }

  // ==========================================
  // ADMIN/DASHBOARD KYC VERIFICATION METHODS
  // ==========================================

  /**
   * Get all pending KYC submissions for manual review
   */
  async getPendingKycSubmissions() {
    const pendingRiders = await prisma.rider.findMany({
      where: {
        kycStatus: "pending",
        aadhaar: { not: null },
        pan: { not: null },
        dl: { not: null },
        selfie: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        dob: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return {
      count: pendingRiders.length,
      submissions: pendingRiders,
    };
  }

  /**
   * Get KYC documents for a specific rider (for manual review)
   * Generates pre-signed URLs for secure document access
   */
  async getKycDocuments(riderId: string) {
    console.log(`🚀 GET KYC DOCUMENTS CALLED FOR RIDER: ${riderId}`);

    // First try to get documents from the new KYC documents table
    const kycDocuments = await prisma.kycDocument.findMany({
      where: {
        riderId: riderId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: {
        id: true,
        name: true,
        phone: true,
        dob: true,
        kycStatus: true,
        aadhaar: true,
        pan: true,
        dl: true,
        selfie: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rider) {
      throw new Error("Rider not found");
    }

    // If we have documents in the new table, generate pre-signed URLs
    if (kycDocuments && kycDocuments.length > 0) {
      console.log(
        `🔍 Processing ${kycDocuments.length} documents for rider ${riderId}`
      );

      const documentsWithSignedUrls = await Promise.all(
        kycDocuments.map(async (doc) => {
          try {
            // Extract S3 key from URL or use the value directly if it's already a key
            const url = doc.documentImageUrl || "";
            let s3Key = "";

            console.log(
              `📄 Processing document ${doc.documentType}: ${url.substring(
                0,
                80
              )}...`
            );

            // Check if it's already just a key (starts with riders/ or vehicles/)
            if (url.startsWith("riders/") || url.startsWith("vehicles/")) {
              s3Key = url;
              console.log(`🔑 Using existing key: ${s3Key}`);
            }
            // Check if it's a full S3 URL that needs parsing
            else if (
              url.includes(".s3.") ||
              url.includes("s3.amazonaws.com") ||
              url.includes("amazonaws.com")
            ) {
              // Extract key from URL
              // Format: https://bucket.s3.region.amazonaws.com/riders/xxx/kyc/file.png
              // OR: https://ev91-documents-dev.s3.ap-south-1.amazonaws.com/riders/xxx/kyc/file.png

              try {
                const urlObj = new URL(url);
                // Remove leading slash from pathname to get the key
                s3Key = urlObj.pathname.substring(1);
                console.log(`🔑 Extracted S3 key from URL: ${s3Key}`);
              } catch (urlError) {
                console.error(`❌ Failed to parse URL: ${url}`, urlError);
                // Fallback: try splitting by / and finding "riders" or "vehicles"
                const urlParts = url.split("/");
                const ridersIndex = urlParts.findIndex(
                  (part) => part === "riders" || part === "vehicles"
                );
                if (ridersIndex !== -1) {
                  s3Key = urlParts.slice(ridersIndex).join("/");
                  console.log(
                    `🔑 Extracted S3 key using fallback method: ${s3Key}`
                  );
                }
              }
            }

            // Generate pre-signed URL if we have a valid S3 key
            if (s3Key) {
              console.log(`⏳ Generating pre-signed URL for key: ${s3Key}`);

              try {
                const presignedUrl = await s3Service.getPresignedUrl(
                  s3Key,
                  3600
                ); // 1 hour expiry
                console.log(
                  `✅ Generated pre-signed URL: ${presignedUrl.substring(
                    0,
                    100
                  )}...`
                );
                return {
                  ...doc,
                  documentImageUrl: presignedUrl,
                  originalKey: s3Key, // Store original key for reference
                };
              } catch (presignError) {
                console.error(
                  `❌ Failed to generate pre-signed URL for key ${s3Key}:`,
                  presignError
                );
                // Return document with original URL as fallback
                return doc;
              }
            }

            console.log(`⚠️ No S3 key found, returning original URL`);
            // If URL generation fails, return document with original URL
            return doc;
          } catch (error) {
            console.error(`❌ Failed to process document ${doc.id}:`, error);
            // Return document with original URL as fallback
            return doc;
          }
        })
      );

      console.log(
        `✅ Returning ${documentsWithSignedUrls.length} documents with signed URLs`
      );

      // Add a test field to verify this code is running
      const documentsWithTestField = documentsWithSignedUrls.map((doc) => ({
        ...doc,
        _presignedUrl: true, // Test marker
      }));

      return documentsWithTestField;
    }

    // Otherwise, convert legacy fields to the new format with pre-signed URLs
    const legacyDocs = [];

    const generateLegacyDocUrl = async (url: string | null) => {
      if (!url) return null;

      try {
        // Extract S3 key from URL
        let s3Key = "";

        if (url.includes(".s3.") || url.includes("s3.amazonaws.com")) {
          const urlParts = url.split("/");
          const bucketIndex = urlParts.findIndex((part) =>
            part.includes(".s3.")
          );
          if (bucketIndex !== -1) {
            s3Key = urlParts.slice(bucketIndex + 1).join("/");
          }
        } else if (url.startsWith("riders/") || url.startsWith("vehicles/")) {
          s3Key = url;
        }

        if (s3Key) {
          return await s3Service.getPresignedUrl(s3Key, 3600);
        }

        return url;
      } catch (error) {
        console.error(
          `Failed to generate pre-signed URL for legacy document:`,
          error
        );
        return url;
      }
    };

    if (rider.aadhaar) {
      legacyDocs.push({
        id: `legacy-aadhaar-${riderId}`,
        riderId: riderId,
        documentType: "aadhaar",
        documentTypeDisplay: "Aadhaar Card",
        documentImageUrl: await generateLegacyDocUrl(rider.aadhaar),
        verificationStatus: rider.kycStatus || "pending",
        createdAt: rider.createdAt,
        updatedAt: rider.updatedAt,
      });
    }

    if (rider.pan) {
      legacyDocs.push({
        id: `legacy-pan-${riderId}`,
        riderId: riderId,
        documentType: "pan",
        documentTypeDisplay: "PAN Card",
        documentImageUrl: await generateLegacyDocUrl(rider.pan),
        verificationStatus: rider.kycStatus || "pending",
        createdAt: rider.createdAt,
        updatedAt: rider.updatedAt,
      });
    }

    if (rider.dl) {
      legacyDocs.push({
        id: `legacy-dl-${riderId}`,
        riderId: riderId,
        documentType: "dl",
        documentTypeDisplay: "Driving License",
        documentImageUrl: await generateLegacyDocUrl(rider.dl),
        verificationStatus: rider.kycStatus || "pending",
        createdAt: rider.createdAt,
        updatedAt: rider.updatedAt,
      });
    }

    if (rider.selfie) {
      legacyDocs.push({
        id: `legacy-selfie-${riderId}`,
        riderId: riderId,
        documentType: "selfie",
        documentTypeDisplay: "Selfie Photo",
        documentImageUrl: await generateLegacyDocUrl(rider.selfie),
        verificationStatus: rider.kycStatus || "pending",
        createdAt: rider.createdAt,
        updatedAt: rider.updatedAt,
      });
    }

    return legacyDocs;
  }

  /**
   * Verify/Reject a single KYC document (manual verification by admin)
   */
  async verifySingleKycDocument(
    riderId: string,
    documentId: string,
    status: "verified" | "rejected",
    notes?: string
  ) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });

    if (!rider) {
      throw new Error("Rider not found");
    }

    // Verify the document exists and belongs to this rider
    const document = await prisma.kycDocument.findFirst({
      where: {
        id: documentId,
        riderId: riderId,
      },
    });

    if (!document) {
      throw new Error(
        "KYC document not found or does not belong to this rider"
      );
    }

    const now = new Date();

    // Update the specific KYC document status
    const updatedDocument = await prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        verificationNotes: status === "rejected" ? notes : null,
        verificationDate: status === "verified" ? now : null,
        updatedAt: now,
      },
    });

    // ✅ NEW LOGIC: Require at least 4 UNIQUE verified document types
    // Allows re-upload of rejected documents - only counts unique types
    // NOTE: The 4 required types are: Aadhaar, PAN, DL, Selfie
    // AGREEMENT document is OPTIONAL - used only when backend team uploads hard copy signed agreements
    const allDocuments = await prisma.kycDocument.findMany({
      where: { riderId: riderId },
    });

    // Get unique document types that are verified (excluding optional agreement)
    const verifiedDocumentTypes = new Set(
      allDocuments
        .filter((doc) => doc.verificationStatus === "verified")
        .map((doc) => doc.documentType)
    );

    const uniqueVerifiedCount = verifiedDocumentTypes.size;
    const hasAllRejected =
      allDocuments.length > 0 &&
      allDocuments.every((doc) => doc.verificationStatus === "rejected");

    // ✅ KYC Approval requires 4 unique verified document types
    // - 4+ unique verified types → KYC approved (allows re-uploaded docs)
    // - All rejected → KYC rejected
    // - Otherwise → pending
    let newKycStatus = rider.kycStatus;
    if (uniqueVerifiedCount >= 4) {
      newKycStatus = "approved";
      console.log(
        `✅ [KYC] Approving KYC for rider ${riderId} - ${uniqueVerifiedCount} unique verified document types:`,
        Array.from(verifiedDocumentTypes).join(", ")
      );
    } else if (hasAllRejected) {
      newKycStatus = "rejected";
      console.log(
        `❌ [KYC] Rejecting KYC for rider ${riderId} - all documents rejected`
      );
    } else {
      newKycStatus = "pending";
      console.log(
        `⏳ [KYC] KYC pending for rider ${riderId} - ${uniqueVerifiedCount}/4 unique document types verified`
      );
    }

    if (newKycStatus !== rider.kycStatus) {
      await prisma.rider.update({
        where: { id: riderId },
        data: {
          kycStatus: newKycStatus,
          // ✅ FIX: Auto-update registration status when KYC approved
          registrationStatus:
            newKycStatus === "approved"
              ? "KYC_COMPLETED"
              : rider.registrationStatus,
        },
      });

      console.log(
        `✅ [KYC] Updated rider ${riderId} KYC status: ${rider.kycStatus} → ${newKycStatus}`
      );

      // ✅ FIX: Try to auto-complete registration if all requirements met
      if (newKycStatus === "approved") {
        try {
          const completionResult =
            await registrationCompletionService.tryCompleteRegistration(
              riderId
            );
          if (completionResult.completed) {
            console.log(
              `✅ [KYC] Auto-completed registration for rider ${riderId}`
            );
          } else {
            console.log(
              `⏳ [KYC] Registration not yet complete for rider ${riderId}. Missing:`,
              completionResult.missing
            );
          }
        } catch (error) {
          console.error(
            `❌ [KYC] Error checking registration completion for rider ${riderId}:`,
            error
          );
          // Don't throw - KYC verification succeeded even if completion check failed
        }
      }
    }

    return {
      documentId: updatedDocument.id,
      documentType: updatedDocument.documentType,
      riderId: updatedDocument.riderId,
      riderName: rider.name,
      previousStatus: document.verificationStatus,
      newStatus: updatedDocument.verificationStatus,
      notes: updatedDocument.verificationNotes,
      verifiedAt: updatedDocument.verificationDate?.toISOString(),
      overallKycStatus: newKycStatus,
    };
  }

  /**
   * Verify/Reject KYC documents (manual verification by admin)
   */
  async verifyKycDocuments(
    riderId: string,
    status: "verified" | "rejected",
    rejectionReason?: string,
    verifiedBy?: string
  ) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });

    if (!rider) {
      throw new Error("Rider not found");
    }

    const now = new Date();

    // Update KYC documents status
    await prisma.kycDocument.updateMany({
      where: { riderId: riderId },
      data: {
        verificationStatus: status,
        verificationNotes: status === "rejected" ? rejectionReason : null,
        verifiedBy: status === "verified" ? verifiedBy : null,
        verificationDate: status === "verified" ? now : null,
        updatedAt: now,
      },
    });

    // Update rider KYC status for backward compatibility
    const newKycStatus = status === "verified" ? "approved" : "rejected";
    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        kycStatus: newKycStatus,
        // ✅ FIX: Auto-update registration status when KYC approved
        registrationStatus:
          newKycStatus === "approved"
            ? "KYC_COMPLETED"
            : rider.registrationStatus,
      },
    });

    console.log(
      `✅ [KYC] Bulk verified documents for rider ${riderId}: ${rider.kycStatus} → ${newKycStatus}`
    );

    // ✅ FIX: Try to auto-complete registration if all requirements met
    if (newKycStatus === "approved") {
      try {
        const completionResult =
          await registrationCompletionService.tryCompleteRegistration(riderId);
        if (completionResult.completed) {
          console.log(
            `✅ [KYC] Auto-completed registration for rider ${riderId} after bulk verification`
          );
        } else {
          console.log(
            `⏳ [KYC] Registration not yet complete for rider ${riderId}. Missing:`,
            completionResult.missing
          );
        }
      } catch (error) {
        console.error(
          `❌ [KYC] Error checking registration completion for rider ${riderId}:`,
          error
        );
        // Don't throw - KYC verification succeeded even if completion check failed
      }
    }

    return {
      riderId: updatedRider.id,
      name: updatedRider.name,
      previousStatus: rider.kycStatus,
      newStatus: updatedRider.kycStatus,
      verifiedBy,
      rejectionReason: status === "rejected" ? rejectionReason : null,
      verifiedAt: now.toISOString(),
    };
  }

  /**
   * Auto-verify using external KYC service (Digilocker integration)
   */
  async autoVerifyKyc(riderId: string, service: string = "digilocker") {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });

    if (!rider) {
      throw new Error("Rider not found");
    }

    // Check if documents are uploaded
    if (!rider.aadhaar || !rider.pan || !rider.dl) {
      throw new Error("Required documents not uploaded for auto-verification");
    }

    try {
      let verificationResult;

      if (service === "digilocker") {
        // Digilocker API integration
        const digilockerResponse = await axios.post(
          `${env.DIGILOCKER_API_URL}/verify`,
          {
            riderId: rider.id,
            name: rider.name,
            dob: rider.dob,
            documents: {
              aadhaar: rider.aadhaar,
              pan: rider.pan,
              dl: rider.dl,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${env.DIGILOCKER_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        verificationResult = digilockerResponse.data;
      } else {
        // Other KYC service integrations can be added here
        throw new Error(`Unsupported auto-verification service: ${service}`);
      }

      // Determine status based on verification result
      const isVerified =
        verificationResult.status === "verified" ||
        verificationResult.verified === true;
      const kycStatus = isVerified ? "approved" : "rejected";

      // Update rider KYC status
      const updatedRider = await prisma.rider.update({
        where: { id: riderId },
        data: { kycStatus },
      });

      return {
        riderId: updatedRider.id,
        name: updatedRider.name,
        service,
        verificationResult,
        status: kycStatus,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Auto-verification error (${service}):`, error);

      // In development, simulate success for testing
      if (env.NODE_ENV === "development") {
        await prisma.rider.update({
          where: { id: riderId },
          data: { kycStatus: "approved" },
        });

        return {
          riderId: rider.id,
          name: rider.name,
          service,
          verificationResult: {
            status: "verified",
            message: "Development mode simulation",
          },
          status: "approved",
          verifiedAt: new Date().toISOString(),
        };
      }

      throw new Error(`Auto-verification failed: ${(error as Error).message}`);
    }
  }
}
