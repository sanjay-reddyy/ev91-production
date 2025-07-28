import { prisma } from '../config/database';

/**
 * Interface for rider registration data
 */
export interface RiderRegistrationData {
  phone: string;
  consent: boolean;
}

/**
 * Interface for rider profile data
 */
export interface RiderProfileData {
  name: string;
  dob: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
}

/**
 * Registration service with business logic for the rider registration process
 */
export class RegistrationService {
  /**
   * Start the registration process for a rider
   * Generates OTP, stores/updates rider record, and sends OTP via SMS
   */
  /**
   * Start registration using phone-based OTP (Twilio)
   */
  async startRegistration(phone: string, consent: boolean) {
    if (!phone) throw new Error('Phone number is required');
    // Find existing rider by phone
    let rider = await prisma.rider.findUnique({ where: { phone } });
    if (!rider) {
      rider = await prisma.rider.create({
        data: {
          phone,
          consent,
        }
      });
    } else {
      // Update existing rider by id (unique identifier)
      rider = await prisma.rider.update({
        where: { id: rider.id },
        data: { consent },
      });
    }
    return {
      riderId: rider.id,
      message: 'Registration initiated successfully',
    };
  }

  /**
   * Mark phone as verified after OTP verification
   */
  async verifyPhone(phone: string) {
    if (!phone) throw new Error('Phone number is required');
    
    // Find existing rider by phone
    let rider = await prisma.rider.findUnique({ where: { phone } });
    
    if (!rider) {
      // Create new rider with phone verified
      rider = await prisma.rider.create({
        data: {
          phone,
          phoneVerified: true,
          registrationStatus: 'PHONE_VERIFIED',
          consent: true
        }
      });
    } else {
      // Update existing rider to mark phone as verified
      rider = await prisma.rider.update({
        where: { id: rider.id },
        data: {
          phoneVerified: true,
          registrationStatus: 'PHONE_VERIFIED'
        }
      });
    }
    
    return {
      riderId: rider.id,
      message: 'Phone verified successfully',
      phoneVerified: true
    };
  }

  /**
   * Convert date to ISO format if needed
   */
  private convertDateToISO(dateStr: string): string {
    if (!dateStr) return dateStr;
    
    // Already in ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Convert DD/MM/YYYY to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateStr;
  }

  /**
   * Save rider profile data
   */
  async saveProfile(riderId: string, data: RiderProfileData) {
    // Check if rider exists
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    
    if (!rider) {
      throw new Error('Rider not found');
    }

    // With Twilio, phone verification is handled by OTP
    // No need to check otpVerified here
    
    // Convert DOB to ISO format
    const convertedDob = this.convertDateToISO(data.dob);
    
    // Update profile data
    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        name: data.name,
        dob: convertedDob,
        address1: data.address1,
        address2: data.address2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        emergencyName: data.emergencyName || null,
        emergencyPhone: data.emergencyPhone || null,
        emergencyRelation: data.emergencyRelation || null,
        registrationStatus: 'PROFILE_COMPLETED'
      }
    });    return {
      riderId: updatedRider.id,
      message: 'Profile updated successfully',
    };
  }

  /**
   * Save emergency contact details separately
   */
  async saveEmergencyContact(riderId: string, emergencyData: {
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelation: string;
  }) {
    // Check if rider exists
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    
    if (!rider) {
      throw new Error('Rider not found');
    }
    
    if (!rider.phoneVerified) {
      throw new Error('Phone must be verified before saving emergency contact');
    }
    
    // Update emergency contact data
    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        emergencyName: emergencyData.emergencyName,
        emergencyPhone: emergencyData.emergencyPhone,
        emergencyRelation: emergencyData.emergencyRelation,
        registrationStatus: 'EMERGENCY_CONTACT_COMPLETED'
      }
    });
    
    return {
      riderId: updatedRider.id,
      message: 'Emergency contact updated successfully',
    };
  }

  /**
   * Get rider by ID
   */
  async getRider(riderId: string) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    
    if (!rider) {
      throw new Error('Rider not found');
    }
    
    // Return rider data (no sensitive fields to remove in current schema)
    return rider;
  }

  /**
   * E-sign rental agreement
   */
  async esignAgreement(riderId: string, agreementData: any) {
    // First verify rider exists and is eligible
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    
    if (!rider) {
      throw new Error('Rider not found');
    }
    
    if (rider.kycStatus !== 'approved') {
      throw new Error('KYC must be approved before signing agreement');
    }
    
    // Import the e-sign provider
    const { esignAgreement } = await import('../utils/esignProvider');
    
    try {
      // Call external e-sign provider
      const esignResult = await esignAgreement({ riderId, agreementData });
      
      // Update rider with signed agreement
      await prisma.rider.update({
        where: { id: riderId },
        data: { 
          agreementSigned: true
        }
      });
      
      return {
        riderId,
        message: 'Agreement signed successfully',
        providerResult: esignResult
      };
    } catch (error) {
      throw new Error(`E-sign provider error: ${(error as Error).message}`);
    }
  }
}
