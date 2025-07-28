import { Request, Response } from 'express';
import { KycService, KycDocumentType } from '../services/kycService';
import multer from 'multer';

const kycService = new KycService();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * KYC controller handling HTTP requests for document upload and verification
 */
export class KycController {
  // Multer middleware for file upload
  uploadMiddleware = upload.single('file');
  
  /**
   * Upload KYC document
   */
  async uploadDocument(req: Request, res: Response) {
    try {
      const { riderId, documentType } = req.params;
      const file = req.file;
      
      if (!riderId || !documentType || !file) {
        return res.status(400).json({
          success: false,
          error: 'Rider ID, document type, and file are required'
        });
      }
      
      // Validate document type
      if (!Object.values(KycDocumentType).includes(documentType as KycDocumentType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document type'
        });
      }

      // Check if AWS credentials are configured
      const hasAwsConfig = process.env.AWS_ACCESS_KEY_ID && 
                          process.env.AWS_SECRET_ACCESS_KEY && 
                          process.env.AWS_S3_BUCKET;

      if (!hasAwsConfig) {
        // Fallback: Save file info without actual S3 upload for development
        console.log(`📄 KYC Document Upload (Dev Mode):`, {
          riderId,
          documentType,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        });

        return res.status(200).json({
          success: true,
          data: {
            riderId,
            documentType,
            fileName: file.originalname,
            fileSize: file.size,
            url: `https://dev-placeholder.com/kyc/${riderId}/${documentType}`,
            message: 'Document uploaded successfully (development mode)'
          }
        });
      }

      // Production: Use actual S3 upload
      const result = await kycService.uploadDocument(
        riderId,
        documentType as KycDocumentType,
        file.buffer,
        file.mimetype
      );
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Document upload error:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Get KYC status
   */
  async getKycStatus(req: Request, res: Response) {
    try {
      const { riderId } = req.params;
      
      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: 'Rider ID is required'
        });
      }
      
      const result = await kycService.getKycStatus(riderId);
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Get KYC status error:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Submit KYC for verification
   */
  async submitForVerification(req: Request, res: Response) {
    try {
      const { riderId } = req.params;
      
      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: 'Rider ID is required'
        });
      }
      
      const result = await kycService.submitForVerification(riderId);
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('KYC verification submission error:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // ==========================================
  // ADMIN/DASHBOARD KYC VERIFICATION METHODS
  // ==========================================

  /**
   * Get all pending KYC submissions for manual review
   */
  async getPendingKycSubmissions(req: Request, res: Response) {
    try {
      const result = await kycService.getPendingKycSubmissions();
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get pending KYC submissions error:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get KYC documents for a specific rider (for manual review)
   */
  async getKycDocuments(req: Request, res: Response) {
    try {
      const { riderId } = req.params;
      
      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: 'Rider ID is required'
        });
      }

      const result = await kycService.getKycDocuments(riderId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get KYC documents error:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  /**
   * Verify/Reject KYC documents (manual verification by admin)
   */
  async verifyKycDocuments(req: Request, res: Response) {
    try {
      const { riderId } = req.params;
      const { status, rejectionReason, verifiedBy } = req.body;
      
      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: 'Rider ID is required'
        });
      }

      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status must be either "verified" or "rejected"'
        });
      }

      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required when rejecting KYC'
        });
      }

      const result = await kycService.verifyKycDocuments(
        riderId, 
        status, 
        rejectionReason, 
        verifiedBy || 'admin'
      );
      
      return res.status(200).json({
        success: true,
        data: result,
        message: `KYC ${status} successfully`
      });
    } catch (error) {
      console.error('Verify KYC documents error:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  /**
   * Auto-verify using external KYC service (Digilocker integration)
   */
  async autoVerifyKyc(req: Request, res: Response) {
    try {
      const { riderId } = req.params;
      const { service } = req.body; // 'digilocker' or other services
      
      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: 'Rider ID is required'
        });
      }

      const result = await kycService.autoVerifyKyc(riderId, service || 'digilocker');
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Auto-verification completed'
      });
    } catch (error) {
      console.error('Auto-verify KYC error:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
}
