/**
 * Event Store Service
 * Persistent storage for city events to enable recovery and replay
 */

import { prisma } from "../index";
import { AnyCityEvent } from "../events/cityEvents";

export class EventStore {
  /**
   * Store event for persistent replay capability
   */
  static async storeEvent(event: AnyCityEvent): Promise<void> {
    try {
      await prisma.cityEventLog.create({
        data: {
          eventId: event.eventId,
          eventType: event.type,
          cityId: event.cityId,
          eventData: JSON.stringify(event),
          timestamp: new Date(),
          processed: false,
          retryCount: 0,
        },
      });

      console.log(`📝 Event stored: ${event.eventId}`);
    } catch (error) {
      console.error("❌ Failed to store event:", error);
      throw error;
    }
  }

  /**
   * Get unprocessed events for retry
   */
  static async getFailedEvents(): Promise<AnyCityEvent[]> {
    try {
      const events = await prisma.cityEventLog.findMany({
        where: {
          OR: [
            { processed: false },
            {
              AND: [
                { processed: true },
                { retryCount: { lt: 3 } }, // Max 3 retries
                { updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } }, // 5 min ago
              ],
            },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      return events.map((e) => JSON.parse(e.eventData as string));
    } catch (error) {
      console.error("❌ Failed to get failed events:", error);
      return [];
    }
  }

  /**
   * Mark event as processed successfully
   */
  static async markEventProcessed(eventId: string): Promise<void> {
    await prisma.cityEventLog.update({
      where: { eventId },
      data: {
        processed: true,
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Increment retry count
   */
  static async incrementRetryCount(eventId: string): Promise<void> {
    await prisma.cityEventLog.update({
      where: { eventId },
      data: {
        retryCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get events for a specific city (for manual sync)
   */
  static async getCityEvents(
    cityId: string,
    fromSequence: number = 0
  ): Promise<AnyCityEvent[]> {
    try {
      const events = await prisma.cityEventLog.findMany({
        where: {
          cityId,
          // You could add sequence filtering here if needed
        },
        orderBy: { createdAt: "asc" },
      });

      return events.map((e) => JSON.parse(e.eventData as string));
    } catch (error) {
      console.error("❌ Failed to get city events:", error);
      return [];
    }
  }
}
