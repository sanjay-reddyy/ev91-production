/**
 * Payment Deduction Service
 *
 * Handles automatic deduction of rental payments from rider earnings including:
 * - Automatic payment processing from earnings
 * - Balance verification before deduction
 * - Transaction recording and audit trail
 * - Insufficient balance handling
 * - Retry logic for failed deductions
 *
 * This service ensures reliable and transparent automatic payment
 * processing from rider earnings.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Payment status constants (matches Prisma schema string status)
const PaymentStatus = {
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
 * Minimum balance required for automatic deduction
 */
export const MINIMUM_BALANCE_FOR_DEDUCTION = 100;

/**
 * Maximum retry attempts for failed deductions
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry delay in days
 */
export const RETRY_DELAY_DAYS = 1;

// ============================================
// Types
// ============================================

export interface DeductionResult {
  success: boolean;
  paymentId: string;
  riderId: string;
  amountDeducted: number;
  previousBalance: number;
  newBalance: number;
  transactionRef?: string;
  error?: string;
  timestamp: Date;
}

export interface BatchDeductionResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  totalAmountDeducted: number;
  results: DeductionResult[];
}

export interface RiderBalanceInfo {
  riderId: string;
  currentBalance: number;
  availableForDeduction: number;
  pendingPayments: number;
  overduePayments: number;
  canDeduct: boolean;
}

// ============================================
// Balance Verification Functions
// ============================================

/**
 * Get rider's current earnings balance
 *
 * NOTE: This is a placeholder. In production, this should integrate with
 * your actual earnings tracking system or table.
 *
 * @param riderId - Rider ID
 * @returns Current balance
 */
export async function getRiderBalance(riderId: string): Promise<number> {
  // TODO: Integrate with actual earnings system
  // For now, returning a placeholder balance
  // In production, this should query your earnings table

  // Example logic when earnings table exists:
  // const earnings = await prisma.riderEarning.aggregate({
  //   where: { riderId },
  //   _sum: { amount: true },
  // });

  // Sum all rental payment deductions
  const deductions = await prisma.riderRentalPayment.aggregate({
    where: {
      riderId,
      deductedFromEarnings: true,
    },
    _sum: { amount: true },
  });

  const totalDeductions = deductions._sum.amount || 0;

  // Placeholder: Assuming 10,000 starting balance per rider
  // Replace with actual earnings query
  const placeholderBalance = 10000;

  return placeholderBalance - totalDeductions;
}

/**
 * Get detailed balance information for a rider
 *
 * @param riderId - Rider ID
 * @returns Rider balance information
 */
export async function getRiderBalanceInfo(
  riderId: string
): Promise<RiderBalanceInfo> {
  const currentBalance = await getRiderBalance(riderId);

  // Count pending and overdue payments
  const pendingCount = await prisma.riderRentalPayment.count({
    where: {
      riderId,
      status: PaymentStatus.PENDING,
    },
  });

  const overdueCount = await prisma.riderRentalPayment.count({
    where: {
      riderId,
      status: PaymentStatus.OVERDUE,
    },
  });

  const availableForDeduction = Math.max(
    0,
    currentBalance - MINIMUM_BALANCE_FOR_DEDUCTION
  );

  return {
    riderId,
    currentBalance,
    availableForDeduction,
    pendingPayments: pendingCount,
    overduePayments: overdueCount,
    canDeduct: availableForDeduction > 0,
  };
}

/**
 * Check if rider has sufficient balance for deduction
 *
 * @param riderId - Rider ID
 * @param amount - Amount to deduct
 * @returns True if sufficient balance
 */
export async function hasSufficientBalance(
  riderId: string,
  amount: number
): Promise<boolean> {
  const balance = await getRiderBalance(riderId);
  return balance - amount >= MINIMUM_BALANCE_FOR_DEDUCTION;
}

// ============================================
// Payment Deduction Functions
// ============================================

/**
 * Deduct payment from rider earnings
 *
 * @param paymentId - Payment ID
 * @returns Deduction result
 */
