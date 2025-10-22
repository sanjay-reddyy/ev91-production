/**
 * Rider ID Generator Service
 *
 * Generates unique public rider IDs using existing city and createdAt columns.
 * Format: {CITYCODE}-{YY}-R{NNNNNN}
 * Example: MAA-25-R000001 (Chennai 2025, rider #1)
 *
 * Design Philosophy:
 * - Uses EXISTING city and createdAt columns (zero data duplication)
 * - Sequential numbering per city-year combination
 * - Auto-scales from 6 to 7 digits at 1 million riders per city
 * - Thread-safe using database transactions
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generate a unique public rider ID
 *
 * @param rider - Object with city name and optional createdAt timestamp
 * @returns Public rider ID (e.g., "MAA-25-R000001")
 */
export async function generateRiderId(rider: {
  city: string;
  createdAt?: Date;
}): Promise<string> {
  // 1. Map city name to 3-letter code
  const cityCode = getCityCode(rider.city);

  // 2. Use existing createdAt or current year for new riders
  const registrationYear = rider.createdAt
    ? rider.createdAt.getFullYear()
    : new Date().getFullYear();
  const yearSuffix = registrationYear % 100; // 2025 → 25

  console.log(
    `🆔 Generating Rider ID for ${rider.city} (${cityCode}) - Year ${registrationYear}`
  );

  // 3. Get next sequential number using transaction (thread-safe)
  const counter = await prisma.$transaction(async (tx) => {
    // Try to find existing counter for this city-year
    const existing = await tx.riderCounter.findUnique({
      where: {
        cityCode_year: {
          cityCode,
          year: registrationYear,
        },
      },
    });

    if (existing) {
      // Increment existing counter
      return await tx.riderCounter.update({
        where: {
          cityCode_year: {
            cityCode,
            year: registrationYear,
          },
        },
        data: {
          lastNumber: {
            increment: 1,
          },
        },
      });
    } else {
      // Create new counter for this city-year combination
      return await tx.riderCounter.create({
        data: {
          id: `counter_${cityCode}_${registrationYear}`,
          cityCode,
          year: registrationYear,
          lastNumber: 1,
        },
      });
    }
  });

  // 4. Auto-scale digit count (6 digits up to 999,999, then 7 digits)
  const digitCount = counter.lastNumber >= 1000000 ? 7 : 6;
  const paddedNumber = counter.lastNumber.toString().padStart(digitCount, "0");

  // 5. Generate public ID: CHE-25-R000001 (no dash between R and number)
  const publicRiderId = `${cityCode}-${yearSuffix}-R${paddedNumber}`;

  console.log(`✅ Generated Rider ID: ${publicRiderId}`);
  console.log(`   City: ${rider.city} (${cityCode})`);
  console.log(`   Year: ${registrationYear}`);
  console.log(`   Number: ${counter.lastNumber}`);

  return publicRiderId;
}

/**
 * Validate public rider ID format
 *
 * @param riderId - Rider ID to validate
 * @returns true if valid format
 */
export function validateRiderId(riderId: string): boolean {
  // Pattern: CHE-25-R000001 or CHE-25-R0000001 (6-7 digits)
  const pattern = /^[A-Z]{3}-\d{2}-R\d{6,7}$/;
  return pattern.test(riderId);
}

/**
 * Parse public rider ID into components
 *
 * @param publicRiderId - Rider ID to parse
 * @returns Object with cityCode, year, and number, or null if invalid
 */
export function parseRiderId(publicRiderId: string): {
  cityCode: string;
  year: number;
  number: number;
} | null {
  const match = publicRiderId.match(/^([A-Z]{3})-(\d{2})-R(\d{6,7})$/);
  if (!match) return null;

  const [, cityCode, yearSuffix, numberStr] = match;
  return {
    cityCode,
    year: 2000 + parseInt(yearSuffix), // 25 → 2025
    number: parseInt(numberStr),
  };
}

/**
 * Get next number for a city-year without creating a rider ID
 * Useful for previewing what the next ID will be
 *
 * @param cityCode - City code (e.g., "MAA")
 * @param year - Year (e.g., 2025)
 * @returns Next available number
 */
export async function getNextNumber(
  cityCode: string,
  year: number
): Promise<number> {
  const counter = await prisma.riderCounter.findUnique({
    where: {
      cityCode_year: {
        cityCode,
        year,
      },
    },
  });

  return counter ? counter.lastNumber + 1 : 1;
}

