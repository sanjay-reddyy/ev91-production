/**
 * Rental Payment Cron Jobs
 *
 * Scheduled jobs for automated rental payment processing including:
 * - Daily payment deductions
 * - Payment reminders
 * - Overdue alerts
 * - Rental ending notices
 * - Late fee application
 *
 * Use node-cron or similar scheduler to run these functions
 */

import PaymentDeductionService from "../services/PaymentDeductionService";
import PaymentScheduleService from "../services/PaymentScheduleService";
import NotificationService from "../services/NotificationService";

// ============================================
// Job Functions
// ============================================

/**
 * Process automatic payment deductions
 * Runs daily at 2:00 AM
 * Deducts rental payments from rider earnings
 */
export async function processAutomaticPayments() {
  console.log("🕐 [CRON JOB] Starting automatic payment deductions...");

  try {
    const result = await PaymentDeductionService.processAutomaticDeductions();

    console.log(`✅ [CRON JOB] Payment deductions completed:`);
    console.log(`   - Total processed: ${result.totalProcessed}`);
    console.log(`   - Successful: ${result.successful}`);
    console.log(`   - Failed: ${result.failed}`);
    console.log(`   - Total amount: ₹${result.totalAmountDeducted}`);

    return result;
  } catch (error: any) {
    console.error(
      "❌ [CRON JOB] Automatic payment deductions failed:",
      error.message
    );
    throw error;
  }
}

/**
 * Send payment reminders
 * Runs daily at 9:00 AM
 * Sends reminders 3 days before payment due date
 */
export async function sendPaymentReminders() {
  console.log("🕐 [CRON JOB] Sending payment reminders...");

  try {
    const result = await NotificationService.sendPaymentReminders();

    console.log(`✅ [CRON JOB] Payment reminders sent:`);
    console.log(`   - Total sent: ${result.totalSent}`);
    console.log(`   - Successful: ${result.successful}`);
    console.log(`   - Failed: ${result.failed}`);

    return result;
  } catch (error: any) {
    console.error("❌ [CRON JOB] Payment reminders failed:", error.message);
    throw error;
  }
}

/**
 * Send overdue payment alerts
 * Runs daily at 10:00 AM
 * Alerts riders with overdue payments
 */
export async function sendOverdueAlerts() {
  console.log("🕐 [CRON JOB] Sending overdue payment alerts...");

  try {
    const result = await NotificationService.sendOverdueAlerts();

    console.log(`✅ [CRON JOB] Overdue alerts sent:`);
    console.log(`   - Total sent: ${result.totalSent}`);
    console.log(`   - Successful: ${result.successful}`);
    console.log(`   - Failed: ${result.failed}`);

    return result;
  } catch (error: any) {
    console.error("❌ [CRON JOB] Overdue alerts failed:", error.message);
    throw error;
  }
}

/**
 * Send rental ending notices
 * Runs daily at 9:30 AM
 * Notifies riders 30 days before rental ends
 */
export async function sendRentalEndingNotices() {
  console.log("🕐 [CRON JOB] Sending rental ending notices...");

  try {
    const result = await NotificationService.sendRentalEndingNotices();

    console.log(`✅ [CRON JOB] Rental ending notices sent:`);
    console.log(`   - Total sent: ${result.totalSent}`);
    console.log(`   - Successful: ${result.successful}`);
    console.log(`   - Failed: ${result.failed}`);

    return result;
  } catch (error: any) {
    console.error("❌ [CRON JOB] Rental ending notices failed:", error.message);
    throw error;
  }
}

/**
 * Check and update overdue payments
 * Runs daily at 1:00 AM
 * Marks PENDING payments as OVERDUE after grace period
 */
export async function updateOverduePayments() {
  console.log("🕐 [CRON JOB] Checking for overdue payments...");

  try {
    const count = await PaymentScheduleService.checkAndUpdateOverduePayments();

    console.log(
      `✅ [CRON JOB] Overdue payments updated: ${count} payments marked as OVERDUE`
    );

    return count;
  } catch (error: any) {
    console.error(
      "❌ [CRON JOB] Update overdue payments failed:",
      error.message
    );
    throw error;
  }
}

/**
 * Apply late fees to overdue payments
 * Runs daily at 1:30 AM
 * Applies 5% late fee (min ₹100) to overdue payments
 */
export async function applyLateFees() {
  console.log("🕐 [CRON JOB] Applying late fees...");

  try {
    const count = await PaymentScheduleService.applyLateFees();

    console.log(`✅ [CRON JOB] Late fees applied: ${count} payments updated`);

    return count;
  } catch (error: any) {
    console.error("❌ [CRON JOB] Apply late fees failed:", error.message);
    throw error;
  }
}

// ============================================
// Job Schedule Configuration
// ============================================

/**
 * Cron schedule configuration
 * Use with node-cron or similar
 *
 * Example using node-cron:
 * ```
 * import cron from 'node-cron';
 * import * as rentalJobs from './jobs/rentalPaymentJobs';
 *
 * // Update overdue payments - Daily at 1:00 AM
 * cron.schedule('0 1 * * *', rentalJobs.updateOverduePayments);
 *
 * // Apply late fees - Daily at 1:30 AM
 * cron.schedule('30 1 * * *', rentalJobs.applyLateFees);
 *
 * // Process payments - Daily at 2:00 AM
 * cron.schedule('0 2 * * *', rentalJobs.processAutomaticPayments);
 *
 * // Send reminders - Daily at 9:00 AM
 * cron.schedule('0 9 * * *', rentalJobs.sendPaymentReminders);
 *
 * // Send rental ending notices - Daily at 9:30 AM
 * cron.schedule('30 9 * * *', rentalJobs.sendRentalEndingNotices);
 *
 * // Send overdue alerts - Daily at 10:00 AM
 * cron.schedule('0 10 * * *', rentalJobs.sendOverdueAlerts);
 * ```
 */
export const cronSchedules = {
  updateOverduePayments: "0 1 * * *", // 1:00 AM daily
  applyLateFees: "30 1 * * *", // 1:30 AM daily
  processAutomaticPayments: "0 2 * * *", // 2:00 AM daily
  sendPaymentReminders: "0 9 * * *", // 9:00 AM daily
  sendRentalEndingNotices: "30 9 * * *", // 9:30 AM daily
  sendOverdueAlerts: "0 10 * * *", // 10:00 AM daily
};

/**
 * Job execution order (recommended):
 * 1. Update overdue payments (1:00 AM)
 * 2. Apply late fees (1:30 AM)
 * 3. Process automatic payments (2:00 AM)
 * 4. Send payment reminders (9:00 AM)
 * 5. Send rental ending notices (9:30 AM)
 * 6. Send overdue alerts (10:00 AM)
 */

export default {
  processAutomaticPayments,
  sendPaymentReminders,
  sendOverdueAlerts,
  sendRentalEndingNotices,
  updateOverduePayments,
  applyLateFees,
  cronSchedules,
};
