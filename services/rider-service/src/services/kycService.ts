import { prisma } from '../config/database';
import { env } from '../config/env';
import { uploadToS3 } from '../utils/s3Client';
import axios from 'axios';

/**
 * KYC document types
 */
export enum KycDocumentType {
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  DL = 'dl',
  SELFIE = 'selfie'
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
    file: Buffer,
    mimeType: string
  ) {
    // Validate rider exists
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    if (!rider) {
      throw new Error('Rider not found');
    }

    // Generate unique filename
    const extension = mimeType.split('/')[1];
    const key = `kyc/${riderId}/${documentType}-${Date.now()}.${extension}`;

    // Upload to S3
    const fileUrl = await uploadToS3(file, key, mimeType);

    // Update rider record with document URL
    const updateData: any = {};
    updateData[documentType] = fileUrl;

    await prisma.rider.update({
      where: { id: riderId },
      data: updateData
    });

    return {
      documentType,
      url: fileUrl,
      message: 'Document uploaded successfully'
    };
  }

  /**
   * Check KYC status for rider
   */
  async getKycStatus(riderId: string) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    
    if (!rider) {
      throw new Error('Rider not found');
    }
    
    return {
      status: rider.kycStatus,
      aadhaar: !!rider.aadhaar,
      pan: !!rider.pan,
      dl: !!rider.dl,
      selfie: !!rider.selfie
    };
  }

  /**
   * Submit KYC documents for verification via provider API
   */
  async submitForVerification(riderId: string) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    
    if (!rider) {
      throw new Error('Rider not found');
    }
    
    // Check if all required documents are uploaded
    if (!rider.aadhaar || !rider.pan || !rider.dl || !rider.selfie) {
      throw new Error('All required documents must be uploaded');
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
            selfie: rider.selfie
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${env.KYC_PROVIDER_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // For demo purposes, you can auto-approve in development
      const kycStatus = env.NODE_ENV === 'development' ? 'approved' : 'pending';
      
      // Update KYC status
      await prisma.rider.update({
        where: { id: riderId },
        data: { kycStatus }
      });
      
      return {
        message: 'KYC verification submitted successfully',
        status: kycStatus,
        providerResponse: response.data
      };
    } catch (error) {
      console.error('KYC verification error:', error);
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
        kycStatus: 'pending',
        aadhaar: { not: null },
        pan: { not: null },
        dl: { not: null },
        selfie: { not: null }
      },
      select: {
        id: true,
        name: true,
        phone: true,
        dob: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return {
      count: pendingRiders.length,
      submissions: pendingRiders
    };
  }

  /**
   * Get KYC documents for a specific rider (for manual review)
   */
  async getKycDocuments(riderId: string) {
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
        updatedAt: true
      }
    });

    if (!rider) {
      throw new Error('Rider not found');
    }

    return {
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        dob: rider.dob,
        kycStatus: rider.kycStatus,
        createdAt: rider.createdAt,
        updatedAt: rider.updatedAt
      },
      documents: {
        aadhaar: rider.aadhaar,
        pan: rider.pan,
        dl: rider.dl,
        selfie: rider.selfie
      }
    };
  }

  /**
   * Verify/Reject KYC documents (manual verification by admin)
   */
  async verifyKycDocuments(
    riderId: string, 
    status: 'verified' | 'rejected', 
    rejectionReason?: string, 
    verifiedBy?: string
  ) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    
    if (!rider) {
      throw new Error('Rider not found');
    }

    // Update KYC status
    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: { 
        kycStatus: status === 'verified' ? 'approved' : 'rejected'
      }
    });

    // TODO: In a production system, you might want to store the verification details
    // in a separate KycVerification table with verifiedBy, rejectionReason, etc.

    return {
      riderId: updatedRider.id,
      name: updatedRider.name,
      previousStatus: rider.kycStatus,
      newStatus: updatedRider.kycStatus,
      verifiedBy,
      rejectionReason: status === 'rejected' ? rejectionReason : null,
      verifiedAt: new Date().toISOString()
    };
  }

  /**
   * Auto-verify using external KYC service (Digilocker integration)
   */
  async autoVerifyKyc(riderId: string, service: string = 'digilocker') {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    
    if (!rider) {
      throw new Error('Rider not found');
    }

    // Check if documents are uploaded
    if (!rider.aadhaar || !rider.pan || !rider.dl) {
      throw new Error('Required documents not uploaded for auto-verification');
    }

    try {
      let verificationResult;

      if (service === 'digilocker') {
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
              dl: rider.dl
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${env.DIGILOCKER_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        verificationResult = digilockerResponse.data;
      } else {
        // Other KYC service integrations can be added here
        throw new Error(`Unsupported auto-verification service: ${service}`);
      }

      // Determine status based on verification result
      const isVerified = verificationResult.status === 'verified' || verificationResult.verified === true;
      const kycStatus = isVerified ? 'approved' : 'rejected';

      // Update rider KYC status
      const updatedRider = await prisma.rider.update({
        where: { id: riderId },
        data: { kycStatus }
      });

      return {
        riderId: updatedRider.id,
        name: updatedRider.name,
        service,
        verificationResult,
        status: kycStatus,
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Auto-verification error (${service}):`, error);
      
      // In development, simulate success for testing
      if (env.NODE_ENV === 'development') {
        await prisma.rider.update({
          where: { id: riderId },
          data: { kycStatus: 'approved' }
        });

        return {
          riderId: rider.id,
          name: rider.name,
          service,
          verificationResult: { status: 'verified', message: 'Development mode simulation' },
          status: 'approved',
          verifiedAt: new Date().toISOString()
        };
      }

      throw new Error(`Auto-verification failed: ${(error as Error).message}`);
    }
  }
}
