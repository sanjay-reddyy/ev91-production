import { prisma } from "../config/database";

/**
 * Registration Completion Service
 *
 * Centralized service to handle rider registration completion logic.
 * This service checks if all registration requirements are met and
 * automatically updates the registration status to COMPLETED.
 *
 * Requirements for completion:
 * 1. Phone verified (phoneVerified = true)
 * 2. KYC approved (kycStatus = 'approved')
 * 3. Agreement signed (agreementSigned = true)
 */
export class RegistrationCompletionService {
  /**
   * Check if rider meets all requirements for registration completion
   */
  async checkRequirements(riderId: string): Promise<{
    isComplete: boolean;
    missing: string[];
    rider: any;
  }> {
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: {
        id: true,
        phone: true,
        name: true,
        dob: true,
        address1: true,
        city: true,
        state: true,
        pincode: true,
        aadhaar: true,
        pan: true,
        dl: true,
        emergencyName: true,
        emergencyPhone: true,
        phoneVerified: true,
        kycStatus: true,
        agreementSigned: true,
        registrationStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rider) {
      throw new Error("Rider not found");
    }

    const missing: string[] = [];

    // Check profile completion
    const requiredProfileFields = [
      { key: "name", label: "Full Name" },
      { key: "dob", label: "Date of Birth" },
      { key: "address1", label: "Address Line 1" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "pincode", label: "PIN Code" },
      { key: "aadhaar", label: "Aadhar Number" },
      { key: "pan", label: "PAN Number" },
      { key: "dl", label: "Driving License" },
      { key: "emergencyName", label: "Emergency Contact Name" },
      { key: "emergencyPhone", label: "Emergency Contact Phone" },
    ];

    const missingProfileFields = requiredProfileFields.filter(
      ({ key }) => !rider[key as keyof typeof rider]
    );

    if (missingProfileFields.length > 0) {
      missing.push(
        `Profile fields: ${missingProfileFields.map((f) => f.label).join(", ")}`
      );
    }

    // Check phone verification
    if (!rider.phoneVerified) {
      missing.push("Phone verification");
    }

    // Check KYC approval (use "approved" to match kycService implementation)
    if (rider.kycStatus !== "approved" && rider.kycStatus !== "verified") {
      missing.push("KYC approval");
    }

    // Check agreement signature
    if (!rider.agreementSigned) {
      missing.push("Rental agreement signature");
    }

    const isComplete = missing.length === 0;

    console.log(`[RegistrationCompletion] Check for rider ${riderId}:`, {
      profileComplete: missingProfileFields.length === 0,
      phoneVerified: rider.phoneVerified,
      kycStatus: rider.kycStatus,
      agreementSigned: rider.agreementSigned,
      isComplete,
      missing,
    });

    return { isComplete, missing, rider };
  }

  /**
   * Attempt to complete registration if all requirements are met
   *
   * This is the main method that should be called whenever any of the
   * registration requirements changes (phone verified, KYC approved, agreement signed).
   *
   * @returns Object with completion status and message
   */
  async tryCompleteRegistration(riderId: string): Promise<{
    completed: boolean;
    message: string;
    missing?: string[];
    previousStatus?: string;
    newStatus?: string;
  }> {
    const { isComplete, missing, rider } = await this.checkRequirements(
      riderId
    );

    if (!isComplete) {
      console.log(
        `[RegistrationCompletion] Cannot complete for rider ${riderId}. Missing:`,
        missing
      );
      return {
        completed: false,
        message: "Registration requirements not met",
        missing,
      };
    }

    // All requirements met - check if already completed
    if (rider.registrationStatus === "COMPLETED") {
      console.log(
        `[RegistrationCompletion] Rider ${riderId} already completed`
      );
      return {
        completed: true,
        message: "Registration already completed",
      };
    }

    // Complete registration
    const previousStatus = rider.registrationStatus;

    await prisma.rider.update({
      where: { id: riderId },
      data: {
        registrationStatus: "COMPLETED",
        // Note: We don't auto-activate here. Admin can still control activation separately.
      },
    });

    console.log(
      `✅ [RegistrationCompletion] Auto-completed registration for rider ${riderId}`,
      {
        previousStatus,
        newStatus: "COMPLETED",
        phone: rider.phone,
        name: rider.name,
      }
    );

    return {
      completed: true,
      message: "Registration completed successfully",
      previousStatus,
      newStatus: "COMPLETED",
    };
  }

