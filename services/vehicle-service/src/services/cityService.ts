/**
 * City Service
 * For EV91 Platform - Vehicle Service
 * Handles all city-related operations
 */

import { prisma } from "../index";
import { City as PrismaCity } from "@prisma/client";
import {
  City,
  CreateCityRequest,
  UpdateCityRequest,
  CityFilters,
  CityResponse,
  CityWithHubCount,
} from "../types/city";
import { ErrorHandler, Logger } from "../utils";

export class CityService {
  /**
   * Create a new city
   */
  static async createCity(data: CreateCityRequest): Promise<City> {
    try {
      Logger.info("Creating new city", {
        cityName: data.name,
        cityCode: data.code,
      });

      // Check if city with same name or code already exists
      const existingCity = await prisma.city.findFirst({
        where: {
          OR: [{ name: data.name }, { code: data.code }],
        },
      });

      if (existingCity) {
        throw ErrorHandler.createError(
          "City with this name or code already exists",
          "CITY_EXISTS",
          400
        );
      }

      const city = await prisma.city.create({
        data: {
          ...data,
          country: data.country || "India",
          timezone: data.timezone || "Asia/Kolkata",
          isActive: data.isActive ?? true,
          isOperational: data.isOperational ?? true,
          marketPotential: data.marketPotential ?? null,
        },
      });

      Logger.info("City created successfully", {
        cityId: city.id,
        cityName: city.name,
      });
      return city as City;
    } catch (error) {
      Logger.error("Error creating city", error);
      if ((error as any)?.error) throw error;
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get city by ID
   */
  static async getCityById(id: string): Promise<City | null> {
    try {
      const city = await prisma.city.findUnique({
        where: { id },
      });

      return city as City | null;
    } catch (error) {
      Logger.error("Error fetching city by ID", { cityId: id, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get city by code
   */
  static async getCityByCode(code: string): Promise<City | null> {
    try {
      const city = await prisma.city.findUnique({
        where: { code },
      });

      return city as City | null;
    } catch (error) {
      Logger.error("Error fetching city by code", { cityCode: code, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get all cities with optional filters
   */
  static async getCities(filters: CityFilters = {}): Promise<CityResponse[]> {
    try {
      const {
        isActive,
        isOperational,
        state,
        regionCode,
        marketPotential,
        search,
      } = filters;

      const whereClause: any = {};

      if (isActive !== undefined) whereClause.isActive = isActive;
      if (isOperational !== undefined)
        whereClause.isOperational = isOperational;
      if (state) whereClause.state = state;
      if (regionCode) whereClause.regionCode = regionCode;
      if (marketPotential) whereClause.marketPotential = marketPotential;

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ];
      }

      const cities = await prisma.city.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              hubs: true,
            },
          },
        },
        orderBy: [
          { isOperational: "desc" },
          { isActive: "desc" },
          { name: "asc" },
        ],
      });

      return cities.map((city: any) => ({
        id: city.id,
        name: city.name,
        displayName: city.displayName,
        code: city.code,
        state: city.state,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        isActive: city.isActive,
        isOperational: city.isOperational,
        hubCount: city._count.hubs,
      }));
    } catch (error) {
      Logger.error("Error fetching cities", { filters, error });
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get cities with hub and vehicle counts
   */
  static async getCitiesWithCounts(): Promise<CityWithHubCount[]> {
    try {
      const cities = await prisma.city.findMany({
        include: {
          hubs: {
            include: {
              _count: {
                select: {
                  vehicles: true,
                },
              },
            },
          },
        },
        orderBy: [
          { isOperational: "desc" },
          { isActive: "desc" },
          { name: "asc" },
        ],
      });

      return cities.map((city: any) => ({
        ...city,
        hubCount: city.hubs.length,
        activeHubCount: city.hubs.filter((hub: any) => hub.status === "Active")
          .length,
        totalVehicles: city.hubs.reduce(
          (total: number, hub: any) => total + hub._count.vehicles,
          0
        ),
      }));
    } catch (error) {
      Logger.error("Error fetching cities with counts", error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Update city
   */
  static async updateCity(id: string, data: UpdateCityRequest): Promise<City> {
    try {
      Logger.info("Updating city", { cityId: id });

      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id },
      });

      if (!existingCity) {
        throw ErrorHandler.createError("City not found", "CITY_NOT_FOUND", 404);
      }

      // Check if updating to a name/code that already exists (excluding current city)
      if (data.name || data.code) {
        const conflictingCity = await prisma.city.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [{ name: data.name }, { code: data.code }].filter(Boolean),
              },
            ],
          },
        });

        if (conflictingCity) {
          throw ErrorHandler.createError(
            "City with this name or code already exists",
            "CITY_EXISTS",
            400
          );
        }
      }

      const updatedCity = await prisma.city.update({
        where: { id },
        data: {
          ...data,
          marketPotential:
            data.marketPotential !== undefined
              ? data.marketPotential
              : undefined,
        },
      });

      Logger.info("City updated successfully", { cityId: id });
      return updatedCity as City;
    } catch (error) {
      Logger.error("Error updating city", { cityId: id, error });
      if ((error as any)?.error) throw error;
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Delete city (soft delete by setting isActive to false)
   */
  static async deleteCity(id: string): Promise<void> {
    try {
      Logger.info("Deleting city", { cityId: id });

      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id },
        include: {
          hubs: {
            include: {
              vehicles: true,
            },
          },
        },
      });

      if (!existingCity) {
        throw ErrorHandler.createError("City not found", "CITY_NOT_FOUND", 404);
      }

      // Check if city has active hubs with vehicles
      const activeHubsWithVehicles = existingCity.hubs.filter(
        (hub: any) => hub.status === "Active" && hub.vehicles.length > 0
      );

      if (activeHubsWithVehicles.length > 0) {
        throw ErrorHandler.createError(
          "Cannot delete city with active hubs that have vehicles assigned",
          "CITY_HAS_ACTIVE_VEHICLES",
          400
        );
      }

      // Soft delete by setting isActive to false
      await prisma.city.update({
        where: { id },
        data: {
          isActive: false,
          isOperational: false,
        },
      });

      Logger.info("City deleted successfully", { cityId: id });
    } catch (error) {
      Logger.error("Error deleting city", { cityId: id, error });
      if ((error as any)?.error) throw error;
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get operational cities (for dropdowns and selection)
   */
  static async getOperationalCities(): Promise<CityResponse[]> {
    try {
      const cities = await prisma.city.findMany({
        where: {
          isActive: true,
          isOperational: true,
        },
        orderBy: { name: "asc" },
      });

      return cities.map((city: any) => ({
        id: city.id,
        name: city.name,
        displayName: city.displayName,
        code: city.code,
        state: city.state,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        isActive: city.isActive,
        isOperational: city.isOperational,
      }));
    } catch (error) {
      Logger.error("Error fetching operational cities", error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }
}
