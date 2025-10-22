/**
 * Rental Pricing Service
 *
 * Handles all rental cost calculations including:
 * - Base rental cost retrieval from Vehicle Service
 * - Depreciation calculation (2% per month, max 30%)
 * - Total cost estimation for rental period
 * - Savings calculation
 * - Security deposit recommendations
 *
 * This service implements the core pricing logic for EV rentals,
 * ensuring consistent pricing across the platform.
 */

import { getVehicleServiceClient } from "./VehicleServiceClient";

// ============================================
// Constants
// ============================================

/**
 * Depreciation rate per month (2%)
 */
export const DEPRECIATION_RATE_PER_MONTH = 0.02;

/**
 * Maximum depreciation percentage (30%)
 */
export const MAX_DEPRECIATION_PERCENTAGE = 0.3;

/**
 * Standard rental period in months (12 months)
 */
export const STANDARD_RENTAL_PERIOD_MONTHS = 12;

/**
 * Security deposit multiplier (2x monthly cost)
 */
export const SECURITY_DEPOSIT_MULTIPLIER = 2;

// ============================================
// Types
// ============================================

export interface RentalCostCalculation {
  modelId: string;
  modelName: string;
  baseRentalCost: number;
  vehicleAge: number;
  depreciationPercentage: number;
  actualMonthlyCost: number;
  savings: number;
  depreciationAmount: number;
}

export interface RentalEstimate {
  modelId: string;
  modelName: string;
  baseRentalCost: number;
  vehicleAge: number;
  monthlyRentalCost: number;
  depreciationPercentage: number;
  monthlySavings: number;
  rentalPeriodMonths: number;
  totalCostForPeriod: number;
  totalSavingsForPeriod: number;
  securityDepositRecommendation: number;
  breakdownByMonth: MonthlyBreakdown[];
}

export interface MonthlyBreakdown {
  month: number;
  monthlyCost: number;
  cumulativeCost: number;
}

export interface PricingComparison {
  newVehicleCost: number;
  usedVehicleCost: number;
  savingsAmount: number;
  savingsPercentage: number;
}

// ============================================
// Core Pricing Functions
// ============================================

/**
 * Calculate depreciation percentage based on vehicle age
 * Formula: min(vehicleAge * 2%, 30%)
 *
 * @param vehicleAge - Age of vehicle in months
 * @returns Depreciation percentage (0-30%)
 */
export function calculateDepreciationPercentage(vehicleAge: number): number {
  if (vehicleAge < 0) {
    throw new Error("Vehicle age cannot be negative");
  }

  const depreciation = vehicleAge * DEPRECIATION_RATE_PER_MONTH;
  return Math.min(depreciation, MAX_DEPRECIATION_PERCENTAGE);
}

/**
 * Calculate actual monthly rental cost after depreciation
 *
 * @param baseRentalCost - Base monthly rental cost for new vehicle
 * @param vehicleAge - Age of vehicle in months
 * @returns Actual monthly cost after depreciation
 */
export function calculateActualMonthlyCost(
  baseRentalCost: number,
  vehicleAge: number
): number {
  if (baseRentalCost <= 0) {
    throw new Error("Base rental cost must be positive");
  }

  const depreciationPercentage = calculateDepreciationPercentage(vehicleAge);
  const depreciationAmount = baseRentalCost * depreciationPercentage;
  const actualCost = baseRentalCost - depreciationAmount;

  return Math.round(actualCost); // Round to nearest rupee
}

/**
 * Calculate monthly savings from depreciation
 *
 * @param baseRentalCost - Base monthly rental cost
 * @param actualMonthlyCost - Actual cost after depreciation
 * @returns Savings amount
 */
export function calculateMonthlySavings(
  baseRentalCost: number,
  actualMonthlyCost: number
): number {
  return Math.round(baseRentalCost - actualMonthlyCost);
}

/**
 * Calculate recommended security deposit
 * Typically 2x the monthly rental cost
 *
 * @param monthlyRentalCost - Monthly rental cost
 * @returns Recommended security deposit
 */
