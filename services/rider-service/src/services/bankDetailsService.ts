import { prisma } from "../config/database";
import { s3Service } from "./s3Service";

export interface BankDetailsInput {
  accountHolderName: string;
  accountNumber: string;
  accountType: "SAVINGS" | "CURRENT";
  ifscCode: string;
  bankName: string;
  branchName?: string;
  branchAddress?: string;
  isPrimary?: boolean;
  notes?: string;
  addedBy?: string;
}

export interface BankDetailsUpdate extends Partial<BankDetailsInput> {
  verificationStatus?: "pending" | "verified" | "rejected";
  verificationNotes?: string;
  verifiedBy?: string;
  isActive?: boolean;
  lastEditedBy?: string;
}

export enum BankProofDocumentType {
  PASSBOOK = "PASSBOOK",
  CANCELLED_CHEQUE = "CANCELLED_CHEQUE",
  BANK_STATEMENT = "BANK_STATEMENT",
}

/**
 * Service for managing rider bank account details
 */
export class BankDetailsService {
  /**
   * Add new bank account details for a rider
   */
  async addBankDetails(
    riderId: string,
    bankData: BankDetailsInput,
    proofFile?: Express.Multer.File,
    proofType?: BankProofDocumentType
  ) {
    try {
      // Validate rider exists
      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new Error("Rider not found");
      }

      console.log(`🏦 Adding bank details for rider ${riderId}`);

      // If this is to be set as primary, unset any existing primary accounts
      if (bankData.isPrimary) {
        await prisma.riderBankDetails.updateMany({
          where: {
            riderId: riderId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
        console.log("✅ Unset existing primary account");
      }

      // Upload proof document if provided
      let proofDocumentUrl: string | undefined;
      if (proofFile && proofType) {
        console.log(`📤 Uploading bank proof document: ${proofType}`);
        const uploadResult = await s3Service.uploadFile(proofFile, {
          riderId: riderId,
          documentType: proofType.toLowerCase(),
          folder: "bank-documents",
          metadata: {
            riderId: riderId,
            documentType: proofType,
            accountNumber: bankData.accountNumber.slice(-4), // Last 4 digits only
          },
        });
        proofDocumentUrl = uploadResult.location;
        console.log(`✅ Bank proof uploaded: ${proofDocumentUrl}`);
      }

      // Create bank details record
      const bankDetails = await prisma.riderBankDetails.create({
        data: {
          riderId,
          accountHolderName: bankData.accountHolderName,
          accountNumber: bankData.accountNumber,
          accountType: bankData.accountType,
          ifscCode: bankData.ifscCode.toUpperCase(),
          bankName: bankData.bankName,
          branchName: bankData.branchName,
          branchAddress: bankData.branchAddress,
          isPrimary: bankData.isPrimary || false,
          proofDocumentType: proofType,
          proofDocumentUrl: proofDocumentUrl,
          notes: bankData.notes,
          addedBy: bankData.addedBy,
          verificationStatus: "pending",
        },
      });

      console.log(`✅ Bank details created with ID: ${bankDetails.id}`);

      return {
        success: true,
        data: bankDetails,
        message: "Bank details added successfully",
      };
    } catch (error: any) {
      console.error(`❌ Error adding bank details:`, error);
      throw new Error(`Failed to add bank details: ${error.message}`);
    }
  }

  /**
   * Update existing bank account details
   */
  async updateBankDetails(
    bankDetailsId: string,
    updateData: BankDetailsUpdate,
    proofFile?: Express.Multer.File,
    proofType?: BankProofDocumentType
  ) {
    try {
      // Verify bank details exist
      const existing = await prisma.riderBankDetails.findUnique({
        where: { id: bankDetailsId },
      });

      if (!existing) {
        throw new Error("Bank details not found");
      }

      console.log(`🔄 Updating bank details ${bankDetailsId}`);

      // If setting as primary, unset other primary accounts for this rider
      if (updateData.isPrimary) {
        await prisma.riderBankDetails.updateMany({
          where: {
            riderId: existing.riderId,
            isPrimary: true,
            id: { not: bankDetailsId },
          },
          data: {
            isPrimary: false,
          },
        });
        console.log("✅ Unset other primary accounts");
      }

      // Upload new proof document if provided
      let proofDocumentUrl = existing.proofDocumentUrl;
      if (proofFile && proofType) {
        console.log(`📤 Uploading updated bank proof document: ${proofType}`);
        const uploadResult = await s3Service.uploadFile(proofFile, {
          riderId: existing.riderId,
          documentType: proofType.toLowerCase(),
          folder: "bank-documents",
          metadata: {
            riderId: existing.riderId,
            documentType: proofType,
          },
        });
        proofDocumentUrl = uploadResult.location;

        // Delete old proof document if it exists
        if (existing.proofDocumentUrl) {
          try {
            const oldKey = existing.proofDocumentUrl.split(".com/")[1];
            if (oldKey) {
              await s3Service.deleteFile(oldKey);
              console.log(`🗑️ Deleted old proof document`);
            }
          } catch (deleteError) {
            console.warn(
              "⚠️ Could not delete old proof document:",
              deleteError
            );
          }
        }
      }

      // Update bank details
      const updated = await prisma.riderBankDetails.update({
        where: { id: bankDetailsId },
        data: {
          ...(updateData.accountHolderName && {
            accountHolderName: updateData.accountHolderName,
          }),
          ...(updateData.accountNumber && {
            accountNumber: updateData.accountNumber,
          }),
          ...(updateData.accountType && {
            accountType: updateData.accountType,
          }),
          ...(updateData.ifscCode && {
            ifscCode: updateData.ifscCode.toUpperCase(),
          }),
          ...(updateData.bankName && { bankName: updateData.bankName }),
          ...(updateData.branchName !== undefined && {
            branchName: updateData.branchName,
          }),
          ...(updateData.branchAddress !== undefined && {
            branchAddress: updateData.branchAddress,
          }),
          ...(updateData.isPrimary !== undefined && {
            isPrimary: updateData.isPrimary,
          }),
          ...(proofFile &&
            proofType && {
              proofDocumentType: proofType,
              proofDocumentUrl: proofDocumentUrl,
            }),
          ...(updateData.verificationStatus && {
            verificationStatus: updateData.verificationStatus,
            ...(updateData.verificationStatus === "verified" && {
              verificationDate: new Date(),
            }),
          }),
          ...(updateData.verificationNotes !== undefined && {
            verificationNotes: updateData.verificationNotes,
          }),
          ...(updateData.verifiedBy && { verifiedBy: updateData.verifiedBy }),
          ...(updateData.isActive !== undefined && {
            isActive: updateData.isActive,
          }),
          ...(updateData.notes !== undefined && { notes: updateData.notes }),
          ...(updateData.lastEditedBy && {
            lastEditedBy: updateData.lastEditedBy,
          }),
        },
      });

      console.log(`✅ Bank details updated successfully`);

      return {
        success: true,
        data: updated,
        message: "Bank details updated successfully",
      };
    } catch (error: any) {
      console.error(`❌ Error updating bank details:`, error);
      throw new Error(`Failed to update bank details: ${error.message}`);
    }
  }

  /**
   * Get all bank accounts for a rider
   */
  async getRiderBankDetails(riderId: string) {
    try {
      const bankDetails = await prisma.riderBankDetails.findMany({
        where: { riderId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      });

      return {
        success: true,
        data: bankDetails,
      };
    } catch (error: any) {
      console.error(`❌ Error fetching bank details:`, error);
      throw new Error(`Failed to fetch bank details: ${error.message}`);
    }
  }

  /**
   * Get a specific bank account by ID
   */
  async getBankDetailsById(bankDetailsId: string) {
    try {
      const bankDetails = await prisma.riderBankDetails.findUnique({
        where: { id: bankDetailsId },
        include: {
          rider: {
            select: {
              id: true,
              name: true,
              phone: true,
              publicRiderId: true,
            },
          },
        },
      });

      if (!bankDetails) {
        throw new Error("Bank details not found");
      }

      return {
        success: true,
        data: bankDetails,
      };
    } catch (error: any) {
      console.error(`❌ Error fetching bank details:`, error);
      throw new Error(`Failed to fetch bank details: ${error.message}`);
    }
  }

  /**
   * Delete (soft delete - set inactive) bank account details
   */
  async deleteBankDetails(bankDetailsId: string, deletedBy?: string) {
    try {
      const bankDetails = await prisma.riderBankDetails.findUnique({
        where: { id: bankDetailsId },
      });

      if (!bankDetails) {
        throw new Error("Bank details not found");
      }

      // Soft delete - set as inactive
      const updated = await prisma.riderBankDetails.update({
        where: { id: bankDetailsId },
        data: {
          isActive: false,
          isPrimary: false, // Can't be primary if inactive
          lastEditedBy: deletedBy,
        },
      });

      console.log(`✅ Bank details marked as inactive: ${bankDetailsId}`);

      return {
        success: true,
        data: updated,
        message: "Bank details deleted successfully",
      };
    } catch (error: any) {
      console.error(`❌ Error deleting bank details:`, error);
      throw new Error(`Failed to delete bank details: ${error.message}`);
    }
  }

  /**
   * Set a bank account as primary
   */
  async setPrimaryAccount(bankDetailsId: string) {
    try {
      const bankDetails = await prisma.riderBankDetails.findUnique({
        where: { id: bankDetailsId },
      });

      if (!bankDetails) {
        throw new Error("Bank details not found");
      }

      if (!bankDetails.isActive) {
        throw new Error("Cannot set inactive account as primary");
      }

      // Unset any existing primary accounts for this rider
      await prisma.riderBankDetails.updateMany({
        where: {
          riderId: bankDetails.riderId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });

      // Set this account as primary
      const updated = await prisma.riderBankDetails.update({
        where: { id: bankDetailsId },
        data: {
          isPrimary: true,
        },
      });

      console.log(`✅ Set bank account as primary: ${bankDetailsId}`);

      return {
        success: true,
        data: updated,
        message: "Primary account updated successfully",
      };
    } catch (error: any) {
      console.error(`❌ Error setting primary account:`, error);
      throw new Error(`Failed to set primary account: ${error.message}`);
    }
  }

  /**
   * Verify bank account details
   */
  async verifyBankDetails(
    bankDetailsId: string,
    verifiedBy: string,
    verificationNotes?: string
  ) {
    try {
      const updated = await prisma.riderBankDetails.update({
        where: { id: bankDetailsId },
        data: {
          verificationStatus: "verified",
          verificationDate: new Date(),
          verifiedBy,
          verificationNotes,
        },
      });

      console.log(`✅ Bank details verified: ${bankDetailsId}`);

      return {
        success: true,
        data: updated,
        message: "Bank details verified successfully",
      };
    } catch (error: any) {
      console.error(`❌ Error verifying bank details:`, error);
      throw new Error(`Failed to verify bank details: ${error.message}`);
    }
  }

  /**
   * Reject bank account details
   */
  async rejectBankDetails(
    bankDetailsId: string,
    verifiedBy: string,
    verificationNotes: string
  ) {
    try {
      const updated = await prisma.riderBankDetails.update({
        where: { id: bankDetailsId },
        data: {
          verificationStatus: "rejected",
          verificationDate: new Date(),
          verifiedBy,
          verificationNotes,
        },
      });

      console.log(`❌ Bank details rejected: ${bankDetailsId}`);

      return {
        success: true,
        data: updated,
        message: "Bank details rejected",
      };
    } catch (error: any) {
      console.error(`❌ Error rejecting bank details:`, error);
      throw new Error(`Failed to reject bank details: ${error.message}`);
    }
  }
}

export const bankDetailsService = new BankDetailsService();
