/**
 * City Sync Routes
 * For EV91 Platform - Rider Service
 * Internal routes for city synchronization and rider lookup
 */

import { Router, Request, Response } from "express";
import { CitySyncController } from "../controllers/citySyncController";
import { prisma } from "../config/database";

const router = Router();

// City synchronization endpoint (called by vehicle-service)
router.post("/city-sync", CitySyncController.handleCitySync);

// City sync status and management endpoints
router.get("/city-sync/status", CitySyncController.getSyncStatus);
router.get("/city-sync/cities", CitySyncController.getCities);
router.post("/city-sync/manual/:cityId", CitySyncController.manualSync);

// Internal rider lookup endpoint (for service-to-service communication)
// GET /internal/riders/public/:publicRiderId
router.get(
  "/riders/public/:publicRiderId",
  async (req: Request, res: Response) => {
    try {
      const { publicRiderId } = req.params;

      console.log(
        `[Internal] Looking up rider by publicRiderId: ${publicRiderId}`
      );

      const rider = await prisma.rider.findUnique({
        where: { publicRiderId: publicRiderId },
      });

      if (!rider) {
        console.log(
          `[Internal] Rider not found for publicRiderId: ${publicRiderId}`
        );
        return res.status(404).json({
          success: false,
          message: `Rider with public ID "${publicRiderId}" not found`,
        });
      }

      console.log(
        `[Internal] Found rider: ${rider.id} for publicRiderId: ${publicRiderId}`
      );

      res.json({
        success: true,
        data: {
          id: rider.id,
          publicRiderId: rider.publicRiderId,
          name: rider.name,
          phone: rider.phone,
          email: rider.email,
          registrationStatus: rider.registrationStatus,
          isActive: rider.isActive,
        },
      });
    } catch (error: any) {
      console.error(`[Internal] Error looking up rider:`, error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

// Internal rider lookup by ID (for service-to-service communication)
// GET /internal/riders/:riderId
router.get("/riders/:riderId", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    console.log(`[Internal] Looking up rider by ID: ${riderId}`);

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      console.log(`[Internal] Rider not found for ID: ${riderId}`);
      return res.status(404).json({
        success: false,
        message: `Rider with ID "${riderId}" not found`,
      });
    }

    console.log(
      `[Internal] Found rider: ${rider.name} (${rider.publicRiderId})`
    );

    res.json({
      success: true,
      data: {
        id: rider.id,
        publicRiderId: rider.publicRiderId,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        registrationStatus: rider.registrationStatus,
        isActive: rider.isActive,
        city: rider.city,
        state: rider.state,
      },
    });
  } catch (error: any) {
    console.error(`[Internal] Error looking up rider:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
