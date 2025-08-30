import { QueryParams, PaginationInfo } from '../types';

/**
 * Validation utilities for vehicle service
 */
export class Validator {
  /**
   * Validate VIN format (simplified - should be 17 characters alphanumeric)
   */
  static isValidVIN(vin: string): boolean {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinRegex.test(vin);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (basic)
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate year is reasonable for vehicles
   */
  static isValidVehicleYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear + 1;
  }

  /**
   * Validate mileage is non-negative
   */
  static isValidMileage(mileage: number): boolean {
    return mileage >= 0;
  }

  /**
   * Validate cost is non-negative
   */
  static isValidCost(cost: number): boolean {
    return cost >= 0;
  }

  /**
   * Validate license plate format (basic - non-empty)
   */
  static isValidLicensePlate(licensePlate: string): boolean {
    return licensePlate.trim().length > 0;
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Pagination utilities
 */
export class PaginationHelper {
  /**
   * Calculate pagination info
   */
  static calculatePagination(
    totalItems: number,
    page: number = 1,
    limit: number = 20
  ): PaginationInfo {
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage,
      hasPreviousPage
    };
  }

  /**
   * Calculate skip value for database queries
   */
  static calculateSkip(page: number = 1, limit: number = 20): number {
    return (Math.max(1, page) - 1) * limit;
  }

  /**
   * Validate and sanitize query parameters
   */
  static sanitizeQueryParams(params: QueryParams): {
    page: number;
    limit: number;
    skip: number;
  } {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = this.calculateSkip(page, limit);

    return { page, limit, skip };
  }
}