/**
 * Map city name to 3-letter code
 * Uses airport codes for major cities
 *
 * @param cityName - Full city name (e.g., "Chennai", "Bengaluru")
 * @returns 3-letter city code (e.g., "MAA", "BLR")
 */
export function getCityCode(cityName: string): string {
  const cityCodeMap: Record<string, string> = {
    // Major cities - Airport codes
    chennai: "MAA",
    bangalore: "BLR",
    bengaluru: "BLR",
    mumbai: "BOM",
    delhi: "DEL",
    "new delhi": "DEL",
    hyderabad: "HYD",
    kolkata: "CCU",
    pune: "PNQ",
    ahmedabad: "AMD",
    jaipur: "JAI",
    surat: "STV",
    lucknow: "LKO",
    kanpur: "KNU",
    nagpur: "NAG",
    indore: "IDR",
    thane: "THN",
    bhopal: "BHO",
    visakhapatnam: "VTZ",
    vizag: "VTZ",
    "pimpri-chinchwad": "PCC",
    patna: "PAT",
    vadodara: "BDQ",
    baroda: "BDQ",
    ghaziabad: "GZB",
    ludhiana: "LUH",
    agra: "AGR",
    nashik: "ISK",
    faridabad: "FBD",
    meerut: "MRT",
    rajkot: "RAJ",
    varanasi: "VNS",
    banaras: "VNS",
    srinagar: "SXR",
    amritsar: "ATQ",
    allahabad: "IXD",
    prayagraj: "IXD",
    ranchi: "IXR",
    howrah: "HWH",
    coimbatore: "CJB",
    jabalpur: "JLR",
    gwalior: "GWL",
    vijayawada: "VGA",
    jodhpur: "JDH",
    madurai: "IXM",
    raipur: "RPR",
    kota: "KTU",
    chandigarh: "IXC",
    guwahati: "GAU",
    thiruvananthapuram: "TRV",
    trivandrum: "TRV",
    kochi: "COK",
    cochin: "COK",
    kozhikode: "CCJ",
    calicut: "CCJ",
    mangalore: "IXE",
    mysore: "MYQ",
    hubli: "HBX",
    belgaum: "IXG",
    shimoga: "RQY",
    tirupati: "TIR",
    nellore: "NEL",
    guntur: "GNT",
    warangal: "WGC",
    jammu: "IXJ",
    dehradun: "DED",
    haridwar: "HDW",
    rishikesh: "RSH",
    mussoorie: "MSR",
    nainital: "NNT",
    udaipur: "UDR",
    ajmer: "AJM",
    bikaner: "BKN",
    bhilai: "BHI",
    durg: "DRG",
    bilaspur: "BIL",
    rourkela: "ROU",
    cuttack: "CUT",
    bhubaneswar: "BBI",
    siliguri: "IXB",
    asansol: "ASN",
    durgapur: "DGP",
    dhanbad: "DBD",
    jamshedpur: "IXW",
    salem: "SXV",
    tirunelveli: "TNI",
    vellore: "VLR",
    erode: "ERD",
    thanjavur: "TJV",
    trichy: "TRZ",
    tiruchirappalli: "TRZ",
    puducherry: "PNY",
    pondicherry: "PNY",
  };

  const normalized = cityName.toLowerCase().trim();
  const code = cityCodeMap[normalized];

  if (code) {
    return code;
  }

  // Fallback: Use first 3 letters in uppercase
  console.warn(
    `⚠️  No city code mapping found for "${cityName}", using first 3 letters`
  );
  return cityName.substring(0, 3).toUpperCase();
}

/**
 * Get statistics for rider IDs
 *
 * @returns Object with rider count per city-year
 */
export async function getRiderIdStats(): Promise<{
  totalRiders: number;
  cityCounts: { cityCode: string; year: number; count: number }[];
}> {
  const counters = await prisma.riderCounter.findMany({
    orderBy: [{ cityCode: "asc" }, { year: "desc" }],
  });

  const totalRiders = counters.reduce(
    (sum, counter) => sum + counter.lastNumber,
    0
  );

  const cityCounts = counters.map((counter) => ({
    cityCode: counter.cityCode,
    year: counter.year,
    count: counter.lastNumber,
  }));

  return {
    totalRiders,
    cityCounts,
  };
}

export default {
  generateRiderId,
  validateRiderId,
  parseRiderId,
  getNextNumber,
  getCityCode,
  getRiderIdStats,
};
