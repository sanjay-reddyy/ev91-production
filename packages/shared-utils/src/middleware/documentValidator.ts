/**
 * Document Validation Middleware
 *
 * Validates uploaded files before processing them for S3 upload.
 * Checks file size, type, and format according to industry standards.
 */

export interface ValidationConfig {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

/**
 * Default validation configurations for different document types
 */
export const VALIDATION_CONFIGS = {
  // Identity documents (Aadhaar, PAN, DL)
  IDENTITY_DOCUMENT: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png"],
    allowedExtensions: ["jpg", "jpeg", "png"],
  },

  // PDF documents (Insurance, RC, PUC)
  PDF_DOCUMENT: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["application/pdf"],
    allowedExtensions: ["pdf"],
  },

  // Profile photos
  PROFILE_PHOTO: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png"],
    allowedExtensions: ["jpg", "jpeg", "png"],
  },

  // Vehicle photos
  VEHICLE_PHOTO: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png"],
    allowedExtensions: ["jpg", "jpeg", "png"],
  },

  // Bank documents
  BANK_DOCUMENT: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
  },
};

/**
 * Validate a file against specified criteria
 */
export class DocumentValidator {
  /**
   * Validate file size
   */
  static validateSize(
    fileSize: number,
    maxSizeBytes: number
  ): ValidationResult {
    if (fileSize > maxSizeBytes) {
      return {
        valid: false,
        errors: [
          {
            field: "file",
            message: `File size (${this.formatBytes(
              fileSize
            )}) exceeds maximum allowed size of ${this.formatBytes(
              maxSizeBytes
            )}`,
            code: "FILE_TOO_LARGE",
          },
        ],
      };
    }
    return { valid: true };
  }

  /**
   * Validate file MIME type
   */
  static validateMimeType(
    mimeType: string,
    allowedTypes: string[]
  ): ValidationResult {
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return {
        valid: false,
        errors: [
          {
            field: "file",
            message: `File type "${mimeType}" is not allowed. Allowed types: ${allowedTypes.join(
              ", "
            )}`,
            code: "INVALID_FILE_TYPE",
          },
        ],
      };
    }
    return { valid: true };
  }

  /**
   * Validate file extension
   */
  static validateExtension(
    filename: string,
    allowedExtensions: string[]
  ): ValidationResult {
    const extension = filename.split(".").pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        errors: [
          {
            field: "file",
            message: `File extension ".${extension}" is not allowed. Allowed extensions: ${allowedExtensions
              .map((e) => `.${e}`)
              .join(", ")}`,
            code: "INVALID_FILE_EXTENSION",
          },
        ],
      };
    }
    return { valid: true };
  }

  /**
   * Comprehensive file validation
   */
  static validate(
    file: {
      size: number;
      mimetype: string;
      originalname: string;
    },
    config: ValidationConfig
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate size
    if (config.maxSizeBytes) {
      const sizeValidation = this.validateSize(file.size, config.maxSizeBytes);
      if (!sizeValidation.valid && sizeValidation.errors) {
        errors.push(...sizeValidation.errors);
      }
    }

    // Validate MIME type
    if (config.allowedMimeTypes) {
      const mimeValidation = this.validateMimeType(
        file.mimetype,
        config.allowedMimeTypes
      );
      if (!mimeValidation.valid && mimeValidation.errors) {
        errors.push(...mimeValidation.errors);
      }
    }

    // Validate extension
    if (config.allowedExtensions) {
      const extValidation = this.validateExtension(
        file.originalname,
        config.allowedExtensions
      );
      if (!extValidation.valid && extValidation.errors) {
        errors.push(...extValidation.errors);
      }
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }

  /**
   * Validate multiple files
   */
  static validateMultiple(
    files: Array<{
      size: number;
      mimetype: string;
      originalname: string;
    }>,
    config: ValidationConfig
  ): ValidationResult {
    const allErrors: ValidationError[] = [];

    files.forEach((file, index) => {
      const validation = this.validate(file, config);
      if (!validation.valid && validation.errors) {
        allErrors.push(
          ...validation.errors.map((err) => ({
            ...err,
            field: `file[${index}].${err.field}`,
          }))
        );
      }
    });

    return allErrors.length > 0
      ? { valid: false, errors: allErrors }
      : { valid: true };
  }

  /**
   * Helper to format bytes into human-readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

/**
 * Express middleware for document validation
 */
export const validateDocument = (config: ValidationConfig) => {
  return (req: any, res: any, next: any) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
        code: "NO_FILE",
      });
    }

    const validation = DocumentValidator.validate(file, config);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "File validation failed",
        errors: validation.errors,
      });
    }

    next();
  };
};

/**
 * Express middleware for multiple documents validation
 */
export const validateDocuments = (config: ValidationConfig) => {
  return (req: any, res: any, next: any) => {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
        code: "NO_FILES",
      });
    }

    const validation = DocumentValidator.validateMultiple(files, config);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "File validation failed",
        errors: validation.errors,
      });
    }

    next();
  };
};
