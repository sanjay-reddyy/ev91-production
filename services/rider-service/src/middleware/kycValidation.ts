import { Request, Response, NextFunction } from "express";
import joi from "joi";

/**
 * Validate KYC verification request
 */
export const validateKycVerificationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi.object({
    status: joi.string().valid("verified", "rejected").required(),
    rejectionReason: joi.when("status", {
      is: "rejected",
      then: joi.string().min(3).required().messages({
        "any.required": "Rejection reason is required when rejecting KYC",
        "string.min": "Rejection reason must be at least 3 characters long",
      }),
      otherwise: joi.optional(),
    }),
    verifiedBy: joi.string().min(3).max(100),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }

  next();
};

/**
 * Validate document upload request
 */
export const validateDocumentUploadRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // This validation runs after multer processes the file
  // So we need to check if the file exists in req.file

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "File is required for document upload",
    });
  }

  // Validate document type
  const { documentType } = req.params;
  const validDocTypes = ["aadhaar", "pan", "dl", "selfie"];

  if (documentType && !validDocTypes.includes(documentType.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid document type: ${documentType}. Valid types are: ${validDocTypes.join(
        ", "
      )}`,
    });
  }

  // Validate document size
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: `File size exceeds the limit of 5MB`,
    });
  }

  // Validate document type based on mimetype
  const validMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];

  if (!validMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: `Invalid file type. Allowed types: JPEG, PNG, PDF`,
    });
  }

  next();
};