export async function deductPaymentFromEarnings(
  paymentId: string
): Promise<DeductionResult> {
  const payment = await prisma.riderRentalPayment.findUnique({
    where: { id: paymentId },
    include: {
      rental: {
        include: {
          rider: true,
        },
      },
    },
  });

  if (!payment) {
    return {
      success: false,
      paymentId,
      riderId: "",
      amountDeducted: 0,
      previousBalance: 0,
      newBalance: 0,
      error: "Payment not found",
      timestamp: new Date(),
    };
  }

  const riderId = payment.riderId;
  const totalDue = payment.amount + (payment.lateFee || 0);
  const alreadyPaid = payment.paidDate ? payment.amount : 0;
  const amountToPay = totalDue - alreadyPaid;

  // Check balance
  const previousBalance = await getRiderBalance(riderId);
  const hasSufficient = await hasSufficientBalance(riderId, amountToPay);

  if (!hasSufficient) {
    return {
      success: false,
      paymentId,
      riderId,
      amountDeducted: 0,
      previousBalance,
      newBalance: previousBalance,
      error: `Insufficient balance. Required: ₹${amountToPay}, Available: ₹${
        previousBalance - MINIMUM_BALANCE_FOR_DEDUCTION
      }`,
      timestamp: new Date(),
    };
  }

  // Perform deduction in transaction
  try {
    const transactionRef = `RENT-${Date.now()}-${paymentId.substring(0, 8)}`;

    await prisma.$transaction(async (tx) => {
      // Update payment record
      await tx.riderRentalPayment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidDate: new Date(),
          deductedFromEarnings: true,
          transactionId: transactionRef,
          notes: payment.notes
            ? `${payment.notes} | Auto-deducted from earnings`
            : "Auto-deducted from earnings",
        },
      });

      // TODO: Record deduction in earnings when earnings table exists
      // await tx.riderEarning.create({
      //   data: {
      //     riderId,
      //     amount: -amountToPay,
      //     earningType: 'RENTAL_PAYMENT_DEDUCTION',
      //     description: `Rental payment for ${payment.paymentMonth}`,
      //     earningDate: new Date(),
      //     status: 'CONFIRMED',
      //     metadata: {
      //       paymentId,
      //       rentalId: payment.rentalId,
      //       transactionRef,
      //     },
      //   },
      // });
    });

    const newBalance = previousBalance - amountToPay;

    console.log(
      `✅ Deducted ₹${amountToPay} from rider ${riderId} for payment ${paymentId}`
    );

    return {
      success: true,
      paymentId,
      riderId,
      amountDeducted: amountToPay,
      previousBalance,
      newBalance,
      transactionRef,
      timestamp: new Date(),
    };
  } catch (error: any) {
    console.error(`❌ Failed to deduct payment ${paymentId}:`, error.message);

    return {
      success: false,
      paymentId,
      riderId,
      amountDeducted: 0,
      previousBalance,
      newBalance: previousBalance,
      error: error.message,
      timestamp: new Date(),
    };
  }
}

/**
 * Process automatic deductions for due payments
 * Runs as scheduled job (cron)
 *
 * @returns Batch deduction result
 */
