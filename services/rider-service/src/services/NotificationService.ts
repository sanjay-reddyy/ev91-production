/**
 * Notification Service for EV Rental Payments
 *
 * Handles automated notifications including:
 * - Payment due reminders (3 days before due date)
 * - Overdue payment alerts
 * - Rental ending notices (1 month before end)
 * - Payment confirmation notifications
 * - Batch notification processing for scheduled jobs
 *
 * This service ensures riders stay informed about their rental payments
 * and important rental events.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// Constants
// ============================================

/**
 * Days before due date to send payment reminder
 */
export const REMINDER_DAYS_BEFORE_DUE = 3;

/**
 * Days before rental end to send ending notice
 */
export const RENTAL_ENDING_NOTICE_DAYS = 30;

/**
 * Maximum notification retries
 */
export const MAX_NOTIFICATION_RETRIES = 3;

// ============================================
// Types
// ============================================

export enum NotificationType {
  PAYMENT_REMINDER = "PAYMENT_REMINDER",
  PAYMENT_OVERDUE = "PAYMENT_OVERDUE",
  PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED",
  RENTAL_ENDING = "RENTAL_ENDING",
  RENTAL_STARTED = "RENTAL_STARTED",
  RENTAL_TERMINATED = "RENTAL_TERMINATED",
}

export enum NotificationChannel {
  SMS = "SMS",
  EMAIL = "EMAIL",
  PUSH = "PUSH",
  IN_APP = "IN_APP",
}

export interface NotificationPayload {
  riderId: string;
  riderName?: string;
  riderPhone?: string;
  riderEmail?: string;
  type: NotificationType;
  channels: NotificationChannel[];
  data: {
    paymentId?: string;
    rentalId?: string;
    amount?: number;
    dueDate?: Date;
    lateFee?: number;
    paymentMonth?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    [key: string]: any;
  };
}

export interface NotificationResult {
  success: boolean;
  riderId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  sentChannels: NotificationChannel[];
  failedChannels: NotificationChannel[];
  error?: string;
  timestamp: Date;
}

export interface BatchNotificationResult {
  totalSent: number;
  successful: number;
  failed: number;
  results: NotificationResult[];
}

// ============================================
// Template Generation Functions
// ============================================

/**
 * Generate SMS message from template
 *
 * @param type - Notification type
 * @param data - Template data
 * @returns SMS message text
 */
