/**
 * Payment Schedule Generator Service
 *
 * Handles automatic generation of rental payment schedules including:
 * - 12-month payment schedule creation
 * - Due date calculation (1st of each month)
 * - Payment amount distribution
 * - Late fee calculation
 * - Schedule updates for rental changes
 *
 * This service ensures consistent payment schedule generation
 * and management across the platform.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Payment status constants (matches Prisma schema string status)
const RentalPaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  WAIVED: "WAIVED",
  FAILED: "FAILED",
} as const;

// ============================================
// Constants
// ============================================

/**
 * Standard rental period in months
 */
export const DEFAULT_RENTAL_PERIOD_MONTHS = 12;

/**
 * Default payment due day of month (1st)
 */
export const PAYMENT_DUE_DAY = 1;

/**
 * Grace period in days before marking payment overdue
 */
export const GRACE_PERIOD_DAYS = 3;

/**
 * Late fee percentage (5% of monthly payment)
 */
export const LATE_FEE_PERCENTAGE = 0.05;

/**
 * Minimum late fee amount
 */
export const MINIMUM_LATE_FEE = 100;

// ============================================
// Types
// ============================================

export interface PaymentScheduleConfig {
  rentalId: string;
  riderId: string;
  monthlyRentalCost: number;
  startDate: Date;
  numberOfMonths?: number;
  gracePeriodDays?: number;
}

export interface GeneratedPayment {
  paymentMonth: string; // Format: "YYYY-MM"
  dueDate: Date;
  amountDue: number;
  status: string; // PENDING, PAID, OVERDUE, WAIVED, FAILED
}

export interface PaymentScheduleSummary {
  totalPayments: number;
  totalAmount: number;
  firstPaymentDate: Date;
  lastPaymentDate: Date;
  monthlyAmount: number;
  payments: GeneratedPayment[];
}

// ============================================
// Core Schedule Generation Functions
// ============================================

/**
 * Generate payment month string in format "YYYY-MM"
 *
 * @param date - Date to format
 * @returns Payment month string
 */
export function formatPaymentMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Calculate due date for a payment
 * Defaults to 1st of the month
 *
 * @param paymentMonth - Payment month (YYYY-MM)
 * @param dueDay - Day of month (default: 1)
 * @returns Due date
 */
export function calculateDueDate(
  paymentMonth: string,
  dueDay: number = PAYMENT_DUE_DAY
): Date {
  const [year, month] = paymentMonth.split("-").map(Number);
  return new Date(year, month - 1, dueDay);
}

/**
 * Calculate late fee for overdue payment
 *
 * @param amountDue - Original amount due
 * @param daysOverdue - Number of days overdue
 * @returns Late fee amount
 */
export function calculateLateFee(
  amountDue: number,
  daysOverdue: number
): number {
  if (daysOverdue <= 0) return 0;

  const lateFee = amountDue * LATE_FEE_PERCENTAGE;
  return Math.max(lateFee, MINIMUM_LATE_FEE);
}

/**
 * Generate payment schedule array
 *
 * @param config - Schedule configuration
 * @returns Array of generated payments
 */
