// This is a custom models file to extend Prisma types
// Use this to help transition during the schema update

import { Rider as PrismaRider } from "@prisma/client";

// Extended Rider type with isActive field
export interface Rider extends PrismaRider {
  isActive: boolean;
}

// Helper function to map database riders to the extended type
export function mapRider(rider: PrismaRider): Rider {
  // During the transition period, if isActive doesn't exist in database,
  // compute it from registrationStatus
  if (!("isActive" in rider)) {
    return {
      ...(rider as any),
      isActive: (rider as any).registrationStatus === "COMPLETED",
    } as Rider;
  }

  // Once database is migrated, this will use the actual field
  return rider as Rider;
}