  /**
   * Get registration status with detailed breakdown of all steps
   *
   * This provides a comprehensive view of the registration progress,
   * showing which steps are completed and which are pending.
   */
  async getDetailedStatus(riderId: string) {
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: {
        id: true,
        phone: true,
        name: true,
        dob: true,
        address1: true,
        city: true,
        state: true,
        pincode: true,
        aadhaar: true,
        pan: true,
        dl: true,
        emergencyName: true,
        emergencyPhone: true,
        phoneVerified: true,
        kycStatus: true,
        agreementSigned: true,
        registrationStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rider) {
      throw new Error("Rider not found");
    }

    // Check profile completion
    const requiredProfileFields = [
      { key: "name", label: "Full Name" },
      { key: "phone", label: "Phone Number" },
      { key: "dob", label: "Date of Birth" },
      { key: "address1", label: "Address Line 1" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "pincode", label: "PIN Code" },
      { key: "aadhaar", label: "Aadhar Number" },
      { key: "pan", label: "PAN Number" },
      { key: "dl", label: "Driving License" },
      { key: "emergencyName", label: "Emergency Contact Name" },
      { key: "emergencyPhone", label: "Emergency Contact Phone" },
    ];

    const missingProfileFields = requiredProfileFields.filter(
      ({ key }) => !rider[key as keyof typeof rider]
    );
    const profileCompleted = missingProfileFields.length === 0;

    // Define registration steps with proper stage breakdown
    const steps = [
      {
        stage: 1,
        step: "Profile Information",
        completed: profileCompleted,
        required: true,
        status: profileCompleted ? "completed" : "pending",
        details: profileCompleted
          ? "All profile fields filled"
          : `Missing: ${missingProfileFields.map((f) => f.label).join(", ")}`,
        weight: 33.33, // Stage 1: 33.33% of total progress
      },
      {
        stage: 2,
        step: "Phone Verification",
        completed: rider.phoneVerified,
        required: true,
        status: rider.phoneVerified ? "completed" : "pending",
        weight: 11.11, // Stage 2a: 11.11% of total progress
      },
      {
        stage: 2,
        step: "KYC Approval",
        completed:
          rider.kycStatus === "approved" || rider.kycStatus === "verified",
        required: true,
        status: rider.kycStatus,
        details: `Current KYC status: ${rider.kycStatus}`,
        weight: 22.22, // Stage 2b: 22.22% of total progress
      },
      {
        stage: 3,
        step: "Agreement Signature",
        completed: rider.agreementSigned === true,
        required: true,
        status: rider.agreementSigned ? "completed" : "pending",
        weight: 33.33, // Stage 3: 33.33% of total progress
      },
    ];

    // Calculate progress based on weighted steps
    let progress = 0;
    steps.forEach((step) => {
      if (step.completed) {
        progress += step.weight;
      }
    });
    progress = Math.round(progress);

    // Determine next action
    let nextAction = null;
    const firstIncomplete = steps.find((s) => s.required && !s.completed);
    if (firstIncomplete) {
      nextAction = firstIncomplete.step;
    }

    // Build missing fields array for frontend compatibility
    const missingFields: string[] = [];
    steps.forEach((step) => {
      if (step.required && !step.completed) {
        missingFields.push(step.step);
      }
    });

    // Calculate completed steps (out of 4 total stages)
    const completedSteps = steps.filter((s) => s.completed).length;
    const totalSteps = steps.filter((s) => s.required).length;

    console.log(
      `[RegistrationCompletion] Detailed status for rider ${riderId}:`,
      {
        progress,
        completedSteps,
        totalSteps,
        missingFields,
        canComplete: completedSteps === totalSteps,
      }
    );

    return {
      riderId: rider.id,
      phone: rider.phone,
      name: rider.name,
      registrationStatus: rider.registrationStatus,
      isActive: rider.isActive,
      progress,
      completionPercentage: progress, // ✅ Add for frontend compatibility
      completedSteps,
      totalSteps,
      steps,
      canComplete: completedSteps === totalSteps,
      missingFields, // ✅ Add for frontend compatibility
      missingProfileFields: missingProfileFields.map((f) => f.label), // ✅ Specific profile fields missing
      nextAction,
      createdAt: rider.createdAt,
      updatedAt: rider.updatedAt,
    };
  }

  /**
   * Check if a rider's registration is complete
   *
   * Simple boolean check without detailed breakdown.
   * Useful for quick validation in other services.
   */
  async isRegistrationComplete(riderId: string): Promise<boolean> {
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: {
        name: true,
        dob: true,
        address1: true,
        city: true,
        state: true,
        pincode: true,
        aadhaar: true,
        pan: true,
        dl: true,
        emergencyName: true,
        emergencyPhone: true,
        phoneVerified: true,
        kycStatus: true,
        agreementSigned: true,
      },
    });

    if (!rider) {
      return false;
    }

    // Check all required fields
    const profileComplete =
      !!rider.name &&
      !!rider.dob &&
      !!rider.address1 &&
      !!rider.city &&
      !!rider.state &&
      !!rider.pincode &&
      !!rider.aadhaar &&
      !!rider.pan &&
      !!rider.dl &&
      !!rider.emergencyName &&
      !!rider.emergencyPhone;

    return (
      profileComplete &&
      rider.phoneVerified === true &&
      (rider.kycStatus === "approved" || rider.kycStatus === "verified") &&
      rider.agreementSigned === true
    );
  }
}

// Export singleton instance
export const registrationCompletionService =
  new RegistrationCompletionService();