export function generateSmsMessage(
  type: NotificationType,
  data: NotificationPayload["data"]
): string {
  const { riderName, amount, dueDate, paymentMonth, lateFee } = data;

  switch (type) {
    case NotificationType.PAYMENT_REMINDER:
      const dueDateStr = dueDate
        ? new Date(dueDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";
      return `Hi ${
        riderName || "Rider"
      }, your EV rental payment of ₹${amount} for ${paymentMonth} is due on ${dueDateStr}. Please ensure sufficient balance in your earnings. - EV91 Platform`;

    case NotificationType.PAYMENT_OVERDUE:
      const overdueAmount = amount! + (lateFee || 0);
      return `URGENT: Your EV rental payment of ₹${amount} for ${paymentMonth} is overdue. Late fee of ₹${
        lateFee || 0
      } applied. Total due: ₹${overdueAmount}. Please clear your dues immediately. - EV91 Platform`;

    case NotificationType.PAYMENT_CONFIRMED:
      return `Payment confirmed! ₹${amount} deducted successfully for your EV rental payment (${paymentMonth}). Thank you for your timely payment. - EV91 Platform`;

    case NotificationType.RENTAL_ENDING:
      const endDays = data.daysRemaining || 30;
      return `Your EV rental agreement is ending in ${endDays} days. Please contact support to renew or return the vehicle. - EV91 Platform`;

    case NotificationType.RENTAL_STARTED:
      return `Welcome! Your EV rental has started. Monthly rental: ₹${amount}. Vehicle: ${data.vehicleModel} (${data.vehicleNumber}). Happy riding! - EV91 Platform`;

    case NotificationType.RENTAL_TERMINATED:
      return `Your EV rental agreement has been terminated. Reason: ${
        data.reason || "N/A"
      }. Please return the vehicle to the nearest hub. - EV91 Platform`;

    default:
      return `EV91 Platform notification - ${type}`;
  }
}

/**
 * Generate email HTML from template
 *
 * @param type - Notification type
 * @param data - Template data
 * @returns Email HTML content
 */
export function generateEmailHtml(
  type: NotificationType,
  data: NotificationPayload["data"]
): { subject: string; html: string } {
  const { riderName, amount, dueDate, paymentMonth, lateFee } = data;

  switch (type) {
    case NotificationType.PAYMENT_REMINDER: {
      const dueDateStr = dueDate
        ? new Date(dueDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "";

      return {
        subject: `Payment Reminder: EV Rental Due on ${dueDateStr}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Payment Reminder</h2>
            <p>Hi ${riderName || "Rider"},</p>
            <p>This is a friendly reminder that your EV rental payment is due soon.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Payment Month:</strong> ${paymentMonth}</p>
              <p style="margin: 5px 0;"><strong>Amount Due:</strong> ₹${amount}</p>
              <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDateStr}</p>
            </div>
            <p>Please ensure you have sufficient balance in your earnings account for automatic deduction.</p>
            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from EV91 Platform.</p>
          </div>
        `,
      };
    }

    case NotificationType.PAYMENT_OVERDUE: {
      const overdueAmount = amount! + (lateFee || 0);

      return {
        subject: `⚠️ OVERDUE: EV Rental Payment for ${paymentMonth}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">Payment Overdue</h2>
            </div>
            <p>Hi ${riderName || "Rider"},</p>
            <p><strong>Your EV rental payment is overdue.</strong> Please clear your dues immediately to avoid service suspension.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Payment Month:</strong> ${paymentMonth}</p>
              <p style="margin: 5px 0;"><strong>Original Amount:</strong> ₹${amount}</p>
              <p style="margin: 5px 0;"><strong>Late Fee:</strong> ₹${
                lateFee || 0
              }</p>
              <p style="margin: 5px 0; font-size: 18px;"><strong>Total Due:</strong> <span style="color: #dc2626;">₹${overdueAmount}</span></p>
            </div>
            <p>Please contact support if you need assistance with your payment.</p>
            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from EV91 Platform.</p>
          </div>
        `,
      };
    }

    case NotificationType.PAYMENT_CONFIRMED: {
      return {
        subject: `✓ Payment Confirmed - ${paymentMonth}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #16a34a; margin-top: 0;">Payment Confirmed</h2>
            </div>
            <p>Hi ${riderName || "Rider"},</p>
            <p>Your EV rental payment has been successfully processed!</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Payment Month:</strong> ${paymentMonth}</p>
              <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${amount}</p>
              <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${new Date().toLocaleDateString(
                "en-IN"
              )}</p>
            </div>
            <p>Thank you for your timely payment. Keep riding!</p>
            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from EV91 Platform.</p>
          </div>
        `,
      };
    }

    case NotificationType.RENTAL_ENDING: {
      const endDays = data.daysRemaining || 30;

      return {
        subject: `EV Rental Agreement Ending in ${endDays} Days`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Rental Agreement Ending Soon</h2>
            <p>Hi ${riderName || "Rider"},</p>
            <p>Your EV rental agreement is ending in <strong>${endDays} days</strong>.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${
                data.vehicleModel
              } (${data.vehicleNumber})</p>
              <p style="margin: 5px 0;"><strong>End Date:</strong> ${
                data.endDate
                  ? new Date(data.endDate).toLocaleDateString("en-IN")
                  : "N/A"
              }</p>
            </div>
            <p>Please contact support to:</p>
            <ul>
              <li>Renew your rental agreement</li>
              <li>Return the vehicle</li>
              <li>Discuss any questions</li>
            </ul>
            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from EV91 Platform.</p>
          </div>
        `,
      };
    }

    default:
      return {
        subject: `EV91 Platform Notification`,
        html: `<p>${type}</p>`,
      };
  }
}

/**
 * Generate push notification payload
 *
 * @param type - Notification type
 * @param data - Template data
 * @returns Push notification object
 */
export function generatePushNotification(
  type: NotificationType,
  data: NotificationPayload["data"]
): { title: string; body: string; data: any } {
  const { amount, paymentMonth, dueDate } = data;

  switch (type) {
    case NotificationType.PAYMENT_REMINDER:
      return {
        title: "💰 Payment Reminder",
        body: `Your EV rental payment of ₹${amount} for ${paymentMonth} is due soon`,
        data: { type, ...data },
      };

    case NotificationType.PAYMENT_OVERDUE:
      return {
        title: "⚠️ Payment Overdue",
        body: `Your payment of ₹${amount} for ${paymentMonth} is overdue. Please clear your dues.`,
        data: { type, ...data },
      };

    case NotificationType.PAYMENT_CONFIRMED:
      return {
        title: "✓ Payment Confirmed",
        body: `Payment of ₹${amount} for ${paymentMonth} processed successfully`,
        data: { type, ...data },
      };

    case NotificationType.RENTAL_ENDING:
      const endDays = data.daysRemaining || 30;
      return {
        title: "📆 Rental Ending Soon",
        body: `Your rental agreement is ending in ${endDays} days`,
        data: { type, ...data },
      };

    default:
      return {
        title: "EV91 Notification",
        body: type,
        data: { type, ...data },
      };
  }
}

// ============================================
// Notification Sending Functions
// ============================================

/**
 * Send notification through specified channels
 *
 * NOTE: This is a placeholder implementation.
 * Integrate with actual SMS, Email, and Push notification services.
 *
 * @param payload - Notification payload
 * @returns Notification result
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const { riderId, type, channels, data } = payload;
  const sentChannels: NotificationChannel[] = [];
  const failedChannels: NotificationChannel[] = [];

  console.log(`📧 Sending ${type} notification to rider ${riderId}...`);

  // Process each channel
  for (const channel of channels) {
    try {
      switch (channel) {
        case NotificationChannel.SMS:
          const smsMessage = generateSmsMessage(type, data);
          // TODO: Integrate with SMS service (MSG91, Twilio, etc.)
          console.log(`  📱 SMS: ${smsMessage.substring(0, 100)}...`);
          sentChannels.push(channel);
          break;

        case NotificationChannel.EMAIL:
          const emailData = generateEmailHtml(type, data);
          // TODO: Integrate with Email service (SendGrid, AWS SES, etc.)
          console.log(`  📧 Email: ${emailData.subject}`);
          sentChannels.push(channel);
          break;

        case NotificationChannel.PUSH:
          const pushData = generatePushNotification(type, data);
          // TODO: Integrate with Push service (FCM, APNS, etc.)
          console.log(`  🔔 Push: ${pushData.title}`);
          sentChannels.push(channel);
          break;

        case NotificationChannel.IN_APP:
          // TODO: Create in-app notification record
          console.log(`  📱 In-App: ${type}`);
          sentChannels.push(channel);
          break;
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to send ${channel}:`, error.message);
      failedChannels.push(channel);
    }
  }

  const success = sentChannels.length > 0;

  return {
    success,
    riderId,
    type,
    channels,
    sentChannels,
    failedChannels,
    error:
      failedChannels.length > 0
        ? `Failed channels: ${failedChannels.join(", ")}`
        : undefined,
    timestamp: new Date(),
  };
}

// ============================================
// Scheduled Notification Jobs
// ============================================

/**
 * Send payment reminders for upcoming due dates
 * Run daily as cron job
 *
 * @returns Batch notification result
 */
export async function sendPaymentReminders(): Promise<BatchNotificationResult> {
  console.log("🔄 Checking for upcoming payment due dates...");

  const today = new Date();
  const reminderDate = new Date(today);
  reminderDate.setDate(reminderDate.getDate() + REMINDER_DAYS_BEFORE_DUE);

  // Find payments due in REMINDER_DAYS_BEFORE_DUE days
  const upcomingPayments = await prisma.riderRentalPayment.findMany({
    where: {
      status: "PENDING",
      dueDate: {
        gte: new Date(reminderDate.setHours(0, 0, 0, 0)),
        lte: new Date(reminderDate.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      rider: true,
      rental: true,
    },
  });

  console.log(
    `📊 Found ${upcomingPayments.length} payments due in ${REMINDER_DAYS_BEFORE_DUE} days`
  );

  const results: NotificationResult[] = [];

  for (const payment of upcomingPayments) {
    const paymentMonth = payment.dueDate
      ? new Date(payment.dueDate).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })
      : "N/A";

    const result = await sendNotification({
      riderId: payment.riderId,
      riderName: payment.rider.name || undefined,
      riderPhone: payment.rider.phone,
      type: NotificationType.PAYMENT_REMINDER,
      channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
      data: {
        paymentId: payment.id,
        rentalId: payment.rentalId,
        amount: payment.amount,
        dueDate: payment.dueDate,
        paymentMonth,
      },
    });

    results.push(result);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Sent ${successful} reminders, ${failed} failed`);

  return {
    totalSent: upcomingPayments.length,
    successful,
    failed,
    results,
  };
}

/**
 * Send overdue payment alerts
 * Run daily as cron job
 *
 * @returns Batch notification result
 */
export async function sendOverdueAlerts(): Promise<BatchNotificationResult> {
  console.log("🔄 Checking for overdue payments...");

  const overduePayments = await prisma.riderRentalPayment.findMany({
    where: {
      status: "OVERDUE",
      deductedFromEarnings: false,
    },
    include: {
      rider: true,
      rental: true,
    },
  });

  console.log(`📊 Found ${overduePayments.length} overdue payments`);

  const results: NotificationResult[] = [];

  for (const payment of overduePayments) {
    const paymentMonth = payment.dueDate
      ? new Date(payment.dueDate).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })
      : "N/A";

    const result = await sendNotification({
      riderId: payment.riderId,
      riderName: payment.rider.name || undefined,
      riderPhone: payment.rider.phone,
      type: NotificationType.PAYMENT_OVERDUE,
      channels: [
        NotificationChannel.SMS,
        NotificationChannel.EMAIL,
        NotificationChannel.PUSH,
      ],
      data: {
        paymentId: payment.id,
        rentalId: payment.rentalId,
        amount: payment.amount,
        dueDate: payment.dueDate,
        lateFee: payment.lateFee || 0,
        paymentMonth,
      },
    });

    results.push(result);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Sent ${successful} overdue alerts, ${failed} failed`);

  return {
    totalSent: overduePayments.length,
    successful,
    failed,
    results,
  };
}

/**
 * Send rental ending notices
 * Run daily as cron job
 *
 * @returns Batch notification result
 */
export async function sendRentalEndingNotices(): Promise<BatchNotificationResult> {
  console.log("🔄 Checking for rentals ending soon...");

  const today = new Date();
  const endingDate = new Date(today);
  endingDate.setDate(endingDate.getDate() + RENTAL_ENDING_NOTICE_DAYS);

  const endingRentals = await prisma.riderVehicleRental.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lte: new Date(endingDate.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      rider: true,
    },
  });

  console.log(
    `📊 Found ${endingRentals.length} rentals ending in ${RENTAL_ENDING_NOTICE_DAYS} days`
  );

  const results: NotificationResult[] = [];

  for (const rental of endingRentals) {
    const daysRemaining = Math.ceil(
      (new Date(rental.endDate!).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const result = await sendNotification({
      riderId: rental.riderId,
      riderName: rental.rider.name || undefined,
      riderPhone: rental.rider.phone,
      type: NotificationType.RENTAL_ENDING,
      channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
      data: {
        rentalId: rental.id,
        vehicleModel: rental.vehicleModelId,
        vehicleNumber: rental.vehicleId,
        endDate: rental.endDate,
        daysRemaining,
      },
    });

    results.push(result);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Sent ${successful} ending notices, ${failed} failed`);

  return {
    totalSent: endingRentals.length,
    successful,
    failed,
    results,
  };
}

/**
 * Send payment confirmation notification
 * Called after successful payment deduction
 *
 * @param paymentId - Payment ID
 * @returns Notification result
 */
export async function sendPaymentConfirmation(
  paymentId: string
): Promise<NotificationResult> {
  const payment = await prisma.riderRentalPayment.findUnique({
    where: { id: paymentId },
    include: {
      rider: true,
      rental: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const paymentMonth = payment.dueDate
    ? new Date(payment.dueDate).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "N/A";

  return await sendNotification({
    riderId: payment.riderId,
    riderName: payment.rider.name || undefined,
    riderPhone: payment.rider.phone,
    type: NotificationType.PAYMENT_CONFIRMED,
    channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
    data: {
      paymentId: payment.id,
      rentalId: payment.rentalId,
      amount: payment.amount,
      paymentMonth,
    },
  });
}

/**
 * Send rental started notification
 *
 * @param rentalId - Rental ID
 * @returns Notification result
 */
export async function sendRentalStartedNotification(
  rentalId: string
): Promise<NotificationResult> {
  const rental = await prisma.riderVehicleRental.findUnique({
    where: { id: rentalId },
    include: {
      rider: true,
    },
  });

  if (!rental) {
    throw new Error("Rental not found");
  }

  return await sendNotification({
    riderId: rental.riderId,
    riderName: rental.rider.name || undefined,
    riderPhone: rental.rider.phone,
    type: NotificationType.RENTAL_STARTED,
    channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
    data: {
      rentalId: rental.id,
      amount: rental.monthlyRentalCost,
      vehicleModel: rental.vehicleModelId,
      vehicleNumber: rental.vehicleId,
    },
  });
}

/**
 * Send rental terminated notification
 *
 * @param rentalId - Rental ID
 * @param reason - Termination reason
 * @returns Notification result
 */
export async function sendRentalTerminatedNotification(
  rentalId: string,
  reason: string
): Promise<NotificationResult> {
  const rental = await prisma.riderVehicleRental.findUnique({
    where: { id: rentalId },
    include: {
      rider: true,
    },
  });

  if (!rental) {
    throw new Error("Rental not found");
  }

  return await sendNotification({
    riderId: rental.riderId,
    riderName: rental.rider.name || undefined,
    riderPhone: rental.rider.phone,
    type: NotificationType.RENTAL_TERMINATED,
    channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
    data: {
      rentalId: rental.id,
      vehicleModel: rental.vehicleModelId,
      vehicleNumber: rental.vehicleId,
      reason,
    },
  });
}

// ============================================
// Export Service Object
// ============================================

export const NotificationService = {
  // Core notification
  sendNotification,

  // Template generation
  generateSmsMessage,
  generateEmailHtml,
  generatePushNotification,

  // Scheduled jobs
  sendPaymentReminders,
  sendOverdueAlerts,
  sendRentalEndingNotices,

  // Event-triggered notifications
  sendPaymentConfirmation,
  sendRentalStartedNotification,
  sendRentalTerminatedNotification,

  // Constants
  REMINDER_DAYS_BEFORE_DUE,
  RENTAL_ENDING_NOTICE_DAYS,
  MAX_NOTIFICATION_RETRIES,
};

export default NotificationService;