export async function processAutomaticDeductions(): Promise<BatchDeductionResult> {
  console.log("🔄 Starting automatic payment deductions...");

  const today = new Date();

  // Find payments due for processing
  // Include payments due today or in the past that are still PENDING
  const duePayments = await prisma.riderRentalPayment.findMany({
    where: {
      status: PaymentStatus.PENDING,
      dueDate: {
        lte: today,
      },
      deductedFromEarnings: false,
    },
    include: {
      rental: {
        include: {
          rider: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  console.log(`📊 Found ${duePayments.length} payments due for processing`);

  const results: DeductionResult[] = [];
  let successful = 0;
  let failed = 0;
  let totalAmountDeducted = 0;

  for (const payment of duePayments) {
    const result = await deductPaymentFromEarnings(payment.id);
    results.push(result);

    if (result.success) {
      successful++;
      totalAmountDeducted += result.amountDeducted;
    } else {
      failed++;

      // If insufficient balance, check if should mark overdue
      if (result.error?.includes("Insufficient balance")) {
        const daysPastDue = Math.floor(
          (today.getTime() - new Date(payment.dueDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // If past grace period, mark as overdue
        if (daysPastDue > 3) {
          await prisma.riderRentalPayment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.OVERDUE,
              notes: payment.notes
                ? `${payment.notes} | Marked overdue due to insufficient balance`
                : "Marked overdue due to insufficient balance",
            },
          });

          console.log(`⚠️ Payment ${payment.id} marked as OVERDUE`);
        }
      }
    }
  }

  console.log(
    `✅ Processed ${duePayments.length} payments: ${successful} successful, ${failed} failed`
  );
  console.log(`💰 Total amount deducted: ₹${totalAmountDeducted}`);

  return {
    totalProcessed: duePayments.length,
    successful,
    failed,
    totalAmountDeducted,
    results,
  };
}

/**
 * Retry failed deductions for a specific rider
 *
 * @param riderId - Rider ID
 * @returns Batch deduction result
 */
export async function retryFailedDeductions(
  riderId: string
): Promise<BatchDeductionResult> {
  console.log(`🔄 Retrying failed deductions for rider ${riderId}...`);

  const today = new Date();

  // Find overdue payments for this rider
  const overduePayments = await prisma.riderRentalPayment.findMany({
    where: {
      riderId,
      status: PaymentStatus.OVERDUE,
      deductedFromEarnings: false,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  console.log(`📊 Found ${overduePayments.length} overdue payments to retry`);

  const results: DeductionResult[] = [];
  let successful = 0;
  let failed = 0;
  let totalAmountDeducted = 0;

  for (const payment of overduePayments) {
    const result = await deductPaymentFromEarnings(payment.id);
    results.push(result);

    if (result.success) {
      successful++;
      totalAmountDeducted += result.amountDeducted;
    } else {
      failed++;
    }
  }

  console.log(
    `✅ Retry complete: ${successful} successful, ${failed} still failed`
  );

  return {
    totalProcessed: overduePayments.length,
    successful,
    failed,
    totalAmountDeducted,
    results,
  };
}

/**
 * Process deduction for a specific rental (all payments)
 *
 * @param rentalId - Rental ID
 * @returns Batch deduction result
 */
export async function processRentalPayments(
  rentalId: string
): Promise<BatchDeductionResult> {
  const pendingPayments = await prisma.riderRentalPayment.findMany({
    where: {
      rentalId,
      status: PaymentStatus.PENDING,
      dueDate: {
        lte: new Date(),
      },
    },
  });

  const results: DeductionResult[] = [];
  let successful = 0;
  let failed = 0;
  let totalAmountDeducted = 0;

  for (const payment of pendingPayments) {
    const result = await deductPaymentFromEarnings(payment.id);
    results.push(result);

    if (result.success) {
      successful++;
      totalAmountDeducted += result.amountDeducted;
    } else {
      failed++;
    }
  }

  return {
    totalProcessed: pendingPayments.length,
    successful,
    failed,
    totalAmountDeducted,
    results,
  };
}

// ============================================
// Manual Payment Functions
// ============================================

/**
 * Record manual payment (not from earnings)
 *
 * @param paymentId - Payment ID
 * @param amount - Amount paid
 * @param paymentMethod - Payment method
 * @param notes - Optional notes
 * @returns Updated payment record
 */
export async function recordManualPayment(
  paymentId: string,
  amount: number,
  paymentMethod: string,
  notes?: string
): Promise<any> {
  const payment = await prisma.riderRentalPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const isPaid =
    payment.status === PaymentStatus.PAID || payment.paidDate !== null;

  const updated = await prisma.riderRentalPayment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.PAID,
      paidDate: new Date(),
      paymentMethod,
      deductedFromEarnings: false,
      notes: notes || `Manual payment of ₹${amount} via ${paymentMethod}`,
    },
  });

  console.log(
    `✅ Recorded manual payment of ₹${amount} for payment ${paymentId}`
  );

  return updated;
}

// ============================================
// Reporting Functions
// ============================================

/**
 * Get deduction summary for a rider
 *
 * @param riderId - Rider ID
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 * @returns Deduction summary
 */
export async function getRiderDeductionSummary(
  riderId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalDeducted: number;
  paymentCount: number;
  averagePayment: number;
  periodStart?: Date;
  periodEnd?: Date;
}> {
  const where: any = {
    riderId,
    deductedFromEarnings: true,
    status: PaymentStatus.PAID,
  };

  if (startDate || endDate) {
    where.paidDate = {};
    if (startDate) where.paidDate.gte = startDate;
    if (endDate) where.paidDate.lte = endDate;
  }

  const payments = await prisma.riderRentalPayment.findMany({
    where,
  });

  const totalDeducted = payments.reduce(
    (sum: number, p: any) => sum + p.amount,
    0
  );
  const paymentCount = payments.length;
  const averagePayment = paymentCount > 0 ? totalDeducted / paymentCount : 0;

  return {
    totalDeducted,
    paymentCount,
    averagePayment,
    periodStart: startDate,
    periodEnd: endDate,
  };
}

// ============================================
// Export Service Object
// ============================================

export const PaymentDeductionService = {
  // Balance verification
  getRiderBalance,
  getRiderBalanceInfo,
  hasSufficientBalance,

  // Deduction processing
  deductPaymentFromEarnings,
  processAutomaticDeductions,
  retryFailedDeductions,
  processRentalPayments,

  // Manual payments
  recordManualPayment,

  // Reporting
  getRiderDeductionSummary,

  // Constants
  MINIMUM_BALANCE_FOR_DEDUCTION,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY_DAYS,
};

export default PaymentDeductionService;