export function generatePaymentSchedule(
  config: PaymentScheduleConfig
): GeneratedPayment[] {
  const {
    monthlyRentalCost,
    startDate,
    numberOfMonths = DEFAULT_RENTAL_PERIOD_MONTHS,
  } = config;

  const payments: GeneratedPayment[] = [];
  const startDateObj = new Date(startDate);

  // Start from the month after rental start
  // If rental starts on 15th Oct, first payment is 1st Nov
  let currentDate = new Date(startDateObj);
  currentDate.setDate(1); // Set to 1st of the month
  currentDate.setMonth(currentDate.getMonth() + 1); // Next month

  for (let i = 0; i < numberOfMonths; i++) {
    const paymentMonth = formatPaymentMonth(currentDate);
    const dueDate = calculateDueDate(paymentMonth);

    payments.push({
      paymentMonth,
      dueDate,
      amountDue: monthlyRentalCost,
      status: RentalPaymentStatus.PENDING,
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return payments;
}

/**
 * Create payment schedule summary
 *
 * @param payments - Array of payments
 * @returns Payment schedule summary
 */
export function createScheduleSummary(
  payments: GeneratedPayment[]
): PaymentScheduleSummary {
  if (payments.length === 0) {
    throw new Error("Cannot create summary for empty payment schedule");
  }

  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amountDue, 0);
  const monthlyAmount = payments[0].amountDue;
  const firstPaymentDate = payments[0].dueDate;
  const lastPaymentDate = payments[payments.length - 1].dueDate;

  return {
    totalPayments,
    totalAmount,
    firstPaymentDate,
    lastPaymentDate,
    monthlyAmount,
    payments,
  };
}

// ============================================
// Database Operations
// ============================================

/**
 * Create payment schedule in database
 *
 * @param config - Schedule configuration
 * @returns Array of created payment records
 */
export async function createPaymentScheduleInDB(
  config: PaymentScheduleConfig
): Promise<any[]> {
  const { rentalId, riderId } = config;

  // Generate payment schedule
  const payments = generatePaymentSchedule(config);

  // Create all payments in database
  const createdPayments = await prisma.$transaction(
    payments.map((payment) =>
      prisma.riderRentalPayment.create({
        data: {
          rentalId,
          riderId,
          dueDate: payment.dueDate,
          amount: payment.amountDue,
          status: payment.status,
          deductedFromEarnings: false,
          lateFee: 0,
          notes: `Payment for ${payment.paymentMonth}`,
        },
      })
    )
  );

  console.log(
    `✅ Created ${createdPayments.length} payment records for rental ${rentalId}`
  );

  return createdPayments;
}

/**
 * Update payment schedule for rental cost change
 * Only updates future PENDING payments
 *
 * @param rentalId - Rental ID
 * @param newMonthlyCost - New monthly rental cost
 * @returns Number of updated payments
 */
export async function updatePaymentSchedule(
  rentalId: string,
  newMonthlyCost: number
): Promise<number> {
  const today = new Date();

  const result = await prisma.riderRentalPayment.updateMany({
    where: {
      rentalId,
      status: RentalPaymentStatus.PENDING,
      dueDate: {
        gte: today,
      },
    },
    data: {
      amount: newMonthlyCost,
    },
  });

  console.log(
    `✅ Updated ${result.count} future payments for rental ${rentalId} to ₹${newMonthlyCost}`
  );

  return result.count;
}

/**
 * Delete payment schedule for a rental
 * Used when rental is cancelled before start
 *
 * @param rentalId - Rental ID
 * @returns Number of deleted payments
 */
export async function deletePaymentSchedule(rentalId: string): Promise<number> {
  const result = await prisma.riderRentalPayment.deleteMany({
    where: {
      rentalId,
      status: RentalPaymentStatus.PENDING,
      paidDate: null,
    },
  });

  console.log(
    `✅ Deleted ${result.count} pending payments for rental ${rentalId}`
  );

  return result.count;
}

/**
 * Get payment schedule for a rental
 *
 * @param rentalId - Rental ID
 * @returns Array of payment records
 */
export async function getPaymentSchedule(rentalId: string): Promise<any[]> {
  const payments = await prisma.riderRentalPayment.findMany({
    where: { rentalId },
    orderBy: { dueDate: "asc" },
  });

  return payments;
}

// ============================================
// Payment Status Management
// ============================================

/**
 * Check and update overdue payments
 * Marks PENDING payments as OVERDUE if past grace period
 *
 * @param gracePeriodDays - Grace period in days
 * @returns Number of payments marked overdue
 */
export async function checkAndUpdateOverduePayments(
  gracePeriodDays: number = GRACE_PERIOD_DAYS
): Promise<number> {
  const today = new Date();
  const overdueDate = new Date(today);
  overdueDate.setDate(overdueDate.getDate() - gracePeriodDays);

  const result = await prisma.riderRentalPayment.updateMany({
    where: {
      status: RentalPaymentStatus.PENDING,
      dueDate: {
        lt: overdueDate,
      },
    },
    data: {
      status: RentalPaymentStatus.OVERDUE,
    },
  });

  if (result.count > 0) {
    console.log(`⚠️ Marked ${result.count} payments as OVERDUE`);
  }

  return result.count;
}

/**
 * Apply late fees to overdue payments
 *
 * @param applyToPaymentIds - Optional specific payment IDs
 * @returns Number of payments updated with late fees
 */
export async function applyLateFees(
  applyToPaymentIds?: string[]
): Promise<number> {
  const where: any = {
    status: RentalPaymentStatus.OVERDUE,
    lateFee: 0, // Only apply once
  };

  if (applyToPaymentIds && applyToPaymentIds.length > 0) {
    where.id = { in: applyToPaymentIds };
  }

  // Fetch overdue payments
  const overduePayments = await prisma.riderRentalPayment.findMany({
    where,
  });

  if (overduePayments.length === 0) {
    return 0;
  }

  // Calculate and apply late fees
  const today = new Date();
  let updateCount = 0;

  for (const payment of overduePayments) {
    const daysOverdue = Math.floor(
      (today.getTime() - new Date(payment.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const lateFee = calculateLateFee(payment.amount, daysOverdue);

    await prisma.riderRentalPayment.update({
      where: { id: payment.id },
      data: {
        lateFee,
        daysPastDue: daysOverdue,
        isLate: true,
        notes: payment.notes
          ? `${payment.notes} | Late fee applied: ₹${lateFee} (${daysOverdue} days overdue)`
          : `Late fee applied: ₹${lateFee} (${daysOverdue} days overdue)`,
      },
    });

    updateCount++;
  }

  console.log(`💰 Applied late fees to ${updateCount} overdue payments`);

  return updateCount;
}

/**
 * Get payment statistics for a rental
 *
 * @param rentalId - Rental ID
 * @returns Payment statistics
 */
export async function getPaymentStatistics(rentalId: string): Promise<{
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  lateFees: number;
}> {
  const payments = await getPaymentSchedule(rentalId);

  const stats = {
    total: payments.length,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    lateFees: 0,
  };

  for (const payment of payments) {
    stats.totalAmount += payment.amount;
    const paidAmount = payment.paidDate ? payment.amount : 0;
    stats.paidAmount += paidAmount;
    stats.lateFees += payment.lateFee || 0;

    switch (payment.status) {
      case RentalPaymentStatus.PAID:
        stats.paid++;
        break;
      case RentalPaymentStatus.PENDING:
        stats.pending++;
        stats.pendingAmount += payment.amount - paidAmount;
        break;
      case RentalPaymentStatus.OVERDUE:
        stats.overdue++;
        stats.overdueAmount += payment.amount - paidAmount;
        break;
    }
  }

  return stats;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate payment schedule configuration
 *
 * @param config - Schedule configuration
 * @returns Validation result
 */
export function validateScheduleConfig(config: PaymentScheduleConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.rentalId) {
    errors.push("Rental ID is required");
  }

  if (!config.riderId) {
    errors.push("Rider ID is required");
  }

  if (config.monthlyRentalCost <= 0) {
    errors.push("Monthly rental cost must be positive");
  }

  if (!config.startDate) {
    errors.push("Start date is required");
  }

  if (config.numberOfMonths && config.numberOfMonths <= 0) {
    errors.push("Number of months must be positive");
  }

  if (config.numberOfMonths && config.numberOfMonths > 36) {
    errors.push("Number of months cannot exceed 36");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// Export Service Object
// ============================================

export const PaymentScheduleService = {
  // Schedule generation
  generatePaymentSchedule,
  createScheduleSummary,
  formatPaymentMonth,
  calculateDueDate,

  // Database operations
  createPaymentScheduleInDB,
  updatePaymentSchedule,
  deletePaymentSchedule,
  getPaymentSchedule,

  // Status management
  checkAndUpdateOverduePayments,
  applyLateFees,
  calculateLateFee,
  getPaymentStatistics,

  // Validation
  validateScheduleConfig,

  // Constants
  DEFAULT_RENTAL_PERIOD_MONTHS,
  PAYMENT_DUE_DAY,
  GRACE_PERIOD_DAYS,
  LATE_FEE_PERCENTAGE,
  MINIMUM_LATE_FEE,
};

export default PaymentScheduleService;