export function calculateSecurityDeposit(monthlyRentalCost: number): number {
  return monthlyRentalCost * SECURITY_DEPOSIT_MULTIPLIER;
}

/**
 * Calculate total cost for a rental period
 *
 * @param monthlyRentalCost - Monthly rental cost
 * @param months - Number of months
 * @returns Total cost for the period
 */
export function calculateTotalCost(
  monthlyRentalCost: number,
  months: number
): number {
  if (months <= 0) {
    throw new Error("Rental period must be positive");
  }

  return monthlyRentalCost * months;
}

// ============================================
// Advanced Pricing Functions
// ============================================

/**
 * Get comprehensive rental cost calculation
 * Fetches model details from Vehicle Service and calculates all pricing
 *
 * @param modelId - Vehicle model ID
 * @param vehicleAge - Age of vehicle in months
 * @returns Detailed cost calculation
 */
export async function getRentalCostCalculation(
  modelId: string,
  vehicleAge: number
): Promise<RentalCostCalculation> {
  const vehicleServiceClient = getVehicleServiceClient();

  // Fetch model details from Vehicle Service
  const model = await vehicleServiceClient.getVehicleModel(modelId);

  if (!model) {
    throw new Error(`Vehicle model not found: ${modelId}`);
  }

  if (!model.isAvailableForRent) {
    throw new Error(`Vehicle model is not available for rent: ${modelId}`);
  }

  const baseRentalCost = model.baseRentalCost;
  const depreciationPercentage = calculateDepreciationPercentage(vehicleAge);
  const depreciationAmount = baseRentalCost * depreciationPercentage;
  const actualMonthlyCost = calculateActualMonthlyCost(
    baseRentalCost,
    vehicleAge
  );
  const savings = calculateMonthlySavings(baseRentalCost, actualMonthlyCost);

  return {
    modelId: model.id,
    modelName: model.modelName,
    baseRentalCost,
    vehicleAge,
    depreciationPercentage: Math.round(depreciationPercentage * 100), // As percentage
    actualMonthlyCost,
    savings,
    depreciationAmount: Math.round(depreciationAmount),
  };
}

/**
 * Get comprehensive rental estimate for a period
 * Includes breakdown by month and total calculations
 *
 * @param modelId - Vehicle model ID
 * @param vehicleAge - Age of vehicle in months
 * @param rentalPeriodMonths - Rental period (default: 12 months)
 * @returns Detailed rental estimate
 */
export async function getRentalEstimate(
  modelId: string,
  vehicleAge: number,
  rentalPeriodMonths: number = STANDARD_RENTAL_PERIOD_MONTHS
): Promise<RentalEstimate> {
  const costCalculation = await getRentalCostCalculation(modelId, vehicleAge);

  const totalCostForPeriod = calculateTotalCost(
    costCalculation.actualMonthlyCost,
    rentalPeriodMonths
  );

  const totalBaseForPeriod = calculateTotalCost(
    costCalculation.baseRentalCost,
    rentalPeriodMonths
  );

  const totalSavingsForPeriod = totalBaseForPeriod - totalCostForPeriod;

  const securityDepositRecommendation = calculateSecurityDeposit(
    costCalculation.actualMonthlyCost
  );

  // Generate monthly breakdown
  const breakdownByMonth: MonthlyBreakdown[] = [];
  let cumulativeCost = 0;

  for (let month = 1; month <= rentalPeriodMonths; month++) {
    cumulativeCost += costCalculation.actualMonthlyCost;
    breakdownByMonth.push({
      month,
      monthlyCost: costCalculation.actualMonthlyCost,
      cumulativeCost,
    });
  }

  return {
    modelId: costCalculation.modelId,
    modelName: costCalculation.modelName,
    baseRentalCost: costCalculation.baseRentalCost,
    vehicleAge: costCalculation.vehicleAge,
    monthlyRentalCost: costCalculation.actualMonthlyCost,
    depreciationPercentage: costCalculation.depreciationPercentage,
    monthlySavings: costCalculation.savings,
    rentalPeriodMonths,
    totalCostForPeriod,
    totalSavingsForPeriod,
    securityDepositRecommendation,
    breakdownByMonth,
  };
}

