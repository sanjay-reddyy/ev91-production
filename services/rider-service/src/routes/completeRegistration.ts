import express, { Request, Response, Router } from "express";
import { prisma } from "../config/database";

const router: Router = express.Router();

/**
 * Get rider registration status with details
 */
router.get("/riders/:riderId/status", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Define required fields with labels for better UI display
    const requiredFields = [
      { field: "name", label: "Full Name" },
      { field: "phone", label: "Phone Number" },
      { field: "dob", label: "Date of Birth" },
      { field: "address1", label: "Address Line 1" },
      { field: "city", label: "City" },
      { field: "state", label: "State" },
      { field: "pincode", label: "PIN Code" },
      { field: "aadharNumber", label: "Aadhar Number" },
      { field: "panNumber", label: "PAN Number" },
      { field: "drivingLicenseNumber", label: "Driving License" },
      { field: "emergencyName", label: "Emergency Contact Name" },
      { field: "emergencyPhone", label: "Emergency Contact Phone" },
    ];

    // Get missing fields with user-friendly labels
    const missingFields = getMissingRiderFields(rider);

    // Calculate completion percentage
    const totalRequiredFields = requiredFields.length;
    const completedFields = totalRequiredFields - missingFields.length;
    const completionPercentage = Math.round(
      (completedFields / totalRequiredFields) * 100
    );

    // Return detailed status
    res.json({
      success: true,
      data: {
        registrationStatus: rider.registrationStatus,
        isActive: rider.registrationStatus === "COMPLETED", // For backwards compatibility during migration
        kycStatus: rider.kycStatus,
        missingFields,
        completionPercentage,
        canBeActivated:
          rider.registrationStatus === "COMPLETED" &&
          rider.kycStatus === "verified",
      },
    });
  } catch (error) {
    console.error("Error fetching registration status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get registration status",
    });
  }
});

/**
 * Verify KYC and complete registration endpoint
 * This will be used in the rider profile to complete the registration process
 */
router.patch(
  "/riders/:riderId/complete-registration",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;
      const { kycVerified = true, activateRider = true } = req.body;

      // Get current rider to check status
      const currentRider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!currentRider) {
        return res.status(404).json({
          success: false,
          message: "Rider not found",
        });
      }

      // Check if any required fields are missing
      const missingFields = getMissingRiderFields(currentRider);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot complete registration: Required rider information is missing",
          missingFields: getMissingRiderFields(currentRider),
        });
      }

      // Step 1: Update registration status
      const updatedRider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          registrationStatus: "COMPLETED",
          kycStatus: kycVerified ? "verified" : "pending",
        },
      });

      // Step 2: Update isActive status if requested
      if (activateRider) {
        await prisma.$executeRaw`
        UPDATE "rider"."Rider"
        SET "isActive" = ${true}
        WHERE "id" = ${riderId}
      `;
      }

      // Get final rider data
      const finalRider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!finalRider) {
        throw new Error("Failed to retrieve updated rider");
      }

      res.json({
        success: true,
        data: {
          ...finalRider,
          isActive: activateRider, // Explicitly include isActive in the response
        },
        message: `Registration completed${kycVerified ? ", KYC verified" : ""}${
          activateRider ? ", and rider activated" : ""
        }`,
      });
    } catch (error) {
      console.error("Error completing registration:", error);
      res.status(500).json({
        success: false,
        message: "Failed to complete registration",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * Helper function to get missing required fields from a rider object
 * with user-friendly labels
 */
function getMissingRiderFields(rider: any): string[] {
  const requiredFields = [
    { field: "name", label: "Full Name" },
    { field: "phone", label: "Phone Number" },
    { field: "dob", label: "Date of Birth" },
    { field: "address1", label: "Address Line 1" },
    { field: "city", label: "City" },
    { field: "state", label: "State" },
    { field: "pincode", label: "PIN Code" },
    { field: "aadharNumber", label: "Aadhar Number" },
    { field: "panNumber", label: "PAN Number" },
    { field: "drivingLicenseNumber", label: "Driving License" },
    { field: "emergencyName", label: "Emergency Contact Name" },
    { field: "emergencyPhone", label: "Emergency Contact Phone" },
  ];

  return requiredFields
    .filter(({ field }) => !rider[field])
    .map(({ label }) => label);
}

export default router;
