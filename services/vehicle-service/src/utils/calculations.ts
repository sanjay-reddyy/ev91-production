import { PartsReplaced } from '../types';

/**
 * Calculate total cost for service records
 */
export class CostCalculator {
  /**
   * Calculate total service cost from labor and parts
   */
  static calculateServiceCost(laborCost: number = 0, partsCost: number = 0): number {
    return Number((laborCost + partsCost).toFixed(2));
  }

  /**
   * Calculate parts cost from parts replaced array
   */
  static calculatePartsCost(partsReplaced: PartsReplaced[] = []): number {
    const total = partsReplaced.reduce((sum, part) => {
      return sum + (part.cost * part.quantity);
    }, 0);
    return Number(total.toFixed(2));
  }

  /**
   * Calculate vehicle depreciation based on age and initial value
   */
  static calculateDepreciation(
    purchasePrice: number, 
    purchaseDate: Date, 
    depreciationRate: number = 0.15
  ): number {
    const currentDate = new Date();
    const ageInYears = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const depreciatedValue = purchasePrice * Math.pow(1 - depreciationRate, ageInYears);
    return Number(Math.max(depreciatedValue, purchasePrice * 0.1).toFixed(2)); // Minimum 10% of original value
  }

  /**
   * Calculate average cost from an array of costs
   */
  static calculateAverageCost(costs: number[]): number {
    if (costs.length === 0) return 0;
    const total = costs.reduce((sum, cost) => sum + cost, 0);
    return Number((total / costs.length).toFixed(2));
  }

  /**
   * Parse numeric value from string (removing non-numeric characters)
   */
  static parseNumericValue(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  }
}

/**
 * Date calculation utilities
 */
export class DateCalculator {
  /**
   * Calculate vehicle age from purchase date (returns age in months)
   */
  static calculateVehicleAge(registrationDate: Date, purchaseDate?: Date): number {
    const referenceDate = purchaseDate || registrationDate;
    const currentDate = new Date();
    const ageInMs = currentDate.getTime() - referenceDate.getTime();
    return Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30)); // Convert to months
  }

  /**
   * Calculate next service due date based on last service and interval
   */
  static calculateNextServiceDate(lastServiceDate: Date, intervalMonths: number = 6): Date {
    const nextDate = new Date(lastServiceDate);
    nextDate.setMonth(nextDate.getMonth() + intervalMonths);
    return nextDate;
  }

  /**
   * Check if a date is within a range
   */
  static isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date <= endDate;
  }

  /**
   * Format date to ISO string for database storage
   */
  static formatDateForDB(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Get start and end of month for a given date
   */
  static getMonthRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }
}
