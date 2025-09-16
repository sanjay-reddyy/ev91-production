/**
 * City Controller
 * For EV91 Platform - Client Store Service
 * Public API endpoints for city data
 */

import { Request, Response } from "express";
import { prisma } from "../index";

export class CityController {
  /**
   * Get all cities
   * GET /api/v1/cities
   */
  static async getCities(req: Request, res: Response): Promise<void> {
    try {
      const { active, operational } = req.query;

      const where: any = {};

      // Apply filters based on query parameters
      if (active !== undefined) {
        where.isActive = active === "true";
      }

      if (operational !== undefined) {
        where.isOperational = operational === "true";
      }

      const cities = await prisma.city.findMany({
        where,
        select: {
          id: true,
          name: true,
          displayName: true,
          code: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          isActive: true,
          isOperational: true,
          timezone: true,
        },
        orderBy: [
          { isOperational: "desc" },
          { isActive: "desc" },
          { name: "asc" },
        ],
      });

      res.json({
        success: true,
        message: "Cities retrieved successfully",
        data: cities,
        count: cities.length,
      });
    } catch (error) {
      console.error("Error getting cities:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve cities",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal server error",
      });
    }
  }

  /**
   * Get operational cities only
   * GET /api/v1/cities/operational
   */
  static async getOperationalCities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const cities = await prisma.city.findMany({
        where: {
          isActive: true,
          isOperational: true,
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          code: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          timezone: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      res.json({
        success: true,
        message: "Operational cities retrieved successfully",
        data: cities,
        count: cities.length,
      });
    } catch (error) {
      console.error("Error getting operational cities:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve operational cities",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal server error",
      });
    }
  }

  /**
   * Get active cities only
   * GET /api/v1/cities/active
   */
  static async getActiveCities(req: Request, res: Response): Promise<void> {
    try {
      const cities = await prisma.city.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          code: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          isOperational: true,
          timezone: true,
        },
        orderBy: [{ isOperational: "desc" }, { name: "asc" }],
      });

      res.json({
        success: true,
        message: "Active cities retrieved successfully",
        data: cities,
        count: cities.length,
      });
    } catch (error) {
      console.error("Error getting active cities:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve active cities",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal server error",
      });
    }
  }

  /**
   * Get city by ID
   * GET /api/v1/cities/:id
   */
  static async getCityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "City ID is required",
        });
        return;
      }

      const city = await prisma.city.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          displayName: true,
          code: true,
          state: true,
          country: true,
          timezone: true,
          latitude: true,
          longitude: true,
          pinCodeRange: true,
          regionCode: true,
          isActive: true,
          isOperational: true,
          launchDate: true,
          estimatedPopulation: true,
          marketPotential: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!city) {
        res.status(404).json({
          success: false,
          message: "City not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "City retrieved successfully",
        data: city,
      });
    } catch (error) {
      console.error("Error getting city by ID:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve city",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal server error",
      });
    }
  }

  /**
   * Get city by code
   * GET /api/v1/cities/code/:code
   */
  static async getCityByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      if (!code) {
        res.status(400).json({
          success: false,
          message: "City code is required",
        });
        return;
      }

      const city = await prisma.city.findUnique({
        where: { code: code.toUpperCase() },
        select: {
          id: true,
          name: true,
          displayName: true,
          code: true,
          state: true,
          country: true,
          timezone: true,
          latitude: true,
          longitude: true,
          pinCodeRange: true,
          regionCode: true,
          isActive: true,
          isOperational: true,
          launchDate: true,
          estimatedPopulation: true,
          marketPotential: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!city) {
        res.status(404).json({
          success: false,
          message: "City not found with the provided code",
        });
        return;
      }

      res.json({
        success: true,
        message: "City retrieved successfully",
        data: city,
      });
    } catch (error) {
      console.error("Error getting city by code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve city",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal server error",
      });
    }
  }
}