/**
 * Compare pricing between new and used vehicle
 *
 * @param modelId - Vehicle model ID
 * @param newVehicleAge - Age of new vehicle (typically 0)
 * @param usedVehicleAge - Age of used vehicle
 * @param months - Comparison period in months
 * @returns Pricing comparison
 */
export async function comparePricing(
  modelId: string,
  newVehicleAge: number = 0,
  usedVehicleAge: number,
  months: number = STANDARD_RENTAL_PERIOD_MONTHS
): Promise<PricingComparison> {
  const newEstimate = await getRentalEstimate(modelId, newVehicleAge, months);
  const usedEstimate = await getRentalEstimate(modelId, usedVehicleAge, months);

  const savingsAmount =
    newEstimate.totalCostForPeriod - usedEstimate.totalCostForPeriod;
  const savingsPercentage =
    (savingsAmount / newEstimate.totalCostForPeriod) * 100;

  return {
    newVehicleCost: newEstimate.totalCostForPeriod,
    usedVehicleCost: usedEstimate.totalCostForPeriod,
    savingsAmount,
    savingsPercentage: Math.round(savingsPercentage * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Validate rental pricing parameters
 *
 * @param baseRentalCost - Base rental cost
 * @param vehicleAge - Vehicle age
 * @param rentalPeriodMonths - Rental period
 * @returns Validation result
 */
export function validatePricingParameters(
  baseRentalCost: number,
  vehicleAge: number,
  rentalPeriodMonths: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (baseRentalCost <= 0) {
    errors.push("Base rental cost must be positive");
  }

  if (vehicleAge < 0) {
    errors.push("Vehicle age cannot be negative");
  }

  if (vehicleAge > 60) {
    errors.push("Vehicle age exceeds maximum (60 months)");
  }

  if (rentalPeriodMonths <= 0) {
    errors.push("Rental period must be positive");
  }

  if (rentalPeriodMonths > 36) {
    errors.push("Rental period exceeds maximum (36 months)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format currency in Indian Rupees
 *
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate average monthly cost over a period with varying vehicle ages
 * Useful for long-term rentals where vehicle continues to age
 *
 * @param baseRentalCost - Base rental cost
 * @param startingAge - Starting vehicle age
 * @param months - Number of months
 * @returns Average monthly cost
 */
export function calculateAverageMonthlyRent(
  baseRentalCost: number,
  startingAge: number,
  months: number
): number {
  let totalCost = 0;

  for (let i = 0; i < months; i++) {
    const currentAge = startingAge + i;
    const monthlyCost = calculateActualMonthlyCost(baseRentalCost, currentAge);
    totalCost += monthlyCost;
  }

  return Math.round(totalCost / months);
}

/**
 * Get pricing tier based on vehicle age
 *
 * @param vehicleAge - Vehicle age in months
 * @returns Pricing tier
 */
export function getPricingTier(vehicleAge: number): string {
  if (vehicleAge === 0) return "Brand New";
  if (vehicleAge <= 6) return "Like New (0-6 months)";
  if (vehicleAge <= 12) return "Excellent (6-12 months)";
  if (vehicleAge <= 24) return "Good (1-2 years)";
  if (vehicleAge <= 36) return "Fair (2-3 years)";
  return "Older (3+ years)";
}

// ============================================
// Export Service Object
// ============================================

export const RentalPricingService = {
  // Core calculations
  calculateDepreciationPercentage,
  calculateActualMonthlyCost,
  calculateMonthlySavings,
  calculateSecurityDeposit,
  calculateTotalCost,

  // Advanced functions
  getRentalCostCalculation,
  getRentalEstimate,
  comparePricing,

  // Validation
  validatePricingParameters,

  // Utilities
  formatCurrency,
  calculateAverageMonthlyRent,
  getPricingTier,

  // Constants
  DEPRECIATION_RATE_PER_MONTH,
  MAX_DEPRECIATION_PERCENTAGE,
  STANDARD_RENTAL_PERIOD_MONTHS,
  SECURITY_DEPOSIT_MULTIPLIER,
};

export default RentalPricingService;
