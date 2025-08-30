import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../index";
import { s3Service } from "../services/s3Service";

const router = Router();

// Configure multer for memory storage (for S3 uploads)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = (
    process.env.ALLOWED_FILE_TYPES ||
    "image/jpeg,image/png,image/jpg,application/pdf"
  ).split(",");

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(", ")}`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB default
  },
});

// Upload single file endpoint with S3 integration
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      console.log("📤 File upload request received");
      console.log("File:", req.file?.originalname);
      console.log("Body:", req.body);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const {
        vehicleId,
        mediaType = "vehicle_photo",
        uploadedBy = "admin",
        source = "web_admin",
        description,
      } = req.body;

      // Determine S3 folder based on media type
      let s3Folder = "documents";
      if (
        mediaType.toLowerCase().includes("photo") ||
        req.file.mimetype.startsWith("image/")
      ) {
        s3Folder = "photos";
      } else if (mediaType.toLowerCase().includes("insurance")) {
        s3Folder = "insurance";
      } else if (mediaType.toLowerCase().includes("rc")) {
        s3Folder = "registration";
      }

      // Upload to S3
      const s3Result = await s3Service.uploadFile(req.file, {
        vehicleId: vehicleId || "temp",
        mediaType,
        folder: s3Folder,
        metadata: {
          uploadedBy,
          source,
          description: description || "",
        },
      });

      // Create media record in database
      const mediaRecord = await prisma.vehicleMedia.create({
        data: {
          id: uuidv4(),
          vehicleId: vehicleId || "temp",
          fileName: req.file.originalname,
          fileUrl: s3Result.location,
          // s3Key: s3Result.key, // Temporarily disabled until migration completes
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          mediaType: mediaType,
          mediaCategory: req.file.mimetype.startsWith("image/")
            ? "Photo"
            : "Document",
          description: description,
          uploadedBy: uploadedBy,
          uploadDate: new Date(),
          source: source,
          isActive: true,
          tags: null,
        },
      });

      console.log("✅ Media record created:", mediaRecord.id);
      console.log("✅ S3 upload successful:", s3Result.location);

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          id: mediaRecord.id,
          fileName: mediaRecord.fileName,
          fileType: mediaRecord.fileType,
          fileSize: mediaRecord.fileSize,
          mediaType: mediaRecord.mediaType,
          uploadDate: mediaRecord.uploadDate,
          url: mediaRecord.fileUrl,
          s3Key: s3Result.key, // Include in response even if not stored in DB yet
          viewUrl: `/api/v1/media/view/${mediaRecord.id}`,
        },
      });
    } catch (error) {
      console.error("❌ File upload error:", error);
      return res.status(500).json({
        success: false,
        message: "File upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Upload multiple files endpoint with S3 integration
router.post(
  "/upload-multiple",
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      console.log("📤 Multiple file upload request received");
      console.log("Files count:", req.files?.length);
      console.log("Body:", req.body);

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const {
        vehicleId,
        mediaType = "vehicle_photo",
        uploadedBy = "admin",
        source = "web_admin",
        description,
      } = req.body;
      const uploadedFiles = [];

      // Determine S3 folder based on media type
      let s3Folder = "documents";
      if (mediaType.toLowerCase().includes("photo")) {
        s3Folder = "photos";
      } else if (mediaType.toLowerCase().includes("insurance")) {
        s3Folder = "insurance";
      } else if (mediaType.toLowerCase().includes("rc")) {
        s3Folder = "registration";
      }

      // Upload all files to S3
      const s3Results = await s3Service.uploadMultipleFiles(req.files, {
        vehicleId: vehicleId || "temp",
        mediaType,
        folder: s3Folder,
        metadata: {
          uploadedBy,
          source,
          description: description || "",
        },
      });

      // Create media records for each file
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const s3Result = s3Results[i];

        const mediaRecord = await prisma.vehicleMedia.create({
          data: {
            id: uuidv4(),
            vehicleId: vehicleId || "temp",
            fileName: file.originalname,
            fileUrl: s3Result.location,
            s3Key: s3Result.key, // Re-enabled after successful migration
            fileType: file.mimetype,
            fileSize: file.size,
            mediaType: mediaType,
            mediaCategory: file.mimetype.startsWith("image/")
              ? "Photo"
              : "Document",
            description: description,
            uploadedBy: uploadedBy,
            uploadDate: new Date(),
            source: source,
            isActive: true,
            tags: null,
          },
        });

        uploadedFiles.push({
          id: mediaRecord.id,
          fileName: mediaRecord.fileName,
          fileType: mediaRecord.fileType,
          fileSize: mediaRecord.fileSize,
          mediaType: mediaRecord.mediaType,
          uploadDate: mediaRecord.uploadDate,
          url: mediaRecord.fileUrl,
          s3Key: s3Result.key, // Include in response even if not stored in DB yet
          viewUrl: `/api/v1/media/view/${mediaRecord.id}`,
        });
      }

      console.log(
        `✅ ${uploadedFiles.length} files uploaded to S3 and database`
      );

      return res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: uploadedFiles,
      });
    } catch (error) {
      console.error("❌ Multiple file upload error:", error);
      return res.status(500).json({
        success: false,
        message: "File upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// View file via presigned URL
router.get("/view/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mediaRecord = await prisma.vehicleMedia.findUnique({
      where: { id },
    });

    if (!mediaRecord) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    if (!mediaRecord.s3Key) {
      // Fallback to direct URL for legacy files
      return res.redirect(mediaRecord.fileUrl);
    }

    // Generate presigned URL for secure access
    const presignedUrl = await s3Service.getPresignedUrl(
      mediaRecord.s3Key,
      3600
    ); // 1 hour expiry

    // Redirect to presigned URL or return it based on query parameter
    if (req.query.redirect === "false") {
      return res.json({
        success: true,
        data: {
          url: presignedUrl,
          expiresIn: 3600,
        },
      });
    }

    return res.redirect(presignedUrl);
  } catch (error) {
    console.error("❌ File view error:", error);
    return res.status(500).json({
      success: false,
      message: "File view failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get file by ID (legacy endpoint for compatibility)
router.get("/file/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mediaRecord = await prisma.vehicleMedia.findUnique({
      where: { id },
    });

    if (!mediaRecord) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    if (!mediaRecord.s3Key) {
      // Legacy files stored locally or with direct URLs
      return res.redirect(mediaRecord.fileUrl);
    }

    // Generate presigned URL for S3 files
    const presignedUrl = await s3Service.getPresignedUrl(
      mediaRecord.s3Key,
      3600
    );
    return res.redirect(presignedUrl);
  } catch (error) {
    console.error("❌ File retrieval error:", error);
    return res.status(500).json({
      success: false,
      message: "File retrieval failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get media list for a vehicle
router.get("/vehicle/:vehicleId", async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const { mediaType } = req.query;

    const whereClause: any = {
      vehicleId,
      isActive: true,
    };

    if (mediaType) {
      whereClause.mediaType = mediaType;
    }

    const mediaRecords = await prisma.vehicleMedia.findMany({
      where: whereClause,
      orderBy: {
        uploadDate: "desc",
      },
    });

    const mediaList = await Promise.all(
      mediaRecords.map(async (record: any) => {
        let viewUrl = record.fileUrl;

        // Generate presigned URL for S3 files
        if (record.s3Key) {
          try {
            viewUrl = await s3Service.getPresignedUrl(record.s3Key, 3600);
          } catch (error) {
            console.warn(
              `Failed to generate presigned URL for ${record.id}:`,
              error
            );
          }
        }

        return {
          id: record.id,
          fileName: record.fileName,
          fileType: record.fileType,
          fileSize: record.fileSize,
          mediaType: record.mediaType,
          mediaCategory: record.mediaCategory,
          description: record.description,
          uploadDate: record.uploadDate,
          url: viewUrl,
          s3Key: record.s3Key,
          viewUrl: `/api/v1/media/view/${record.id}`,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: mediaList,
    });
  } catch (error) {
    console.error("❌ Media list retrieval error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve media list",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Delete media file
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mediaRecord = await prisma.vehicleMedia.findUnique({
      where: { id },
    });

    if (!mediaRecord) {
      return res.status(404).json({
        success: false,
        message: "Media record not found",
      });
    }

    // Soft delete - mark as inactive
    await prisma.vehicleMedia.update({
      where: { id },
      data: { isActive: false },
    });

    // Delete from S3 if it's an S3 file
    if (mediaRecord.s3Key) {
      try {
        await s3Service.deleteFile(mediaRecord.s3Key);
        console.log(`✅ File deleted from S3: ${mediaRecord.s3Key}`);
      } catch (error) {
        console.warn(`Failed to delete S3 file ${mediaRecord.s3Key}:`, error);
        // Continue with soft delete even if S3 deletion fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Media file deleted successfully",
    });
  } catch (error) {
    console.error("❌ Media deletion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete media file",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
