import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../index";
import { AppError } from "../utils/errorHandler";
import { Logger } from "../utils";

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

interface UploadDocumentParams {
  vehicleId: string;
  file: Express.Multer.File;
  documentType: string;
  description?: string;
  uploadedBy: string;
}

interface UploadMultipleParams {
  vehicleId: string;
  files: Express.Multer.File[];
  documentMappings: Record<string, string>; // filename -> documentType
  uploadedBy: string;
}

export class DocumentService {
  // Upload single document to S3 and store URL in database
  static async uploadVehicleDocument(params: UploadDocumentParams) {
    const { vehicleId, file, documentType, description, uploadedBy } = params;

    Logger.info("Starting document upload", {
      vehicleId,
      documentType,
      fileName: file.originalname,
    });

    // Validate vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { rcDetails: true, insuranceDetails: true },
    });

    if (!vehicle) {
      throw new AppError("Vehicle not found", 404);
    }

    try {
      // Generate unique filename
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `${vehicleId}/${documentType}/${uuidv4()}.${fileExtension}`;
      const bucketName = process.env.AWS_S3_BUCKET;

      if (!bucketName) {
        throw new AppError("AWS S3 bucket not configured", 500);
      }

      // Upload to S3
      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          vehicleId,
          documentType,
          originalName: file.originalname,
          uploadedBy,
        },
      };

      const uploadResult = await s3.upload(uploadParams).promise();
      const fileUrl = uploadResult.Location;

      Logger.info("File uploaded to S3", { fileUrl, fileName });

      // Store in database based on document type
      let result;

      switch (documentType.toLowerCase()) {
        case "rc":
        case "registration":
          result = await this.updateRCDocument(vehicleId, fileUrl, uploadedBy);
          break;

        case "insurance":
        case "policy":
          result = await this.updateInsuranceDocument(
            vehicleId,
            fileUrl,
            uploadedBy
          );
          break;

        case "vehicle_photo":
        case "vehicle":
        case "photo":
          result = await this.addVehicleMedia(
            vehicleId,
            file,
            fileUrl,
            fileName,
            uploadedBy,
            description
          );
          break;

        default:
          // For any other document type, store in VehicleMedia
          result = await this.addVehicleMedia(
            vehicleId,
            file,
            fileUrl,
            fileName,
            uploadedBy,
            description,
            documentType
          );
          break;
      }

      Logger.info("Document stored in database", {
        vehicleId,
        documentType,
        result,
      });

      return {
        id: result.id,
        vehicleId,
        documentType,
        fileName: file.originalname,
        fileUrl,
        uploadDate: new Date(),
        verificationStatus: "Pending",
      };
    } catch (error: any) {
      Logger.error("Document upload failed", error);
      throw new AppError(
        `Document upload failed: ${error.message || "Unknown error"}`,
        500
      );
    }
  }

  // Upload multiple documents
  static async uploadMultipleDocuments(params: UploadMultipleParams) {
    const { vehicleId, files, documentMappings, uploadedBy } = params;

    Logger.info("Starting multiple document upload", {
      vehicleId,
      fileCount: files.length,
      documentTypes: Object.values(documentMappings),
    });

    const results = [];

    for (const file of files) {
      const documentType = documentMappings[file.originalname];
      if (!documentType) {
        Logger.warn("No document type mapping found for file", {
          fileName: file.originalname,
        });
        continue;
      }

      try {
        const result = await this.uploadVehicleDocument({
          vehicleId,
          file,
          documentType,
          uploadedBy,
        });
        results.push(result);
      } catch (error: any) {
        Logger.error("Failed to upload file", {
          fileName: file.originalname,
          error,
        });
        // Continue with other files instead of failing completely
        results.push({
          fileName: file.originalname,
          error: error.message || "Unknown error",
          success: false,
        });
      }
    }

    return results;
  }

  // Get vehicle documents
  static async getVehicleDocuments(vehicleId: string, documentType?: string) {
    Logger.info("Getting vehicle documents", { vehicleId, documentType });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        rcDetails: true,
        insuranceDetails: true,
        mediaFiles: {
          where: documentType ? { mediaType: documentType } : {},
          orderBy: { uploadDate: "desc" },
        },
      },
    });

    if (!vehicle) {
      throw new AppError("Vehicle not found", 404);
    }

    const documents = {
      rc: vehicle.rcDetails
        ? {
            id: vehicle.rcDetails.id,
            rcNumber: vehicle.rcDetails.rcNumber,
            photoUrl: vehicle.rcDetails.rcPhotoUrl,
            uploadDate: vehicle.rcDetails.rcUploadDate,
            verificationStatus: vehicle.rcDetails.rcVerificationStatus,
          }
        : null,

      insurance: vehicle.insuranceDetails.map((insurance) => ({
        id: insurance.id,
        policyNumber: insurance.policyNumber,
        providerName: insurance.providerName,
        photoUrl: insurance.policyPhotoUrl,
        uploadDate: insurance.policyUploadDate,
        verificationStatus: insurance.verificationStatus,
        isActive: insurance.isActive,
      })),

      photos: vehicle.mediaFiles.map((media) => ({
        id: media.id,
        fileName: media.fileName,
        fileUrl: media.fileUrl,
        mediaType: media.mediaType,
        description: media.description,
        uploadDate: media.uploadDate,
        fileSize: media.fileSize,
      })),
    };

    return documents;
  }

  // Delete document
  static async deleteVehicleDocument(documentId: string) {
    Logger.info("Deleting vehicle document", { documentId });

    // Try to find in VehicleMedia first
    const mediaFile = await prisma.vehicleMedia.findUnique({
      where: { id: documentId },
    });

    if (mediaFile) {
      // Delete from S3
      if (mediaFile.s3Key) {
        try {
          await s3
            .deleteObject({
              Bucket: process.env.AWS_S3_BUCKET!,
              Key: mediaFile.s3Key,
            })
            .promise();
        } catch (error) {
          Logger.warn("Failed to delete file from S3", {
            s3Key: mediaFile.s3Key,
            error,
          });
        }
      }

      // Delete from database
      await prisma.vehicleMedia.delete({
        where: { id: documentId },
      });

      return { success: true };
    }

    throw new AppError("Document not found", 404);
  }

  // Update document verification status
  static async updateDocumentVerification(
    documentId: string,
    verificationStatus: string,
    notes?: string,
    verifiedBy?: string
  ) {
    Logger.info("Updating document verification", {
      documentId,
      verificationStatus,
    });

    // Try VehicleMedia first
    const mediaFile = await prisma.vehicleMedia.findUnique({
      where: { id: documentId },
    });

    if (mediaFile) {
      // For vehicle media, we don't have verification status field
      // So we'll add a note or tag instead
      const updatedMedia = await prisma.vehicleMedia.update({
        where: { id: documentId },
        data: {
          description: notes
            ? `${mediaFile.description || ""}\nVerification: ${verificationStatus} - ${notes}`
            : mediaFile.description,
        },
      });
      return updatedMedia;
    }

    // Try RC Details
    const rcDetails = await prisma.rCDetails.findUnique({
      where: { id: documentId },
    });

    if (rcDetails) {
      const updatedRC = await prisma.rCDetails.update({
        where: { id: documentId },
        data: {
          rcVerificationStatus: verificationStatus,
        },
      });
      return updatedRC;
    }

    // Try Insurance Details
    const insuranceDetails = await prisma.insuranceDetails.findUnique({
      where: { id: documentId },
    });

    if (insuranceDetails) {
      const updatedInsurance = await prisma.insuranceDetails.update({
        where: { id: documentId },
        data: {
          verificationStatus: verificationStatus,
        },
      });
      return updatedInsurance;
    }

    throw new AppError("Document not found", 404);
  }

  // Helper method to update RC document
  private static async updateRCDocument(
    vehicleId: string,
    fileUrl: string,
    uploadedBy: string
  ) {
    const rcDetails = await prisma.rCDetails.findUnique({
      where: { vehicleId },
    });

    if (!rcDetails) {
      throw new AppError("RC details not found for this vehicle", 404);
    }

    return await prisma.rCDetails.update({
      where: { vehicleId },
      data: {
        rcPhotoUrl: fileUrl,
        rcUploadDate: new Date(),
        rcVerificationStatus: "Pending",
      },
    });
  }

  // Helper method to update insurance document
  private static async updateInsuranceDocument(
    vehicleId: string,
    fileUrl: string,
    uploadedBy: string
  ) {
    // Get the most recent active insurance record
    const insurance = await prisma.insuranceDetails.findFirst({
      where: {
        vehicleId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!insurance) {
      throw new AppError(
        "Active insurance details not found for this vehicle",
        404
      );
    }

    return await prisma.insuranceDetails.update({
      where: { id: insurance.id },
      data: {
        policyPhotoUrl: fileUrl,
        policyUploadDate: new Date(),
        verificationStatus: "Pending",
      },
    });
  }

  // Helper method to add vehicle media
  private static async addVehicleMedia(
    vehicleId: string,
    file: Express.Multer.File,
    fileUrl: string,
    s3Key: string,
    uploadedBy: string,
    description?: string,
    mediaType: string = "Vehicle Photo"
  ) {
    return await prisma.vehicleMedia.create({
      data: {
        vehicleId,
        fileName: file.originalname,
        fileUrl,
        s3Key,
        fileType: file.mimetype,
        fileSize: file.size,
        mediaType,
        mediaCategory: file.mimetype.startsWith("image/")
          ? "Photo"
          : "Document",
        description,
        uploadedBy,
        source: "web_admin",
      },
    });
  }
}
